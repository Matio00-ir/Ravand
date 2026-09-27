import { getTranslations } from "next-intl/server";
import {
  Panel,
  PanelHead,
  StatRow,
  StatTile,
  Status,
  type StatusTone,
  Table,
  Td,
  Tr,
} from "@/components/dashboard/ui";
import { Donut, Sparkline } from "@/components/dashboard/charts";
import { AreaChart } from "@/components/product/Chart";

const ACTUAL = [0.9, 1.0, 1.05, 1.1, 1.0, 1.15, 1.2, 1.25, 1.2, 1.3, 1.35, 1.4];
const TARGET = [1.0, 1.05, 1.1, 1.1, 1.15, 1.2, 1.2, 1.25, 1.3, 1.3, 1.35, 1.4];

type Stat = { label: string; value: string; unit: string; delta: string; trend: "up" | "down" | "flat" };
type Kpi = { name: string; trend: number[]; current: string; target: string; status: string };

const kpiTone: Record<string, StatusTone> = {
  onTrack: "success",
  atRisk: "warning",
  behind: "error",
};

/** The "Analytics" screen body — used by /demo/[token]/analytics. */
export async function AnalyticsContent({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "dash" });
  const a = await getTranslations({ locale, namespace: "dash.analytics" });

  const stats = a.raw("stats") as Stat[];
  const months = a.raw("revenue.months") as string[];
  const segments = a.raw("channels.segments") as { label: string; value: number }[];
  const kpis = a.raw("kpis.rows") as Kpi[];
  const columns = a.raw("kpis.columns") as string[];

  return (
    <div className="min-w-0 space-y-6">
      <StatRow>
        {stats.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} unit={s.unit} delta={s.delta} trend={s.trend} />
        ))}
      </StatRow>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHead
            title={a("revenue.title")}
            meta={a("revenue.meta")}
            action={
              <div className="hidden items-center gap-3 sm:flex">
                <span className="flex items-center gap-1.5 text-[11.5px] text-steel">
                  <span className="h-px w-3.5 bg-[#9FB0C4]" />
                  {a("revenue.series")}
                </span>
                <span className="flex items-center gap-1.5 text-[11.5px] text-steel">
                  <span className="w-3.5 border-t border-dashed border-silver/40" />
                  {a("revenue.compare")}
                </span>
              </div>
            }
          />
          <div className="mt-5 h-56 text-silver">
            <AreaChart series={ACTUAL} compare={TARGET} labels={months} id="an-rev" />
          </div>
        </Panel>

        <Panel>
          <PanelHead title={a("channels.title")} meta={a("channels.meta")} />
          <div className="mt-6 text-silver">
            <Donut segments={segments} centerValue={a("channels.center")} centerLabel={a("channels.centerLabel")} />
          </div>
        </Panel>
      </div>

      <Panel flush>
        <PanelHead className="p-5" title={a("kpis.title")} meta={a("kpis.meta")} />
        <Table
          head={[
            { label: columns[0] },
            { label: columns[1], hideBelow: "md" },
            { label: columns[2], align: "end" },
            { label: columns[3], align: "end", hideBelow: "sm" },
            { label: columns[4] },
          ]}
        >
          {kpis.map((k) => (
            <Tr key={k.name}>
              <Td>{k.name}</Td>
              <Td hideBelow="md" className="w-32">
                <Sparkline data={k.trend} className="h-6" />
              </Td>
              <Td align="end" numeric>
                {k.current}
              </Td>
              <Td align="end" numeric muted hideBelow="sm">
                {k.target}
              </Td>
              <Td>
                <Status tone={kpiTone[k.status] ?? "neutral"}>{a(`kpis.status.${k.status}`)}</Status>
              </Td>
            </Tr>
          ))}
        </Table>
      </Panel>

      <p className="t-small text-steel">{t("sampleNote")}</p>
    </div>
  );
}
