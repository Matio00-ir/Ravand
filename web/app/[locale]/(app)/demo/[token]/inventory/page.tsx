import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DemoShell } from "@/components/dashboard/DemoShell";
import { Panel, PanelHead, StatRow, StatTile, Status, Table, Td, Tr } from "@/components/dashboard/ui";
import { ProductForm } from "@/components/sandbox/ProductForms";
import { EmptyRow, Money, RowLink, demoHref } from "@/components/sandbox/views";
import { loadDemo } from "@/lib/sandbox/context";
import { listStockMoves, type Product } from "@/lib/sandbox/store";
import { formatMillions, formatNumber, formatShortDate, formatCode } from "@/lib/format";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

function stockState(p: Product): "service" | "out" | "low" | "ok" {
  if (!p.trackStock) return "service";
  if (p.stock <= 0) return "out";
  if (p.stock <= p.reorderPoint) return "low";
  return "ok";
}

const tone = { service: "neutral", out: "error", low: "warning", ok: "success" } as const;

/** Products & stock: the catalogue with live quantities, recent moves, and adding items. */
export default async function DemoTokenInventoryPage({
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
  const p = await getTranslations({ locale, namespace: "sandbox.products" });
  const moves = await listStockMoves(lead.id, undefined, 12);
  const href = (x = "") => demoHref(locale, token, x);

  const stocked = snapshot.products.filter((x) => x.trackStock);
  const value = stocked.reduce((sum, x) => sum + x.stock * x.price, 0);
  const low = stocked.filter((x) => x.stock <= x.reorderPoint);

  return (
    <DemoShell lead={lead} token={token} locale={locale} title={p("title")} meta={p("meta")}>
      <div className="min-w-0 space-y-6">
        <StatRow cols={3}>
          <StatTile label={p("stats.items")} value={formatNumber(snapshot.products.length, locale)} unit={p("stats.itemsUnit")} />
          <StatTile label={p("stats.value")} value={formatMillions(value, locale)} unit={s("units.million")} />
          <StatTile
            label={p("stats.low")}
            value={formatNumber(low.length, locale)}
            unit={p("stats.itemsUnit")}
            trend={low.length > 0 ? "down" : "flat"}
            delta={low.length > 0 ? p("stats.lowHint") : undefined}
          />
        </StatRow>

        <Panel flush>
          <PanelHead className="p-5" title={p("list.title")} meta={p("list.meta")} />
          <Table
            head={[
              { label: p("columns.sku"), hideBelow: "sm" },
              { label: p("columns.name") },
              { label: p("columns.price"), align: "end", hideBelow: "md" },
              { label: p("columns.stock"), align: "end" },
              { label: p("columns.reorder"), align: "end", hideBelow: "lg" },
              { label: p("columns.status") },
            ]}
          >
            {snapshot.products.length === 0 ? (
              <EmptyRow colSpan={6}>{p("empty")}</EmptyRow>
            ) : (
              snapshot.products.map((x) => {
                const st = stockState(x);
                return (
                  <Tr key={x.id}>
                    <Td hideBelow="sm">
                      <span className="t-code text-silver">{x.sku}</span>
                    </Td>
                    <Td>
                      <RowLink href={href(`/inventory/${x.id}`)} className="block max-w-[16rem] truncate">
                        {x.name}
                      </RowLink>
                    </Td>
                    <Td align="end" muted hideBelow="md">
                      <Money value={x.price} locale={locale} />
                    </Td>
                    <Td align="end" numeric>
                      {x.trackStock ? `${formatNumber(x.stock, locale)} ${x.unit}` : "—"}
                    </Td>
                    <Td align="end" numeric muted hideBelow="lg">
                      {x.trackStock ? formatNumber(x.reorderPoint, locale) : "—"}
                    </Td>
                    <Td>
                      <Status tone={tone[st]}>{p(`status.${st}`)}</Status>
                    </Td>
                  </Tr>
                );
              })
            )}
          </Table>
        </Panel>

        <Panel>
          <PanelHead title={p("add.title")} meta={p("add.meta")} />
          <div className="mt-5">
            <ProductForm token={token} />
          </div>
        </Panel>

        <Panel flush>
          <PanelHead className="p-5" title={p("moves.title")} meta={p("moves.meta")} />
          <Table
            head={[
              { label: p("moves.columns.date"), hideBelow: "sm" },
              { label: p("moves.columns.product") },
              { label: p("moves.columns.kind") },
              { label: p("moves.columns.qty"), align: "end" },
            ]}
          >
            {moves.map((mv) => (
              <Tr key={mv.id}>
                <Td muted numeric hideBelow="sm">
                  {formatShortDate(mv.createdAt, locale)}
                </Td>
                <Td>
                  <RowLink href={href(`/inventory/${mv.productId}`)} className="block max-w-[14rem] truncate">
                    {mv.productName}
                  </RowLink>
                </Td>
                <Td muted>
                  {p(`moves.kinds.${mv.kind}`)}
                  {mv.ref ? <span className="t-code ms-2 text-steel">{mv.kind === "sale" || mv.kind === "cancel" ? `#${formatCode(Number(mv.ref), locale)}` : mv.ref}</span> : null}
                </Td>
                <Td align="end" numeric>
                  <span className={mv.qty < 0 ? "text-[#c9a3a3]" : "text-[#9ab89f]"}>
                    {mv.qty > 0 ? "+" : "−"}
                    {formatNumber(Math.abs(mv.qty), locale)}
                  </span>
                </Td>
              </Tr>
            ))}
          </Table>
        </Panel>
      </div>
    </DemoShell>
  );
}
