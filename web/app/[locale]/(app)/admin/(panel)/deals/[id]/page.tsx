import { notFound } from "next/navigation";
import { Table, Td, Tr } from "@/components/dashboard/ui";
import { ActionButton, AutoSelect, EntityForm } from "@/components/admin/forms";
import { TaskPanel, Timeline } from "@/components/admin/blocks";
import { A, Badge, Empty, Facts, LinkButton, Money, PageHeader, Section, fa, jdate, jdatetime } from "@/components/admin/ui";
import { convertDeal, deleteDeal, saveDeal, setDealStage } from "@/lib/admin/actions/crm";
import { requirePage } from "@/lib/admin/auth";
import { getDeal } from "@/lib/admin/crm";
import { dealFields } from "@/lib/admin/defs";
import { valuesFor } from "@/lib/admin/fields";
import { DEAL_SOURCES, DEAL_STAGES, QUOTE_STATUSES, labelOf, options } from "@/lib/admin/labels";
import { q, q1 } from "@/lib/admin/schema";
import { userOptions } from "@/lib/admin/settings";

export const metadata = { title: "فرصت فروش" };

/** One opportunity: status, what the lead did on the website, quotes, timeline and tasks. */
export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage("crm");
  const { id } = await params;
  if (!/^\d{1,15}$/.test(id)) notFound();
  const deal = await getDeal(Number(id));
  if (!deal) notFound();

  const [users, quotes, demo, expert] = await Promise.all([
    userOptions(),
    q<{ id: number; number: string; title: string; status: string; total: number; issued_at: string }>(
      `SELECT id, number, title, status, total, issued_at FROM adm_quotes WHERE deal_id = $1 ORDER BY created_at DESC`,
      [deal.id]
    ),
    deal.demo_lead_id
      ? q1<{ business_type: string; user_count: number; modules: string[]; workflow: string[]; access_count: number; last_accessed_at: Date | null; expires_at: Date; status: string; actions: number; invoices: number }>(
          `SELECT l.business_type, l.user_count, l.modules, l.workflow, l.access_count, l.last_accessed_at, l.expires_at, l.status,
                  (SELECT count(*)::int FROM demo_events e WHERE e.lead_id = l.id AND e.kind <> 'sandbox.reset') AS actions,
                  (SELECT count(*)::int FROM demo_events e WHERE e.lead_id = l.id AND e.kind = 'invoice.create') AS invoices
           FROM demo_leads l WHERE l.id = $1`,
          [deal.demo_lead_id]
        )
      : null,
    deal.expert_request_id
      ? q1<{ role: string | null; company_size: string; industry: string; needs: string | null; preferred_date: string; preferred_slot: string; status: string }>(
          `SELECT role, company_size, industry, needs, to_char(preferred_date, 'YYYY-MM-DD') AS preferred_date, preferred_slot, status
           FROM expert_requests WHERE id = $1`,
          [deal.expert_request_id]
        )
      : null,
  ]);

  const SLOT: Record<string, string> = { morning: "صبح", midday: "ظهر", afternoon: "عصر" };

  return (
    <>
      <PageHeader
        title={deal.title}
        back={{ href: "/admin/deals", label: "فرصت‌های فروش" }}
        meta={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Badge map={DEAL_STAGES} value={deal.stage} />
            <span>{labelOf(DEAL_SOURCES, deal.source)}</span>
            <span>ثبت: {jdatetime(deal.created_at)}</span>
          </span>
        }
        actions={
          <>
            <div className="w-48">
              <AutoSelect action={setDealStage} name="stage" value={deal.stage} options={options(DEAL_STAGES)} hidden={{ id: deal.id }} label="مرحله" />
            </div>
            <LinkButton href={`/admin/quotes/new?deal=${deal.id}`} variant="ghost">
              پیش‌فاکتور
            </LinkButton>
            {deal.customer_id ? (
              <LinkButton href={`/admin/customers/${deal.customer_id}`}>پرونده مشتری</LinkButton>
            ) : (
              <ActionButton action={convertDeal} hidden={{ id: deal.id }} label="تبدیل به مشتری" variant="primary" confirm="این فرصت «برنده» ثبت و برایش پرونده مشتری ساخته شود؟" />
            )}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <Section title="خلاصه">
            <Facts
              cols={3}
              items={[
                ["شرکت", deal.company],
                ["رابط", deal.contact_name],
                ["موبایل", deal.mobile ? <a href={`tel:${deal.mobile}`} className="t-num underline-offset-4 hover:underline" dir="ltr">{deal.mobile}</a> : null],
                ["ارزش تخمینی", <Money key="v" value={deal.value} unit />],
                ["تاریخ تخمینی بستن", jdate(deal.expected_close)],
                ["مسئول", deal.owner_name],
                ["کمپین", [deal.utm_source, deal.utm_medium, deal.utm_campaign].filter(Boolean).join(" / ") || null],
                ["مشتری", deal.customer_id ? <A key="c" href={`/admin/customers/${deal.customer_id}`}>{deal.customer_name}</A> : null],
                ["دلیل از دست رفتن", deal.lost_reason],
              ]}
            />
            {deal.notes ? <p className="mt-5 whitespace-pre-line border-t border-line-dark pt-4 text-[13px] text-silver">{deal.notes}</p> : null}
          </Section>

          {demo ? (
            <Section title="استفاده از دموی سایت" meta="آنچه این سرنخ در محیط دموی اختصاصی‌اش انجام داده">
              <Facts
                cols={3}
                items={[
                  ["بازدید", fa(demo.access_count)],
                  ["اقدام در دمو", `${fa(demo.actions)} (${fa(demo.invoices)} فاکتور)`],
                  ["آخرین بازدید", jdatetime(demo.last_accessed_at)],
                  ["کاربران", fa(demo.user_count)],
                  ["ماژول‌ها", demo.modules.join("، ")],
                  ["انقضا", jdatetime(demo.expires_at)],
                ]}
              />
              <p className="mt-4 text-[12.5px] text-steel">فرآیند کاری مشتری: {demo.workflow.join(" ← ")}</p>
            </Section>
          ) : null}

          {expert ? (
            <Section title="درخواست جلسه با کارشناس">
              <Facts
                cols={3}
                items={[
                  ["سمت", expert.role],
                  ["پرسنل", expert.company_size],
                  ["حوزه", expert.industry],
                  ["زمان پیشنهادی", `${jdate(expert.preferred_date)} — ${SLOT[expert.preferred_slot] ?? expert.preferred_slot}`],
                ]}
              />
              {expert.needs ? <p className="mt-4 whitespace-pre-line text-[13px] text-silver">{expert.needs}</p> : null}
            </Section>
          ) : null}

          <Section
            title="پیش‌فاکتورها"
            flush
            action={<LinkButton href={`/admin/quotes/new?deal=${deal.id}`} variant="ghost">پیش‌فاکتور جدید</LinkButton>}
          >
            <Table head={[{ label: "شماره" }, { label: "عنوان", hideBelow: "md" }, { label: "مبلغ", align: "end" }, { label: "وضعیت" }]}>
              {quotes.length === 0 ? <Empty colSpan={4}>پیش‌فاکتوری صادر نشده است.</Empty> : null}
              {quotes.map((x) => (
                <Tr key={x.id}>
                  <Td>
                    <A href={`/admin/quotes/${x.id}`} className="t-code">{x.number}</A>
                  </Td>
                  <Td muted hideBelow="md">{x.title}</Td>
                  <Td align="end"><Money value={x.total} /></Td>
                  <Td><Badge map={QUOTE_STATUSES} value={x.status} /></Td>
                </Tr>
              ))}
            </Table>
          </Section>

          <Timeline entity="deal" entityId={deal.id} />
        </div>

        <div className="min-w-0 space-y-6">
          <TaskPanel entity="deal" entityId={deal.id} />
          <Section title="ویرایش فرصت">
            <EntityForm action={saveDeal} fields={dealFields(users)} values={valuesFor(dealFields(users), deal)} hidden={{ id: deal.id }} />
          </Section>
          <Section title="حذف">
            <p className="mb-4 text-[12.5px] text-steel">فرصت و تاریخچه و کارهایش حذف می‌شود. پیش‌فاکتورها باقی می‌مانند.</p>
            <ActionButton action={deleteDeal} hidden={{ id: deal.id }} label="حذف فرصت" variant="danger" confirm="این فرصت برای همیشه حذف شود؟" />
          </Section>
        </div>
      </div>
    </>
  );
}
