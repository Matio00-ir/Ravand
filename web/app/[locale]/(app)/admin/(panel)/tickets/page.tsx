import { Panel, StatRow, StatTile, Status, Table, Td, Tr } from "@/components/dashboard/ui";
import { A, Badge, Empty, LinkButton, PageHeader, Tabs, fa, jdatetime } from "@/components/admin/ui";
import { requirePage } from "@/lib/admin/auth";
import { PRIORITIES, TICKET_CATEGORIES, TICKET_STATUSES, labelOf } from "@/lib/admin/labels";
import { q, q1 } from "@/lib/admin/schema";

export const metadata = { title: "تیکت‌های پشتیبانی" };

type Row = {
  id: number; number: string; subject: string; status: string; priority: string; category: string; customer: string | null;
  customer_id: number | null; assignee: string | null; created_at: Date; resolved_at: Date | null; due_at: Date; hours_left: number;
};

const FILTERS = { open: "باز", breach: "عبور از مهلت", resolved: "حل‌شده", all: "همه" } as const;

export default async function TicketsPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  await requirePage("support");
  const { f } = await searchParams;
  const key = (f && f in FILTERS ? f : "open") as keyof typeof FILTERS;
  const rows = await q<Row>(
    `SELECT t.id, t.number, t.subject, t.status, t.priority, t.category, c.name AS customer, t.customer_id, u.name AS assignee,
            t.created_at, t.resolved_at, t.due_at, (extract(epoch FROM (t.due_at - now())) / 3600)::int AS hours_left
     FROM adm_tickets t LEFT JOIN adm_customers c ON c.id = t.customer_id LEFT JOIN adm_users u ON u.id = t.assignee_id
     ORDER BY CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, t.due_at
     LIMIT 1000`
  );
  const isOpen = (r: Row) => ["open", "in_progress", "waiting"].includes(r.status);
  const breach = (r: Row) => isOpen(r) && r.hours_left < 0;
  const match = { open: isOpen, breach, resolved: (r: Row) => !isOpen(r), all: () => true };
  const shown = rows.filter(match[key]);

  const recent = await q1<{ resolved: number; avg_hours: number | null }>(
    `SELECT count(*)::int AS resolved, round(avg(extract(epoch FROM (resolved_at - created_at)) / 3600))::int AS avg_hours
     FROM adm_tickets WHERE resolved_at > now() - interval '30 days'`
  );

  return (
    <>
      <PageHeader title="تیکت‌های پشتیبانی" meta="درخواست‌ها و مشکلات مشتریان؛ مهلت پاسخ بر اساس اولویت" actions={<LinkButton href="/admin/tickets/new">تیکت جدید</LinkButton>} />
      <div className="space-y-6">
        <StatRow>
          <StatTile label="تیکت‌های باز" value={fa(rows.filter(isOpen).length)} />
          <StatTile label="عبور از مهلت" value={fa(rows.filter(breach).length)} trend={rows.some(breach) ? "down" : "flat"} />
          <StatTile label="حل‌شده (۳۰ روز)" value={fa(recent?.resolved ?? 0)} />
          <StatTile label="میانگین زمان حل" value={fa(recent?.avg_hours ?? 0)} unit="ساعت" />
        </StatRow>
        <Panel flush>
          <div className="p-5">
            <Tabs items={Object.entries(FILTERS).map(([k, label]) => ({ href: k === "open" ? "/admin/tickets" : `/admin/tickets?f=${k}`, label, count: rows.filter(match[k as keyof typeof FILTERS]).length, active: k === key }))} />
          </div>
          <Table
            head={[
              { label: "تیکت" },
              { label: "مشتری", hideBelow: "md" },
              { label: "اولویت" },
              { label: "مهلت", hideBelow: "sm" },
              { label: "وضعیت" },
            ]}
          >
            {shown.length === 0 ? <Empty colSpan={5}>تیکتی نیست.</Empty> : null}
            {shown.map((r) => (
              <Tr key={r.id}>
                <Td>
                  <A href={`/admin/tickets/${r.id}`} className="block max-w-[20rem] truncate font-semibold">{r.subject}</A>
                  <span className="block text-[12px] text-steel"><span className="t-code">{r.number}</span> · {labelOf(TICKET_CATEGORIES, r.category)}{r.assignee ? ` · ${r.assignee}` : ""}</span>
                </Td>
                <Td muted hideBelow="md">{r.customer_id ? <A href={`/admin/customers/${r.customer_id}`}>{r.customer}</A> : "—"}</Td>
                <Td><Badge map={PRIORITIES} value={r.priority} /></Td>
                <Td hideBelow="sm">
                  {isOpen(r) ? (
                    <Status tone={r.hours_left < 0 ? "error" : r.hours_left < 8 ? "warning" : "neutral"}>
                      {r.hours_left < 0 ? `${fa(-r.hours_left)} ساعت گذشته` : `${fa(r.hours_left)} ساعت`}
                    </Status>
                  ) : (
                    <span className="text-[12px] text-steel">{jdatetime(r.resolved_at)}</span>
                  )}
                </Td>
                <Td><Badge map={TICKET_STATUSES} value={r.status} /></Td>
              </Tr>
            ))}
          </Table>
        </Panel>
      </div>
    </>
  );
}
