import { useTranslations } from "next-intl";
import { ModuleIcon, type ModuleKey } from "@/components/system/ModuleIcon";
import { LogoMark } from "@/components/ui/Logo";
import { AreaChart } from "@/components/product/Chart";
import { cn } from "@/lib/utils";

/**
 * The RAVAND product surface, in the brand's own system.
 *
 * It is always rendered COMPLETE — never cropped or bled off an edge.
 * Two sizes share one design: `compact` for the hero (a self-contained
 * panel that fits its column), and the full surface for the product zone.
 */

export const ALL_MODULES: ModuleKey[] = [
  "erp",
  "finance",
  "crm",
  "sales",
  "inventory",
  "workflow",
  "hr",
  "analytics",
];

const SERIES = [42, 48, 45, 56, 52, 61, 58, 69, 66, 78, 74, 86];
const COMPARE = [38, 41, 43, 44, 48, 49, 53, 55, 58, 60, 63, 66];

const statusColor: Record<string, string> = {
  paid: "bg-success",
  pending: "bg-warning",
  processing: "bg-info",
  overdue: "bg-error",
};

type Kpi = { label: string; value: string; unit: string; delta: string };
type Row = {
  ref: string;
  account: string;
  type: string;
  amount: string;
  status: keyof typeof statusColor;
};
type Dist = { label: string; value: number };

export function Dashboard({
  modules = ALL_MODULES,
  active = "erp",
  compact = false,
  className,
}: {
  modules?: ModuleKey[];
  active?: ModuleKey;
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations("product");
  const kpis = t.raw("kpis") as Kpi[];
  const rows = t.raw("table.rows") as Row[];
  const dist = t.raw("distribution.items") as Dist[];
  const months = t.raw("chart.months") as string[];

  const shownRows = compact ? rows.slice(0, 3) : rows;
  const shownKpis = compact ? kpis.slice(0, 3) : kpis;
  // the third KPI only appears once there is room for three columns
  const shownNav = compact ? modules.slice(0, 6) : modules;

  return (
    <div
      className={cn(
        "panel--dark overflow-hidden text-ink-inverse shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]",
        className
      )}
    >
      {/* window bar */}
      <div className="flex items-center gap-2.5 border-b border-line-dark px-4 py-3">
        <LogoMark tone="inverse" className="h-[15px]" />
        <span className="t-code text-silver">RAVAND</span>
        <span className="ms-auto t-code text-steel">{t("topbar.period")}</span>
      </div>

      <div className="flex">
        {/* sidebar */}
        <aside
          className={cn(
            "shrink-0 border-e border-line-dark py-3",
            compact ? "hidden" : "hidden w-[178px] md:block"
          )}
        >
          <p className="t-label px-4 pb-2 text-steel">{t("workspace")}</p>
          <nav className="flex flex-col gap-0.5 px-2">
            {shownNav.map((key) => {
              const on = key === active;
              return (
                <span
                  key={key}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-[var(--radius-xs)] px-2.5 py-2 text-[12.5px] transition-colors duration-[var(--t-base)]",
                    on ? "bg-white/[0.07] text-offwhite" : "text-ink-inverse-muted"
                  )}
                >
                  {on ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-1.5 w-0.5 rounded-full bg-accent"
                      style={{ insetInlineStart: 0 }}
                    />
                  ) : null}
                  <ModuleIcon
                    name={key}
                    className={cn("h-4 w-4 shrink-0", on ? "text-silver" : "text-steel")}
                  />
                  <span className="truncate">{t(`nav.${key}`)}</span>
                </span>
              );
            })}
          </nav>
        </aside>

        {/* main */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between border-b border-line-dark px-4 py-3.5">
            <p className="t-h4 truncate text-offwhite">{t("topbar.title")}</p>
            <span className="hidden h-6 w-6 rounded-[var(--radius-xs)] border border-line-dark bg-white/[0.05] sm:block" />
          </div>

          {/* KPI register */}
          <div
            className={cn(
              "grid border-b border-line-dark",
              compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 md:grid-cols-4"
            )}
          >
            {shownKpis.map((kpi, i) => (
              <div
                key={kpi.label}
                className={cn(
                  "px-4 py-3.5",
                  i > 0 && "border-s border-line-dark",
                  compact && i === 2 && "hidden sm:block"
                )}
              >
                <p className="t-label truncate text-steel">{kpi.label}</p>
                <p className="t-num mt-2 text-[1.25rem] font-bold leading-none text-offwhite">
                  {kpi.value}
                  <span className="ms-1.5 align-middle text-[11px] font-normal text-steel">
                    {kpi.unit}
                  </span>
                </p>
              </div>
            ))}
          </div>

          {/* chart + distribution */}
          <div className={cn("grid", compact ? "" : "lg:grid-cols-[1.6fr_1fr]")}>
            <div
              className={cn(
                "px-4 py-4",
                compact ? "" : "border-b border-line-dark lg:border-b-0 lg:border-e"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="t-label text-steel">{t("chart.title")}</p>
                <span className="hidden items-center gap-1.5 text-[11px] text-steel sm:flex">
                  <span className="h-px w-3 bg-[#9FB0C4]" />
                  {t("chart.series")}
                </span>
              </div>
              <div className={cn("mt-3 text-silver", compact ? "h-36" : "h-44")}>
                <AreaChart series={SERIES} compare={COMPARE} labels={months} />
              </div>
            </div>

            {!compact ? (
              <div className="border-b border-line-dark px-4 py-4 lg:border-b-0">
                <p className="t-label text-steel">{t("distribution.title")}</p>
                <ul className="mt-4 space-y-3">
                  {dist.map((item, i) => (
                    <li key={item.label}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[12.5px] text-silver">{item.label}</span>
                        <span className="t-num text-[12.5px] text-steel">
                          {item.value}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1 w-full bg-white/[0.06]">
                        <div
                          className="h-full bg-[#7F8FA6]"
                          style={{ width: `${item.value}%`, opacity: 1 - i * 0.13 }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* records */}
          <div className="border-t border-line-dark">
            <p className="t-label px-4 py-3 text-steel">{t("table.title")}</p>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-y border-line-dark">
                  {(t.raw("table.columns") as string[]).map((col, i) => (
                    <th
                      key={col}
                      scope="col"
                      className={cn(
                        "t-label px-4 py-2 text-start font-bold text-steel",
                        i === 2 && "text-end",
                        i === 1 && (compact ? "hidden" : "hidden md:table-cell")
                      )}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shownRows.map((row) => (
                  <tr key={row.ref} className="border-b border-line-dark last:border-b-0">
                    <td className="px-4 py-3">
                      <p className="truncate text-[12.5px] text-offwhite">{row.account}</p>
                      <p className="t-code mt-0.5 text-steel">{row.ref}</p>
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-[12.5px] text-silver",
                        compact ? "hidden" : "hidden md:table-cell"
                      )}
                    >
                      {row.type}
                    </td>
                    <td
                      className={cn(
                        "t-num px-4 py-3 text-end text-[12.5px] text-offwhite"
                      )}
                    >
                      {row.amount}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 whitespace-nowrap text-[12px] text-silver">
                        <span
                          className={cn("h-1.5 w-1.5 rounded-full", statusColor[row.status])}
                        />
                        {t(`table.status.${row.status}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
