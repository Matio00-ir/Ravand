"use server";

import { FieldErrors, act, actForm, idFrom, logActivity, ok, parse, type AdminState } from "@/lib/admin/act";
import { AdminError, type Area } from "@/lib/admin/auth";
import { activityFields, dealFields, quoteFields, taskFields } from "@/lib/admin/defs";
import { parseAmount, v } from "@/lib/admin/fields";
import { isoToJalali, todayIso } from "@/lib/admin/jalali";
import { labelOf, DEAL_STAGES, QUOTE_STATUSES } from "@/lib/admin/labels";
import { nextNumber, q, q1 } from "@/lib/admin/schema";
import { parseLines, totals, userOptions, vatRate } from "@/lib/admin/settings";

const jYear = () => isoToJalali(todayIso()).slice(0, 4);

/* ---------------- deals ---------------- */

export async function saveDeal(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return actForm("crm", async (user) => {
    const vals = parse(fd, dealFields(await userOptions()));
    const id = Number(fd.get("id")) || null;
    const stage = v.s(vals, "stage")!;
    const closing = stage === "won" || stage === "lost";
    const params = [
      v.s(vals, "title"),
      v.s(vals, "company"),
      v.s(vals, "contact_name"),
      v.s(vals, "mobile"),
      v.s(vals, "email"),
      v.s(vals, "source"),
      stage,
      v.n(vals, "value"),
      v.s(vals, "expected_close"),
      v.s(vals, "owner_id"),
      stage === "lost" ? v.s(vals, "lost_reason") : null,
      v.s(vals, "notes"),
    ];

    if (!id) {
      const row = await q1<{ id: number }>(
        `INSERT INTO adm_deals (title, company, contact_name, mobile, email, source, stage, value, expected_close, owner_id, lost_reason, notes, closed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, ${closing ? "now()" : "NULL"}) RETURNING id`,
        params
      );
      await logActivity("deal", row!.id, "system", "فرصت فروش ثبت شد.", user.id);
      return { redirect: `/admin/deals/${row!.id}` };
    }

    const before = await q1<{ stage: string }>(`SELECT stage FROM adm_deals WHERE id = $1`, [id]);
    if (!before) throw new AdminError("notFound");
    await q(
      `UPDATE adm_deals SET title = $1, company = $2, contact_name = $3, mobile = $4, email = $5, source = $6, stage = $7,
         value = $8, expected_close = $9, owner_id = $10, lost_reason = $11, notes = $12, updated_at = now(),
         closed_at = CASE WHEN $7 IN ('won', 'lost') THEN COALESCE(closed_at, now()) ELSE NULL END
       WHERE id = $13`,
      [...params, id]
    );
    if (before.stage !== stage) {
      await logActivity("deal", id, "system", `مرحله: ${labelOf(DEAL_STAGES, before.stage)} ← ${labelOf(DEAL_STAGES, stage)}`, user.id);
    }
    return ok();
  });
}

export async function setDealStage(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("crm", async (user) => {
    const id = idFrom(fd);
    const stage = String(fd.get("stage"));
    if (!(stage in DEAL_STAGES)) throw new AdminError("invalid");
    const before = await q1<{ stage: string }>(`SELECT stage FROM adm_deals WHERE id = $1`, [id]);
    if (!before) throw new AdminError("notFound");
    await q(
      `UPDATE adm_deals SET stage = $2, updated_at = now(),
         closed_at = CASE WHEN $2 IN ('won', 'lost') THEN COALESCE(closed_at, now()) ELSE NULL END
       WHERE id = $1`,
      [id, stage]
    );
    await logActivity("deal", id, "system", `مرحله: ${labelOf(DEAL_STAGES, before.stage)} ← ${labelOf(DEAL_STAGES, stage)}`, user.id);
    return ok();
  });
}

export async function deleteDeal(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("crm", async () => {
    const id = idFrom(fd);
    await q(`DELETE FROM adm_tasks WHERE entity = 'deal' AND entity_id = $1`, [String(id)]);
    await q(`DELETE FROM adm_activities WHERE entity = 'deal' AND entity_id = $1`, [String(id)]);
    await q(`DELETE FROM adm_deals WHERE id = $1`, [id]);
    return { redirect: "/admin/deals" };
  });
}

