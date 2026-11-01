import { notFound } from "next/navigation";
import { Table, Td, Tr } from "@/components/dashboard/ui";
import { ActionButton, EntityForm } from "@/components/admin/forms";
import { DocSheet } from "@/components/admin/DocSheet";
import { PrintButton } from "@/components/admin/PrintButton";
import { A, Badge, Empty, Money, PageHeader, Section, jdate } from "@/components/admin/ui";
import { cancelInvoice, deletePayment, recordPayment } from "@/lib/admin/actions/finance";
import { requirePage } from "@/lib/admin/auth";
import { paymentFields } from "@/lib/admin/defs";
import { daysFromToday, todayIso } from "@/lib/admin/jalali";
import { INVOICE_STATUSES, PAYMENT_METHODS, labelOf } from "@/lib/admin/labels";
import { q, q1 } from "@/lib/admin/schema";
import { getCompany } from "@/lib/admin/settings";

export const metadata = { title: "فاکتور" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage("finance");
  const { id } = await params;
  if (!/^\d{1,15}$/.test(id)) notFound();
  const inv = await q1<{
    id: number; number: string; status: string; issued_at: string; due_at: string; subtotal: number; discount: number; tax: number;
    total: number; paid: number; notes: string | null; contract_id: number | null; contract_number: string | null;
    customer_id: number; name: string; national_id: string | null; economic_code: string | null; address: string | null; postal_code: string | null; phone: string | null;
  }>(
    `SELECT i.*, k.number AS contract_number, c.name, c.national_id, c.economic_code, c.address, c.postal_code, c.phone
     FROM adm_invoices i JOIN adm_customers c ON c.id = i.customer_id LEFT JOIN adm_contracts k ON k.id = i.contract_id
     WHERE i.id = $1`,
    [Number(id)]
  );
  if (!inv) notFound();
  const [lines, payments, company] = await Promise.all([
    q<{ description: string; qty: number; unit_price: number; line_total: number }>(`SELECT description, qty, unit_price, line_total FROM adm_invoice_lines WHERE invoice_id = $1 ORDER BY id`, [inv.id]),
    q<{ id: number; amount: number; method: string; reference: string | null; paid_at: string }>(`SELECT id, amount, method, reference, paid_at FROM adm_payments WHERE invoice_id = $1 ORDER BY paid_at, id`, [inv.id]),
    getCompany(),
  ]);
  const remaining = inv.total - inv.paid;
  const overdue = (inv.status === "issued" || inv.status === "partial") && daysFromToday(inv.due_at) < 0;
  const payable = inv.status === "issued" || inv.status === "partial";

  return (
    <>
      <PageHeader
        title={`فاکتور ${inv.number}`}
        back={{ href: "/admin/invoices", label: "فاکتورها" }}
        meta={
          <span className="flex flex-wrap gap-x-3">
            <Badge map={INVOICE_STATUSES} value={overdue ? "overdue" : inv.status} />
            <A href={`/admin/customers/${inv.customer_id}`}>{inv.name}</A>
            {inv.contract_id ? <A href={`/admin/contracts/${inv.contract_id}`}>قرارداد {inv.contract_number}</A> : null}
          </span>
        }
        actions={
          <>
            <PrintButton />
            {inv.status !== "cancelled" && inv.paid === 0 ? (
              <ActionButton action={cancelInvoice} hidden={{ id: inv.id }} label="ابطال فاکتور" variant="danger" confirm="این فاکتور باطل شود؟" />
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 2xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
        <DocSheet
          kind="صورت‌حساب فروش کالا و خدمات"
          number={inv.number}
          issued={inv.issued_at}
          due={inv.due_at}
          seller={company}
          buyer={{ name: inv.name, national_id: inv.national_id, economic_code: inv.economic_code, address: inv.address, postal_code: inv.postal_code, phone: inv.phone }}
          lines={lines}
          subtotal={inv.subtotal}
          discount={inv.discount}
          tax={inv.tax}
          total={inv.total}
          paid={inv.paid}
          notes={inv.notes}
        />

        <div className="min-w-0 space-y-6 print:hidden">
          {payable ? (
            <Section title="ثبت دریافت" meta={`مانده: ${new Intl.NumberFormat("fa-IR").format(remaining)} تومان`}>
              <EntityForm
                action={recordPayment}
                fields={paymentFields}
                values={{ amount: remaining, method: "transfer", paid_at: todayIso() }}
                hidden={{ invoice_id: inv.id }}
                submitLabel="ثبت دریافت"
                resetOnSuccess
              />
            </Section>
          ) : null}
          <Section title="دریافت‌ها" flush>
            <Table head={[{ label: "تاریخ" }, { label: "روش" }, { label: "مبلغ", align: "end" }, { label: "" }]}>
              {payments.length === 0 ? <Empty colSpan={4}>دریافتی ثبت نشده است.</Empty> : null}
              {payments.map((p) => (
                <Tr key={p.id}>
                  <Td muted numeric>{jdate(p.paid_at)}</Td>
                  <Td muted>
                    {labelOf(PAYMENT_METHODS, p.method)}
                    {p.reference ? <span className="block text-[11.5px] text-steel">{p.reference}</span> : null}
                  </Td>
                  <Td align="end"><Money value={p.amount} /></Td>
                  <Td align="end">
                    <ActionButton action={deletePayment} hidden={{ id: p.id }} label="حذف" small confirm="این دریافت حذف شود؟" />
                  </Td>
                </Tr>
              ))}
            </Table>
          </Section>
        </div>
      </div>
    </>
  );
}
