"use server";

import { FieldErrors, act, actForm, idFrom, logActivity, ok, parse, type AdminState } from "@/lib/admin/act";
import { AdminError } from "@/lib/admin/auth";
import { catalogFields, contractFields, expenseFields, invoiceFields, paymentFields } from "@/lib/admin/defs";
import { parseAmount, v } from "@/lib/admin/fields";
import { addDaysIso, addYearsIso, isoToJalali, todayIso } from "@/lib/admin/jalali";
import { CONTRACT_STATUSES, labelOf } from "@/lib/admin/labels";
import { nextNumber, q, q1 } from "@/lib/admin/schema";
import { contractOptions, customerOptions, parseLines, totals, vatRate } from "@/lib/admin/settings";

const jYearOf = (iso: string) => isoToJalali(iso).slice(0, 4);

/* ---------------- contracts ---------------- */

export async function saveContract(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return actForm("finance", async (user) => {
    const vals = parse(fd, contractFields(await customerOptions()));
    const start = v.s(vals, "start_date")!;
    const end = v.s(vals, "end_date");
    if (end && end < start) throw new FieldErrors({ end_date: "invalid" });
    const params = [
      Number(v.s(vals, "customer_id")),
      v.s(vals, "kind"),
      v.s(vals, "title"),
      v.s(vals, "status"),
      start,
      end,
      v.n(vals, "amount"),
      v.b(vals, "auto_renew"),
      v.s(vals, "notes"),
    ];
    const id = Number(fd.get("id")) || null;
    if (!id) {
      const number = await nextNumber("contract", "C", jYearOf(start));
      const row = await q1<{ id: number }>(
        `INSERT INTO adm_contracts (customer_id, kind, title, status, start_date, end_date, amount, auto_renew, notes, number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [...params, number]
      );
      await logActivity("customer", params[0] as number, "system", `قرارداد ${number} ثبت شد.`, user.id);
      return { redirect: `/admin/contracts/${row!.id}` };
    }
    await q(
      `UPDATE adm_contracts SET customer_id = $1, kind = $2, title = $3, status = $4, start_date = $5, end_date = $6, amount = $7,
         auto_renew = $8, notes = $9 WHERE id = $10`,
      [...params, id]
    );
    return ok();
  });
}

export async function setContractStatus(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("finance", async (user) => {
    const id = idFrom(fd);
    const status = String(fd.get("status"));
    if (!(status in CONTRACT_STATUSES)) throw new AdminError("invalid");
    const row = await q1<{ customer_id: number; number: string }>(`UPDATE adm_contracts SET status = $2 WHERE id = $1 RETURNING customer_id, number`, [id, status]);
    if (row) await logActivity("customer", row.customer_id, "system", `قرارداد ${row.number}: ${labelOf(CONTRACT_STATUSES, status)}`, user.id);
    return ok();
  });
}

/**
 * Renews an annual support contract: a new contract for the next year,
 * starting the day after the current one ends, at the same price plus an
 * optional increase (Iran's inflation makes a yearly increase the norm).
 */
export async function renewContract(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("finance", async (user) => {
    const id = idFrom(fd);
    const increase = Math.min(500, Math.max(0, parseAmount(String(fd.get("increase") ?? "0")) ?? 0));
    const old = await q1<{ customer_id: number; kind: string; title: string; start_date: string; end_date: string | null; amount: number; auto_renew: boolean; number: string }>(
      `SELECT customer_id, kind, title, start_date, end_date, amount, auto_renew, number FROM adm_contracts WHERE id = $1`,
      [id]
    );
    if (!old) throw new AdminError("notFound");
    const existing = await q1<{ id: number }>(`SELECT id FROM adm_contracts WHERE renewal_of = $1`, [id]);
    if (existing) return { redirect: `/admin/contracts/${existing.id}` };

    const start = old.end_date ? addDaysIso(old.end_date, 1) : todayIso();
    const end = addDaysIso(addYearsIso(start, 1), -1);
    const amount = Math.round((old.amount * (100 + increase)) / 100 / 10_000) * 10_000;
    const number = await nextNumber("contract", "C", jYearOf(start));
    const row = await q1<{ id: number }>(
      `INSERT INTO adm_contracts (number, customer_id, kind, title, status, start_date, end_date, amount, auto_renew, renewal_of, notes)
       VALUES ($1, $2, $3, $4, 'active', $5, $6, $7, $8, $9, $10) RETURNING id`,
      [number, old.customer_id, old.kind, old.title, start, end, amount, old.auto_renew, id, `تمدید قرارداد ${old.number}${increase ? ` با ${increase}٪ افزایش` : ""}`]
    );
    await q(`UPDATE adm_contracts SET status = 'completed' WHERE id = $1 AND status = 'active' AND end_date < $2`, [id, todayIso()]);
    await logActivity("customer", old.customer_id, "system", `قرارداد ${old.number} با شماره ${number} تمدید شد.`, user.id);
    return { redirect: `/admin/contracts/${row!.id}` };
  });
}

/* ---------------- invoices & payments ---------------- */

async function refreshInvoiceStatus(invoiceId: number) {
  await q(
    `UPDATE adm_invoices SET
       paid = COALESCE((SELECT sum(amount) FROM adm_payments WHERE invoice_id = $1), 0),
       status = CASE
         WHEN status IN ('cancelled', 'draft') THEN status
         WHEN COALESCE((SELECT sum(amount) FROM adm_payments WHERE invoice_id = $1), 0) >= total THEN 'paid'
         WHEN COALESCE((SELECT sum(amount) FROM adm_payments WHERE invoice_id = $1), 0) > 0 THEN 'partial'
         ELSE 'issued' END
     WHERE id = $1`,
    [invoiceId]
  );
}

export async function saveInvoice(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return actForm("finance", async (user) => {
    const vals = parse(fd, invoiceFields(await customerOptions(), await contractOptions()));
    const lines = parseLines(fd);
    const issued = v.s(vals, "issued_at")!;
    const due = v.s(vals, "due_at")!;
    if (due < issued) throw new FieldErrors({ due_at: "invalid" });
    const t = totals(lines, parseAmount(String(fd.get("discount") ?? "")) ?? 0, await vatRate(), fd.get("vat") === "on");
    const customerId = Number(v.s(vals, "customer_id"));
    const number = await nextNumber("invoice", "INV", jYearOf(issued));
    const row = await q1<{ id: number }>(
      `INSERT INTO adm_invoices (number, customer_id, contract_id, status, issued_at, due_at, subtotal, discount, tax, total, notes)
       VALUES ($1, $2, $3, 'issued', $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [number, customerId, v.s(vals, "contract_id") ? Number(v.s(vals, "contract_id")) : null, issued, due, t.subtotal, t.discount, t.tax, t.total, v.s(vals, "notes")]
    );
    for (const l of lines) {
      await q(`INSERT INTO adm_invoice_lines (invoice_id, description, qty, unit_price, line_total) VALUES ($1, $2, $3, $4, $5)`, [
        row!.id,
        l.description,
        l.qty,
        l.unit_price,
        l.qty * l.unit_price,
      ]);
    }
    await logActivity("customer", customerId, "system", `فاکتور ${number} صادر شد.`, user.id);
    return { redirect: `/admin/invoices/${row!.id}` };
  });
}

export async function recordPayment(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return actForm("finance", async (user) => {
    const id = idFrom(fd, "invoice_id");
    const vals = parse(fd, paymentFields);
    const inv = await q1<{ status: string; total: number; paid: number; customer_id: number; number: string }>(
      `SELECT status, total, paid, customer_id, number FROM adm_invoices WHERE id = $1`,
      [id]
    );
    if (!inv) throw new AdminError("notFound");
    if (inv.status === "cancelled" || inv.status === "paid") throw new AdminError("notPayable");
    const amount = v.n(vals, "amount");
    if (amount <= 0) throw new FieldErrors({ amount: "invalid" });
    if (amount > inv.total - inv.paid) throw new AdminError("overpay");
    await q(`INSERT INTO adm_payments (invoice_id, amount, method, reference, paid_at) VALUES ($1, $2, $3, $4, $5)`, [
      id,
      amount,
      v.s(vals, "method"),
      v.s(vals, "reference"),
      v.s(vals, "paid_at"),
    ]);
    await refreshInvoiceStatus(id);
    await logActivity("customer", inv.customer_id, "system", `دریافت ${new Intl.NumberFormat("fa-IR").format(amount)} تومان بابت فاکتور ${inv.number}.`, user.id);
    return ok("دریافت ثبت شد.");
  });
}

export async function deletePayment(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("finance", async () => {
    const id = idFrom(fd);
    const row = await q1<{ invoice_id: number }>(`DELETE FROM adm_payments WHERE id = $1 RETURNING invoice_id`, [id]);
    if (row) await refreshInvoiceStatus(row.invoice_id);
    return ok();
  });
}

export async function cancelInvoice(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("finance", async (user) => {
    const id = idFrom(fd);
    const inv = await q1<{ paid: number; customer_id: number; number: string }>(`SELECT paid, customer_id, number FROM adm_invoices WHERE id = $1`, [id]);
    if (!inv) throw new AdminError("notFound");
    if (inv.paid > 0) throw new AdminError("hasPayments");
    await q(`UPDATE adm_invoices SET status = 'cancelled' WHERE id = $1`, [id]);
    await logActivity("customer", inv.customer_id, "system", `فاکتور ${inv.number} باطل شد.`, user.id);
    return ok();
  });
}

/* ---------------- expenses & catalog ---------------- */

export async function saveExpense(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return actForm("finance", async () => {
    const vals = parse(fd, expenseFields);
    await q(`INSERT INTO adm_expenses (spent_at, category, amount, vendor, note) VALUES ($1, $2, $3, $4, $5)`, [
      v.s(vals, "spent_at"),
      v.s(vals, "category"),
      v.n(vals, "amount"),
      v.s(vals, "vendor"),
      v.s(vals, "note"),
    ]);
    return ok("هزینه ثبت شد.");
  });
}

export async function deleteExpense(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("finance", async () => {
    await q(`DELETE FROM adm_expenses WHERE id = $1`, [idFrom(fd)]);
    return ok();
  });
}

export async function saveCatalogItem(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return actForm("finance", async () => {
    const vals = parse(fd, catalogFields);
    const params = [v.s(vals, "name"), v.s(vals, "kind"), v.s(vals, "unit"), v.n(vals, "price"), v.s(vals, "description"), v.b(vals, "active")];
    const id = Number(fd.get("id")) || null;
    if (id) await q(`UPDATE adm_catalog SET name = $1, kind = $2, unit = $3, price = $4, description = $5, active = $6 WHERE id = $7`, [...params, id]);
    else await q(`INSERT INTO adm_catalog (name, kind, unit, price, description, active) VALUES ($1, $2, $3, $4, $5, $6)`, params);
    return ok(id ? "ذخیره شد." : "خدمت اضافه شد.");
  });
}

export async function deleteCatalogItem(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("finance", async () => {
    await q(`DELETE FROM adm_catalog WHERE id = $1`, [idFrom(fd)]);
    return ok();
  });
}
