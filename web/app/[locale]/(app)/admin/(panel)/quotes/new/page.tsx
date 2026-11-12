import { EntityForm } from "@/components/admin/forms";
import { LinesEditor } from "@/components/admin/LinesEditor";
import { PageHeader, Section } from "@/components/admin/ui";
import { saveQuote } from "@/lib/admin/actions/crm";
import { requirePage } from "@/lib/admin/auth";
import { quoteFields } from "@/lib/admin/defs";
import type { FieldDef } from "@/lib/admin/fields";
import { addDaysIso, todayIso } from "@/lib/admin/jalali";
import { q1 } from "@/lib/admin/schema";
import { customerOptions, listCatalog, vatRate } from "@/lib/admin/settings";

export const metadata = { title: "پیش‌فاکتور جدید" };

/** A quote for a deal (?deal=) or an existing customer (?customer=, or picked here). */
export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ deal?: string; customer?: string }> }) {
  await requirePage("crm");
  const sp = await searchParams;
  const dealId = /^\d+$/.test(sp.deal ?? "") ? Number(sp.deal) : null;
  const deal = dealId ? await q1<{ id: number; title: string; customer_id: number | null }>(`SELECT id, title, customer_id FROM adm_deals WHERE id = $1`, [dealId]) : null;
  const [catalog, vat, customers] = await Promise.all([listCatalog(true), vatRate(), customerOptions()]);

  // Without a deal, the quote must name a customer.
  const fields: FieldDef[] = deal
    ? quoteFields
    : [{ name: "customer_id", label: "مشتری", type: "select", required: true, options: customers, span: 4 }, ...quoteFields];

  return (
    <>
      <PageHeader
        title="پیش‌فاکتور جدید"
        meta={deal ? `برای فرصت «${deal.title}»` : "برای یک مشتری ثبت‌شده"}
        back={deal ? { href: `/admin/deals/${deal.id}`, label: deal.title } : { href: "/admin/quotes", label: "پیش‌فاکتورها" }}
      />
      <Section title="مشخصات و ردیف‌ها">
        <EntityForm
          action={saveQuote}
          fields={fields}
          values={{
            title: deal ? `پیاده‌سازی روند — ${deal.title}` : "پیاده‌سازی و راه‌اندازی روند",
            issued_at: todayIso(),
            valid_until: addDaysIso(todayIso(), 14),
            customer_id: sp.customer ?? null,
          }}
          hidden={deal ? { deal_id: deal.id, ...(deal.customer_id ? { customer_id: deal.customer_id } : {}) } : undefined}
          submitLabel="صدور پیش‌فاکتور"
        >
          <LinesEditor catalog={catalog} vatPercent={vat} />
        </EntityForm>
      </Section>
    </>
  );
}
