import { balanceOf, isOverdue, type Snapshot } from "@/lib/sandbox/store";

/**
 * Every dashboard figure in the sandbox, derived from the customer's own
 * rows — so issuing an invoice or recording a payment moves the numbers
 * on the overview and finance screens immediately.
 */

const DAY = 24 * 60 * 60 * 1000;

/** Calendar month key in the locale's calendar (Jalali for fa). */
function monthParts(date: Date, locale: string): { key: string; label: string } {
  const cal = locale === "fa" ? "persian" : "gregory";
  const parts = new Intl.DateTimeFormat(`en-u-ca-${cal}`, { year: "numeric", month: "numeric" }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const label = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR-u-ca-persian" : "en-US", { month: "short" }).format(date);
  return { key: `${year}-${month}`, label };
}

/** The last `count` calendar months, oldest first. */
export function lastMonths(count: number, locale: string, now = new Date()) {
  const months: { key: string; label: string }[] = [];
  for (let d = 0; months.length < count && d < count * 32; d++) {
    const m = monthParts(new Date(now.getTime() - d * DAY), locale);
    if (!months.some((x) => x.key === m.key)) months.push(m);
  }
  return months.reverse();
}

function sumWhere<T>(items: T[], pick: (x: T) => number, where: (x: T) => boolean) {
  return items.reduce((s, x) => (where(x) ? s + pick(x) : s), 0);
}

/** Percent change, or null when there's no base to compare against. */
function change(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function computeMetrics(snap: Snapshot, locale: string, now = Date.now()) {
  const live = snap.invoices.filter((i) => i.status !== "cancelled");
  const inWindow = (d: Date, from: number, to: number) => d.getTime() > now - from * DAY && d.getTime() <= now - to * DAY;

  const sales30 = sumWhere(live, (i) => i.total, (i) => inWindow(i.issuedAt, 30, 0));
  const salesPrev30 = sumWhere(live, (i) => i.total, (i) => inWindow(i.issuedAt, 60, 30));
  const invoices30 = live.filter((i) => inWindow(i.issuedAt, 30, 0)).length;
  const collected30 = sumWhere(snap.payments, (p) => p.amount, (p) => inWindow(p.paidAt, 30, 0));
  const collectedPrev30 = sumWhere(snap.payments, (p) => p.amount, (p) => inWindow(p.paidAt, 60, 30));
  const vat30 = sumWhere(live, (i) => i.tax, (i) => inWindow(i.issuedAt, 30, 0));

  const open = live.filter((i) => balanceOf(i) > 0);
  const receivables = open.reduce((s, i) => s + balanceOf(i), 0);
  const overdue = open.filter((i) => isOverdue(i, now));
  const overdueAmount = overdue.reduce((s, i) => s + balanceOf(i), 0);

  const lowStock = snap.products.filter((p) => p.trackStock && p.stock <= p.reorderPoint);

  // Receivables aging by days past due.
  const aging = [
    { key: "current", min: -Infinity, max: 0 },
    { key: "d30", min: 0, max: 30 },
    { key: "d60", min: 30, max: 60 },
    { key: "d60plus", min: 60, max: Infinity },
  ].map((b) => {
    const amount = open
      .filter((i) => {
        const past = (now - i.dueAt.getTime()) / DAY;
        return past > b.min && past <= b.max;
      })
      .reduce((s, i) => s + balanceOf(i), 0);
    return { key: b.key, amount, share: receivables > 0 ? Math.round((amount / receivables) * 100) : 0 };
  });

  // Six calendar months of sales vs. cash actually collected.
  const months = lastMonths(6, locale, new Date(now));
  const salesByMonth = months.map((m) =>
    sumWhere(live, (i) => i.total, (i) => monthParts(i.issuedAt, locale).key === m.key)
  );
  const cashByMonth = months.map((m) =>
    sumWhere(snap.payments, (p) => p.amount, (p) => monthParts(p.paidAt, locale).key === m.key)
  );

  // Top products by revenue need invoice lines, which the snapshot
  // doesn't carry; top customers by sales are what the overview shows.
  const byCustomer = new Map<string, number>();
  for (const i of live) byCustomer.set(i.customerName, (byCustomer.get(i.customerName) ?? 0) + i.total);
  const ranked = [...byCustomer.entries()].sort((a, b) => b[1] - a[1]);
  const totalSales = ranked.reduce((s, [, v]) => s + v, 0);
  const topCustomers = ranked.slice(0, 4).map(([label, value]) => ({ label, value }));
  const others = totalSales - topCustomers.reduce((s, c) => s + c.value, 0);

  // Balance per customer for the CRM list.
  const customerBalance = new Map<number, { balance: number; count: number; last: Date | null; sales: number }>();
  for (const c of snap.customers) customerBalance.set(c.id, { balance: 0, count: 0, last: null, sales: 0 });
  for (const i of live) {
    const row = customerBalance.get(i.customerId);
    if (!row) continue;
    row.balance += balanceOf(i);
    row.count += 1;
    row.sales += i.total;
    if (!row.last || i.issuedAt > row.last) row.last = i.issuedAt;
  }

  return {
    sales30,
    salesChange: change(sales30, salesPrev30),
    invoices30,
    avgInvoice30: invoices30 > 0 ? Math.round(sales30 / invoices30) : 0,
    collected30,
    collectedChange: change(collected30, collectedPrev30),
    vat30,
    receivables,
    openCount: open.length,
    overdueCount: overdue.length,
    overdueAmount,
    lowStock,
    aging,
    months: months.map((m) => m.label),
    salesByMonth,
    cashByMonth,
    customerMix: others > 0 ? [...topCustomers, { label: "__others", value: others }] : topCustomers,
    totalSales,
    customerBalance,
  };
}

export type Metrics = ReturnType<typeof computeMetrics>;