/**
 * A won deal becomes a customer: the company, its contact person and
 * the deal's history move to a customer record the rest of the panel
 * (contracts, invoices, projects, tickets) hangs off.
 */
export async function convertDeal(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("crm", async (user) => {
    const id = idFrom(fd);
    const deal = await q1<{ title: string; company: string | null; contact_name: string | null; mobile: string | null; email: string | null; source: string; customer_id: number | null; notes: string | null }>(
      `SELECT title, company, contact_name, mobile, email, source, customer_id, notes FROM adm_deals WHERE id = $1`,
      [id]
    );
    if (!deal) throw new AdminError("notFound");
    if (deal.customer_id) return { redirect: `/admin/customers/${deal.customer_id}` };

    const name = deal.company || deal.contact_name || deal.title;
    const customer = await q1<{ id: number }>(
      `INSERT INTO adm_customers (name, phone, email, status, source, notes) VALUES ($1, $2, $3, 'onboarding', $4, $5) RETURNING id`,
      [name, deal.mobile, deal.email, deal.source, deal.notes]
    );
    if (deal.contact_name) {
      await q(`INSERT INTO adm_contacts (customer_id, name, mobile, email) VALUES ($1, $2, $3, $4)`, [
        customer!.id,
        deal.contact_name,
        deal.mobile,
        deal.email,
      ]);
    }
    await q(`UPDATE adm_deals SET customer_id = $2, stage = 'won', closed_at = COALESCE(closed_at, now()), updated_at = now() WHERE id = $1`, [
      id,
      customer!.id,
    ]);
    await q(`UPDATE adm_quotes SET customer_id = $2 WHERE deal_id = $1 AND customer_id IS NULL`, [id, customer!.id]);
    await logActivity("deal", id, "system", "به مشتری تبدیل شد.", user.id);
    await logActivity("customer", customer!.id, "system", `از فرصت فروش «${deal.title}» ساخته شد.`, user.id);
    return { redirect: `/admin/customers/${customer!.id}` };
  });
}

/* ---------------- timeline & tasks (shared by every entity) ---------------- */

const ENTITY_AREA: Record<string, Area> = { deal: "crm", customer: "customers", project: "projects", ticket: "support" };

function entityRef(fd: FormData): { entity: string; entityId: string; area: Area } {
  const entity = String(fd.get("entity") ?? "");
  const entityId = String(fd.get("entity_id") ?? "");
  if (!ENTITY_AREA[entity] || !/^\d{1,15}$/.test(entityId)) throw new AdminError("invalid");
  return { entity, entityId, area: ENTITY_AREA[entity] };
}

export async function addActivity(_prev: AdminState, fd: FormData): Promise<AdminState> {
  const area = ENTITY_AREA[String(fd.get("entity"))] ?? "settings";
  return actForm(area, async (user) => {
    const { entity, entityId } = entityRef(fd);
    const vals = parse(fd, activityFields);
    await logActivity(entity, entityId, v.s(vals, "kind")!, v.s(vals, "body")!, user.id);
    if (entity === "deal") await q(`UPDATE adm_deals SET updated_at = now() WHERE id = $1`, [Number(entityId)]);
    return ok("ثبت شد.");
  });
}

