import React from "react";
import { C, E, EN, SIGNAL, alpha, lerp, mixHex, ramp, useT } from "./tokens";
import { DASH } from "./layout";
import { S } from "./timeline";
import { SYMBOL } from "../marks";

/**
 * The RAVAND product surface, re-drawn for the film from components/product/Dashboard.tsx:
 * graphite shell, hairline separation, one accented series, semantic colour only on status dots.
 * Copy and sample figures are the site's own (messages/en.json → product); the sidebar rows are
 * the module nodes themselves, which land here from the flow scene.
 */

const KPIS = [
  { label: "Net revenue", to: 1248, fmt: (v: number) => Math.round(v).toLocaleString("en-US"), unit: "M Toman" },
  { label: "Open orders", to: 186, fmt: (v: number) => String(Math.round(v)), unit: "orders" },
  { label: "Stock turnover", to: 4.2, fmt: (v: number) => v.toFixed(1), unit: "× per month" },
  { label: "On-time delivery", to: 96, fmt: (v: number) => String(Math.round(v)), unit: "percent" },
];

const SERIES = [42, 48, 45, 56, 52, 61, 58, 69, 66, 78, 74, 86];
const COMPARE = [38, 41, 43, 44, 48, 49, 53, 55, 58, 60, 63, 66];
const DIST = [["Sales", 32], ["Operations", 24], ["Marketing", 18], ["Finance", 14], ["Other", 12]] as const;
const ROWS = [
  { ref: "INV-2481", account: "Arya Trading Co.", type: "Sales invoice", amount: "84,200,000", status: "paid" },
  { ref: "PO-1043", account: "Negin Steel", type: "Purchase order", amount: "31,500,000", status: "pending" },
  { ref: "INV-2480", account: "Pars Plast Industries", type: "Sales invoice", amount: "126,900,000", status: "paid" },
  { ref: "GRN-0918", account: "Sepehr Logistics", type: "Goods receipt", amount: "58,400,000", status: "processing" },
] as const;
const STATUS: Record<string, { color: string; label: string }> = {
  paid: { color: "#2E7D32", label: "Settled" },
  pending: { color: "#F59E0B", label: "Pending" },
  processing: { color: "#3B82F6", label: "Processing" },
};

