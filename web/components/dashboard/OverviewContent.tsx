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
  ToolButton,
} from "@/components/dashboard/ui";
import { Donut } from "@/components/dashboard/charts";
import { AreaChart } from "@/components/product/Chart";

const SERIES = [42, 48, 45, 56, 52, 61, 58, 69, 66, 78, 74, 86];
const COMPARE = [38, 41, 43, 44, 48, 49, 53, 55, 58, 60, 63, 66];

type Stat = { label: string; value: string; unit: string; delta: string; trend: "up" | "down" | "flat" };
type DocRow = { ref: string; account: string; type: string; amount: string; status: string };
type Approval = { title: string; meta: string; tone: StatusTone; state: string };

const docTone: Record<string, StatusTone> = {
  paid: "success",
  pending: "warning",
  processing: "info",
  overdue: "error",
};

/**
 * The "Overview" screen body — shared by the internal /dashboard preview
 * and every per-customer /demo/[token] environment. Both render the same
 * sample dataset (see dash.overview.* in messages/*.json); what changes
 * between them is the Shell around it (nav, banner, workspace name).
 */
export async function OverviewContent({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "dash" });
  const o = await getTranslations({ locale, namespace: "dash.overview" });

  const stats = o.raw("stats") as Stat[];
  const rows = o.raw("documents.rows") as DocRow[];
  const columns = o.raw("documents.columns") as string[];
  const segments = o.raw("composition.segments") as { label: string; value: number }[];
  const months = o.raw("revenue.months") as string[];
  const approvals = o.raw("approvals.items") as Approval[];

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
            title={o("revenue.title")}
            meta={o("revenue.meta")}
            action={
              <div className="hidden items-center gap-3 sm:flex">
                <span className="flex items-center gap-1.5 text-[11.5px] text-steel">
                  <span className="h-px w-3.5 bg-[#9FB0C4]" />
                  {o("revenue.series")}
                </span>
                <span className="flex items-center gap-1.5 text-[11.5px] text-steel">
                  <span className="w-3.5 border-t border-dashed border-silver/40" />
                  {o("revenue.compare")}
                </span>
              </div>
            }
          />
          <div className="mt-5 h-56 text-silver">
            <AreaChart series={SERIES} compare={COMPARE} labels={months} id="ov-rev" />
          </div>
        </Panel>

        <Panel>
          <PanelHead title={o("composition.title")} meta={o("composition.meta")} />
          <div className="mt-6 text-silver">
            <Donut segments={segments} centerValue={o("composition.center")} centerLabel={o("composition.centerLabel")} />
          </div>
        </Panel>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel flush>
          <PanelHead
            className="p-5"
            title={o("documents.title")}
            meta={o("documents.meta")}
            action={<ToolButton>{o("documents.action")}</ToolButton>}
          />
          <Table
            head={[
              { label: columns[0] },
              { label: columns[1], hideBelow: "md" },
              { label: columns[2], align: "end" },
              { label: columns[3] },
            ]}
          >
            {rows.map((row) => (
              <Tr key={row.ref}>
                <Td>
                  <span className="block truncate">{row.account}</span>
                  <span className="t-code mt-0.5 block text-steel">{row.ref}</span>
                </Td>
                <Td muted hideBelow="md">
                  {row.type}
                </Td>
                <Td align="end" numeric>
                  {row.amount}
                </Td>
                <Td>
                  <Status tone={docTone[row.status] ?? "neutral"}>{o(`documents.status.${row.status}`)}</Status>
                </Td>
              </Tr>
            ))}
          </Table>
        </Panel>

        <Panel flush>
          <PanelHead className="p-5" title={o("approvals.title")} meta={o("approvals.meta")} />
          <ul className="border-t border-line-dark">
            {approvals.map((item) => (
              <li key={item.title} className="border-b border-line-dark px-5 py-4 last:border-b-0">
                <p className="truncate text-[13px] text-offwhite">{item.title}</p>
                <p className="t-small mt-1 text-steel">{item.meta}</p>
                <div className="mt-2.5">
                  <Status tone={item.tone}>{item.state}</Status>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <p className="t-small text-steel">{t("sampleNote")}</p>
    </div>
  );
}
