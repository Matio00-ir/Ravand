import type { HeroMotionProps, HeroMotionRow } from "./HeroMotion";
import type { PlatformMotionProps } from "./PlatformMotion";
import type { ModuleKey } from "../components/system/ModuleIcon";

type Messages = {
  product: {
    topbar: { title: string; period: string };
    kpis: { label: string; unit: string }[];
    chart: { title: string; series: string; months: string[] };
    table: {
      title: string;
      columns: string[];
      status: HeroMotionProps["status"];
      rows: HeroMotionRow[];
    };
  };
  heroMotion: { toast: string; newRow: HeroMotionRow };
};

/** Builds the hero motion's copy from a locale's message file. */
export function heroMotionProps(locale: "fa" | "en", messages: unknown): HeroMotionProps {
  const m = messages as Messages;
  const p = m.product;
  return {
    locale,
    period: p.topbar.period,
    title: p.topbar.title,
    kpis: p.kpis.map(({ label, unit }) => ({ label, unit })),
    chartTitle: p.chart.title,
    chartSeries: p.chart.series,
    months: p.chart.months,
    tableTitle: p.table.title,
    columns: [p.table.columns[0], p.table.columns[2], p.table.columns[3]],
    status: p.table.status,
    rows: p.table.rows.slice(0, 3).map(({ ref, account, amount, status }) => ({ ref, account, amount, status })),
    newRow: m.heroMotion.newRow,
    toast: m.heroMotion.toast,
  };
}

type PlatformMessages = {
  platform: { modules: { key: string; code: string; name: string }[] };
  platformMotion: {
    caption: string;
    waiting: string;
    steps: { key: ModuleKey; event: string; meta: string }[];
  };
};

/** Builds the platform motion's copy; module names come from the platform section itself. */
export function platformMotionProps(
  locale: "fa" | "en",
  layout: PlatformMotionProps["layout"],
  messages: unknown
): PlatformMotionProps {
  const m = messages as PlatformMessages;
  const modules = new Map(m.platform.modules.map((mod) => [mod.key, mod]));
  return {
    locale,
    layout,
    caption: m.platformMotion.caption,
    waiting: m.platformMotion.waiting,
    steps: m.platformMotion.steps.map((s) => ({
      ...s,
      code: modules.get(s.key)?.code ?? "",
      name: modules.get(s.key)?.name ?? "",
    })),
  };
}
