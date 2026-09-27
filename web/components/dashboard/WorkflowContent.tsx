import { getTranslations } from "next-intl/server";
import {
  ActivityList,
  Panel,
  PanelHead,
  ShareBar,
  StatRow,
  StatTile,
  type StatusTone,
} from "@/components/dashboard/ui";
import { formatNumber } from "@/lib/format";

type Stat = { label: string; value: string; unit: string; delta: string; trend: "up" | "down" | "flat" };
type Card = { title: string; meta: string };
type Event = { title: string; meta: string; tone: StatusTone; state: string };

/**
 * The "Workflow" screen body — used by /demo/[token]/workflow.
 *
 * Unlike the other module screens, the board is built from the customer's
 * own stages (the workflow they laid out in the builder), so this is the
 * one screen that visibly reflects their process rather than a fixed
 * sample. Case counts and card placement are derived deterministically
 * from the stage index so the board is stable across reloads.
 */
export async function WorkflowContent({ locale, stages }: { locale: string; stages: string[] }) {
  const t = await getTranslations({ locale, namespace: "dash" });
  const w = await getTranslations({ locale, namespace: "dash.workflow" });

  const stats = w.raw("stats") as Stat[];
  const cards = w.raw("cards") as Card[];
  const events = w.raw("activity.items") as Event[];

  const columns = stages.map((name, i) => {
    const count = [14, 11, 9, 8, 6, 5, 4, 3][i % 8];
    // Cards cycle through the sample set, but each gets its own case number
    // so the same reference never shows up in two columns.
    const own = [0, 1].map((j) => ({
      ...cards[(i * 2 + j) % cards.length],
      ref: `WF-${1204 - (i * 2 + j) * 3}`,
    }));
    const onTime = Math.max(72, 98 - ((i * 7) % 23));
    return { name, count, cards: own, onTime, overdueIndex: i === 1 ? 1 : -1 };
  });

  return (
    <div className="min-w-0 space-y-6">
      <StatRow>
        {stats.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} unit={s.unit} delta={s.delta} trend={s.trend} />
        ))}
      </StatRow>

      <Panel>
        <PanelHead title={w("board.title")} meta={w("board.meta")} />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {columns.map((col, i) => (
            <section
              key={`${col.name}-${i}`}
              className="min-w-0 rounded-[var(--radius-sm)] border border-line-dark bg-white/[0.02] p-3"
            >
              <header className="flex items-center justify-between gap-2 px-1">
                <h3 className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-offwhite">
                  <span className="t-index shrink-0 text-steel">{formatNumber(i + 1, locale)}</span>
                  <span className="truncate">{col.name}</span>
                </h3>
                <span className="t-num shrink-0 text-[11.5px] text-steel">
                  {w("board.count", { count: formatNumber(col.count, locale) })}
                </span>
              </header>
              <ul className="mt-3 space-y-2">
                {col.cards.map((card, j) => (
                  <li
                    key={card.ref}
                    className="rounded-[var(--radius-xs)] border border-line-dark bg-deep px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="t-code text-[11px] text-steel">{card.ref}</span>
                      {j === col.overdueIndex ? (
                        <span className="text-[11px] text-[#B08585]">{w("board.overdue")}</span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-[12.5px] text-offwhite">{card.title}</p>
                    <p className="t-small mt-0.5 truncate text-steel">{card.meta}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Panel>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHead title={w("sla.title")} meta={w("sla.meta")} />
          <ul className="mt-6 space-y-4">
            {columns.map((col, i) => (
              <ShareBar
                key={`${col.name}-${i}`}
                label={col.name}
                value={col.onTime}
                caption={`${formatNumber(col.onTime, locale)}${locale === "fa" ? "٪" : "%"}`}
              />
            ))}
          </ul>
        </Panel>

        <Panel flush>
          <PanelHead className="p-5" title={w("activity.title")} meta={w("activity.meta")} />
          <ActivityList items={events} />
        </Panel>
      </div>

      <p className="t-small text-steel">{t("sampleNote")}</p>
    </div>
  );
}
