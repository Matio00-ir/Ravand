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
type Bucket = { label: string; value: number; caption: string };
type Entry = { date: string; desc: string; account: string; debit: string; credit: string; status: string };

const entryTone: Record<string, StatusTone> = {
  posted: "success",
  review: "warning",
  draft: "neutral",
};

/** The "Finance" screen body — shared by /dashboard/finance and /demo/[token]/finance. */
export async function FinanceContent({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "dash" });
  const f = await getTranslations({ locale, namespace: "dash.finance" });

  const stats = f.raw("stats") as Stat[];
  const buckets = f.raw("aging.buckets") as Bucket[];
  const entries = f.raw("ledger.rows") as Entry[];
  const columns = f.raw("ledger.columns") as string[];
  const cashLabels = f.raw("cashflow.labels") as string[];
  const cashData = f.raw("cashflow.data") as number[];

  return (
    <div className="min-w-0 space-y-6">
      <StatRow>
        {stats.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} unit={s.unit} delta={s.delta} trend={s.trend} />
        ))}
      </StatRow>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHead title={f("cashflow.title")} meta={f("cashflow.meta")} />
          <div className="mt-6 h-56">
            <ColumnChart data={cashData} labels={cashLabels} />
          </div>
        </Panel>

        <Panel>
          <PanelHead title={f("aging.title")} meta={f("aging.meta")} />
          <ul className="mt-6 space-y-4">
            {buckets.map((b, i) => (
              <ShareBar key={b.label} label={b.label} value={b.value} caption={b.caption} opacity={1 - i * 0.14} />
            ))}
          </ul>
        </Panel>
      </div>

      <Panel flush>
        <PanelHead
          className="p-5"
          title={f("ledger.title")}
          meta={f("ledger.meta")}
          action={<ToolButton>{f("ledger.action")}</ToolButton>}
        />
        <Table
          head={[
            { label: columns[0], hideBelow: "sm" },
            { label: columns[1] },
            { label: columns[2], hideBelow: "lg" },
            { label: columns[3], align: "end" },
            { label: columns[4], align: "end" },
            { label: columns[5] },
          ]}
        >
          {entries.map((e) => (
            <Tr key={e.date + e.desc}>
              <Td muted hideBelow="sm" numeric>
                {e.date}
              </Td>
              <Td>{e.desc}</Td>
              <Td muted hideBelow="lg">
                {e.account}
              </Td>
              <Td align="end" numeric>
                {e.debit}
              </Td>
              <Td align="end" numeric muted>
                {e.credit}
              </Td>
              <Td>
                <Status tone={entryTone[e.status] ?? "neutral"}>{f(`ledger.status.${e.status}`)}</Status>
              </Td>
            </Tr>
          ))}
        </Table>
      </Panel>

      <p className="t-small text-steel">{t("sampleNote")}</p>
    </div>
  );
}
