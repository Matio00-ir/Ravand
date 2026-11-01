import { notFound } from "next/navigation";
import { Table, Td, Tr } from "@/components/dashboard/ui";
import { AutoSelect, EntityForm } from "@/components/admin/forms";
import { A, Badge, Empty, Facts, LinkButton, Money, PageHeader, Section, fa, jdate } from "@/components/admin/ui";
import { renewContract, saveContract, setContractStatus } from "@/lib/admin/actions/finance";
import { requirePage } from "@/lib/admin/auth";
import { contractFields } from "@/lib/admin/defs";
import { valuesFor } from "@/lib/admin/fields";
import { daysFromToday } from "@/lib/admin/jalali";
import { CONTRACT_KINDS, CONTRACT_STATUSES, INVOICE_STATUSES, PROJECT_STATUSES, labelOf, options } from "@/lib/admin/labels";
import { q, q1 } from "@/lib/admin/schema";
import { customerOptions } from "@/lib/admin/settings";

export const metadata = { title: "قرارداد" };

export default async function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage("finance");
  const { id } = await params;
  if (!/^\d{1,15}$/.test(id)) notFound();
  const k = await q1<{
    id: number; number: string; customer_id: number; customer: string; kind: string; title: string; status: string;
    start_date: string; end_date: string | null; amount: number; auto_renew: boolean; renewal_of: number | null;
    renewal_of_number: string | null; notes: string | null; quote_id: number | null; renewed_by: number | null;
  }>(
    `SELECT k.*, c.name AS customer, p.number AS renewal_of_number,
            (SELECT id FROM adm_contracts n WHERE n.renewal_of = k.id LIMIT 1) AS renewed_by
     FROM adm_contracts k JOIN adm_customers c ON c.id = k.customer_id LEFT JOIN adm_contracts p ON p.id = k.renewal_of
     WHERE k.id = $1`,
    [Number(id)]
  );
  if (!k) notFound();

  const [invoices, projects, customers] = await Promise.all([
    q<{ id: number; number: string; status: string; issued_at: string; total: number; net: number; paid: number }>(
      `SELECT id, number, status, issued_at, total, subtotal - discount AS net, paid FROM adm_invoices WHERE contract_id = $1 ORDER BY issued_at`,
      [k.id]
    ),
    q<{ id: number; title: string; status: string }>(`SELECT id, title, status FROM adm_projects WHERE contract_id = $1`, [k.id]),
    customerOptions(),
  ]);
  const billed = invoices.filter((i) => i.status !== "cancelled").reduce((s, i) => s + i.net, 0);
  const collected = invoices.filter((i) => i.status !== "cancelled").reduce((s, i) => s + i.paid, 0);
  const left = k.end_date ? daysFromToday(k.end_date) : null;

  return (
    <>
      <PageHeader
        title={`${labelOf(CONTRACT_KINDS, k.kind)} — ${k.customer}`}
        back={{ href: "/admin/contracts", label: "قراردادها" }}
        meta={
          <span className="flex flex-wrap gap-x-3">
            <span className="t-code">{k.number}</span>
            <Badge map={CONTRACT_STATUSES} value={k.status} />
          </span>
        }
        actions={
          <>
            <div className="w-40">
              <AutoSelect action={setContractStatus} name="status" value={k.status} options={options(CONTRACT_STATUSES)} hidden={{ id: k.id }} label="وضعیت" />
            </div>
            <LinkButton href={`/admin/invoices/new?contract=${k.id}`}>صدور فاکتور</LinkButton>
            {k.kind === "implementation" ? <LinkButton href={`/admin/projects/new?customer=${k.customer_id}&contract=${k.id}`} variant="ghost">پروژه پیاده‌سازی</LinkButton> : null}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <Section title="خلاصه">
            <Facts
              cols={3}
              items={[
                ["مشتری", <A key="c" href={`/admin/customers/${k.customer_id}`}>{k.customer}</A>],
                ["عنوان", k.title],
                ["مبلغ قرارداد (بی‌مالیات)", <Money key="a" value={k.amount} unit />],
                ["شروع", jdate(k.start_date)],
                ["پایان", k.end_date ? `${jdate(k.end_date)}${left !== null ? ` (${left < 0 ? `${fa(-left)} روز گذشته` : `${fa(left)} روز مانده`})` : ""}` : "—"],
                ["تمدید خودکار", k.auto_renew ? "بله" : "خیر"],
                ["فاکتورشده (بی‌مالیات)", <Money key="b" value={billed} unit />],
                ["وصول‌شده (با مالیات)", <Money key="p" value={collected} unit />],
                ["فاکتورنشده", <Money key="r" value={Math.max(0, k.amount - billed)} unit />],
                ["تمدیدِ", k.renewal_of ? <A key="o" href={`/admin/contracts/${k.renewal_of}`}>{k.renewal_of_number}</A> : null],
                ["پیش‌فاکتور مبدأ", k.quote_id ? <A key="q" href={`/admin/quotes/${k.quote_id}`}>مشاهده</A> : null],
              ]}
            />
            {k.notes ? <p className="mt-5 whitespace-pre-line border-t border-line-dark pt-4 text-[13px] text-silver">{k.notes}</p> : null}
          </Section>

          <Section title="فاکتورهای این قرارداد" flush action={<LinkButton href={`/admin/invoices/new?contract=${k.id}`} variant="ghost">فاکتور جدید</LinkButton>}>
            <Table head={[{ label: "شماره" }, { label: "تاریخ" }, { label: "مبلغ", align: "end" }, { label: "وضعیت" }]}>
              {invoices.length === 0 ? <Empty colSpan={4}>فاکتوری صادر نشده است.</Empty> : null}
              {invoices.map((i) => (
                <Tr key={i.id}>
                  <Td><A href={`/admin/invoices/${i.id}`} className="t-code">{i.number}</A></Td>
                  <Td muted numeric>{jdate(i.issued_at)}</Td>
                  <Td align="end"><Money value={i.total} /></Td>
                  <Td><Badge map={INVOICE_STATUSES} value={i.status} /></Td>
                </Tr>
              ))}
            </Table>
          </Section>

          {projects.length ? (
            <Section title="پروژه‌ها">
              <ul className="space-y-2 text-[13px]">
                {projects.map((p) => (
                  <li key={p.id} className="flex justify-between gap-3">
                    <A href={`/admin/projects/${p.id}`}>{p.title}</A>
                    <Badge map={PROJECT_STATUSES} value={p.status} />
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </div>

        <div className="min-w-0 space-y-6">
          {k.renewed_by ? (
            <Section title="تمدید">
              <p className="text-[13px] text-silver">
                این قرارداد تمدید شده است: <A href={`/admin/contracts/${k.renewed_by}`}>قرارداد دوره بعد</A>
              </p>
            </Section>
          ) : k.end_date ? (
            <Section title="تمدید برای یک سال دیگر" meta="قرارداد دوره بعد از روز پس از پایان این قرارداد شروع می‌شود">
              <EntityForm
                action={renewContract}
                fields={[{ name: "increase", label: "افزایش قیمت (٪)", type: "int", span: 4, hint: "مثلاً ۳۰ برای ۳۰٪ افزایش؛ صفر برای همان مبلغ" }]}
                values={{ increase: 0 }}
                hidden={{ id: k.id }}
                submitLabel="ساخت قرارداد تمدید"
              />
            </Section>
          ) : null}
          <Section title="ویرایش قرارداد">
            <EntityForm action={saveContract} fields={contractFields(customers)} values={valuesFor(contractFields(customers), k)} hidden={{ id: k.id }} />
          </Section>
        </div>
      </div>
    </>
  );
}
