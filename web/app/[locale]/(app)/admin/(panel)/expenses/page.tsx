import { Table, Td, Tr } from "@/components/dashboard/ui";
import { ActionButton, EntityForm } from "@/components/admin/forms";
import { Empty, Money, PageHeader, Section, Tabs, jdate, millions } from "@/components/admin/ui";
import { faDigits } from "@/components/admin/ui";
import { ShareBar } from "@/components/dashboard/ui";
import { deleteExpense, saveExpense } from "@/lib/admin/actions/finance";
import { requirePage } from "@/lib/admin/auth";
import { expenseFields } from "@/lib/admin/defs";
import { jalaliMonthKey, jalaliMonthName, todayIso } from "@/lib/admin/jalali";
import { EXPENSE_CATEGORIES, labelOf, options } from "@/lib/admin/labels";
import { q } from "@/lib/admin/schema";

export const metadata = { title: "هزینه‌ها" };

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  await requirePage("finance");
  const { c } = await searchParams;
  const rows = await q<{ id: number; spent_at: string; category: string; amount: number; vendor: string | null; note: string | null }>(
    `SELECT id, spent_at, category, amount, vendor, note FROM adm_expenses ORDER BY spent_at DESC, id DESC LIMIT 1000`
  );
  const month = jalaliMonthKey(todayIso());
  const year = faDigits(month.slice(0, 4));
  const thisMonth = rows.filter((r) => jalaliMonthKey(r.spent_at) === month);
  const thisYear = rows.filter((r) => jalaliMonthKey(r.spent_at).startsWith(month.slice(0, 4)));
  const byCat = options(EXPENSE_CATEGORIES)
    .map((o) => ({ ...o, total: thisYear.filter((r) => r.category === o.value).reduce((s, r) => s + r.amount, 0) }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);
  const yearTotal = thisYear.reduce((s, r) => s + r.amount, 0);
  const shown = c ? rows.filter((r) => r.category === c) : rows;

  return (
    <>
      <PageHeader title="هزینه‌ها" meta={`${jalaliMonthName(month)}: ${millions(thisMonth.reduce((s, r) => s + r.amount, 0))} میلیون — سال ${year}: ${millions(yearTotal)} میلیون تومان`} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Section title="دفتر هزینه‌ها" flush>
          <div className="px-5 pb-4">
            <Tabs
              items={[
                { href: "/admin/expenses", label: "همه", active: !c },
                ...options(EXPENSE_CATEGORIES).map((o) => ({ href: `/admin/expenses?c=${o.value}`, label: o.label, active: c === o.value })),
              ]}
            />
          </div>
          <Table head={[{ label: "تاریخ" }, { label: "دسته" }, { label: "شرح", hideBelow: "md" }, { label: "مبلغ", align: "end" }, { label: "" }]}>
            {shown.length === 0 ? <Empty colSpan={5}>هزینه‌ای ثبت نشده است.</Empty> : null}
            {shown.map((r) => (
              <Tr key={r.id}>
                <Td muted numeric>{jdate(r.spent_at)}</Td>
                <Td>{labelOf(EXPENSE_CATEGORIES, r.category)}</Td>
                <Td muted hideBelow="md">{[r.vendor, r.note].filter(Boolean).join(" — ") || "—"}</Td>
                <Td align="end"><Money value={r.amount} /></Td>
                <Td align="end"><ActionButton action={deleteExpense} hidden={{ id: r.id }} label="حذف" small confirm="این هزینه حذف شود؟" /></Td>
              </Tr>
            ))}
          </Table>
        </Section>
        <div className="min-w-0 space-y-6">
          <Section title="ثبت هزینه">
            <EntityForm action={saveExpense} fields={expenseFields} values={{ spent_at: todayIso(), category: "other" }} submitLabel="ثبت" resetOnSuccess />
          </Section>
          <Section title={`هزینه‌های سال ${year} به تفکیک`}>
            {byCat.length === 0 ? (
              <Empty>هنوز هزینه‌ای برای امسال ثبت نشده است.</Empty>
            ) : (
              <ul className="space-y-4">
                {byCat.map((x) => (
                  <ShareBar key={x.value} label={x.label} value={yearTotal ? Math.round((x.total / yearTotal) * 100) : 0} caption={`${millions(x.total)} میلیون`} />
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
