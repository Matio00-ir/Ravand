import { EntityForm } from "@/components/admin/forms";
import { LinesEditor } from "@/components/admin/LinesEditor";
import { PageHeader, Section } from "@/components/admin/ui";
import { saveInvoice } from "@/lib/admin/actions/finance";
import { requirePage } from "@/lib/admin/auth";
import { invoiceFields } from "@/lib/admin/defs";
import { addDaysIso, todayIso } from "@/lib/admin/jalali";
import { q1 } from "@/lib/admin/schema";
import { contractOptions, customerOptions, listCatalog, vatRate } from "@/lib/admin/settings";

export const metadata = { title: "فاکتور جدید" };

/** A new official invoice; from a contract (?contract=) its unbilled balance is prefilled. */
export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ customer?: string; contract?: string }> }) {
  await requirePage("finance");
  const sp = await searchParams;
  const contract = /^\d+$/.test(sp.contract ?? "")
    ? await q1<{ id: number; customer_id: number; title: string; amount: number; billed: number; kind: string }>(
        `SELECT k.id, k.customer_id, k.title, k.amount, k.kind,
                COALESCE((SELECT sum(subtotal - discount) FROM adm_invoices i WHERE i.contract_id = k.id AND i.status <> 'cancelled'), 0) AS billed
         FROM adm_contracts k WHERE k.id = $1`,
        [Number(sp.contract)]
      )
    : null;
  const [customers, contracts, catalog, vat] = await Promise.all([customerOptions(), contractOptions(), listCatalog(true), vatRate()]);
  const today = todayIso();
  const remaining = contract ? Math.max(0, contract.amount - contract.billed) : 0;

  return (
    <>
      <PageHeader
        title="فاکتور جدید"
        back={contract ? { href: `/admin/contracts/${contract.id}`, label: "قرارداد" } : { href: "/admin/invoices", label: "فاکتورها" }}
        meta={contract ? `از قرارداد «${contract.title}» — مانده فاکتورنشده پیش‌فرض گذاشته شده؛ برای پرداخت مرحله‌ای مبلغ را تغییر دهید.` : undefined}
      />
      <Section title="مشخصات و ردیف‌ها">
        <EntityForm
          action={saveInvoice}
          fields={invoiceFields(customers, contracts)}
          values={{
            customer_id: contract ? String(contract.customer_id) : sp.customer ?? null,
            contract_id: contract ? String(contract.id) : null,
            issued_at: today,
            due_at: addDaysIso(today, 7),
          }}
          submitLabel="صدور فاکتور"
        >
          <LinesEditor
            catalog={catalog}
            vatPercent={vat}
            initial={contract ? [{ description: contract.title, qty: 1, unit_price: remaining }] : undefined}
          />
        </EntityForm>
      </Section>
    </>
  );
}
