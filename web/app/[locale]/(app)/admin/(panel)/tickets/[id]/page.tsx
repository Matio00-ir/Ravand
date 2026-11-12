import { notFound } from "next/navigation";
import { Status } from "@/components/dashboard/ui";
import { AutoSelect, EntityForm } from "@/components/admin/forms";
import { TaskPanel, Timeline } from "@/components/admin/blocks";
import { A, Badge, Facts, PageHeader, Section, fa, jdatetime } from "@/components/admin/ui";
import { saveTicket, setTicketStatus } from "@/lib/admin/actions/ops";
import { requirePage } from "@/lib/admin/auth";
import { ticketFields } from "@/lib/admin/defs";
import { valuesFor } from "@/lib/admin/fields";
import { PRIORITIES, TICKET_CATEGORIES, TICKET_CHANNELS, TICKET_STATUSES, labelOf, options } from "@/lib/admin/labels";
import { q1 } from "@/lib/admin/schema";
import { customerOptions, userOptions } from "@/lib/admin/settings";

export const metadata = { title: "تیکت" };

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage("support");
  const { id } = await params;
  if (!/^\d{1,15}$/.test(id)) notFound();
  const t = await q1<{
    id: number; number: string; subject: string; body: string | null; status: string; priority: string; category: string; channel: string;
    customer_id: number | null; customer: string | null; assignee_id: string | null; assignee: string | null; created_at: Date; due_at: Date;
    resolved_at: Date | null; hours_left: number;
  }>(
    `SELECT t.*, c.name AS customer, u.name AS assignee, (extract(epoch FROM (t.due_at - now())) / 3600)::int AS hours_left
     FROM adm_tickets t LEFT JOIN adm_customers c ON c.id = t.customer_id LEFT JOIN adm_users u ON u.id = t.assignee_id WHERE t.id = $1`,
    [Number(id)]
  );
  if (!t) notFound();
  const fields = ticketFields(await customerOptions(), await userOptions());
  const open = ["open", "in_progress", "waiting"].includes(t.status);

  return (
    <>
      <PageHeader
        title={t.subject}
        back={{ href: "/admin/tickets", label: "تیکت‌ها" }}
        meta={
          <span className="flex flex-wrap items-center gap-x-3">
            <span className="t-code">{t.number}</span>
            <Badge map={PRIORITIES} value={t.priority} />
            {open ? (
              <Status tone={t.hours_left < 0 ? "error" : t.hours_left < 8 ? "warning" : "neutral"}>
                {t.hours_left < 0 ? `${fa(-t.hours_left)} ساعت از مهلت گذشته` : `${fa(t.hours_left)} ساعت تا مهلت`}
              </Status>
            ) : null}
          </span>
        }
        actions={
          <div className="w-48">
            <AutoSelect action={setTicketStatus} name="status" value={t.status} options={options(TICKET_STATUSES)} hidden={{ id: t.id }} label="وضعیت" />
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <Section title="شرح">
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-offwhite">{t.body || "—"}</p>
          </Section>
          <Timeline entity="ticket" entityId={t.id} />
        </div>
        <div className="min-w-0 space-y-6">
          <Section title="خلاصه">
            <Facts
              items={[
                ["مشتری", t.customer_id ? <A key="c" href={`/admin/customers/${t.customer_id}`}>{t.customer}</A> : null],
                ["مسئول", t.assignee],
                ["دسته", labelOf(TICKET_CATEGORIES, t.category)],
                ["کانال", labelOf(TICKET_CHANNELS, t.channel)],
                ["ثبت", jdatetime(t.created_at)],
                ["مهلت", jdatetime(t.due_at)],
                ["حل", jdatetime(t.resolved_at)],
              ]}
            />
          </Section>
          <TaskPanel entity="ticket" entityId={t.id} />
          <Section title="ویرایش تیکت">
            <EntityForm action={saveTicket} fields={fields} values={valuesFor(fields, t)} hidden={{ id: t.id }} />
          </Section>
        </div>
      </div>
    </>
  );
}
