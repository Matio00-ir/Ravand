import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/**
 * The hero's living dashboard. Same panel as components/product/Dashboard
 * (compact), but in motion: it assembles itself, then a new invoice lands,
 * revenue ticks up, and a pending order settles — the "everything is
 * connected and live" story, told without a word of copy.
 *
 * Authored in composition pixels (960×720); the Player scales it to fit.
 * Every motion is driven by useCurrentFrame — no CSS transitions.
 */

export const HERO_MOTION = {
  width: 960,
  height: 720,
  fps: 30,
  durationInFrames: 450,
} as const;

type Status = "paid" | "pending" | "processing" | "overdue";

export type HeroMotionRow = {
  ref: string;
  account: string;
  amount: string;
  status: Status;
};

export type HeroMotionProps = {
  locale: "fa" | "en";
  period: string;
  title: string;
  kpis: { label: string; unit: string }[];
  chartTitle: string;
  chartSeries: string;
  months: string[];
  tableTitle: string;
  columns: [string, string, string];
  status: Record<Status, string>;
  rows: HeroMotionRow[];
  newRow: HeroMotionRow;
  toast: string;
};

const C = {
  panel: "#12161c",
  line: "rgba(255,255,255,0.08)",
  steel: "#69727d",
  silver: "#b7bec7",
  offwhite: "#f7f8fa",
  muted: "#98a0aa",
  accent: "#71859e",
  series: "#9FB0C4",
  status: {
    paid: "#2e7d32",
    pending: "#f59e08",
    processing: "#3b82f6",
    overdue: "#ef4444",
  } as Record<Status, string>,
};

const SERIES = [42, 48, 45, 56, 52, 61, 58, 69, 66, 78, 74, 86];
const COMPARE = [38, 41, 43, 44, 48, 49, 53, 55, 58, 60, 63, 66];

// timeline (frames @30fps)
const T = {
  kpis: 12,
  chart: 24,
  rows: 70,
  invoice: 180, // new invoice lands
  settle: 290, // pending order is paid
  fadeOut: 420,
};

const ROW_H = 60;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.22, 0.61, 0.36, 1);

