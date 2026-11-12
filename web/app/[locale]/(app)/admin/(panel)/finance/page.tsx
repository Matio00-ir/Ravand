import { ColumnChart } from "@/components/dashboard/charts";
import { ShareBar, StatRow, StatTile, Table, Td, Tr } from "@/components/dashboard/ui";
import { A, Empty, Money, PageHeader, Section, millions } from "@/components/admin/ui";
import { faDigits } from "@/components/admin/ui";
import { requirePage } from "@/lib/admin/auth";
import { daysFromToday, jalaliMonthKey, jalaliMonthName, lastJalaliMonths, todayIso } from "@/lib/admin/jalali";
import { q } from "@/lib/admin/schema";

export const metadata = { title: "گزارش مالی" };

/**
 * The money picture on a cash basis: what was invoiced, what actually
 * came in, what went out, month by month (Jalali), plus receivables
 * aging and recurring support revenue.
 */
export default async function FinanceReportPage() {
  await requirePage("finance");
  const [invoices, payments, expenses, support] = await Promise.all([
    q<{ issued_at: string; due_at: string; total: number; paid: number; status: string; customer_id: number; customer: string }>(
      `SELECT i.issued_at, i.due_at, i.total, i.paid, i.status, i.customer_id, c.name AS customer
       FROM adm_invoices i JOIN adm_customers c ON c.id = i.customer_id WHERE i.status <> 'cancelled'`
    ),
    q<{ amount: number; paid_at: string }>(`SELECT p.amount, p.paid_at FROM adm_payments p JOIN adm_invoices i ON i.id = p.invoice_id WHERE i.status <> 'cancelled'`),
    q<{ amount: number; spent_at: string }>(`SELECT amount, spent_at FROM adm_expenses`),
    q<{ amount: number }>(`SELECT amount FROM adm_contracts WHERE status = 'active' AND kind = 'support'`),
  ]);

  const months = lastJalaliMonths(12);
  const sumBy = <T,>(items: T[], date: (x: T) => string, val: (x: T) => number, key: string) =>
    items.filter((x) => jalaliMonthKey(date(x)) === key).reduce((s, x) => s + val(x), 0);
  const table = months.map((m) => {
    const invoiced = sumBy(invoices, (x) => x.issued_at, (x) => x.total, m);
    const collected = sumBy(payments, (x) => x.paid_at, (x) => x.amount, m);
    const spent = sumBy(expenses, (x) => x.spent_at, (x) => x.amount, m);
    return { m, invoiced, collected, spent, net: collected - spent };
  });

  const year = faDigits(jalaliMonthKey(todayIso()).slice(0, 4));
  const yearKey = jalaliMonthKey(todayIso()).slice(0, 4);
  const inYear = (d: string) => jalaliMonthKey(d).startsWith(yearKey);
  const collectedYear = payments.filter((p) => inYear(p.paid_at)).reduce((s, p) => s + p.amount, 0);
  const spentYear = expenses.filter((e) => inYear(e.spent_at)).reduce((s, e) => s + e.amount, 0);
  const arr = support.reduce((s, x) => s + x.amount, 0);

  const open = invoices.filter((i) => i.status === "issued" || i.status === "partial");
  const receivable = open.reduce((s, i) => s + i.total - i.paid, 0);
  const buckets = [
    { label: "سررسیدنشده", test: (d: number) => d >= 0 },
    { label: "۱ تا ۳۰ روز گذشته", test: (d: number) => d < 0 && d >= -30 },
    { label: "۳۱ تا ۹۰ روز گذشته", test: (d: number) => d < -30 && d >= -90 },
    { label: "بیش از ۹۰ روز", test: (d: number) => d < -90 },
  ].map((b) => {
    const amount = open.filter((i) => b.test(daysFromToday(i.due_at))).reduce((s, i) => s + i.total - i.paid, 0);
    return { ...b, amount, share: receivable ? Math.round((amount / receivable) * 100) : 0 };
  });

  const byCustomer = new Map<number, { name: string; total: number }>();
  for (const i of invoices.filter((x) => inYear(x.issued_at))) {
    const row = byCustomer.get(i.customer_id) ?? { name: i.customer, total: 0 };
    row.total += i.total;
    byCustomer.set(i.customer_id, row);
  }
  const top = [...byCustomer.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 6);

  return (
    <>
      <PageHeader title="گزارش مالی" meta={`سال ${year} — بر مبنای نقدی (دریافت‌ها و هزینه‌های واقعی)`} />
      <div className="space-y-6">
        <StatRow>
          <StatTile label={`وصول ${year}`} value={millions(collectedYear)} unit="میلیون تومان" />
          <StatTile label={`هزینه ${year}`} value={millions(spentYear)} unit="میلیون تومان" />
          <StatTile label="سود نقدی" value={millions(collectedYear - spentYear)} unit="میلیون تومان" trend={collectedYear - spentYear >= 0 ? "up" : "down"} />
          <StatTile label="درآمد سالانه پشتیبانی (ARR)" value={millions(arr)} unit="میلیون تومان" delta={`ماهانه ≈ ${millions(arr / 12)} میلیون`} />
        </StatRow>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Section title="وصول ماهانه" meta="مبالغ دریافت‌شده در ۱۲ ماه اخیر">
            <div className="h-56">
              <ColumnChart data={table.map((r) => r.collected)} labels={table.map((r) => jalaliMonthName(r.m).slice(0, 3))} />
            </div>
          </Section>
          <Section title="سنی مطالبات" meta={`کل مطالبات: ${millions(receivable)} میلیون تومان`}>
            <ul className="space-y-4">
              {buckets.map((b, i) => (
                <ShareBar key={b.label} label={b.label} value={b.share} caption={`${millions(b.amount)} میلیون`} opacity={1 - i * 0.15} />
              ))}
            </ul>
          </Section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Section title="جریان ماهانه" flush>
            <Table head={[{ label: "ماه" }, { label: "فاکتورشده", align: "end" }, { label: "وصول", align: "end" }, { label: "هزینه", align: "end" }, { label: "خالص نقدی", align: "end" }]}>
              {[...table].reverse().map((r) => (
                <Tr key={r.m}>
                  <Td>{jalaliMonthName(r.m)} {r.m.slice(0, 4).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}</Td>
                  <Td align="end" muted><Money value={r.invoiced} /></Td>
                  <Td align="end"><Money value={r.collected} /></Td>
                  <Td align="end" muted><Money value={r.spent} /></Td>
                  <Td align="end"><Money value={r.net} className={r.net < 0 ? "text-[#d9a3a3]" : "text-[#9ab89f]"} /></Td>
                </Tr>
              ))}
            </Table>
          </Section>
          <Section title={`بزرگ‌ترین مشتریان ${year}`} meta="بر اساس مبلغ فاکتورشده">
            {top.length === 0 ? (
              <Empty>هنوز فاکتوری برای امسال نیست.</Empty>
            ) : (
              <ul className="space-y-3">
                {top.map(([id, x]) => (
                  <li key={id} className="flex items-center justify-between gap-3 text-[13px]">
                    <A href={`/admin/customers/${id}`} className="min-w-0 truncate">{x.name}</A>
                    <Money value={x.total} className="text-silver" />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
