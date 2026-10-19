import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DemoShell } from "@/components/dashboard/DemoShell";
import { Panel, PanelHead, Table, Td, Tr } from "@/components/dashboard/ui";
import { ConfirmAction } from "@/components/sandbox/ConfirmAction";
import { PaymentForm } from "@/components/sandbox/PaymentForm";
import { InvoiceStatus, Money, RowLink, demoHref } from "@/components/sandbox/views";
import { cancelInvoiceAction } from "@/lib/sandbox/actions";
import { loadLead } from "@/lib/sandbox/context";
import { balanceOf, getInvoiceDetail } from "@/lib/sandbox/store";
import { formatNumber, formatShortDate, formatCode } from "@/lib/format";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

/** One invoice: lines, totals, payments received, and what can be done next. */
export default async function DemoTokenInvoicePage({
  params,
}: {
  params: Promise<{ locale: string; token: string; id: string }>;
}) {
  const { locale, token, id } = await params;
  setRequestLocale(locale);

  const lead = await loadLead(token, locale);
  if (!lead) return null;
  if (!/^\d{1,15}$/.test(id)) notFound();

  const detail = await getInvoiceDetail(lead.id, Number(id));
  if (!detail) notFound();
  const { invoice, lines, payments, customer } = detail;

  const v = await getTranslations({ locale, namespace: "sandbox.invoices" });
  const s = await getTranslations({ locale, namespace: "sandbox" });
  const remaining = balanceOf(invoice);
  const href = (p = "") => demoHref(locale, token, p);
  const toman = s("units.toman");

  return (
    <DemoShell
      lead={lead}
      token={token}
      locale={locale}
      title={v("detail.title", { number: formatCode(invoice.number, locale) })}
      meta={invoice.customerName}
    >
      <div className="min-w-0 space-y-6">
        <RowLink href={href("/sales")} className="t-small text-silver">
          {v("backToList")}
        </RowLink>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <Panel flush>
            <div className="grid gap-5 border-b border-line-dark p-5 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <p className="t-label text-steel">{v("detail.customer")}</p>
                <RowLink href={href(`/crm/${customer.id}`)} className="mt-1.5 block text-[14px] font-semibold">
                  {customer.name}
                </RowLink>
                <p className="t-small mt-1 text-steel">
                  {[customer.city, customer.phone].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div>
                <p className="t-label text-steel">{v("detail.issued")}</p>
                <p className="t-num mt-1.5 text-[13px] text-silver">{formatShortDate(invoice.issuedAt, locale)}</p>
              </div>
              <div>
                <p className="t-label text-steel">{v("detail.due")}</p>
                <p className="t-num mt-1.5 text-[13px] text-silver">{formatShortDate(invoice.dueAt, locale)}</p>
                <div className="mt-2">
                  <InvoiceStatus invoice={invoice} label={(k) => v(`status.${k}`)} />
                </div>
              </div>
            </div>

            <Table
              head={[
                { label: v("form.product") },
                { label: v("form.qty"), align: "end" },
                { label: v("form.unitPrice"), align: "end", hideBelow: "sm" },
                { label: v("form.lineTotal"), align: "end" },
              ]}
            >
              {lines.map((l) => (
                <Tr key={l.id}>
                  <Td>
                    <RowLink href={href(`/inventory/${l.productId}`)}>{l.productName}</RowLink>
                  </Td>
                  <Td align="end" numeric muted>
                    {formatNumber(l.qty, locale)} {l.unit}
                  </Td>
                  <Td align="end" hideBelow="sm" muted>
                    <Money value={l.unitPrice} locale={locale} />
                  </Td>
                  <Td align="end">
                    <Money value={l.lineTotal} locale={locale} />
                  </Td>
                </Tr>
              ))}
            </Table>

            <dl className="ms-auto max-w-sm space-y-2.5 border-t border-line-dark p-5 text-[13px]">
              <div className="flex justify-between gap-4">
                <dt className="text-steel">{v("form.subtotal")}</dt>
                <dd><Money value={invoice.subtotal} locale={locale} /></dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-steel">{v("form.tax")}</dt>
                <dd><Money value={invoice.tax} locale={locale} /></dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-line-dark pt-2.5 font-bold text-offwhite">
                <dt>{v("form.total")}</dt>
                <dd><Money value={invoice.total} locale={locale} unit={toman} /></dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-steel">{v("detail.paid")}</dt>
                <dd className="text-silver"><Money value={invoice.paid} locale={locale} /></dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-steel">{v("detail.remaining")}</dt>
                <dd className="text-offwhite"><Money value={remaining} locale={locale} unit={toman} /></dd>
              </div>
            </dl>
            {invoice.note ? <p className="border-t border-line-dark p-5 text-[13px] text-silver">{invoice.note}</p> : null}
          </Panel>

          <div className="min-w-0 space-y-6">
            {remaining > 0 ? (
              <Panel>
                <PanelHead title={v("payment.title")} meta={v("payment.meta")} />
                <div className="mt-5">
                  <PaymentForm token={token} invoiceId={invoice.id} remaining={remaining} />
                </div>
              </Panel>
            ) : null}

            <Panel flush>
              <PanelHead className="p-5" title={v("payments.title")} meta={v("payments.meta")} />
              <ul className="border-t border-line-dark">
                {payments.length === 0 ? (
                  <li className="px-5 py-6 text-center text-[13px] text-steel">{v("payments.empty")}</li>
                ) : (
                  payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-4 border-b border-line-dark px-5 py-3.5 last:border-b-0">
                      <div>
                        <p className="text-[13px] text-offwhite">{v(`payment.methods.${p.method}`)}</p>
                        <p className="t-num t-small mt-0.5 text-steel">{formatShortDate(p.paidAt, locale)}</p>
                      </div>
                      <Money value={p.amount} locale={locale} />
                    </li>
                  ))
                )}
              </ul>
            </Panel>

            {invoice.status !== "cancelled" && invoice.paid === 0 ? (
              <Panel>
                <PanelHead title={v("cancel.title")} meta={v("cancel.meta")} />
                <div className="mt-4">
                  <ConfirmAction
                    action={cancelInvoiceAction.bind(null, token, invoice.id)}
                    label={v("cancel.cta")}
                    confirm={v("cancel.confirm")}
                  />
                </div>
              </Panel>
            ) : null}
          </div>
        </div>
      </div>
    </DemoShell>
  );
}