export const HeroMotion: React.FC<HeroMotionProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const rtl = p.locale === "fa";
  const nf = new Intl.NumberFormat(rtl ? "fa-IR" : "en-US");
  const nf1 = new Intl.NumberFormat(rtl ? "fa-IR" : "en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 24 });
  const exit = interpolate(frame, [T.fadeOut, durationInFrames], [1, 0], clamp);

  // KPIs: count up, then react to the new invoice
  const count = (i: number) =>
    interpolate(frame, [T.kpis + i * 6, T.kpis + i * 6 + 45], [0, 1], { ...clamp, easing: ease });
  const bump = interpolate(frame, [T.invoice + 6, T.invoice + 36], [0, 1], { ...clamp, easing: ease });
  const kpiValues = [
    nf.format(Math.round(1248 * count(0) + 84 * bump)),
    nf.format(Math.round(186 * count(1) + bump)),
    nf1.format(4.2 * count(2)),
  ];
  const kpiFlash = interpolate(frame, [T.invoice + 6, T.invoice + 14, T.invoice + 50], [0, 1, 0], clamp);

  // chart: line draws, area fades, last point lifts with the invoice
  const draw = interpolate(frame, [T.chart, T.chart + 72], [0, 1], { ...clamp, easing: ease });
  const area = interpolate(frame, [T.chart + 36, T.chart + 90], [0, 1], clamp);
  const series = SERIES.map((v, i) => (i === SERIES.length - 1 ? v + 6 * bump : v));
  const chart = buildChart(series, COMPARE);

  // records: initial rows slide in, then the new invoice pushes them down
  const push = interpolate(frame, [T.invoice, T.invoice + 18], [0, 1], { ...clamp, easing: ease });
  const settle = interpolate(frame, [T.settle, T.settle + 10], [0, 1], clamp);
  const rows: (HeroMotionRow & { key: string; isNew?: boolean })[] = [
    { ...p.newRow, key: "new", isNew: true },
    ...p.rows.map((r, i) => ({ ...r, key: r.ref + i })),
  ];

  const toastIn = spring({ frame: frame - (T.invoice - 4), fps, config: { damping: 18, stiffness: 160 } });
  const toastOut = interpolate(frame, [T.invoice + 80, T.invoice + 96], [1, 0], clamp);

  return (
    <AbsoluteFill
      dir={rtl ? "rtl" : "ltr"}
      style={{
        fontFamily: rtl
          ? "var(--font-vazirmatn, Vazirmatn), system-ui, sans-serif"
          : "var(--font-manrope, Manrope), system-ui, sans-serif",
        color: C.offwhite,
        opacity: exit,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 16,
          overflow: "hidden",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 24}px)`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* window bar */}
        <div style={{ ...bar, height: 56, gap: 14 }}>
          <Mark />
          <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 17, color: C.silver }}>RAVAND</span>
          <span style={{ marginInlineStart: "auto", fontSize: 17, color: C.steel }}>{p.period}</span>
          <LiveDot frame={frame} />
        </div>

        {/* title */}
        <div style={{ ...bar, height: 64 }}>
          <span style={{ fontSize: 24, fontWeight: 700 }}>{p.title}</span>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: `1px solid ${C.line}`, height: 120 }}>
          {p.kpis.slice(0, 3).map((k, i) => (
            <div
              key={k.label}
              style={{
                padding: "22px 28px",
                borderInlineStart: i > 0 ? `1px solid ${C.line}` : undefined,
                background: i < 2 ? `rgba(113,133,158,${0.14 * kpiFlash})` : undefined,
              }}
            >
              <div style={{ fontSize: 16, color: C.steel }}>{k.label}</div>
              <div style={{ marginTop: 14, fontSize: 38, fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {kpiValues[i]}
                <span style={{ marginInlineStart: 10, fontSize: 16, fontWeight: 400, color: C.steel }}>{k.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* chart */}
        <div style={{ padding: "18px 28px 12px", borderBottom: `1px solid ${C.line}`, height: 250 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, color: C.steel }}>
            <span>{p.chartTitle}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 18, height: 2, background: C.series }} />
              {p.chartSeries}
            </span>
          </div>
          <svg
            viewBox="0 0 400 100"
            preserveAspectRatio="none"
            style={{ width: "100%", height: 160, marginTop: 12, overflow: "visible" }}
          >
            <defs>
              {/* time runs left to right in both locales, so growth always reads as rising */}
              <clipPath id="hm-reveal">
                <rect x="-2" y="-10" width={404 * draw} height="120" />
              </clipPath>
              <linearGradient id="hm-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={C.series} stopOpacity="0.28" />
                <stop offset="1" stopColor={C.series} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[25, 50, 75].map((y) => (
              <line key={y} x1="0" x2="400" y1={y} y2={y} stroke={C.line} vectorEffect="non-scaling-stroke" />
            ))}
            <path d={chart.compare} fill="none" stroke={C.steel} strokeDasharray="4 4" strokeWidth={1.5} vectorEffect="non-scaling-stroke" opacity={area * 0.8} />
            <path d={chart.area} fill="url(#hm-area)" opacity={area} clipPath="url(#hm-reveal)" />
            <path
              d={chart.line}
              fill="none"
              stroke={C.series}
              strokeWidth={3}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              clipPath="url(#hm-reveal)"
            />
          </svg>
          <div dir="ltr" style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 14, color: C.steel }}>
            {p.months.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>

        {/* records */}
        <div style={{ ...bar, height: 50, fontSize: 16, color: C.steel, justifyContent: "space-between" }}>
          <span>{p.tableTitle}</span>
        </div>
        <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
          {rows.map((r, idx) => {
            // slot 0 is reserved for the incoming invoice
            const slot = r.isNew ? 0 : idx - 1 + push;
            const inAt = T.rows + (idx - 1) * 8;
            const appear = r.isNew
              ? spring({ frame: frame - T.invoice, fps, config: { damping: 200 }, durationInFrames: 20 })
              : interpolate(frame, [inAt, inAt + 14], [0, 1], { ...clamp, easing: ease });
            const highlight = r.isNew ? interpolate(frame, [T.invoice + 10, T.invoice + 90], [0.16, 0], clamp) : 0;
            const settles = r.status === "pending" && idx === 2;
            const status: Status = settles && settle > 0.5 ? "paid" : r.status;
            const dot = settles ? interpolateColors(settle, [0, 1], [C.status.pending, C.status.paid]) : C.status[r.status];
            return (
              <div
                key={r.key}
                style={{
                  position: "absolute",
                  insetInline: 0,
                  top: slot * ROW_H,
                  height: ROW_H,
                  display: "grid",
                  gridTemplateColumns: "1.6fr 1fr 1fr",
                  alignItems: "center",
                  padding: "0 28px",
                  borderBottom: `1px solid ${C.line}`,
                  opacity: appear,
                  transform: `translateX(${(1 - appear) * (rtl ? -20 : 20)}px)`,
                  background: `rgba(113,133,158,${highlight})`,
                }}
              >
                <div>
                  <div style={{ fontSize: 18, color: C.offwhite }}>{r.account}</div>
                  <div style={{ fontSize: 13, color: C.steel, fontFamily: "ui-monospace, monospace", marginTop: 2 }}>{r.ref}</div>
                </div>
                <div style={{ fontSize: 18, color: C.silver, fontVariantNumeric: "tabular-nums" }}>{r.amount}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, color: C.silver }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 99,
                      background: dot,
                      transform: settles ? `scale(${1 + 0.6 * Math.sin(Math.PI * settle)})` : undefined,
                    }}
                  />
                  {p.status[status]}
                </div>
              </div>
            );
          })}
        </div>

        {/* toast */}
        <div
          style={{
            position: "absolute",
            top: 76,
            insetInlineEnd: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 18px",
            borderRadius: 10,
            background: "#1c222b",
            border: `1px solid rgba(255,255,255,0.14)`,
            boxShadow: "0 20px 40px -20px rgba(0,0,0,0.9)",
            fontSize: 17,
            color: C.offwhite,
            opacity: Math.min(toastIn, toastOut),
            transform: `translateY(${(1 - toastIn) * -16}px)`,
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: 99, background: C.status.paid }} />
          {p.toast}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const bar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "0 28px",
  borderBottom: `1px solid ${C.line}`,
  flexShrink: 0,
};

const LiveDot: React.FC<{ frame: number }> = ({ frame }) => {
  const pulse = (frame % 45) / 45;
  return (
    <span style={{ position: "relative", width: 10, height: 10, marginInlineStart: 6 }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: 99, background: C.status.paid }} />
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 99,
          background: C.status.paid,
          opacity: 0.6 * (1 - pulse),
          transform: `scale(${1 + pulse * 1.8})`,
        }}
      />
    </span>
  );
};

const Mark: React.FC = () => (
  <svg width="22" height="18" viewBox="0 0 22 18" aria-hidden="true">
    <path d="M1 17 L8 3 L13 11 L16 7 L21 17" fill="none" stroke={C.silver} strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

function buildChart(series: number[], compare: number[]) {
  const max = 100;
  const pts = (s: number[]) =>
    s.map((v, i) => [(i / (s.length - 1)) * 400, 100 - (v / max) * 100] as const);
  const smooth = (p: readonly (readonly [number, number])[]) =>
    p.reduce((d, [x, y], i) => {
      if (i === 0) return `M${x},${y}`;
      const [px, py] = p[i - 1];
      const cx = (px + x) / 2;
      return `${d} C${cx},${py} ${cx},${y} ${x},${y}`;
    }, "");
  const line = smooth(pts(series));
  return { line, area: `${line} L400,100 L0,100 Z`, compare: smooth(pts(compare)) };
}
