import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DemoShell } from "@/components/dashboard/DemoShell";
import { Panel, PanelHead, StatRow, StatTile, Table, Td, Tr } from "@/components/dashboard/ui";
import { ConfirmAction } from "@/components/sandbox/ConfirmAction";
import { CustomerForm } from "@/components/sandbox/CustomerForm";
import { ActionLink, EmptyRow, InvoiceStatus, Money, RowLink, demoHref } from "@/components/sandbox/views";
import { deleteCustomerAction } from "@/lib/sandbox/actions";
import { loadDemo } from "@/lib/sandbox/context";
import { computeMetrics } from "@/lib/sandbox/metrics";
import { balanceOf } from "@/lib/sandbox/store";
import { formatMillions, formatNumber, formatShortDate, formatCode } from "@/lib/format";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

/** One customer: their statement (invoices and balance), details, and removal. */
export default async function DemoTokenCustomerPage({
  params,
}: {
  params: Promise<{ locale: string; token: string; id: string }>;
}) {
  const { locale, token, id } = await params;
  setRequestLocale(locale);

  const demo = await loadDemo(token, locale);
  if (!demo) return null;
  const { lead, snapshot } = demo;

  const customer = snapshot.customers.find((c) => String(c.id) === id);
  if (!customer) notFound();

  const s = await getTranslations({ locale, namespace: "sandbox" });
  const c = await getTranslations({ locale, namespace: "sandbox.customers" });
  const v = await getTranslations({ locale, namespace: "sandbox.invoices" });
  const m = computeMetrics(snapshot, locale);
  const stats = m.customerBalance.get(customer.id) ?? { balance: 0, count: 0, last: null, sales: 0 };
  const invoices = snapshot.invoices.filter((i) => i.customerId === customer.id);
  const href = (p = "") => demoHref(locale, token, p);

  return (
    <DemoShell
      lead={lead}
      token={token}
      locale={locale}
      title={customer.name}
      meta={c("detail.meta")}
      actions={<ActionLink href={href(`/sales/new?customer=${customer.id}`)}>{v("new")}</ActionLink>}
    >
      <div className="min-w-0 space-y-6">
        <RowLink href={href("/crm")} className="t-small text-silver">
          {c("backToList")}
        </RowLink>

        <StatRow cols={3}>
          <StatTile label={c("columns.balance")} value={formatMillions(stats.balance, locale)} unit={s("units.million")} />
          <StatTile label={c("columns.sales")} value={formatMillions(stats.sales, locale)} unit={s("units.million")} />
          <StatTile label={c("columns.invoices")} value={formatNumber(stats.count, locale)} unit={v("stats.countUnit")} />
        </StatRow>

        <Panel flush>
          <PanelHead className="p-5" title={c("detail.statement")} meta={c("detail.statementMeta")} />
          <Table
            head={[
              { label: v("columns.number") },
              { label: v("columns.date"), hideBelow: "sm" },
              { label: v("columns.total"), align: "end" },
              { label: v("columns.balance"), align: "end", hideBelow: "sm" },
              { label: v("columns.status") },
            ]}
          >
            {invoices.length === 0 ? (
              <EmptyRow colSpan={5}>{c("detail.noInvoices")}</EmptyRow>
            ) : (
              invoices.map((inv) => (
                <Tr key={inv.id}>
                  <Td>
                    <RowLink href={href(`/sales/${inv.id}`)} className="t-code">
                      #{formatCode(inv.number, locale)}
                    </RowLink>
                  </Td>
                  <Td muted numeric hideBelow="sm">
                    {formatShortDate(inv.issuedAt, locale)}
                  </Td>
                  <Td align="end">
                    <Money value={inv.total} locale={locale} />
                  </Td>
                  <Td align="end" muted hideBelow="sm">
                    <Money value={balanceOf(inv)} locale={locale} />
                  </Td>
                  <Td>
                    <InvoiceStatus invoice={inv} label={(k) => v(`status.${k}`)} />
                  </Td>
                </Tr>
              ))
            )}
          </Table>
        </Panel>

        <Panel>
          <PanelHead title={c("detail.edit")} />
          <div className="mt-5">
            <CustomerForm token={token} customerId={customer.id} values={customer} />
          </div>
        </Panel>

        <Panel className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 max-w-xl">
            <h2 className="t-h4 text-offwhite">{c("delete.title")}</h2>
            <p className="t-small mt-1 text-steel">{c("delete.body")}</p>
          </div>
          <ConfirmAction
            action={deleteCustomerAction.bind(null, token, customer.id)}
            label={c("delete.cta")}
            confirm={c("delete.confirm", { name: customer.name })}
          />
        </Panel>
      </div>
    </DemoShell>
  );
}
