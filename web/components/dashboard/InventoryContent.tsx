import { getTranslations } from "next-intl/server";
import {
  Panel,
  PanelHead,
  ShareBar,
  StatRow,
  StatTile,
  Status,
  type StatusTone,
  Table,
  Td,
  Tr,
  ToolButton,
} from "@/components/dashboard/ui";
import { ColumnChart } from "@/components/dashboard/charts";

type Stat = { label: string; value: string; unit: string; delta: string; trend: "up" | "down" | "flat" };
type Bar = { label: string; value: number; caption: string };
type Item = { sku: string; name: string; warehouse: string; qty: string; reorder: string; status: string };

const stockTone: Record<string, StatusTone> = {
  ok: "success",
  low: "warning",
  out: "error",
};

/** The "Inventory" screen body — used by /demo/[token]/inventory. */
export async function InventoryContent({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "dash" });
  const inv = await getTranslations({ locale, namespace: "dash.inventory" });

  const stats = inv.raw("stats") as Stat[];
  const labels = inv.raw("movement.labels") as string[];
  const data = inv.raw("movement.data") as number[];
  const warehouses = inv.raw("warehouses.items") as Bar[];
  const items = inv.raw("stock.rows") as Item[];
  const columns = inv.raw("stock.columns") as string[];

  return (
    <div className="min-w-0 space-y-6">
      <StatRow>
        {stats.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} unit={s.unit} delta={s.delta} trend={s.trend} />
        ))}
      </StatRow>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHead title={inv("movement.title")} meta={inv("movement.meta")} />
          <div className="mt-6 h-56">
            <ColumnChart data={data} labels={labels} />
          </div>
        </Panel>

        <Panel>
          <PanelHead title={inv("warehouses.title")} meta={inv("warehouses.meta")} />
          <ul className="mt-6 space-y-5">
            {warehouses.map((w) => (
              <ShareBar key={w.label} label={w.label} value={w.value} caption={w.caption} />
            ))}
          </ul>
        </Panel>
      </div>

      <Panel flush>
        <PanelHead
          className="p-5"
          title={inv("stock.title")}
          meta={inv("stock.meta")}
          action={<ToolButton>{inv("stock.action")}</ToolButton>}
        />
        <Table
          head={[
            { label: columns[0], hideBelow: "sm" },
            { label: columns[1] },
            { label: columns[2], hideBelow: "lg" },
            { label: columns[3], align: "end" },
            { label: columns[4], align: "end", hideBelow: "md" },
            { label: columns[5] },
          ]}
        >
          {items.map((item) => (
            <Tr key={item.sku}>
              <Td hideBelow="sm">
                <span className="t-code text-silver">{item.sku}</span>
              </Td>
              <Td>{item.name}</Td>
              <Td muted hideBelow="lg">
                {item.warehouse}
              </Td>
              <Td align="end" numeric>
                {item.qty}
              </Td>
              <Td align="end" numeric muted hideBelow="md">
                {item.reorder}
              </Td>
              <Td>
                <Status tone={stockTone[item.status] ?? "neutral"}>{inv(`stock.status.${item.status}`)}</Status>
              </Td>
            </Tr>
          ))}
        </Table>
      </Panel>

      <p className="t-small text-steel">{t("sampleNote")}</p>
    </div>
  );
}
