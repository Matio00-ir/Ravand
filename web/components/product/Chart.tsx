import { cn } from "@/lib/utils";

/**
 * RAVAND data visualisation: graphite and silver, one accented series,
 * hairline gridlines, no chart-junk. Semantic colour is reserved for
 * status indicators elsewhere — never for series colour.
 */

const W = 620;
const H = 208;
const PAD_T = 16;
const PAD_B = 26;

function smoothPath(values: number[], width: number, height: number) {
  const max = Math.max(...values) * 1.12;
  const min = Math.min(...values) * 0.82;
  const span = max - min || 1;
  const step = width / (values.length - 1);

  const pts = values.map((v, i) => ({
    x: i * step,
    y: PAD_T + (height - PAD_T - PAD_B) * (1 - (v - min) / span),
  }));

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx} ${p0.y} ${cx} ${p1.y} ${p1.x} ${p1.y}`;
  }
  return { d, pts };
}

export function AreaChart({
  series,
  compare,
  labels,
  className,
  id = "ravand-chart",
}: {
  series: number[];
  compare?: number[];
  labels?: string[];
  className?: string;
  id?: string;
}) {
  const { d, pts } = smoothPath(series, W, H);
  const area = `${d} L ${W} ${H - PAD_B} L 0 ${H - PAD_B} Z`;
  const comparePath = compare ? smoothPath(compare, W, H).d : null;
  const last = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("h-full w-full", className)}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#71859E" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#71859E" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Gridlines — hairlines only, no labels cluttering the plot. */}
      {[0, 1, 2, 3].map((i) => {
        const y = PAD_T + ((H - PAD_T - PAD_B) / 3) * i;
        return (
          <line
            key={i}
            x1="0"
            x2={W}
            y1={y}
            y2={y}
            stroke="currentColor"
            strokeOpacity="0.09"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        );
      })}

      {comparePath ? (
        <path
          d={comparePath}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.22"
          strokeWidth="1"
          strokeDasharray="3 4"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      <path d={area} fill={`url(#${id}-fill)`} />
      <path
        d={d}
        fill="none"
        stroke="#9FB0C4"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last.x} cy={last.y} r="3" fill="#C6CFDA" vectorEffect="non-scaling-stroke" />

      {labels
        ? labels.map((label, i) => (
            <text
              key={label + i}
              x={(W / (labels.length - 1)) * i}
              y={H - 6}
              fill="currentColor"
              fillOpacity="0.42"
              fontSize="11"
              textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"}
            >
              {label}
            </text>
          ))
        : null}
    </svg>
  );
}

export function Ring({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const r = 38;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className={cn("h-24 w-24", className)} aria-hidden="true">
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="6"
      />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="#8EA0B6"
        strokeWidth="6"
        strokeLinecap="butt"
        strokeDasharray={`${(c * value) / 100} ${c}`}
        transform="rotate(-90 50 50)"
      />
    </svg>
  );
}
