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
import { ColumnChart, Donut } from "@/components/dashboard/charts";

type Stat = { label: string; value: string; unit: string; delta: string; trend: "up" | "down" | "flat" };
type Request = { name: string; dept: string; type: string; date: string; status: string };

const requestTone: Record<string, StatusTone> = {
  approved: "success",
  pending: "warning",
  rejected: "error",
};

/** The "People" (HR) screen body — used by /demo/[token]/hr. */
export async function HrContent({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "dash" });
  const h = await getTranslations({ locale, namespace: "dash.hr" });

  const stats = h.raw("stats") as Stat[];
  const labels = h.raw("attendance.labels") as string[];
  const data = h.raw("attendance.data") as number[];
  const segments = h.raw("departments.segments") as { label: string; value: number }[];
  const requests = h.raw("requests.rows") as Request[];
  const columns = h.raw("requests.columns") as string[];

  return (
    <div className="min-w-0 space-y-6">
      <StatRow>
        {stats.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} unit={s.unit} delta={s.delta} trend={s.trend} />
        ))}
      </StatRow>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHead title={h("attendance.title")} meta={h("attendance.meta")} />
          <div className="mt-6 h-56">
            <ColumnChart data={data} labels={labels} highlightLast={false} />
          </div>
        </Panel>

        <Panel>
          <PanelHead title={h("departments.title")} meta={h("departments.meta")} />
          <div className="mt-6 text-silver">
            <Donut
              segments={segments}
              centerValue={h("departments.center")}
              centerLabel={h("departments.centerLabel")}
            />
          </div>
        </Panel>
      </div>

      <Panel flush>
        <PanelHead
          className="p-5"
          title={h("requests.title")}
          meta={h("requests.meta")}
          action={<ToolButton>{h("requests.action")}</ToolButton>}
        />
        <Table
          head={[
            { label: columns[0] },
            { label: columns[1], hideBelow: "lg" },
            { label: columns[2] },
            { label: columns[3], hideBelow: "md" },
            { label: columns[4] },
          ]}
        >
          {requests.map((r) => (
            <Tr key={r.name + r.type}>
              <Td>{r.name}</Td>
              <Td muted hideBelow="lg">
                {r.dept}
              </Td>
              <Td muted>{r.type}</Td>
              <Td muted numeric hideBelow="md">
                {r.date}
              </Td>
              <Td>
                <Status tone={requestTone[r.status] ?? "neutral"}>{h(`requests.status.${r.status}`)}</Status>
              </Td>
            </Tr>
          ))}
        </Table>
      </Panel>

      <p className="t-small text-steel">{t("sampleNote")}</p>
    </div>
  );
}
