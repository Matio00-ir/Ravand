import { notFound } from "next/navigation";
import { ActionButton, AutoSelect, EntityForm } from "@/components/admin/forms";
import { TaskPanel, Timeline } from "@/components/admin/blocks";
import { A, Badge, Facts, PageHeader, Section, fa, jdate } from "@/components/admin/ui";
import { addPhase, deletePhase, saveProject, setPhaseStatus } from "@/lib/admin/actions/ops";
import { requirePage } from "@/lib/admin/auth";
import { phaseFields, projectFields } from "@/lib/admin/defs";
import { valuesFor } from "@/lib/admin/fields";
import { daysFromToday } from "@/lib/admin/jalali";
import { PHASE_STATUSES, PROJECT_STATUSES, TICKET_STATUSES, options } from "@/lib/admin/labels";
import { q, q1 } from "@/lib/admin/schema";
import { contractOptions, customerOptions, userOptions } from "@/lib/admin/settings";
import { cn } from "@/lib/utils";

export const metadata = { title: "پروژه" };

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage("projects");
  const { id } = await params;
  if (!/^\d{1,15}$/.test(id)) notFound();
  const p = await q1<{
    id: number; title: string; status: string; customer_id: number; customer: string; contract_id: number | null; contract_number: string | null;
    start_date: string | null; due_date: string | null; golive_date: string | null; manager_id: string | null; manager: string | null; notes: string | null;
  }>(
    `SELECT p.*, c.name AS customer, k.number AS contract_number, u.name AS manager
     FROM adm_projects p JOIN adm_customers c ON c.id = p.customer_id LEFT JOIN adm_contracts k ON k.id = p.contract_id LEFT JOIN adm_users u ON u.id = p.manager_id
     WHERE p.id = $1`,
    [Number(id)]
  );
  if (!p) notFound();
  const [phases, tickets, customers, contracts, users] = await Promise.all([
    q<{ id: number; title: string; status: string; due_date: string | null }>(`SELECT id, title, status, due_date FROM adm_project_phases WHERE project_id = $1 ORDER BY position`, [p.id]),
    q<{ id: number; number: string; subject: string; status: string }>(
      `SELECT id, number, subject, status FROM adm_tickets WHERE customer_id = $1 AND status IN ('open', 'in_progress', 'waiting') ORDER BY created_at DESC`,
      [p.customer_id]
    ),
    customerOptions(),
    contractOptions(),
    userOptions(),
  ]);
  const done = phases.filter((x) => x.status === "done").length;
  const pct = phases.length ? Math.round((done / phases.length) * 100) : 0;
  const daysLeft = p.due_date ? daysFromToday(p.due_date) : null;
  const fields = projectFields(customers, contracts, users);

  return (
    <>
      <PageHeader
        title={p.title}
        back={{ href: "/admin/projects", label: "پروژه‌ها" }}
        meta={
          <span className="flex flex-wrap gap-x-3">
            <Badge map={PROJECT_STATUSES} value={p.status} />
            <A href={`/admin/customers/${p.customer_id}`}>{p.customer}</A>
          </span>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <Section title="پیشرفت" meta={`${fa(done)} از ${fa(phases.length)} مرحله — ${fa(pct)}٪`}>
            <div className="mb-6 h-1.5 w-full bg-white/[0.07]">
              <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
            </div>
            <ol className="space-y-2">
              {phases.map((ph, i) => {
                const late = ph.due_date && ph.status !== "done" && daysFromToday(ph.due_date) < 0;
                return (
                  <li key={ph.id} className="grid grid-cols-[1.75rem_minmax(0,1fr)_9.5rem_auto] items-center gap-3 rounded-[var(--radius-sm)] border border-line-dark px-3 py-2.5">
                    <span className={cn("t-num grid h-6 w-6 place-items-center rounded-full border text-[11px]", ph.status === "done" ? "border-success/60 text-success" : "border-line-dark-strong text-silver")}>
                      {fa(i + 1)}
                    </span>
                    <div className="min-w-0">
                      <p className={cn("truncate text-[13.5px]", ph.status === "done" ? "text-steel" : "text-offwhite")}>{ph.title}</p>
                      {ph.due_date ? <p className={cn("t-num text-[11.5px]", late ? "text-error" : "text-steel")}>{jdate(ph.due_date)}</p> : null}
                    </div>
                    <AutoSelect action={setPhaseStatus} name="status" value={ph.status} options={options(PHASE_STATUSES)} hidden={{ id: ph.id }} label="وضعیت مرحله" />
                    <ActionButton action={deletePhase} hidden={{ id: ph.id }} label="×" small confirm="این مرحله حذف شود؟" />
                  </li>
                );
              })}
            </ol>
            <div className="mt-5 border-t border-line-dark pt-5">
              <EntityForm action={addPhase} fields={phaseFields} hidden={{ project_id: p.id }} submitLabel="افزودن مرحله" resetOnSuccess />
            </div>
          </Section>
          <Timeline entity="project" entityId={p.id} />
        </div>
        <div className="min-w-0 space-y-6">
          <Section title="خلاصه">
            <Facts
              items={[
                ["مدیر پروژه", p.manager],
                ["قرارداد", p.contract_id ? <A key="k" href={`/admin/contracts/${p.contract_id}`}>{p.contract_number}</A> : null],
                ["شروع", jdate(p.start_date)],
                ["موعد تحویل", p.due_date ? `${jdate(p.due_date)}${daysLeft !== null && p.status !== "done" ? (daysLeft < 0 ? ` — ${fa(-daysLeft)} روز تأخیر` : ` — ${fa(daysLeft)} روز مانده`) : ""}` : "—"],
                ["راه‌اندازی واقعی", jdate(p.golive_date)],
              ]}
            />
            {p.notes ? <p className="mt-5 whitespace-pre-line border-t border-line-dark pt-4 text-[13px] text-silver">{p.notes}</p> : null}
          </Section>
          {tickets.length ? (
            <Section title="تیکت‌های باز این مشتری">
              <ul className="space-y-2 text-[13px]">
                {tickets.map((t) => (
                  <li key={t.id} className="flex justify-between gap-3">
                    <A href={`/admin/tickets/${t.id}`} className="min-w-0 truncate">{t.number} — {t.subject}</A>
                    <Badge map={TICKET_STATUSES} value={t.status} />
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
          <TaskPanel entity="project" entityId={p.id} />
          <Section title="ویرایش پروژه">
            <EntityForm action={saveProject} fields={fields} values={valuesFor(fields, p)} hidden={{ id: p.id }} />
          </Section>
        </div>
      </div>
    </>
  );
}
