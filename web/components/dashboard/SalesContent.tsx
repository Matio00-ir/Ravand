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
import { Funnel } from "@/components/dashboard/charts";

type Stat = { label: string; value: string; unit: string; delta: string; trend: "up" | "down" | "flat" };
type Stage = { label: string; value: number; caption: string };
type Item = { label: string; value: number; caption: string };
type Order = { ref: string; account: string; channel: string; amount: string; status: string };

const orderTone: Record<string, StatusTone> = {
  confirmed: "success",
  packing: "info",
  shipped: "success",
  hold: "warning",
};

/** The "Sales" screen body — shared by /dashboard/sales and /demo/[token]/sales. */
export async function SalesContent({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "dash" });
  const s = await getTranslations({ locale, namespace: "dash.sales" });

  const stats = s.raw("stats") as Stat[];
  const stages = s.raw("funnel.stages") as Stage[];
  const top = s.raw("top.items") as Item[];
  const orders = s.raw("orders.rows") as Order[];
  const columns = s.raw("orders.columns") as string[];

  return (
    <div className="min-w-0 space-y-6">
      <StatRow>
        {stats.map((x) => (
          <StatTile key={x.label} label={x.label} value={x.value} unit={x.unit} delta={x.delta} trend={x.trend} />
        ))}
      </StatRow>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHead title={s("funnel.title")} meta={s("funnel.meta")} />
          <div className="mt-6">
            <Funnel stages={stages} />
          </div>
        </Panel>

        <Panel>
          <PanelHead title={s("top.title")} meta={s("top.meta")} />
          <ul className="mt-6 space-y-4">
            {top.map((item, i) => (
              <ShareBar key={item.label} label={item.label} value={item.value} caption={item.caption} opacity={1 - i * 0.14} />
            ))}
          </ul>
        </Panel>
      </div>

      <Panel flush>
        <PanelHead
          className="p-5"
          title={s("orders.title")}
          meta={s("orders.meta")}
          action={<ToolButton>{s("orders.action")}</ToolButton>}
        />
        <Table
          head={[
            { label: columns[0] },
            { label: columns[1] },
            { label: columns[2], hideBelow: "md" },
            { label: columns[3], align: "end" },
            { label: columns[4] },
          ]}
        >
          {orders.map((order) => (
            <Tr key={order.ref}>
              <Td>
                <span className="t-code text-silver">{order.ref}</span>
              </Td>
              <Td>{order.account}</Td>
              <Td muted hideBelow="md">
                {order.channel}
              </Td>
              <Td align="end" numeric>
                {order.amount}
              </Td>
              <Td>
                <Status tone={orderTone[order.status] ?? "neutral"}>{s(`orders.status.${order.status}`)}</Status>
              </Td>
            </Tr>
          ))}
        </Table>
      </Panel>

      <p className="t-small text-steel">{t("sampleNote")}</p>
    </div>
  );
}
