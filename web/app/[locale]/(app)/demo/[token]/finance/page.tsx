import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DemoShell } from "@/components/dashboard/DemoShell";
import { Panel, PanelHead, ShareBar, StatRow, StatTile, Table, Td, Tr } from "@/components/dashboard/ui";
import { ColumnChart } from "@/components/dashboard/charts";
import { EmptyRow, Money, RowLink, demoHref } from "@/components/sandbox/views";
import { loadDemo } from "@/lib/sandbox/context";
import { computeMetrics } from "@/lib/sandbox/metrics";
import { formatMillions, formatNumber, formatPercentChange, formatShortDate, formatCode } from "@/lib/format";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

/** Finance: receivables, aging, cash collected and VAT — all from the sandbox's own ledger. */
export default async function DemoTokenFinancePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  const demo = await loadDemo(token, locale);
  if (!demo) return null;
  const { lead, snapshot } = demo;

  const s = await getTranslations({ locale, namespace: "sandbox" });
  const f = await getTranslations({ locale, namespace: "sandbox.finance" });
  const v = await getTranslations({ locale, namespace: "sandbox.invoices" });
  const m = computeMetrics(snapshot, locale);
  const href = (p = "") => demoHref(locale, token, p);
  const million = s("units.million");

  const debtors = snapshot.customers
    .map((c) => ({ ...c, balance: m.customerBalance.get(c.id)?.balance ?? 0 }))
    .filter((c) => c.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);

  return (
    <DemoShell lead={lead} token={token} locale={locale} title={f("title")} meta={f("meta")}>
      <div className="min-w-0 space-y-6">
        <StatRow>
          <StatTile label={f("stats.receivables")} value={formatMillions(m.receivables, locale)} unit={million} />
          <StatTile
            label={f("stats.overdue")}
            value={formatMillions(m.overdueAmount, locale)}
            unit={million}
            delta={f("stats.overdueCount", { count: formatNumber(m.overdueCount, locale) })}
            trend={m.overdueCount > 0 ? "down" : "flat"}
          />
          <StatTile
            label={f("stats.collected")}
            value={formatMillions(m.collected30, locale)}
            unit={million}
            delta={m.collectedChange === null ? undefined : s("overview.vsPrevious", { pct: formatPercentChange(m.collectedChange, locale) })}
            trend={m.collectedChange === null ? "flat" : m.collectedChange >= 0 ? "up" : "down"}
          />
          <StatTile label={f("stats.vat")} value={formatMillions(m.vat30, locale)} unit={million} delta={f("stats.vatHint")} />
        </StatRow>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Panel>
            <PanelHead title={f("cash.title")} meta={f("cash.meta")} />
            <div className="mt-6 h-56">
              <ColumnChart data={m.cashByMonth} labels={m.months} />
            </div>
          </Panel>

          <Panel>
            <PanelHead title={f("aging.title")} meta={f("aging.meta")} />
            <ul className="mt-6 space-y-4">
              {m.aging.map((b, i) => (
                <ShareBar
                  key={b.key}
                  label={f(`aging.buckets.${b.key}`)}
                  value={b.share}
                  caption={`${formatMillions(b.amount, locale)} ${million}`}
                  opacity={1 - i * 0.14}
                />
              ))}
            </ul>
          </Panel>
        </div>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Panel flush>
            <PanelHead className="p-5" title={f("payments.title")} meta={f("payments.meta")} />
            <Table
              head={[
                { label: f("payments.columns.date"), hideBelow: "sm" },
                { label: f("payments.columns.customer") },
                { label: f("payments.columns.invoice"), hideBelow: "md" },
                { label: f("payments.columns.method"), hideBelow: "lg" },
                { label: f("payments.columns.amount"), align: "end" },
              ]}
            >
              {snapshot.payments.length === 0 ? (
                <EmptyRow colSpan={5}>{f("payments.empty")}</EmptyRow>
              ) : (
                snapshot.payments.slice(0, 10).map((p) => (
                  <Tr key={p.id}>
                    <Td muted numeric hideBelow="sm">
                      {formatShortDate(p.paidAt, locale)}
                    </Td>
                    <Td>
                      <span className="block max-w-[14rem] truncate">{p.customerName}</span>
                    </Td>
                    <Td hideBelow="md">
                      <RowLink href={href(`/sales/${p.invoiceId}`)} className="t-code">
                        #{formatCode(p.invoiceNumber, locale)}
                      </RowLink>
                    </Td>
                    <Td muted hideBelow="lg">
                      {v(`payment.methods.${p.method}`)}
                    </Td>
                    <Td align="end">
                      <Money value={p.amount} locale={locale} />
                    </Td>
                  </Tr>
                ))
              )}
            </Table>
          </Panel>

          <Panel flush>
            <PanelHead className="p-5" title={f("debtors.title")} meta={f("debtors.meta")} />
            <ul className="border-t border-line-dark">
              {debtors.length === 0 ? (
                <li className="px-5 py-8 text-center text-[13px] text-steel">{f("debtors.empty")}</li>
              ) : (
                debtors.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-4 border-b border-line-dark px-5 py-3.5 last:border-b-0">
                    <RowLink href={href(`/crm/${d.id}`)} className="min-w-0 truncate text-[13px]">
                      {d.name}
                    </RowLink>
                    <span className="shrink-0 text-[13px] text-offwhite">
                      <Money value={d.balance} locale={locale} />
                    </span>
                  </li>
                ))
              )}
            </ul>
          </Panel>
        </div>
      </div>
    </DemoShell>
  );
}
