import { getTranslations } from "next-intl/server";
import {
  ActivityList,
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
import { Funnel } from "@/components/dashboard/charts";

type Stat = { label: string; value: string; unit: string; delta: string; trend: "up" | "down" | "flat" };
type Stage = { label: string; value: number; caption: string };
type Task = { title: string; meta: string; tone: StatusTone; state: string };
type Account = { name: string; owner: string; last: string; value: string; status: string };

const accountTone: Record<string, StatusTone> = {
  active: "success",
  risk: "error",
  new: "info",
};

/** The "Customers" (CRM) screen body — used by /demo/[token]/crm. */
export async function CrmContent({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "dash" });
  const c = await getTranslations({ locale, namespace: "dash.crm" });

  const stats = c.raw("stats") as Stat[];
  const stages = c.raw("pipeline.stages") as Stage[];
  const tasks = c.raw("tasks.items") as Task[];
  const accounts = c.raw("accounts.rows") as Account[];
  const columns = c.raw("accounts.columns") as string[];

  return (
    <div className="min-w-0 space-y-6">
      <StatRow>
        {stats.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} unit={s.unit} delta={s.delta} trend={s.trend} />
        ))}
      </StatRow>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHead title={c("pipeline.title")} meta={c("pipeline.meta")} />
          <div className="mt-6">
            <Funnel stages={stages} />
          </div>
        </Panel>

        <Panel flush>
          <PanelHead className="p-5" title={c("tasks.title")} meta={c("tasks.meta")} />
          <ActivityList items={tasks} />
        </Panel>
      </div>

      <Panel flush>
        <PanelHead
          className="p-5"
          title={c("accounts.title")}
          meta={c("accounts.meta")}
          action={<ToolButton>{c("accounts.action")}</ToolButton>}
        />
        <Table
          head={[
            { label: columns[0] },
            { label: columns[1], hideBelow: "md" },
            { label: columns[2], hideBelow: "lg" },
            { label: columns[3], align: "end" },
            { label: columns[4] },
          ]}
        >
          {accounts.map((a) => (
            <Tr key={a.name}>
              <Td>{a.name}</Td>
              <Td muted hideBelow="md">
                {a.owner}
              </Td>
              <Td muted hideBelow="lg">
                {a.last}
              </Td>
              <Td align="end" numeric>
                {a.value}
              </Td>
              <Td>
                <Status tone={accountTone[a.status] ?? "neutral"}>{c(`accounts.status.${a.status}`)}</Status>
              </Td>
            </Tr>
          ))}
        </Table>
      </Panel>

      <p className="t-small text-steel">{t("sampleNote")}</p>
    </div>
  );
}
