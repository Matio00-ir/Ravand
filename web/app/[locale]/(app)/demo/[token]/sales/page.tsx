import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DemoShell } from "@/components/dashboard/DemoShell";
import { Panel, PanelHead, StatRow, StatTile, Table, Td, Tr } from "@/components/dashboard/ui";
import { ActionLink, EmptyRow, FilterTabs, InvoiceStatus, Money, RowLink, demoHref } from "@/components/sandbox/views";
import { loadDemo } from "@/lib/sandbox/context";
import { computeMetrics } from "@/lib/sandbox/metrics";
import { balanceOf, isOverdue, type Invoice } from "@/lib/sandbox/store";
import { formatMillions, formatNumber, formatPercentChange, formatShortDate, formatCode } from "@/lib/format";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

const FILTERS = ["all", "open", "overdue", "paid", "cancelled"] as const;
type Filter = (typeof FILTERS)[number];

const matches: Record<Filter, (i: Invoice) => boolean> = {
  all: () => true,
  open: (i) => balanceOf(i) > 0,
  overdue: (i) => isOverdue(i),
  paid: (i) => i.status === "paid",
  cancelled: (i) => i.status === "cancelled",
};

/** Sales invoices: the register, filterable, with the 30-day picture on top. */
export default async function DemoTokenSalesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { locale, token } = await params;
  const { filter: rawFilter } = await searchParams;
  setRequestLocale(locale);

  const demo = await loadDemo(token, locale);
  if (!demo) return null;
  const { lead, snapshot } = demo;

  const s = await getTranslations({ locale, namespace: "sandbox" });
  const v = await getTranslations({ locale, namespace: "sandbox.invoices" });

  const filter: Filter = FILTERS.includes(rawFilter as Filter) ? (rawFilter as Filter) : "all";
  const m = computeMetrics(snapshot, locale);
  const rows = snapshot.invoices.filter(matches[filter]);
  const href = (p = "") => demoHref(locale, token, p);
  const million = s("units.million");

  return (
    <DemoShell
      lead={lead}
      token={token}
      locale={locale}
      title={v("title")}
      meta={v("meta")}
      actions={<ActionLink href={href("/sales/new")}>{v("new")}</ActionLink>}
    >
      <div className="min-w-0 space-y-6">
        <StatRow>
          <StatTile
            label={v("stats.sales")}
            value={formatMillions(m.sales30, locale)}
            unit={million}
            delta={m.salesChange === null ? undefined : s("overview.vsPrevious", { pct: formatPercentChange(m.salesChange, locale) })}
            trend={m.salesChange === null ? "flat" : m.salesChange >= 0 ? "up" : "down"}
          />
          <StatTile label={v("stats.count")} value={formatNumber(m.invoices30, locale)} unit={v("stats.countUnit")} />
          <StatTile label={v("stats.average")} value={formatMillions(m.avgInvoice30, locale)} unit={million} />
          <StatTile
            label={v("stats.open")}
            value={formatNumber(m.openCount, locale)}
            unit={v("stats.countUnit")}
            delta={v("stats.overdue", { count: formatNumber(m.overdueCount, locale) })}
            trend={m.overdueCount > 0 ? "down" : "flat"}
          />
        </StatRow>

        <Panel flush>
          <div className="flex flex-wrap items-center justify-between gap-4 p-5">
            <PanelHead title={v("register.title")} meta={v("register.meta", { count: formatNumber(rows.length, locale) })} />
            <FilterTabs
              items={FILTERS.map((f) => ({
                href: f === "all" ? href("/sales") : href(`/sales?filter=${f}`),
                label: v(`filters.${f}`),
                count: formatNumber(snapshot.invoices.filter(matches[f]).length, locale),
                active: f === filter,
              }))}
            />
          </div>
          <Table
            head={[
              { label: v("columns.number") },
              { label: v("columns.customer") },
              { label: v("columns.date"), hideBelow: "md" },
              { label: v("columns.due"), hideBelow: "lg" },
              { label: v("columns.total"), align: "end" },
              { label: v("columns.balance"), align: "end", hideBelow: "sm" },
              { label: v("columns.status") },
            ]}
          >
            {rows.length === 0 ? (
              <EmptyRow colSpan={7}>{v("empty")}</EmptyRow>
            ) : (
              rows.map((inv) => (
                <Tr key={inv.id}>
                  <Td>
                    <RowLink href={href(`/sales/${inv.id}`)} className="t-code">
                      #{formatCode(inv.number, locale)}
                    </RowLink>
                  </Td>
                  <Td>
                    <span className="block max-w-[14rem] truncate">{inv.customerName}</span>
                  </Td>
                  <Td muted hideBelow="md" numeric>
                    {formatShortDate(inv.issuedAt, locale)}
                  </Td>
                  <Td muted hideBelow="lg" numeric>
                    {formatShortDate(inv.dueAt, locale)}
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

        <p className="t-small text-steel">{v("footnote")}</p>
      </div>
    </DemoShell>
  );
}
