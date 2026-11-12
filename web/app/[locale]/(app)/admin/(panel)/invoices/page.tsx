import { Panel, StatRow, StatTile, Table, Td, Tr } from "@/components/dashboard/ui";
import { A, Badge, Empty, LinkButton, Money, PageHeader, Tabs, fa, jdate, millions } from "@/components/admin/ui";
import { requirePage } from "@/lib/admin/auth";
import { daysFromToday, jalaliMonthKey, todayIso } from "@/lib/admin/jalali";
import { INVOICE_STATUSES } from "@/lib/admin/labels";
import { q } from "@/lib/admin/schema";

export const metadata = { title: "فاکتورها و دریافت‌ها" };

type Row = { id: number; number: string; customer_id: number; customer: string; status: string; issued_at: string; due_at: string; total: number; paid: number };

const FILTERS = {
  all: "همه",
  open: "باز",
  overdue: "سررسیدگذشته",
  paid: "تسویه‌شده",
  cancelled: "باطل‌شده",
} as const;

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  await requirePage("finance");
  const { f } = await searchParams;
  const key = (f && f in FILTERS ? f : "all") as keyof typeof FILTERS;
  const rows = await q<Row>(
    `SELECT i.id, i.number, i.customer_id, c.name AS customer, i.status, i.issued_at, i.due_at, i.total, i.paid
     FROM adm_invoices i JOIN adm_customers c ON c.id = i.customer_id ORDER BY i.issued_at DESC, i.id DESC LIMIT 1000`
  );
  const isOpen = (r: Row) => r.status === "issued" || r.status === "partial";
  const isOverdue = (r: Row) => isOpen(r) && daysFromToday(r.due_at) < 0;
  const match: Record<keyof typeof FILTERS, (r: Row) => boolean> = {
    all: () => true,
    open: isOpen,
    overdue: isOverdue,
    paid: (r) => r.status === "paid",
    cancelled: (r) => r.status === "cancelled",
  };
  const shown = rows.filter(match[key]);
  const thisMonth = jalaliMonthKey(todayIso());
  const live = rows.filter((r) => r.status !== "cancelled");

  return (
    <>
      <PageHeader title="فاکتورها و دریافت‌ها" meta="فاکتورهای رسمی، دریافت‌ها و مطالبات" actions={<LinkButton href="/admin/invoices/new">فاکتور جدید</LinkButton>} />
      <div className="space-y-6">
        <StatRow>
          <StatTile label="مطالبات باز" value={millions(rows.filter(isOpen).reduce((s, r) => s + r.total - r.paid, 0))} unit="میلیون تومان" delta={`${fa(rows.filter(isOpen).length)} فاکتور`} />
          <StatTile label="سررسیدگذشته" value={millions(rows.filter(isOverdue).reduce((s, r) => s + r.total - r.paid, 0))} unit="میلیون تومان" delta={`${fa(rows.filter(isOverdue).length)} فاکتور`} trend={rows.some(isOverdue) ? "down" : "flat"} />
          <StatTile label="فاکتورشده این ماه" value={millions(live.filter((r) => jalaliMonthKey(r.issued_at) === thisMonth).reduce((s, r) => s + r.total, 0))} unit="میلیون تومان" />
          <StatTile label="کل فاکتورها" value={fa(live.length)} />
        </StatRow>
        <Panel flush>
          <div className="p-5">
            <Tabs
              items={Object.entries(FILTERS).map(([k, label]) => ({
                href: k === "all" ? "/admin/invoices" : `/admin/invoices?f=${k}`,
                label,
                count: rows.filter(match[k as keyof typeof FILTERS]).length,
                active: k === key,
              }))}
            />
          </div>
          <Table
            head={[
              { label: "شماره" },
              { label: "مشتری" },
              { label: "تاریخ", hideBelow: "md" },
              { label: "سررسید", hideBelow: "lg" },
              { label: "مبلغ", align: "end" },
              { label: "مانده", align: "end", hideBelow: "sm" },
              { label: "وضعیت" },
            ]}
          >
            {shown.length === 0 ? <Empty colSpan={7}>فاکتوری نیست.</Empty> : null}
            {shown.map((r) => (
              <Tr key={r.id}>
                <Td><A href={`/admin/invoices/${r.id}`} className="t-code">{r.number}</A></Td>
                <Td><A href={`/admin/customers/${r.customer_id}`} className="block max-w-[14rem] truncate">{r.customer}</A></Td>
                <Td muted numeric hideBelow="md">{jdate(r.issued_at)}</Td>
                <Td muted numeric hideBelow="lg">{jdate(r.due_at)}</Td>
                <Td align="end"><Money value={r.total} /></Td>
                <Td align="end" hideBelow="sm"><Money value={r.status === "cancelled" ? 0 : r.total - r.paid} /></Td>
                <Td><Badge map={INVOICE_STATUSES} value={isOverdue(r) ? "overdue" : r.status} /></Td>
              </Tr>
            ))}
          </Table>
        </Panel>
      </div>
    </>
  );
}
