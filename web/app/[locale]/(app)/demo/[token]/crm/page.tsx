import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DemoShell } from "@/components/dashboard/DemoShell";
import { Panel, PanelHead, StatRow, StatTile, Table, Td, Tr } from "@/components/dashboard/ui";
import { CustomerForm } from "@/components/sandbox/CustomerForm";
import { EmptyRow, Money, RowLink, demoHref } from "@/components/sandbox/views";
import { loadDemo } from "@/lib/sandbox/context";
import { computeMetrics } from "@/lib/sandbox/metrics";
import { formatMillions, formatNumber, formatShortDate } from "@/lib/format";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

/** Customers: the account list with each one's live balance, and adding new ones. */
export default async function DemoTokenCustomersPage({
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
  const c = await getTranslations({ locale, namespace: "sandbox.customers" });
  const m = computeMetrics(snapshot, locale);
  const href = (p = "") => demoHref(locale, token, p);

  const withBalance = snapshot.customers
    .map((cu) => ({ ...cu, ...(m.customerBalance.get(cu.id) ?? { balance: 0, count: 0, last: null, sales: 0 }) }))
    .sort((a, b) => b.balance - a.balance || b.sales - a.sales);
  const owing = withBalance.filter((x) => x.balance > 0).length;

  return (
    <DemoShell lead={lead} token={token} locale={locale} title={c("title")} meta={c("meta")}>
      <div className="min-w-0 space-y-6">
        <StatRow cols={3}>
          <StatTile label={c("stats.count")} value={formatNumber(snapshot.customers.length, locale)} unit={c("stats.unit")} />
          <StatTile label={c("stats.owing")} value={formatNumber(owing, locale)} unit={c("stats.unit")} />
          <StatTile label={c("stats.receivables")} value={formatMillions(m.receivables, locale)} unit={s("units.million")} />
        </StatRow>

        <Panel>
          <PanelHead title={c("add.title")} meta={c("add.meta")} />
          <div className="mt-5">
            <CustomerForm token={token} />
          </div>
        </Panel>

        <Panel flush>
          <PanelHead className="p-5" title={c("list.title")} meta={c("list.meta")} />
          <Table
            head={[
              { label: c("columns.name") },
              { label: c("columns.city"), hideBelow: "md" },
              { label: c("columns.invoices"), align: "end", hideBelow: "sm" },
              { label: c("columns.last"), hideBelow: "lg" },
              { label: c("columns.sales"), align: "end", hideBelow: "lg" },
              { label: c("columns.balance"), align: "end" },
            ]}
          >
            {withBalance.length === 0 ? (
              <EmptyRow colSpan={6}>{c("empty")}</EmptyRow>
            ) : (
              withBalance.map((cu) => (
                <Tr key={cu.id}>
                  <Td>
                    <RowLink href={href(`/crm/${cu.id}`)} className="block max-w-[16rem] truncate">
                      {cu.name}
                    </RowLink>
                    {cu.phone ? (
                      <span className="t-num mt-0.5 block text-[11.5px] text-steel" dir="ltr">
                        {cu.phone}
                      </span>
                    ) : null}
                  </Td>
                  <Td muted hideBelow="md">
                    {cu.city ?? "—"}
                  </Td>
                  <Td align="end" muted numeric hideBelow="sm">
                    {formatNumber(cu.count, locale)}
                  </Td>
                  <Td muted numeric hideBelow="lg">
                    {cu.last ? formatShortDate(cu.last, locale) : "—"}
                  </Td>
                  <Td align="end" muted hideBelow="lg">
                    <Money value={cu.sales} locale={locale} />
                  </Td>
                  <Td align="end">
                    <span className={cu.balance > 0 ? "text-offwhite" : "text-steel"}>
                      <Money value={cu.balance} locale={locale} />
                    </span>
                  </Td>
                </Tr>
              ))
            )}
          </Table>
        </Panel>
      </div>
    </DemoShell>
  );
}
