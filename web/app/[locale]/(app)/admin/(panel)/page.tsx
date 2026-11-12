import { ColumnChart } from "@/components/dashboard/charts";
import { StatRow, StatTile } from "@/components/dashboard/ui";
import { TaskRows } from "@/components/admin/blocks";
import { A, Empty, LinkButton, Money, PageHeader, Section, fa, jdate, jdatetime, millions } from "@/components/admin/ui";
import { can, requirePage } from "@/lib/admin/auth";
import { listTasks } from "@/lib/admin/crm";
import { jalaliMonthKey, jalaliMonthName, lastJalaliMonths, todayIso } from "@/lib/admin/jalali";
import { ACTIVITY_KINDS, DEAL_SOURCES, labelOf } from "@/lib/admin/labels";
import { q, q1 } from "@/lib/admin/schema";

export const metadata = { title: { absolute: "داشبورد — پنل روند" } };

const ENTITY_HREF: Record<string, string> = { deal: "deals", customer: "customers", project: "projects", ticket: "tickets" };

/**
 * The morning view: today's follow-ups, what needs attention (untouched
 * leads, overdue invoices, renewals, tickets past their deadline), the
 * numbers that matter, and what happened recently.
 */
export default async function AdminHome() {
  const user = await requirePage("dashboard");
  const today = todayIso();
  const crm = can(user.role, "crm");
  const finance = can(user.role, "finance");
  const support = can(user.role, "support");

  const [k, tasks, freshLeads, overdue, renewals, breaches, payments, activity] = await Promise.all([
    q1<{
      leads30: number; pipeline: number; open_deals: number; won_month: number; receivable: number; overdue_amt: number;
      arr: number; projects: number; projects_late: number; tickets: number; tickets_breach: number;
    }>(
      `SELECT
         (SELECT count(*)::int FROM adm_deals WHERE created_at > now() - interval '30 days') AS leads30,
         COALESCE((SELECT sum(value) FROM adm_deals WHERE stage NOT IN ('won', 'lost')), 0) AS pipeline,
         (SELECT count(*)::int FROM adm_deals WHERE stage NOT IN ('won', 'lost')) AS open_deals,
         (SELECT count(*)::int FROM adm_deals WHERE stage = 'won' AND closed_at > now() - interval '30 days') AS won_month,
         COALESCE((SELECT sum(total - paid) FROM adm_invoices WHERE status IN ('issued', 'partial')), 0) AS receivable,
         COALESCE((SELECT sum(total - paid) FROM adm_invoices WHERE status IN ('issued', 'partial') AND due_at < $1), 0) AS overdue_amt,
         COALESCE((SELECT sum(amount) FROM adm_contracts WHERE status = 'active' AND kind = 'support'), 0) AS arr,
         (SELECT count(*)::int FROM adm_projects WHERE status IN ('planning', 'active')) AS projects,
         (SELECT count(*)::int FROM adm_projects WHERE status IN ('planning', 'active') AND due_date < $1) AS projects_late,
         (SELECT count(*)::int FROM adm_tickets WHERE status IN ('open', 'in_progress', 'waiting')) AS tickets,
         (SELECT count(*)::int FROM adm_tickets WHERE status IN ('open', 'in_progress', 'waiting') AND due_at < now()) AS tickets_breach`,
      [today]
    ),
    listTasks(`NOT t.done AND (t.assignee_id = $1 OR t.assignee_id IS NULL) AND (t.due_date IS NULL OR t.due_date <= $2)`, [user.id, today]),
    crm
      ? q<{ id: number; title: string; source: string; created_at: Date }>(
          `SELECT d.id, d.title, d.source, d.created_at FROM adm_deals d
           WHERE d.stage NOT IN ('won', 'lost') AND d.created_at > now() - interval '14 days'
             AND NOT EXISTS (SELECT 1 FROM adm_activities a WHERE a.entity = 'deal' AND a.entity_id = d.id::text AND a.kind <> 'system')
           ORDER BY d.created_at DESC LIMIT 8`
        )
      : Promise.resolve([]),
    finance
      ? q<{ id: number; number: string; customer: string; due_at: string; balance: number }>(
          `SELECT i.id, i.number, c.name AS customer, i.due_at, i.total - i.paid AS balance FROM adm_invoices i JOIN adm_customers c ON c.id = i.customer_id
           WHERE i.status IN ('issued', 'partial') AND i.due_at < $1 ORDER BY i.due_at LIMIT 8`,
          [today]
        )
      : Promise.resolve([]),
    finance
      ? q<{ id: number; customer: string; end_date: string; amount: number }>(
          `SELECT k.id, c.name AS customer, k.end_date, k.amount FROM adm_contracts k JOIN adm_customers c ON c.id = k.customer_id
           WHERE k.status = 'active' AND k.kind = 'support' AND k.end_date <= $1::date + 45
             AND NOT EXISTS (SELECT 1 FROM adm_contracts n WHERE n.renewal_of = k.id)
           ORDER BY k.end_date LIMIT 8`,
          [today]
        )
      : Promise.resolve([]),
    support
      ? q<{ id: number; number: string; subject: string }>(
          `SELECT id, number, subject FROM adm_tickets WHERE status IN ('open', 'in_progress', 'waiting') AND due_at < now() ORDER BY due_at LIMIT 8`
        )
      : Promise.resolve([]),
    finance ? q<{ amount: number; paid_at: string }>(`SELECT amount, paid_at FROM adm_payments WHERE paid_at > $1::date - 200`, [today]) : Promise.resolve([]),
    q<{ entity: string; entity_id: string; kind: string; body: string; created_at: Date; user_name: string | null }>(
      `SELECT a.entity, a.entity_id, a.kind, a.body, a.created_at, u.name AS user_name FROM adm_activities a LEFT JOIN adm_users u ON u.id = a.created_by
       ORDER BY a.created_at DESC LIMIT 12`
    ),
  ]);

  const months = lastJalaliMonths(6);
  const collected = months.map((m) => payments.filter((p) => jalaliMonthKey(p.paid_at) === m).reduce((s, p) => s + p.amount, 0));
  const attention = freshLeads.length + overdue.length + renewals.length + breaches.length;

  return (
    <>
      <PageHeader
        title={`سلام ${user.name}`}
        meta={new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "full", timeZone: "Asia/Tehran" }).format(new Date(`${today}T12:00:00Z`))}
        actions={
          <>
            {crm ? <LinkButton href="/admin/deals/new" variant="ghost">فرصت جدید</LinkButton> : null}
            {finance ? <LinkButton href="/admin/invoices/new" variant="ghost">فاکتور</LinkButton> : null}
            {support ? <LinkButton href="/admin/tickets/new">تیکت</LinkButton> : null}
          </>
        }
      />

      <div className="space-y-6">
        <StatRow>
          {crm ? <StatTile label="سرنخ‌های ۳۰ روز" value={fa(k?.leads30 ?? 0)} delta={`${fa(k?.won_month ?? 0)} فروش موفق در ۳۰ روز`} trend="up" /> : null}
          {crm ? <StatTile label="ارزش قیف فروش" value={millions(k?.pipeline ?? 0)} unit="میلیون تومان" delta={`${fa(k?.open_deals ?? 0)} فرصت باز`} /> : null}
          {finance ? <StatTile label="مطالبات باز" value={millions(k?.receivable ?? 0)} unit="میلیون تومان" delta={`${millions(k?.overdue_amt ?? 0)} میلیون سررسیدگذشته`} trend={(k?.overdue_amt ?? 0) > 0 ? "down" : "flat"} /> : null}
          {finance ? <StatTile label="پشتیبانی سالانه (ARR)" value={millions(k?.arr ?? 0)} unit="میلیون تومان" /> : null}
          {!finance && support ? <StatTile label="تیکت‌های باز" value={fa(k?.tickets ?? 0)} delta={`${fa(k?.tickets_breach ?? 0)} عبور از مهلت`} trend={(k?.tickets_breach ?? 0) > 0 ? "down" : "flat"} /> : null}
          {!finance && can(user.role, "projects") ? <StatTile label="پروژه‌های جاری" value={fa(k?.projects ?? 0)} delta={`${fa(k?.projects_late ?? 0)} عقب از برنامه`} /> : null}
        </StatRow>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <Section title="کارهای امروز من" meta="سررسید امروز و عقب‌افتاده‌ها" action={<A href="/admin/tasks" className="text-[12.5px]">همه کارها</A>}>
            <TaskRows tasks={tasks} showEntity />
          </Section>

          <Section title="نیاز به توجه" meta={attention ? `${fa(attention)} مورد` : "همه‌چیز مرتب است"}>
            {attention === 0 ? <Empty>موردی نیست.</Empty> : null}
            <ul className="space-y-4 text-[13px]">
              {freshLeads.length ? (
                <AttentionGroup title="سرنخ‌های تازه بدون پیگیری">
                  {freshLeads.map((d) => (
                    <li key={d.id} className="flex justify-between gap-3">
                      <A href={`/admin/deals/${d.id}`} className="min-w-0 truncate">{d.title}</A>
                      <span className="shrink-0 text-[12px] text-steel">{labelOf(DEAL_SOURCES, d.source)}</span>
                    </li>
                  ))}
                </AttentionGroup>
              ) : null}
              {overdue.length ? (
                <AttentionGroup title="فاکتورهای سررسیدگذشته">
                  {overdue.map((i) => (
                    <li key={i.id} className="flex justify-between gap-3">
                      <A href={`/admin/invoices/${i.id}`} className="min-w-0 truncate">{i.customer} — {i.number}</A>
                      <Money value={i.balance} className="shrink-0 text-[12px] text-silver" />
                    </li>
                  ))}
                </AttentionGroup>
              ) : null}
              {renewals.length ? (
                <AttentionGroup title="تمدید پشتیبانی در ۴۵ روز">
                  {renewals.map((r) => (
                    <li key={r.id} className="flex justify-between gap-3">
                      <A href={`/admin/contracts/${r.id}`} className="min-w-0 truncate">{r.customer}</A>
                      <span className="t-num shrink-0 text-[12px] text-steel">{jdate(r.end_date)}</span>
                    </li>
                  ))}
                </AttentionGroup>
              ) : null}
              {breaches.length ? (
                <AttentionGroup title="تیکت‌های عبورکرده از مهلت">
                  {breaches.map((t) => (
                    <li key={t.id}>
                      <A href={`/admin/tickets/${t.id}`} className="block truncate">{t.number} — {t.subject}</A>
                    </li>
                  ))}
                </AttentionGroup>
              ) : null}
            </ul>
          </Section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          {finance ? (
            <Section title="وصول ماهانه" meta="مبالغ دریافت‌شده در شش ماه اخیر">
              <div className="h-52">
                <ColumnChart data={collected} labels={months.map((m) => jalaliMonthName(m).slice(0, 3))} />
              </div>
            </Section>
          ) : (
            <div />
          )}
          <Section title="آخرین رویدادها">
            {activity.length === 0 ? <Empty>هنوز رویدادی ثبت نشده است.</Empty> : null}
            <ul className="divide-y divide-line-dark">
              {activity.map((a, i) => (
                <li key={i} className="py-2.5">
                  <p className="line-clamp-2 text-[13px] text-silver">
                    {ENTITY_HREF[a.entity] ? <A href={`/admin/${ENTITY_HREF[a.entity]}/${a.entity_id}`} className="text-silver">{a.body}</A> : a.body}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-steel">
                    {labelOf(ACTIVITY_KINDS, a.kind)} · {jdatetime(a.created_at)}{a.user_name ? ` · ${a.user_name}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </>
  );
}

function AttentionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li>
      <p className="t-label mb-2 text-steel">{title}</p>
      <ul className="space-y-1.5">{children}</ul>
    </li>
  );
}
