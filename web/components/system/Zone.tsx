import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A zone is one stretch of the page carrying one idea. Tone changes are
 * narrative: deep for brand and product moments, light where the system
 * is explained. The optional background grid is a single even square
 * lattice — the only background line treatment in the system.
 */
export function Zone({
  children,
  tone = "light",
  grid = false,
  className,
  id,
}: {
  children: ReactNode;
  tone?: "light" | "raised" | "deep";
  grid?: boolean;
  className?: string;
  id?: string;
}) {
  const tones = {
    light: "bg-page text-ink",
    raised: "bg-raised text-ink",
    deep: "bg-deep text-ink-inverse",
  } as const;

  return (
    <section id={id} className={cn("relative isolate", tones[tone], className)}>
      {grid ? (
        <div
          aria-hidden="true"
          className={cn(
            "grid-bg grid-bg--fade",
            tone === "deep" ? "grid-bg--dark" : "grid-bg--light"
          )}
        />
      ) : null}
      <div className="relative z-10">{children}</div>
    </section>
  );
}

/**
 * One statement per zone: a small label, a large heading, and at most a
 * single supporting line. Anything more belongs in the content below it.
 */
export function SectionHead({
  label,
  title,
  lead,
  tone = "light",
  align = "start",
  className,
  action,
}: {
  label?: string;
  title: ReactNode;
  lead?: string;
  tone?: "light" | "deep";
  align?: "start" | "center";
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
        {label ? (
          <p
            className={cn(
              "t-label mb-5",
              tone === "deep" ? "text-steel" : "text-ink-muted"
            )}
          >
            {label}
          </p>
        ) : null}
        <h2
          className={cn("t-h2", tone === "deep" ? "text-offwhite" : "text-ink")}
        >
          {title}
        </h2>
        {lead ? (
          <p
            className={cn(
              "t-lead mt-5 max-w-xl",
              tone === "deep" ? "text-ink-inverse-muted" : "text-ink-muted"
            )}
          >
            {lead}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
