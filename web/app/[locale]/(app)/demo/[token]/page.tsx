import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DemoShell } from "@/components/dashboard/DemoShell";
import { Panel, PanelHead, StatRow, StatTile, Table, Td, Tr } from "@/components/dashboard/ui";
import { ColumnChart, Donut } from "@/components/dashboard/charts";
import { ConfirmAction } from "@/components/sandbox/ConfirmAction";
import { ActionLink, InvoiceStatus, Money, RowLink, demoHref } from "@/components/sandbox/views";
import { resetSandboxAction } from "@/lib/sandbox/actions";
import { loadDemo } from "@/lib/sandbox/context";
import { computeMetrics } from "@/lib/sandbox/metrics";
import { daysRemaining } from "@/lib/demo-leads";
import { formatDate, formatMillions, formatNumber, formatPercentChange, formatShortDate, formatCode } from "@/lib/format";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The sandbox's home screen. Every figure is computed from this
 * customer's own invoices, payments and stock (lib/sandbox/metrics.ts),
 * so it answers to whatever they do on the other screens.
 */
export default async function DemoTokenPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  const demo = await loadDemo(token, locale);
  if (!demo) return null; // layout.tsx already gates this; defensive only.
  const { lead, snapshot } = demo;

  const t = await getTranslations({ locale, namespace: "demoEnv" });
  const s = await getTranslations({ locale, namespace: "sandbox" });
  const o = await getTranslations({ locale, namespace: "sandbox.overview" });

  const m = computeMetrics(snapshot, locale);
  const href = (p = "") => demoHref(locale, token, p);
  const million = s("units.million");
  const delta = (pct: number | null) => (pct === null ? undefined : o("vsPrevious", { pct: formatPercentChange(pct, locale) }));
  const trend = (pct: number | null) => (pct === null ? "flat" : pct >= 0 ? "up" : "down");

  const mix = m.customerMix.map((c) => ({
    label: c.label === "__others" ? o("mix.others") : c.label,
    value: m.totalSales > 0 ? Math.round((c.value / m.totalSales) * 100) : 0,
  }));
  const recent = snapshot.invoices.slice(0, 6);

  return (
    <DemoShell
      lead={lead}
      token={token}
      locale={locale}
      title={o("title")}
      meta={o("meta")}
      actions={<ActionLink href={href("/sales/new")}>{s("invoices.new")}</ActionLink>}
    >
      <div className="min-w-0 space-y-6">
        <Panel>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 max-w-2xl">
              <p className="t-label text-steel">{t("ready.eyebrow")}</p>
              <h2 className="t-h3 mt-3 text-offwhite">{t("ready.title", { company: lead.company })}</h2>
              <p className="t-body mt-3 text-silver">{o("intro")}</p>
            </div>
            <dl className="shrink-0">
              <dt className="t-label text-steel">{t("ready.trialLabel")}</dt>
              <dd className="t-num mt-2 text-[1.1rem] font-bold text-offwhite">
                {t("ready.daysLeft", { days: formatNumber(daysRemaining(lead), locale) })}
              </dd>
              <dd className="t-small mt-1 text-steel">{t("ready.expiresOn", { date: formatDate(lead.expiresAt, locale) })}</dd>
            </dl>
          </div>

          <ol className="mt-6 grid gap-3 border-t border-line-dark pt-6 md:grid-cols-3">
            {(["invoice", "payment", "stock"] as const).map((k, i) => (
              <li key={k} className="flex gap-3">
                <span className="t-num grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line-dark-strong text-[11px] text-silver">
                  {formatNumber(i + 1, locale)}
                </span>
                <div className="min-w-0">
                  <RowLink href={href(k === "invoice" ? "/sales/new" : k === "payment" ? "/sales?filter=open" : "/inventory")}>
                    {o(`tryIt.${k}.title`)}
                  </RowLink>
                  <p className="t-small mt-1 text-steel">{o(`tryIt.${k}.body`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        <StatRow>
          <StatTile
            label={o("stats.sales")}
            value={formatMillions(m.sales30, locale)}
            unit={million}
            delta={delta(m.salesChange)}
            trend={trend(m.salesChange)}
          />
          <StatTile
            label={o("stats.receivables")}
            value={formatMillions(m.receivables, locale)}
            unit={million}
            delta={o("stats.overdueCount", { count: formatNumber(m.overdueCount, locale) })}
            trend={m.overdueCount > 0 ? "down" : "flat"}
          />
          <StatTile
            label={o("stats.collected")}
            value={formatMillions(m.collected30, locale)}
            unit={million}
            delta={delta(m.collectedChange)}
            trend={trend(m.collectedChange)}
          />
          <StatTile
            label={o("stats.lowStock")}
            value={formatNumber(m.lowStock.length, locale)}
            unit={o("stats.items")}
            delta={m.lowStock.length > 0 ? o("stats.needsOrder") : o("stats.allGood")}
            trend={m.lowStock.length > 0 ? "down" : "flat"}
          />
        </StatRow>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Panel>
            <PanelHead title={o("salesChart.title")} meta={o("salesChart.meta")} />
            <div className="mt-6 h-56">
              <ColumnChart data={m.salesByMonth} labels={m.months} />
            </div>
          </Panel>

          <Panel>
            <PanelHead title={o("mix.title")} meta={o("mix.meta")} />
            <div className="mt-6 text-silver">
              <Donut
                segments={mix}
                centerValue={formatMillions(m.totalSales, locale)}
                centerLabel={million}
              />
            </div>
          </Panel>
        </div>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Panel flush>
            <PanelHead
              className="p-5"
              title={o("recent.title")}
              meta={o("recent.meta")}
              action={<RowLink href={href("/sales")}>{o("recent.all")}</RowLink>}
            />
            <Table
              head={[
                { label: s("invoices.columns.customer") },
                { label: s("invoices.columns.date"), hideBelow: "md" },
                { label: s("invoices.columns.total"), align: "end" },
                { label: s("invoices.columns.status") },
              ]}
            >
              {recent.map((inv) => (
                <Tr key={inv.id}>
                  <Td>
                    <RowLink href={href(`/sales/${inv.id}`)} className="block truncate">
                      {inv.customerName}
                    </RowLink>
                    <span className="t-code mt-0.5 block text-steel">#{formatCode(inv.number, locale)}</span>
                  </Td>
                  <Td muted hideBelow="md" numeric>
                    {formatShortDate(inv.issuedAt, locale)}
                  </Td>
                  <Td align="end">
                    <Money value={inv.total} locale={locale} />
                  </Td>
                  <Td>
                    <InvoiceStatus invoice={inv} label={(k) => s(`invoices.status.${k}`)} />
                  </Td>
                </Tr>
              ))}
            </Table>
          </Panel>

          <Panel flush>
            <PanelHead className="p-5" title={o("lowStock.title")} meta={o("lowStock.meta")} />
            <ul className="border-t border-line-dark">
              {m.lowStock.length === 0 ? (
                <li className="px-5 py-8 text-center text-[13px] text-steel">{o("lowStock.empty")}</li>
              ) : (
                m.lowStock.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-4 border-b border-line-dark px-5 py-3.5 last:border-b-0">
                    <div className="min-w-0">
                      <RowLink href={href(`/inventory/${p.id}`)} className="block truncate text-[13px]">
                        {p.name}
                      </RowLink>
                      <p className="t-small mt-0.5 text-steel">
                        {o("lowStock.reorderAt", { qty: formatNumber(p.reorderPoint, locale), unit: p.unit })}
                      </p>
                    </div>
                    <span className={`t-num shrink-0 text-[13px] ${p.stock === 0 ? "text-error" : "text-warning"}`}>
                      {formatNumber(p.stock, locale)} {p.unit}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </Panel>
        </div>

        <Panel className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 max-w-xl">
            <h2 className="t-h4 text-offwhite">{o("reset.title")}</h2>
            <p className="t-small mt-1 text-steel">{o("reset.body")}</p>
          </div>
          <ConfirmAction
            action={resetSandboxAction.bind(null, token)}
            label={o("reset.cta")}
            confirm={o("reset.confirm")}
            variant="ghost"
          />
        </Panel>

        <p className="t-small text-steel">
          {o("footnote", { date: formatShortDate(new Date(), locale) })}
        </p>
      </div>
    </DemoShell>
  );
}
