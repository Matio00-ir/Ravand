"use server";

import { act, actForm, idFrom, logActivity, ok, parse, type AdminState } from "@/lib/admin/act";
import { AdminError } from "@/lib/admin/auth";
import { contactFields, customerFields } from "@/lib/admin/defs";
import { v } from "@/lib/admin/fields";
import { q, q1 } from "@/lib/admin/schema";

const COLS = ["name", "industry", "size", "city", "address", "phone", "email", "national_id", "economic_code", "postal_code", "status", "source", "notes"] as const;

export async function saveCustomer(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return actForm("customers", async (user) => {
    const vals = parse(fd, customerFields);
    const params = COLS.map((c) => v.s(vals, c));
    const id = Number(fd.get("id")) || null;
    if (!id) {
      const row = await q1<{ id: number }>(
        `INSERT INTO adm_customers (${COLS.join(", ")}) VALUES (${COLS.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING id`,
        params
      );
      await logActivity("customer", row!.id, "system", "پرونده مشتری ساخته شد.", user.id);
      return { redirect: `/admin/customers/${row!.id}` };
    }
    await q(`UPDATE adm_customers SET ${COLS.map((c, i) => `${c} = $${i + 1}`).join(", ")} WHERE id = $${COLS.length + 1}`, [...params, id]);
    return ok();
  });
}

export async function deleteCustomer(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("settings", async () => {
    const id = idFrom(fd);
    const used = await q1<{ c: number }>(
      `SELECT (SELECT count(*) FROM adm_invoices WHERE customer_id = $1) + (SELECT count(*) FROM adm_contracts WHERE customer_id = $1)
            + (SELECT count(*) FROM adm_projects WHERE customer_id = $1) AS c`,
      [id]
    );
    if ((used?.c ?? 0) > 0) throw new AdminError("inUse");
    await q(`DELETE FROM adm_activities WHERE entity = 'customer' AND entity_id = $1`, [String(id)]);
    await q(`DELETE FROM adm_tasks WHERE entity = 'customer' AND entity_id = $1`, [String(id)]);
    await q(`DELETE FROM adm_customers WHERE id = $1`, [id]);
    return { redirect: "/admin/customers" };
  });
}

export async function saveContact(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return actForm("customers", async () => {
    const vals = parse(fd, contactFields);
    const customerId = idFrom(fd, "customer_id");
    await q(`INSERT INTO adm_contacts (customer_id, name, role, mobile, email) VALUES ($1, $2, $3, $4, $5)`, [
      customerId,
      v.s(vals, "name"),
      v.s(vals, "role"),
      v.s(vals, "mobile"),
      v.s(vals, "email"),
    ]);
    return ok("رابط اضافه شد.");
  });
}

export async function deleteContact(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("customers", async () => {
    await q(`DELETE FROM adm_contacts WHERE id = $1`, [idFrom(fd)]);
    return ok();
  });
}
