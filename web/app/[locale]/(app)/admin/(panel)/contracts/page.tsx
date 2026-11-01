import { Panel, StatRow, StatTile, Status, Table, Td, Tr } from "@/components/dashboard/ui";
import { A, Badge, Empty, LinkButton, Money, PageHeader, Section, Tabs, fa, jdate, millions } from "@/components/admin/ui";
import { requirePage } from "@/lib/admin/auth";
import { daysFromToday } from "@/lib/admin/jalali";
import { CONTRACT_KINDS, CONTRACT_STATUSES, labelOf, options } from "@/lib/admin/labels";
import { q } from "@/lib/admin/schema";

export const metadata = { title: "قراردادها و تمدید" };

type Row = {
  id: number; number: string; kind: string; title: string; status: string; start_date: string; end_date: string | null;
  amount: number; customer_id: number; customer: string; renewed: boolean; billed: number;
};

export default async function ContractsPage({ searchParams }: { searchParams: Promise<{ status?: string; kind?: string }> }) {
  await requirePage("finance");
  const sp = await searchParams;
  const rows = await q<Row>(
    `SELECT k.id, k.number, k.kind, k.title, k.status, k.start_date, k.end_date, k.amount, k.customer_id, c.name AS customer,
            EXISTS (SELECT 1 FROM adm_contracts n WHERE n.renewal_of = k.id) AS renewed,
            COALESCE((SELECT sum(subtotal - discount) FROM adm_invoices i WHERE i.contract_id = k.id AND i.status <> 'cancelled'), 0) AS billed
     FROM adm_contracts k JOIN adm_customers c ON c.id = k.customer_id
     ORDER BY k.start_date DESC LIMIT 500`
  );

  const active = rows.filter((r) => r.status === "active");
  const support = active.filter((r) => r.kind === "support");
  const renewals = support
    .filter((r) => r.end_date && !r.renewed && daysFromToday(r.end_date) <= 60)
    .sort((a, b) => a.end_date!.localeCompare(b.end_date!));
  const shown = rows.filter((r) => (!sp.status || r.status === sp.status) && (!sp.kind || r.kind === sp.kind));

  return (
    <>
      <PageHeader title="قراردادها و تمدید" meta="قراردادهای پیاده‌سازی و پشتیبانی سالانه؛ تمدیدهای پیش‌رو بالای صفحه" actions={<LinkButton href="/admin/contracts/new">قرارداد جدید</LinkButton>} />
      <div className="space-y-6">
        <StatRow>
          <StatTile label="قراردادهای فعال" value={fa(active.length)} />
          <StatTile label="درآمد سالانه پشتیبانی" value={millions(support.reduce((s, r) => s + r.amount, 0))} unit="میلیون تومان" delta={`${fa(support.length)} قرارداد پشتیبانی`} />
          <StatTile label="تمدید در ۶۰ روز آینده" value={fa(renewals.length)} trend={renewals.length ? "down" : "flat"} delta={`${millions(renewals.reduce((s, r) => s + r.amount, 0))} میلیون تومان`} />
          <StatTile label="فاکتورنشده از قراردادهای فعال" value={millions(active.reduce((s, r) => s + Math.max(0, r.amount - r.billed), 0))} unit="میلیون تومان" />
        </StatRow>

        <Section title="تمدیدهای پیش‌رو" meta="قراردادهای پشتیبانی که تا ۶۰ روز دیگر تمام می‌شوند و هنوز تمدید نشده‌اند" flush>
          <Table head={[{ label: "مشتری" }, { label: "قرارداد", hideBelow: "md" }, { label: "پایان" }, { label: "مبلغ", align: "end" }]}>
            {renewals.length === 0 ? <Empty colSpan={4}>تمدیدی در پیش نیست.</Empty> : null}
            {renewals.map((r) => {
              const d = daysFromToday(r.end_date!);
              return (
                <Tr key={r.id}>
                  <Td><A href={`/admin/customers/${r.customer_id}`}>{r.customer}</A></Td>
                  <Td hideBelow="md"><A href={`/admin/contracts/${r.id}`} className="t-code">{r.number}</A></Td>
                  <Td>
                    <Status tone={d < 0 ? "error" : d <= 30 ? "warning" : "info"}>{d < 0 ? `${fa(-d)} روز گذشته` : `${fa(d)} روز مانده`}</Status>
                    <span className="t-num block text-[11.5px] text-steel">{jdate(r.end_date)}</span>
                  </Td>
                  <Td align="end"><Money value={r.amount} /></Td>
                </Tr>
              );
            })}
          </Table>
        </Section>

        <Panel flush>
          <div className="flex flex-wrap gap-4 p-5">
            <Tabs
              items={[
                { href: "/admin/contracts", label: "همه", count: rows.length, active: !sp.status && !sp.kind },
                ...options(CONTRACT_STATUSES).map((o) => ({ href: `/admin/contracts?status=${o.value}`, label: o.label, count: rows.filter((r) => r.status === o.value).length, active: sp.status === o.value })),
                ...options(CONTRACT_KINDS).map((o) => ({ href: `/admin/contracts?kind=${o.value}`, label: o.label, active: sp.kind === o.value })),
              ]}
            />
          </div>
          <Table
            head={[
              { label: "شماره" },
              { label: "مشتری" },
              { label: "نوع", hideBelow: "md" },
              { label: "دوره", hideBelow: "lg" },
              { label: "مبلغ", align: "end" },
              { label: "فاکتورشده (بی‌مالیات)", align: "end", hideBelow: "lg" },
              { label: "وضعیت" },
            ]}
          >
            {shown.length === 0 ? <Empty colSpan={7}>قراردادی نیست.</Empty> : null}
            {shown.map((r) => (
              <Tr key={r.id}>
                <Td><A href={`/admin/contracts/${r.id}`} className="t-code">{r.number}</A></Td>
                <Td>
                  <span className="block max-w-[14rem] truncate">{r.customer}</span>
                  <span className="block max-w-[14rem] truncate text-[12px] text-steel">{r.title}</span>
                </Td>
                <Td muted hideBelow="md">{labelOf(CONTRACT_KINDS, r.kind)}</Td>
                <Td muted numeric hideBelow="lg">{jdate(r.start_date)} — {jdate(r.end_date)}</Td>
                <Td align="end"><Money value={r.amount} /></Td>
                <Td align="end" hideBelow="lg"><Money value={r.billed} className="text-silver" /></Td>
                <Td><Badge map={CONTRACT_STATUSES} value={r.status} /></Td>
              </Tr>
            ))}
          </Table>
        </Panel>
      </div>
    </>
  );
}
