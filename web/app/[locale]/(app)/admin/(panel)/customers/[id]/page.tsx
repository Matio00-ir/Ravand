import { notFound } from "next/navigation";
import { StatRow, StatTile, Table, Td, Tr } from "@/components/dashboard/ui";
import { ActionButton, EntityForm } from "@/components/admin/forms";
import { TaskPanel, Timeline } from "@/components/admin/blocks";
import { A, Badge, Empty, Facts, LinkButton, Money, PageHeader, Section, fa, jdate, millions } from "@/components/admin/ui";
import { deleteContact, deleteCustomer, saveContact, saveCustomer } from "@/lib/admin/actions/customers";
import { can, requirePage } from "@/lib/admin/auth";
import { contactFields, customerFields } from "@/lib/admin/defs";
import { valuesFor } from "@/lib/admin/fields";
import { daysFromToday } from "@/lib/admin/jalali";
import {
  COMPANY_SIZES,
  CONTRACT_KINDS,
  CONTRACT_STATUSES,
  CUSTOMER_STATUSES,
  DEAL_SOURCES,
  DEAL_STAGES,
  INDUSTRIES,
  INVOICE_STATUSES,
  PROJECT_STATUSES,
  TICKET_STATUSES,
  labelOf,
} from "@/lib/admin/labels";
import { q, q1 } from "@/lib/admin/schema";

export const metadata = { title: "پرونده مشتری" };

type Customer = {
  id: number; name: string; industry: string | null; size: string | null; city: string | null; address: string | null;
  phone: string | null; email: string | null; national_id: string | null; economic_code: string | null; postal_code: string | null;
  status: string; source: string | null; notes: string | null; created_at: Date;
};

