"use server";

import { act, actForm, idFrom, logActivity, ok, parse, type AdminState } from "@/lib/admin/act";
import { AdminError } from "@/lib/admin/auth";
import { phaseFields, projectFields, ticketFields } from "@/lib/admin/defs";
import { v } from "@/lib/admin/fields";
import { isoToJalali, todayIso } from "@/lib/admin/jalali";
import { DEFAULT_PHASES, PHASE_STATUSES, PROJECT_STATUSES, SLA_HOURS, TICKET_STATUSES, labelOf } from "@/lib/admin/labels";
import { nextNumber, q, q1 } from "@/lib/admin/schema";
import { contractOptions, customerOptions, userOptions } from "@/lib/admin/settings";

/* ---------------- implementation projects ---------------- */

export async function saveProject(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return actForm("projects", async (user) => {
    const vals = parse(fd, projectFields(await customerOptions(), await contractOptions(), await userOptions()));
    const params = [
      v.s(vals, "title"),
      Number(v.s(vals, "customer_id")),
      v.s(vals, "contract_id") ? Number(v.s(vals, "contract_id")) : null,
      v.s(vals, "status"),
      v.s(vals, "manager_id"),
      v.s(vals, "start_date"),
      v.s(vals, "due_date"),
      v.s(vals, "golive_date"),
      v.s(vals, "notes"),
    ];
    const id = Number(fd.get("id")) || null;
    if (!id) {
      const row = await q1<{ id: number }>(
        `INSERT INTO adm_projects (title, customer_id, contract_id, status, manager_id, start_date, due_date, golive_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        params
      );
      // Every implementation starts from RAVAND's standard phases.
      for (const [i, title] of DEFAULT_PHASES.entries()) {
        await q(`INSERT INTO adm_project_phases (project_id, title, position) VALUES ($1, $2, $3)`, [row!.id, title, i + 1]);
      }
      await q(`UPDATE adm_customers SET status = 'onboarding' WHERE id = $1 AND status = 'inactive'`, [params[1]]);
      await logActivity("project", row!.id, "system", "پروژه ساخته شد.", user.id);
      await logActivity("customer", params[1] as number, "system", `پروژه «${params[0]}» ساخته شد.`, user.id);
      return { redirect: `/admin/projects/${row!.id}` };
    }
    const before = await q1<{ status: string }>(`SELECT status FROM adm_projects WHERE id = $1`, [id]);
    await q(
      `UPDATE adm_projects SET title = $1, customer_id = $2, contract_id = $3, status = $4, manager_id = $5, start_date = $6,
         due_date = $7, golive_date = $8, notes = $9 WHERE id = $10`,
      [...params, id]
    );
    if (before && before.status !== params[3]) {
      await logActivity("project", id, "system", `وضعیت: ${labelOf(PROJECT_STATUSES, before.status)} ← ${labelOf(PROJECT_STATUSES, String(params[3]))}`, user.id);
      // A delivered project makes the customer a live customer.
      if (params[3] === "done") await q(`UPDATE adm_customers SET status = 'active' WHERE id = $1`, [params[1]]);
    }
    return ok();
  });
}

export async function addPhase(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return actForm("projects", async () => {
    const projectId = idFrom(fd, "project_id");
    const vals = parse(fd, phaseFields);
    await q(
      `INSERT INTO adm_project_phases (project_id, title, position, due_date)
       VALUES ($1, $2, COALESCE((SELECT max(position) FROM adm_project_phases WHERE project_id = $1), 0) + 1, $3)`,
      [projectId, v.s(vals, "title"), v.s(vals, "due_date")]
    );
    return ok("مرحله اضافه شد.");
  });
}

export async function setPhaseStatus(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("projects", async (user) => {
    const id = idFrom(fd);
    const status = String(fd.get("status"));
    if (!(status in PHASE_STATUSES)) throw new AdminError("invalid");
    const row = await q1<{ project_id: number; title: string }>(`UPDATE adm_project_phases SET status = $2 WHERE id = $1 RETURNING project_id, title`, [id, status]);
    if (row) {
      await logActivity("project", row.project_id, "system", `مرحله «${row.title}»: ${labelOf(PHASE_STATUSES, status)}`, user.id);
      // First phase started → the project is running.
      if (status !== "todo") await q(`UPDATE adm_projects SET status = 'active', start_date = COALESCE(start_date, $2) WHERE id = $1 AND status = 'planning'`, [row.project_id, todayIso()]);
    }
    return ok();
  });
}

export async function deletePhase(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("projects", async () => {
    await q(`DELETE FROM adm_project_phases WHERE id = $1`, [idFrom(fd)]);
    return ok();
  });
}

/* ---------------- support tickets ---------------- */

export async function saveTicket(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return actForm("support", async (user) => {
    const vals = parse(fd, ticketFields(await customerOptions(), await userOptions()));
    const priority = v.s(vals, "priority")!;
    const params = [
      v.s(vals, "subject"),
      v.s(vals, "customer_id") ? Number(v.s(vals, "customer_id")) : null,
      priority,
      v.s(vals, "category"),
      v.s(vals, "channel"),
      v.s(vals, "assignee_id"),
      v.s(vals, "body"),
    ];
    const id = Number(fd.get("id")) || null;
    if (!id) {
      const number = await nextNumber("ticket", "T", isoToJalali(todayIso()).slice(0, 4));
      const row = await q1<{ id: number }>(
        `INSERT INTO adm_tickets (subject, customer_id, priority, category, channel, assignee_id, body, number, due_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now() + make_interval(hours => $9)) RETURNING id`,
        [...params, number, SLA_HOURS[priority] ?? 72]
      );
      if (params[1]) await logActivity("customer", params[1] as number, "system", `تیکت ${number}: ${params[0]}`, user.id);
      return { redirect: `/admin/tickets/${row!.id}` };
    }
    await q(
      `UPDATE adm_tickets SET subject = $1, customer_id = $2, priority = $3, category = $4, channel = $5, assignee_id = $6, body = $7 WHERE id = $8`,
      [...params, id]
    );
    return ok();
  });
}

export async function setTicketStatus(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("support", async (user) => {
    const id = idFrom(fd);
    const status = String(fd.get("status"));
    if (!(status in TICKET_STATUSES)) throw new AdminError("invalid");
    const before = await q1<{ status: string }>(`SELECT status FROM adm_tickets WHERE id = $1`, [id]);
    if (!before) throw new AdminError("notFound");
    await q(
      `UPDATE adm_tickets SET status = $2,
         resolved_at = CASE WHEN $2 IN ('resolved', 'closed') THEN COALESCE(resolved_at, now()) ELSE NULL END
       WHERE id = $1`,
      [id, status]
    );
    await logActivity("ticket", id, "system", `وضعیت: ${labelOf(TICKET_STATUSES, before.status)} ← ${labelOf(TICKET_STATUSES, status)}`, user.id);
    return ok();
  });
}
