import { Panel, StatRow, StatTile, Table, Td, Tr } from "@/components/dashboard/ui";
import { A, Badge, Empty, LinkButton, PageHeader, Tabs, fa, jdate } from "@/components/admin/ui";
import { requirePage } from "@/lib/admin/auth";
import { daysFromToday } from "@/lib/admin/jalali";
import { PROJECT_STATUSES, options } from "@/lib/admin/labels";
import { q } from "@/lib/admin/schema";

export const metadata = { title: "پروژه‌های پیاده‌سازی" };

type Row = {
  id: number; title: string; status: string; customer_id: number; customer: string; due_date: string | null;
  manager: string | null; phases: number; done: number; current: string | null;
};

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requirePage("projects");
  const { status } = await searchParams;
  const rows = await q<Row>(
    `SELECT p.id, p.title, p.status, p.customer_id, c.name AS customer, p.due_date, u.name AS manager,
            (SELECT count(*)::int FROM adm_project_phases ph WHERE ph.project_id = p.id) AS phases,
            (SELECT count(*)::int FROM adm_project_phases ph WHERE ph.project_id = p.id AND ph.status = 'done') AS done,
            (SELECT title FROM adm_project_phases ph WHERE ph.project_id = p.id AND ph.status <> 'done' ORDER BY position LIMIT 1) AS current
     FROM adm_projects p JOIN adm_customers c ON c.id = p.customer_id LEFT JOIN adm_users u ON u.id = p.manager_id
     ORDER BY CASE p.status WHEN 'active' THEN 0 WHEN 'planning' THEN 1 WHEN 'on_hold' THEN 2 ELSE 3 END, p.due_date NULLS LAST`
  );
  const running = rows.filter((r) => r.status === "active" || r.status === "planning");
  const late = running.filter((r) => r.due_date && daysFromToday(r.due_date) < 0);
  const shown = status ? rows.filter((r) => r.status === status) : rows;

  return (
    <>
      <PageHeader title="پروژه‌های پیاده‌سازی" meta="راه‌اندازی روند برای هر مشتری، مرحله به مرحله" actions={<LinkButton href="/admin/projects/new">پروژه جدید</LinkButton>} />
      <div className="space-y-6">
        <StatRow cols={3}>
          <StatTile label="در جریان" value={fa(running.length)} />
          <StatTile label="عقب از برنامه" value={fa(late.length)} trend={late.length ? "down" : "flat"} />
          <StatTile label="تحویل‌شده" value={fa(rows.filter((r) => r.status === "done").length)} />
        </StatRow>
        <Panel flush>
          <div className="p-5">
            <Tabs
              items={[
                { href: "/admin/projects", label: "همه", count: rows.length, active: !status },
                ...options(PROJECT_STATUSES).map((o) => ({ href: `/admin/projects?status=${o.value}`, label: o.label, count: rows.filter((r) => r.status === o.value).length, active: status === o.value })),
              ]}
            />
          </div>
          <Table
            head={[
              { label: "پروژه" },
              { label: "پیشرفت" },
              { label: "مرحله جاری", hideBelow: "lg" },
              { label: "موعد", hideBelow: "md" },
              { label: "وضعیت" },
            ]}
          >
            {shown.length === 0 ? <Empty colSpan={5}>پروژه‌ای نیست.</Empty> : null}
            {shown.map((r) => {
              const pct = r.phases ? Math.round((r.done / r.phases) * 100) : 0;
              const overdue = r.due_date && (r.status === "active" || r.status === "planning") && daysFromToday(r.due_date) < 0;
              return (
                <Tr key={r.id}>
                  <Td>
                    <A href={`/admin/projects/${r.id}`} className="font-semibold">{r.title}</A>
                    <span className="block text-[12px] text-steel">{r.customer}{r.manager ? ` · ${r.manager}` : ""}</span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-24 bg-white/[0.07]">
                        <div className="h-full bg-[#7F8FA6]" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="t-num text-[12px] text-steel">{fa(pct)}٪</span>
                    </div>
                  </Td>
                  <Td muted hideBelow="lg">{r.current ?? "—"}</Td>
                  <Td numeric hideBelow="md" className={overdue ? "text-error" : undefined} muted={!overdue}>{jdate(r.due_date)}</Td>
                  <Td><Badge map={PROJECT_STATUSES} value={r.status} /></Td>
                </Tr>
              );
            })}
          </Table>
        </Panel>
      </div>
    </>
  );
}