const CW = 560, CH = 168, PT = 12, PB = 24;
const smooth = (vals: number[]) => {
  const max = Math.max(...vals) * 1.12, min = Math.min(...vals) * 0.82, span = max - min;
  const step = CW / (vals.length - 1);
  const pts = vals.map((v, i) => ({ x: i * step, y: PT + (CH - PT - PB) * (1 - (v - min) / span) }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const cx = (pts[i].x + pts[i + 1].x) / 2;
    d += ` C ${cx} ${pts[i].y} ${cx} ${pts[i + 1].y} ${pts[i + 1].x} ${pts[i + 1].y}`;
  }
  return { d, last: pts[pts.length - 1] };
};
const main = smooth(SERIES), cmp = smooth(COMPARE);
const label = (extra?: React.CSSProperties): React.CSSProperties => ({ fontFamily: EN, fontWeight: 700, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: C.steel, ...extra });

export const Dashboard: React.FC = () => {
  const t = useT();
  const reveal = ramp(t, S.product + 0.2, S.product + 1.7, E.out);
  const exit = ramp(t, S.convergence - 0.5, S.convergence + 0.5, E.inOut);
  if (reveal <= 0 || exit >= 1) return null;

  const sweep = ramp(t, S.product + 0.4, S.product + 1.7, E.inOut);
  const chartDraw = ramp(t, 39.4, 41.3, E.inOut);
  const flip = ramp(t, 42.6, 42.95, E.flow);
  const pulseT = (t - 41.5) % 1.5;

  return (
    <div style={{ position: "absolute", left: DASH.x, top: DASH.y, width: DASH.w, height: DASH.h, opacity: 1 - exit, transform: `scale(${1 - exit * 0.03})` }}>
      <div style={{ position: "absolute", inset: 0, background: C.raised, border: `1px solid ${C.lineStrong}`, borderRadius: 10, boxShadow: "0 50px 120px rgba(0,0,0,.6)", overflow: "hidden", clipPath: `inset(0 0 ${(1 - reveal) * 100}% 0)` }}>
        {/* window bar */}
        <div style={{ height: 44, borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 12, padding: "0 20px" }}>
          <svg viewBox={`0 0 ${SYMBOL.w} ${SYMBOL.h}`} height={16} style={{ display: "block" }}>
            <path d={SYMBOL.leg} fill="#8A929C" fillRule="evenodd" />
            <path d={SYMBOL.ribbon} fill={C.offwhite} fillRule="evenodd" />
          </svg>
          <span style={{ fontFamily: EN, fontWeight: 700, fontSize: 12, letterSpacing: "0.14em", color: C.silver }}>RAVAND</span>
          <span style={{ marginLeft: "auto", fontFamily: EN, fontWeight: 700, fontSize: 12, letterSpacing: "0.12em", color: C.steel }}>Sep 2026</span>
        </div>
        {/* light sweep along the top edge as the surface opens */}
        <div style={{ position: "absolute", top: 0, left: DASH.w * sweep - 160, width: 160, height: 1, opacity: 1 - ramp(t, S.product + 1.5, S.product + 1.8), background: `linear-gradient(90deg, transparent, ${SIGNAL})` }} />

        {/* sidebar chrome — rows are the module nodes */}
        <div style={{ position: "absolute", left: 0, top: 44, bottom: 0, width: DASH.sidebar, borderRight: `1px solid ${C.line}` }}>
          <div style={{ ...label({ fontSize: 11, padding: "20px 16px 0" }), opacity: ramp(t, S.product + 1.2, S.product + 2.0) }}>Demo workspace</div>
        </div>

        {/* main */}
        <div style={{ position: "absolute", left: DASH.sidebar, top: 44, right: 0, bottom: 0 }}>
          <div style={{ height: 52, borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", opacity: ramp(t, S.product + 1.3, S.product + 2.0) }}>
            <span style={{ fontFamily: EN, fontWeight: 700, fontSize: 19, letterSpacing: "-0.012em", color: C.offwhite }}>Business overview</span>
            <span style={{ width: 28, height: 28, border: `1px solid ${C.line}`, background: alpha("#ffffff", 0.05), borderRadius: 4 }} />
          </div>

          {/* KPI register */}
          <div style={{ display: "flex", height: 96, borderBottom: `1px solid ${C.line}` }}>
            {KPIS.map((k, i) => {
              const a = ramp(t, S.product + 1.8 + i * 0.12, S.product + 2.5 + i * 0.12, E.out);
              const c = ramp(t, S.product + 1.8 + i * 0.12, S.product + 3.4 + i * 0.12, E.out);
              return (
                <div key={k.label} style={{ flex: 1, padding: "20px 24px", borderLeft: i ? `1px solid ${C.line}` : "none", opacity: a, transform: `translateY(${(1 - a) * 8}px)` }}>
                  <div style={label({ fontSize: 11.5 })}>{k.label}</div>
                  <div style={{ marginTop: 10, fontFamily: EN, fontWeight: 700, fontSize: 34, lineHeight: 1, letterSpacing: "-0.02em", color: C.offwhite, fontVariantNumeric: "tabular-nums" }}>
                    {k.fmt(k.to * c)}
                    <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 400, letterSpacing: 0, color: C.steel }}>{k.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* chart + distribution */}
          <div style={{ display: "flex", height: 252, borderBottom: `1px solid ${C.line}` }}>
            <div style={{ width: 610, padding: "20px 24px 0", borderRight: `1px solid ${C.line}`, opacity: ramp(t, 39.2, 39.9) }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={label({ fontSize: 11.5 })}>Revenue trend · 12 months</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: EN, fontSize: 12, color: C.steel }}>
                  <span style={{ width: 14, height: 1, background: SIGNAL }} />Current period
                </span>
              </div>
              <svg width={CW} height={CH} style={{ display: "block", marginTop: 14, color: C.silver }}>
                <defs>
                  <linearGradient id="film-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#71859E" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#71859E" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3].map((i) => <line key={i} x1={0} x2={CW} y1={PT + ((CH - PT - PB) / 3) * i} y2={PT + ((CH - PT - PB) / 3) * i} stroke="#fff" strokeOpacity={0.09} />)}
                <path d={cmp.d} fill="none" stroke="#fff" strokeOpacity={0.22 * ramp(t, 39.8, 40.8)} strokeDasharray="3 4" />
                <path d={`${main.d} L ${CW} ${CH - PB} L 0 ${CH - PB} Z`} fill="url(#film-area)" opacity={ramp(t, 40.4, 41.6)} />
                <path d={main.d} fill="none" stroke={SIGNAL} strokeWidth={1.8} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - chartDraw} />
                {chartDraw >= 1 ? (
                  <>
                    <circle cx={main.last.x} cy={main.last.y} r={3.5} fill="#C6CFDA" />
                    {t > 41.5 ? <circle cx={main.last.x} cy={main.last.y} r={3.5 + pulseT * 10} fill="none" stroke={SIGNAL} strokeOpacity={0.6 * (1 - pulseT / 1.5)} /> : null}
                  </>
                ) : null}
                {["Jan", "Apr", "Jul", "Oct"].map((m, i) => (
                  <text key={m} x={(CW / 3) * i} y={CH - 6} fill="#fff" fillOpacity={0.42} fontSize={11.5} fontFamily={EN} textAnchor={i === 0 ? "start" : i === 3 ? "end" : "middle"}>{m}</text>
                ))}
              </svg>
            </div>
            <div style={{ flex: 1, padding: "20px 24px 0", opacity: ramp(t, 39.6, 40.2) }}>
              <div style={label({ fontSize: 11.5 })}>Revenue composition</div>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                {DIST.map(([name, v], i) => {
                  const g = ramp(t, 39.9 + i * 0.12, 40.9 + i * 0.12, E.out);
                  return (
                    <div key={name}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: EN, fontSize: 13, lineHeight: 1.2 }}>
                        <span style={{ color: C.silver }}>{name}</span>
                        <span style={{ color: C.steel, fontVariantNumeric: "tabular-nums" }}>{Math.round(v * g)}%</span>
                      </div>
                      <div style={{ marginTop: 6, height: 4, background: alpha("#ffffff", 0.06) }}>
                        <div style={{ height: "100%", width: `${v * g}%`, background: "#7F8FA6", opacity: 1 - i * 0.13 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* records */}
          <div style={{ opacity: ramp(t, 40.3, 40.9) }}>
            <div style={{ ...label({ fontSize: 11.5 }), padding: "13px 24px 11px", display: "flex", justifyContent: "space-between" }}>
              <span>Recent documents</span>
              <span style={{ fontWeight: 600, letterSpacing: "0.04em", textTransform: "none", color: C.accent }}>View all</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "300px 210px 170px 1fr", borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, ...label({ fontSize: 11 }), padding: "8px 24px" }}>
              <span>Document</span><span>Type</span><span style={{ textAlign: "right", paddingRight: 36 }}>Amount</span><span>Status</span>
            </div>
            {ROWS.map((r, i) => {
              const a = ramp(t, 40.6 + i * 0.16, 41.3 + i * 0.16, E.out);
              const isFlip = r.ref === "GRN-0918";
              const st = isFlip && flip > 0.5 ? STATUS.paid : STATUS[r.status];
              const dot = isFlip ? mixHex("#3B82F6", "#2E7D32", flip) : st.color;
              const hl = isFlip ? Math.max(0, 1 - Math.abs(t - 42.8) / 0.9) : 0;
              return (
                <div key={r.ref} style={{ display: "grid", gridTemplateColumns: "300px 210px 170px 1fr", alignItems: "center", height: 39, padding: "0 24px", borderBottom: i < 3 ? `1px solid ${C.line}` : "none", opacity: a, transform: `translateY(${(1 - a) * 6}px)`, background: alpha("#ffffff", 0.045 * hl) }}>
                  <span style={{ fontFamily: EN, fontSize: 14, color: C.offwhite }}>{r.account}<span style={{ marginLeft: 12, fontWeight: 700, fontSize: 11, letterSpacing: "0.1em", color: C.steel }}>{r.ref}</span></span>
                  <span style={{ fontFamily: EN, fontSize: 14, color: C.silver }}>{r.type}</span>
                  <span style={{ fontFamily: EN, fontSize: 14, color: C.offwhite, textAlign: "right", paddingRight: 36, fontVariantNumeric: "tabular-nums" }}>{r.amount}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: EN, fontSize: 13, color: C.silver }}>
                    <span style={{ width: 7, height: 7, borderRadius: 4, background: dot }} />{st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 0, top: DASH.h + 18, fontFamily: EN, fontSize: 13, color: C.steel, letterSpacing: "0.01em", opacity: ramp(t, 41.4, 42.2) }}>
        Figures shown are sample data.
      </div>
    </div>
  );
};

export { lerp };