export async function saveTask(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return actForm("dashboard", async (user) => {
    const vals = parse(fd, taskFields(await userOptions()));
    const id = Number(fd.get("id")) || null;
    const entity = String(fd.get("entity") ?? "") || null;
    const entityId = String(fd.get("entity_id") ?? "") || null;
    if (entity && (!ENTITY_AREA[entity] || !entityId || !/^\d{1,15}$/.test(entityId))) throw new AdminError("invalid");
    const params = [v.s(vals, "title"), v.s(vals, "due_date"), v.s(vals, "priority"), v.s(vals, "assignee_id") ?? user.id, v.s(vals, "notes")];
    if (id) {
      await q(`UPDATE adm_tasks SET title = $1, due_date = $2, priority = $3, assignee_id = $4, notes = $5 WHERE id = $6`, [...params, id]);
    } else {
      await q(`INSERT INTO adm_tasks (title, due_date, priority, assignee_id, notes, entity, entity_id) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
        ...params,
        entity,
        entityId,
      ]);
    }
    return ok(id ? "ذخیره شد." : "کار اضافه شد.");
  });
}

export async function toggleTask(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("dashboard", async () => {
    const id = idFrom(fd);
    await q(`UPDATE adm_tasks SET done = NOT done, done_at = CASE WHEN done THEN NULL ELSE now() END WHERE id = $1`, [id]);
    return ok();
  });
}

export async function deleteTask(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("dashboard", async () => {
    await q(`DELETE FROM adm_tasks WHERE id = $1`, [idFrom(fd)]);
    return ok();
  });
}

/* ---------------- website demos & inbox ---------------- */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function updateDemo(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("crm", async () => {
    const id = String(fd.get("id") ?? "");
    if (!UUID.test(id)) throw new AdminError("invalid");
    const op = String(fd.get("op"));
    if (op === "extend") {
      await q(
        `UPDATE demo_leads SET expires_at = GREATEST(expires_at, now()) + interval '7 days',
           status = CASE WHEN status = 'expired' THEN 'active' ELSE status END WHERE id = $1`,
        [id]
      );
    } else if (op === "disable" || op === "enable") {
      await q(`UPDATE demo_leads SET status = $2 WHERE id = $1`, [id, op === "disable" ? "disabled" : "active"]);
    } else throw new AdminError("invalid");
    return ok();
  });
}

export async function updateMessage(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("crm", async (user) => {
    const id = String(fd.get("id") ?? "");
    if (!UUID.test(id)) throw new AdminError("invalid");
    const op = String(fd.get("op"));
    if (op === "read" || op === "archived" || op === "new") {
      await q(`UPDATE contact_messages SET status = $2 WHERE id = $1`, [id, op]);
      return ok();
    }
    if (op === "deal") {
      const m = await q1<{ name: string; company: string | null; email: string; phone: string | null; message: string; utm: Record<string, string> | null }>(
        `SELECT name, company, email, phone, message, utm FROM contact_messages WHERE id = $1`,
        [id]
      );
      if (!m) throw new AdminError("notFound");
      const existing = await q1<{ id: number }>(`SELECT id FROM adm_deals WHERE contact_message_id = $1`, [id]);
      if (existing) return { redirect: `/admin/deals/${existing.id}` };
      const deal = await q1<{ id: number }>(
        `INSERT INTO adm_deals (title, company, contact_name, mobile, email, source, stage, contact_message_id, notes, owner_id, utm_source, utm_medium, utm_campaign)
         VALUES ($1, $2, $3, $4, $5, 'contact', 'new', $6, $7, $8, $9, $10, $11) RETURNING id`,
        [`پیام سایت — ${m.company || m.name}`, m.company, m.name, m.phone, m.email, id, m.message, user.id, m.utm?.source ?? null, m.utm?.medium ?? null, m.utm?.campaign ?? null]
      );
      await q(`UPDATE contact_messages SET status = 'read' WHERE id = $1`, [id]);
      await logActivity("deal", deal!.id, "system", "از پیام فرم تماس سایت ساخته شد.", user.id);
      return { redirect: `/admin/deals/${deal!.id}` };
    }
    throw new AdminError("invalid");
  });
}

/* ---------------- quotes ---------------- */

export async function saveQuote(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return actForm("crm", async (user) => {
    const vals = parse(fd, quoteFields);
    const lines = parseLines(fd);
    const dealId = Number(fd.get("deal_id")) || null;
    let customerId = Number(fd.get("customer_id")) || null;
    if (dealId && !customerId) {
      customerId = (await q1<{ customer_id: number | null }>(`SELECT customer_id FROM adm_deals WHERE id = $1`, [dealId]))?.customer_id ?? null;
    }
    if (!dealId && !customerId) throw new FieldErrors({ customer_id: "required" });
    const discount = parseAmount(String(fd.get("discount") ?? "")) ?? 0;
    const t = totals(lines, discount, await vatRate(), fd.get("vat") === "on");
    const number = await nextNumber("quote", "Q", jYear());

    const row = await q1<{ id: number }>(
      `INSERT INTO adm_quotes (number, deal_id, customer_id, title, status, issued_at, valid_until, subtotal, discount, tax, total, notes)
       VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [number, dealId, customerId, v.s(vals, "title"), v.s(vals, "issued_at"), v.s(vals, "valid_until"), t.subtotal, t.discount, t.tax, t.total, v.s(vals, "notes")]
    );
    for (const l of lines) {
      await q(`INSERT INTO adm_quote_lines (quote_id, description, qty, unit_price, line_total) VALUES ($1, $2, $3, $4, $5)`, [
        row!.id,
        l.description,
        l.qty,
        l.unit_price,
        l.qty * l.unit_price,
      ]);
    }
    if (dealId) {
      await q(`UPDATE adm_deals SET value = CASE WHEN value = 0 THEN $2 ELSE value END, updated_at = now() WHERE id = $1`, [dealId, t.total]);
      await logActivity("deal", dealId, "system", `پیش‌فاکتور ${number} صادر شد.`, user.id);
    }
    return { redirect: `/admin/quotes/${row!.id}` };
  });
}

export async function setQuoteStatus(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("crm", async (user) => {
    const id = idFrom(fd);
    const status = String(fd.get("status"));
    if (!(status in QUOTE_STATUSES)) throw new AdminError("invalid");
    const qrow = await q1<{ deal_id: number | null; number: string }>(`UPDATE adm_quotes SET status = $2 WHERE id = $1 RETURNING deal_id, number`, [id, status]);
    if (qrow?.deal_id) {
      if (status === "sent") await q(`UPDATE adm_deals SET stage = 'proposal', updated_at = now() WHERE id = $1 AND stage IN ('new', 'contacted', 'demo')`, [qrow.deal_id]);
      if (status === "accepted") await q(`UPDATE adm_deals SET stage = 'negotiation', updated_at = now() WHERE id = $1 AND stage NOT IN ('won', 'lost')`, [qrow.deal_id]);
      await logActivity("deal", qrow.deal_id, "system", `پیش‌فاکتور ${qrow.number}: ${labelOf(QUOTE_STATUSES, status)}`, user.id);
    }
    return ok();
  });
}

/** Accepted quote → contract draft for the same customer and amount. */
export async function quoteToContract(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("finance", async (user) => {
    const id = idFrom(fd);
    const quote = await q1<{ customer_id: number | null; deal_id: number | null; title: string; net: number; number: string }>(
      `SELECT customer_id, deal_id, title, subtotal - discount AS net, number FROM adm_quotes WHERE id = $1`,
      [id]
    );
    if (!quote) throw new AdminError("notFound");
    let customerId = quote.customer_id;
    if (!customerId && quote.deal_id) {
      customerId = (await q1<{ customer_id: number | null }>(`SELECT customer_id FROM adm_deals WHERE id = $1`, [quote.deal_id]))?.customer_id ?? null;
    }
    if (!customerId) throw new AdminError("noCustomer");
    const number = await nextNumber("contract", "C", jYear());
    const row = await q1<{ id: number }>(
      `INSERT INTO adm_contracts (number, customer_id, kind, title, status, start_date, amount, quote_id, notes)
       VALUES ($1, $2, 'implementation', $3, 'draft', $4, $5, $6, $7) RETURNING id`,
      // Contract amounts are before VAT; VAT is added on each invoice.
      [number, customerId, quote.title, todayIso(), quote.net, id, `بر اساس پیش‌فاکتور ${quote.number}`]
    );
    await q(`UPDATE adm_quotes SET status = 'accepted', customer_id = $2 WHERE id = $1`, [id, customerId]);
    if (quote.deal_id) {
      await q(`UPDATE adm_deals SET stage = 'won', closed_at = COALESCE(closed_at, now()), updated_at = now() WHERE id = $1`, [quote.deal_id]);
      await logActivity("deal", quote.deal_id, "system", `قرارداد ${number} ساخته شد؛ فرصت برنده شد.`, user.id);
    }
    await logActivity("customer", customerId, "system", `قرارداد ${number} از پیش‌فاکتور ${quote.number} ساخته شد.`, user.id);
    return { redirect: `/admin/contracts/${row!.id}` };
  });
}

export async function deleteQuote(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("crm", async () => {
    await q(`DELETE FROM adm_quotes WHERE id = $1`, [idFrom(fd)]);
    return { redirect: "/admin/quotes" };
  });
}
