import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DemoShell } from "@/components/dashboard/DemoShell";
import { Panel, PanelHead, StatRow, StatTile, Table, Td, Tr } from "@/components/dashboard/ui";
import { ConfirmAction } from "@/components/sandbox/ConfirmAction";
import { ProductForm, StockMoveForm } from "@/components/sandbox/ProductForms";
import { EmptyRow, RowLink, demoHref } from "@/components/sandbox/views";
import { deleteProductAction } from "@/lib/sandbox/actions";
import { loadDemo } from "@/lib/sandbox/context";
import { listStockMoves } from "@/lib/sandbox/store";
import { formatMillions, formatNumber, formatShortDate, formatCode } from "@/lib/format";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

/** One product: stock card (every move), receipts/adjustments, details, removal. */
export default async function DemoTokenProductPage({
  params,
}: {
  params: Promise<{ locale: string; token: string; id: string }>;
}) {
  const { locale, token, id } = await params;
  setRequestLocale(locale);

  const demo = await loadDemo(token, locale);
  if (!demo) return null;
  const { lead, snapshot } = demo;

  const product = snapshot.products.find((x) => String(x.id) === id);
  if (!product) notFound();

  const s = await getTranslations({ locale, namespace: "sandbox" });
  const p = await getTranslations({ locale, namespace: "sandbox.products" });
  const moves = product.trackStock ? await listStockMoves(lead.id, product.id, 50) : [];
  const href = (x = "") => demoHref(locale, token, x);

  return (
    <DemoShell lead={lead} token={token} locale={locale} title={product.name} meta={`${product.sku} · ${product.unit}`}>
      <div className="min-w-0 space-y-6">
        <RowLink href={href("/inventory")} className="t-small text-silver">
          {p("backToList")}
        </RowLink>

        <StatRow cols={3}>
          <StatTile
            label={p("columns.stock")}
            value={product.trackStock ? formatNumber(product.stock, locale) : "—"}
            unit={product.trackStock ? product.unit : undefined}
            trend={product.trackStock && product.stock <= product.reorderPoint ? "down" : "flat"}
            delta={product.trackStock && product.stock <= product.reorderPoint ? p("stats.lowHint") : undefined}
          />
          <StatTile label={p("columns.price")} value={formatMillions(product.price, locale)} unit={s("units.million")} />
          <StatTile
            label={p("stats.value")}
            value={product.trackStock ? formatMillions(product.stock * product.price, locale) : "—"}
            unit={product.trackStock ? s("units.million") : undefined}
          />
        </StatRow>

        {product.trackStock ? (
          <Panel>
            <PanelHead title={p("move.title")} meta={p("move.meta")} />
            <div className="mt-5">
              <StockMoveForm token={token} productId={product.id} unit={product.unit} />
            </div>
          </Panel>
        ) : null}

        {product.trackStock ? (
          <Panel flush>
            <PanelHead className="p-5" title={p("card.title")} meta={p("card.meta")} />
            <Table
              head={[
                { label: p("moves.columns.date") },
                { label: p("moves.columns.kind") },
                { label: p("moves.columns.qty"), align: "end" },
              ]}
            >
              {moves.length === 0 ? (
                <EmptyRow colSpan={3}>{p("card.empty")}</EmptyRow>
              ) : (
                moves.map((mv) => (
                  <Tr key={mv.id}>
                    <Td muted numeric>
                      {formatShortDate(mv.createdAt, locale)}
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
                ))
              )}
            </Table>
          </Panel>
        ) : null}

        <Panel>
          <PanelHead title={p("edit.title")} meta={p("edit.meta")} />
          <div className="mt-5">
            <ProductForm token={token} productId={product.id} values={product} />
          </div>
        </Panel>

        <Panel className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 max-w-xl">
            <h2 className="t-h4 text-offwhite">{p("delete.title")}</h2>
            <p className="t-small mt-1 text-steel">{p("delete.body")}</p>
          </div>
          <ConfirmAction
            action={deleteProductAction.bind(null, token, product.id)}
            label={p("delete.cta")}
            confirm={p("delete.confirm", { name: product.name })}
          />
        </Panel>
      </div>
    </DemoShell>
  );
}
