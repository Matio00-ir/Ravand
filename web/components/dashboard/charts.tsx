import { cn } from "@/lib/utils";

/**
 * Dashboard data marks. Same rules as the marketing charts: graphite and
 * silver, one accented series, hairline gridlines, no chart-junk, and
 * semantic colour reserved for status elsewhere.
 */

const SERIES_STROKE = "#9FB0C4";
const RAMP = ["#C3CDDA", "#9FAEC1", "#7F8FA6", "#63707F", "#4A545F", "#363E47"];

/* ---------------- columns ---------------- */

export function ColumnChart({
  data,
  labels,
  className,
  highlightLast = true,
}: {
  data: number[];
  labels?: string[];
  className?: string;
  highlightLast?: boolean;
}) {
  const max = Math.max(...data) || 1;

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex flex-1 items-end gap-1.5">
        {data.map((v, i) => {
          const isLast = i === data.length - 1;
          return (
            <div key={i} className="flex h-full flex-1 flex-col justify-end">
              <div
                className="w-full rounded-t-[2px]"
                style={{
                  height: `${(v / max) * 100}%`,
                  background: highlightLast && isLast ? "#B7C3D2" : "#5D6979",
                }}
              />
            </div>
          );
        })}
      </div>
      {labels ? (
        <div className="mt-3 flex gap-1.5">
          {labels.map((l, i) => (
            <span key={i} className="t-num flex-1 text-center text-[10.5px] text-steel">
              {l}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- donut ---------------- */

export function Donut({
  segments,
  centerValue,
  centerLabel,
  className,
}: {
  segments: { label: string; value: number }[];
  centerValue: string;
  centerLabel: string;
  className?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 54;
  const c = 2 * Math.PI * r;
  // Cumulative arc offsets, computed up front rather than accumulated
  // during render.
  const arcs = segments.reduce<{ len: number; offset: number }[]>((acc, seg) => {
    const prev = acc[acc.length - 1];
    const len = (seg.value / total) * c;
    acc.push({ len, offset: prev ? prev.offset + prev.len : 0 });
    return acc;
  }, []);

  return (
    <div className={cn("flex items-center gap-6", className)}>
      <div className="relative shrink-0">
        <svg viewBox="0 0 140 140" className="h-[124px] w-[124px] -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.09"
            strokeWidth="14"
          />
          {segments.map((seg, i) => (
            <circle
              key={seg.label}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={RAMP[i % RAMP.length]}
              strokeWidth="14"
              strokeDasharray={`${Math.max(arcs[i].len - 2, 0)} ${c}`}
              strokeDashoffset={-arcs[i].offset}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="t-num text-[1.3rem] font-bold leading-none text-offwhite">
            {centerValue}
          </span>
          <span className="t-label mt-1.5 text-steel">{centerLabel}</span>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2.5">
        {segments.map((seg, i) => (
          <li key={seg.label} className="flex items-center gap-2.5">
            <span
              className="h-2 w-2 shrink-0 rounded-[1px]"
              style={{ background: RAMP[i % RAMP.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-silver">
              {seg.label}
            </span>
            <span className="t-num shrink-0 text-[12.5px] text-steel">{seg.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- funnel ---------------- */

export function Funnel({
  stages,
  className,
}: {
  stages: { label: string; value: number; caption: string }[];
  className?: string;
}) {
  const max = Math.max(...stages.map((s) => s.value)) || 1;

  return (
    <ol className={cn("space-y-3", className)}>
      {stages.map((stage, i) => (
        <li key={stage.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-[13px] text-silver">{stage.label}</span>
            <span className="t-num shrink-0 text-[12.5px] text-steel">{stage.caption}</span>
          </div>
          <div className="mt-2 h-7 w-full bg-white/[0.04]">
            <div
              className="flex h-full items-center px-2.5"
              style={{
                width: `${(stage.value / max) * 100}%`,
                background: RAMP[Math.min(i, RAMP.length - 1)],
              }}
            >
              <span
                className="t-num text-[11.5px] font-semibold"
                style={{ color: i < 3 ? "#0B0D10" : "#E3E8EE" }}
              >
                {stage.value}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ---------------- sparkline ---------------- */

export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const step = 100 / (data.length - 1);
  const d = data
    .map((v, i) => `${i === 0 ? "M" : "L"}${i * step} ${28 - ((v - min) / span) * 24}`)
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 30"
      className={cn("h-8 w-full", className)}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={d}
        fill="none"
        stroke={SERIES_STROKE}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