/** Everything about one customer on one page. */
export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage("customers");
  const { id } = await params;
  if (!/^\d{1,15}$/.test(id)) notFound();
  const c = await q1<Customer>(`SELECT * FROM adm_customers WHERE id = $1`, [Number(id)]);
  if (!c) notFound();

  const finance = can(user.role, "finance");
  const [contacts, deals, contracts, invoices, projects, tickets] = await Promise.all([
    q<{ id: number; name: string; role: string | null; mobile: string | null; email: string | null }>(`SELECT * FROM adm_contacts WHERE customer_id = $1 ORDER BY id`, [c.id]),
    q<{ id: number; title: string; stage: string; value: number }>(`SELECT id, title, stage, value FROM adm_deals WHERE customer_id = $1 ORDER BY created_at DESC`, [c.id]),
    q<{ id: number; number: string; kind: string; title: string; status: string; start_date: string; end_date: string | null; amount: number }>(
      `SELECT id, number, kind, title, status, start_date, end_date, amount FROM adm_contracts WHERE customer_id = $1 ORDER BY start_date DESC`,
      [c.id]
    ),
    q<{ id: number; number: string; status: string; issued_at: string; due_at: string; total: number; paid: number }>(
      `SELECT id, number, status, issued_at, due_at, total, paid FROM adm_invoices WHERE customer_id = $1 ORDER BY issued_at DESC`,
      [c.id]
    ),
    q<{ id: number; title: string; status: string; due_date: string | null }>(`SELECT id, title, status, due_date FROM adm_projects WHERE customer_id = $1 ORDER BY created_at DESC`, [c.id]),
    q<{ id: number; number: string; subject: string; status: string; priority: string }>(
      `SELECT id, number, subject, status, priority FROM adm_tickets WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [c.id]
    ),
  ]);

  const live = invoices.filter((i) => i.status !== "cancelled");
  const billed = live.reduce((s, i) => s + i.total, 0);
  const paid = live.reduce((s, i) => s + i.paid, 0);
  const arr = contracts.filter((k) => k.status === "active" && k.kind === "support").reduce((s, k) => s + k.amount, 0);
  const nextRenewal = contracts.filter((k) => k.status === "active" && k.kind === "support" && k.end_date).sort((a, b) => a.end_date!.localeCompare(b.end_date!))[0];

  return (
    <>
      <PageHeader
        title={c.name}
        back={{ href: "/admin/customers", label: "مشتریان" }}
        meta={
          <span className="flex flex-wrap gap-x-3 gap-y-1">
            <Badge map={CUSTOMER_STATUSES} value={c.status} />
            <span>{labelOf(INDUSTRIES, c.industry)}</span>
            {c.city ? <span>{c.city}</span> : null}
          </span>
        }
        actions={
          <>
            <LinkButton href={`/admin/quotes/new?customer=${c.id}`} variant="ghost">پیش‌فاکتور</LinkButton>
            {finance ? <LinkButton href={`/admin/contracts/new?customer=${c.id}`} variant="ghost">قرارداد</LinkButton> : null}
            {finance ? <LinkButton href={`/admin/invoices/new?customer=${c.id}`} variant="ghost">فاکتور</LinkButton> : null}
            <LinkButton href={`/admin/projects/new?customer=${c.id}`} variant="ghost">پروژه</LinkButton>
            <LinkButton href={`/admin/tickets/new?customer=${c.id}`}>تیکت</LinkButton>
          </>
        }
      />

      <div className="space-y-6">
        {finance ? (
          <StatRow>
            <StatTile label="جمع فاکتورها" value={millions(billed)} unit="میلیون تومان" />
            <StatTile label="دریافت‌شده" value={millions(paid)} unit="میلیون تومان" />
            <StatTile label="مانده بدهی" value={millions(billed - paid)} unit="میلیون تومان" trend={billed - paid > 0 ? "down" : "flat"} />
            <StatTile
              label="پشتیبانی سالانه"
              value={millions(arr)}
              unit="میلیون تومان"
              delta={nextRenewal ? `تمدید: ${jdate(nextRenewal.end_date)} (${fa(daysFromToday(nextRenewal.end_date!))} روز)` : "قرارداد پشتیبانی فعال ندارد"}
            />
          </StatRow>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-6">
            <Section title="مشخصات">
              <Facts
                cols={3}
                items={[
                  ["تلفن", c.phone ? <a key="p" href={`tel:${c.phone}`} dir="ltr" className="hover:underline">{c.phone}</a> : null],
                  ["ایمیل", c.email],
                  ["اندازه", labelOf(COMPANY_SIZES, c.size)],
                  ["شناسه ملی", c.national_id],
                  ["کد اقتصادی", c.economic_code],
                  ["کد پستی", c.postal_code],
                  ["نشانی", c.address],
                  ["منبع جذب", labelOf(DEAL_SOURCES, c.source)],
                ]}
              />
              {c.notes ? <p className="mt-5 whitespace-pre-line border-t border-line-dark pt-4 text-[13px] text-silver">{c.notes}</p> : null}
            </Section>

            {finance ? (
              <Section title="قراردادها" flush action={<LinkButton href={`/admin/contracts/new?customer=${c.id}`} variant="ghost">قرارداد جدید</LinkButton>}>
                <Table head={[{ label: "شماره" }, { label: "نوع" }, { label: "دوره", hideBelow: "md" }, { label: "مبلغ", align: "end" }, { label: "وضعیت" }]}>
                  {contracts.length === 0 ? <Empty colSpan={5}>قراردادی ثبت نشده است.</Empty> : null}
                  {contracts.map((k) => (
                    <Tr key={k.id}>
                      <Td><A href={`/admin/contracts/${k.id}`} className="t-code">{k.number}</A></Td>
                      <Td muted>{labelOf(CONTRACT_KINDS, k.kind)}</Td>
                      <Td muted numeric hideBelow="md">{jdate(k.start_date)} — {jdate(k.end_date)}</Td>
                      <Td align="end"><Money value={k.amount} /></Td>
                      <Td><Badge map={CONTRACT_STATUSES} value={k.status} /></Td>
                    </Tr>
                  ))}
                </Table>
              </Section>
            ) : null}

            {finance ? (
              <Section title="فاکتورها" flush action={<LinkButton href={`/admin/invoices/new?customer=${c.id}`} variant="ghost">فاکتور جدید</LinkButton>}>
                <Table head={[{ label: "شماره" }, { label: "تاریخ", hideBelow: "md" }, { label: "مبلغ", align: "end" }, { label: "مانده", align: "end", hideBelow: "sm" }, { label: "وضعیت" }]}>
                  {invoices.length === 0 ? <Empty colSpan={5}>فاکتوری صادر نشده است.</Empty> : null}
                  {invoices.map((i) => {
                    const overdue = (i.status === "issued" || i.status === "partial") && daysFromToday(i.due_at) < 0;
                    return (
                      <Tr key={i.id}>
                        <Td><A href={`/admin/invoices/${i.id}`} className="t-code">{i.number}</A></Td>
                        <Td muted numeric hideBelow="md">{jdate(i.issued_at)}</Td>
                        <Td align="end"><Money value={i.total} /></Td>
                        <Td align="end" hideBelow="sm"><Money value={i.status === "cancelled" ? 0 : i.total - i.paid} /></Td>
                        <Td><Badge map={INVOICE_STATUSES} value={overdue ? "overdue" : i.status} /></Td>
                      </Tr>
                    );
                  })}
                </Table>
              </Section>
            ) : null}

            <Timeline entity="customer" entityId={c.id} />
          </div>

          <div className="min-w-0 space-y-6">
            <Section title="رابط‌ها" meta="افراد طرف حساب در این سازمان">
              <ul className="divide-y divide-line-dark">
                {contacts.length === 0 ? <li><Empty>رابطی ثبت نشده است.</Empty></li> : null}
                {contacts.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-[13.5px] text-offwhite">{p.name}{p.role ? <span className="text-steel"> · {p.role}</span> : null}</p>
                      <p className="mt-0.5 flex flex-wrap gap-x-3 text-[12px] text-steel">
                        {p.mobile ? <a href={`tel:${p.mobile}`} dir="ltr" className="hover:text-silver">{p.mobile}</a> : null}
                        {p.email ? <a href={`mailto:${p.email}`} dir="ltr" className="hover:text-silver">{p.email}</a> : null}
                      </p>
                    </div>
                    <ActionButton action={deleteContact} hidden={{ id: p.id }} label="حذف" small confirm="این رابط حذف شود؟" />
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-line-dark pt-4">
                <EntityForm action={saveContact} fields={contactFields} hidden={{ customer_id: c.id }} submitLabel="افزودن رابط" resetOnSuccess />
              </div>
            </Section>

            <Section title="پروژه‌ها و تیکت‌ها">
              <ul className="space-y-2.5 text-[13px]">
                {projects.map((p) => (
                  <li key={`p${p.id}`} className="flex items-center justify-between gap-3">
                    <A href={`/admin/projects/${p.id}`}>پروژه: {p.title}</A>
                    <Badge map={PROJECT_STATUSES} value={p.status} />
                  </li>
                ))}
                {tickets.map((t) => (
                  <li key={`t${t.id}`} className="flex items-center justify-between gap-3">
                    <A href={`/admin/tickets/${t.id}`} className="min-w-0 truncate">{t.number} — {t.subject}</A>
                    <Badge map={TICKET_STATUSES} value={t.status} />
                  </li>
                ))}
                {projects.length + tickets.length === 0 ? <li className="text-steel">موردی نیست.</li> : null}
              </ul>
            </Section>

            {deals.length ? (
              <Section title="فرصت‌های فروش">
                <ul className="space-y-2.5 text-[13px]">
                  {deals.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3">
                      <A href={`/admin/deals/${d.id}`} className="min-w-0 truncate">{d.title}</A>
                      <Badge map={DEAL_STAGES} value={d.stage} />
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            <TaskPanel entity="customer" entityId={c.id} />

            <Section title="ویرایش مشخصات">
              <EntityForm action={saveCustomer} fields={customerFields} values={valuesFor(customerFields, c)} hidden={{ id: c.id }} />
            </Section>

            {can(user.role, "settings") ? (
              <Section title="حذف مشتری">
                <p className="mb-4 text-[12.5px] text-steel">فقط مشتری بدون قرارداد، فاکتور و پروژه قابل حذف است.</p>
                <ActionButton action={deleteCustomer} hidden={{ id: c.id }} label="حذف پرونده" variant="danger" confirm={`پرونده «${c.name}» برای همیشه حذف شود؟`} />
              </Section>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
