import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * RAVAND product UI kit.
 *
 * The same system as the marketing site — graphite hierarchy, hairline
 * separation instead of nested cards, tabular figures, 4–10px radius,
 * semantic colour reserved for status — applied at application density.
 */

/* ---------------- surfaces ---------------- */

export function Panel({
  children,
  className,
  flush = false,
}: {
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-[var(--radius-md)] border border-line-dark bg-deep-raised",
        !flush && "p-5",
        className
      )}
    >
      {children}
    </section>
  );
}

export function PanelHead({
  title,
  meta,
  action,
  className,
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="t-h4 truncate text-offwhite">{title}</h2>
        {meta ? <p className="t-small mt-1 text-steel">{meta}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

/* ---------------- figures ---------------- */

export function StatTile({
  label,
  value,
  unit,
  delta,
  trend = "flat",
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  trend?: "up" | "down" | "flat";
  className?: string;
}) {
  const trendColor =
    trend === "up" ? "text-[#7E9A83]" : trend === "down" ? "text-[#B08585]" : "text-steel";

  return (
    <div className={cn("min-w-0 px-5 py-4", className)}>
      <p className="t-label truncate text-steel">{label}</p>
      <p className="t-num mt-2.5 text-[1.6rem] font-bold leading-none text-offwhite">
        {value}
        {unit ? (
          <span className="ms-2 align-middle text-[11px] font-normal text-steel">
            {unit}
          </span>
        ) : null}
      </p>
      {delta ? <p className={cn("t-num mt-2 text-[11.5px]", trendColor)}>{delta}</p> : null}
    </div>
  );
}

/** A row of figures divided by hairlines rather than boxed as cards. */
export function StatRow({
  children,
  className,
  cols = 4,
}: {
  children: ReactNode;
  className?: string;
  cols?: 2 | 3 | 4;
}) {
  const grid = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" };
  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-1 divide-y divide-line-dark rounded-[var(--radius-md)] border border-line-dark bg-deep-raised sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse",
        grid[cols],
        className
      )}
    >
      {children}
    </div>
  );
}

/* ---------------- status ---------------- */

export type StatusTone = "success" | "warning" | "error" | "info" | "neutral";

const dot: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  info: "bg-info",
  neutral: "bg-steel",
};

export function Status({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-[12.5px] text-silver">
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot[tone])} />
      {children}
    </span>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-xs)] border border-line-dark px-2 py-1 text-[11.5px] text-silver",
        className
      )}
    >
      {children}
    </span>
  );
}

/* ---------------- table ---------------- */

export function Table({
  head,
  children,
  className,
}: {
  head: { label: string; align?: "start" | "end"; hideBelow?: "sm" | "md" | "lg" }[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto no-scrollbar", className)}>
      <table className="w-full min-w-[460px] border-collapse">
        <thead>
          <tr className="border-b border-line-dark">
            {head.map((col) => (
              <th
                key={col.label}
                scope="col"
                className={cn(
                  "t-label whitespace-nowrap px-5 py-3 font-bold text-steel",
                  col.align === "end" ? "text-end" : "text-start",
                  col.hideBelow === "sm" && "hidden sm:table-cell",
                  col.hideBelow === "md" && "hidden md:table-cell",
                  col.hideBelow === "lg" && "hidden lg:table-cell"
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-line-dark transition-colors duration-[var(--t-base)] last:border-b-0 hover:bg-white/[0.025]">
      {children}
    </tr>
  );
}

export function Td({
  children,
  align = "start",
  hideBelow,
  muted = false,
  numeric = false,
  className,
}: {
  children: ReactNode;
  align?: "start" | "end";
  hideBelow?: "sm" | "md" | "lg";
  muted?: boolean;
  numeric?: boolean;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-5 py-3.5 text-[13px]",
        align === "end" ? "text-end" : "text-start",
        muted ? "text-silver" : "text-offwhite",
        numeric && "t-num",
        hideBelow === "sm" && "hidden sm:table-cell",
        hideBelow === "md" && "hidden md:table-cell",
        hideBelow === "lg" && "hidden lg:table-cell",
        className
      )}
    >
      {children}
    </td>
  );
}

/* ---------------- controls ---------------- */

export function ToolButton({
  children,
  active = false,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex cursor-default items-center gap-2 rounded-[var(--radius-xs)] border px-3 py-1.5 text-[12.5px] transition-colors duration-[var(--t-base)]",
        active
          ? "border-transparent bg-white/[0.09] text-offwhite"
          : "border-line-dark text-steel hover:text-silver",
        className
      )}
    >
      {children}
    </span>
  );
}

/** A labelled progress/share bar — the only non-chart data mark. */
export function ShareBar({
  label,
  value,
  caption,
  opacity = 1,
}: {
  label: string;
  value: number;
  caption?: string;
  opacity?: number;
}) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-[12.5px] text-silver">{label}</span>
        <span className="t-num shrink-0 text-[12.5px] text-steel">
          {caption ?? `${value}%`}
        </span>
      </div>
      <div className="mt-2 h-1 w-full bg-white/[0.06]">
        <div
          className="h-full bg-[#7F8FA6]"
          style={{ width: `${Math.min(100, value)}%`, opacity }}
        />
      </div>
    </li>
  );
}
