import React from "react";
import { C, E, EN, alpha, ramp, useT } from "./tokens";
import { SCENES } from "./timeline";

/** Rounded polygon path — the brand's 8px radius carried onto the skewed planes. */
export const roundedPoly = (p: [number, number][], r: number) => {
  const n = p.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const prev = p[(i + n - 1) % n], cur = p[i], next = p[(i + 1) % n];
    const v1 = [prev[0] - cur[0], prev[1] - cur[1]], v2 = [next[0] - cur[0], next[1] - cur[1]];
    const l1 = Math.hypot(v1[0], v1[1]), l2 = Math.hypot(v2[0], v2[1]);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const a = [cur[0] + (v1[0] / l1) * rr, cur[1] + (v1[1] / l1) * rr];
    const b = [cur[0] + (v2[0] / l2) * rr, cur[1] + (v2[1] / l2) * rr];
    d += `${i === 0 ? "M" : "L"}${a[0].toFixed(2)} ${a[1].toFixed(2)} Q ${cur[0].toFixed(2)} ${cur[1].toFixed(2)} ${b[0].toFixed(2)} ${b[1].toFixed(2)} `;
  }
  return d + "Z";
};

/** Parallelogram leaning right (skew>0) or left (skew<0); skew is a fraction of the width. */
export const planePts = (w: number, h: number, skew: number): [number, number][] => {
  const off = Math.abs(skew) * w;
  return skew >= 0
    ? [[off, 0], [w, 0], [w - off, h], [0, h]]
    : [[0, 0], [w - off, 0], [w, h], [off, h]];
};

export const Icon: React.FC<{ paths: string[]; fill?: string; size: number; color: string }> = ({ paths, fill, size, color }) => (
  <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="square" strokeLinejoin="miter" style={{ display: "block" }}>
    {paths.map((d, i) => <path key={i} d={d} />)}
    {fill ? <path d={fill} fill={color} stroke="none" /> : null}
  </svg>
);

/** `01 ——— The business` — the website's zone marker, one per scene. */
export const Marker: React.FC<{ n: string; label: string; t0: number; t1: number }> = ({ n, label, t0, t1 }) => {
  const t = useT();
  const inn = ramp(t, t0, t0 + 0.7, E.out);
  const out = ramp(t, t1, t1 + 0.4, E.inOut);
  if (t < t0 - 0.1 || t > t1 + 0.6) return null;
  return (
    <div style={{ position: "absolute", left: 160, top: 80, display: "flex", alignItems: "center", gap: 18, opacity: inn * (1 - out), transform: `translateY(${(1 - inn) * 8 - out * 6}px)` }}>
      <span style={{ fontFamily: EN, fontWeight: 700, fontSize: 15, letterSpacing: "0.12em", color: C.silver, fontVariantNumeric: "tabular-nums" }}>{n}</span>
      <span style={{ width: 56 * inn, height: 1, background: C.steel }} />
      <span style={{ fontFamily: EN, fontWeight: 700, fontSize: 13, letterSpacing: "0.16em", textTransform: "uppercase", color: C.steel }}>{label}</span>
    </div>
  );
};

/** Six hairlines top-right: where we are in the film, drawn like a document index. */
export const PageIndex: React.FC = () => {
  const t = useT();
  const show = ramp(t, 1.2, 2.0, E.out) * (1 - ramp(t, 55.6, 56.4, E.inOut));
  if (show <= 0) return null;
  return (
    <div style={{ position: "absolute", right: 160, top: 90, display: "flex", gap: 8, opacity: show }}>
      {SCENES.map((s, i) => {
        const on = t >= s.from && t < s.to;
        const done = t >= s.to;
        return <span key={i} style={{ width: 28, height: 2, background: on ? C.offwhite : done ? C.steel : alpha("#ffffff", 0.14) }} />;
      })}
    </div>
  );
};

/** A line of display type. Segments separated by "|" alternate bright / muted: "Kept apart,| none of it adds up." */
export type Line = string;

/** Masked word-by-word reveal. Tight tracking and 800 weight, as `.t-display` on the site. */
export const Headline: React.FC<{ lines: Line[]; t0: number; t1: number; size?: number; style?: React.CSSProperties; stagger?: number }> = ({ lines, t0, t1, size = 68, style, stagger = 0.07 }) => {
  const t = useT();
  if (t < t0 - 0.1 || t > t1 + 1.2) return null;
  const out = ramp(t, t1, t1 + 0.55, E.inOut);
  let k = 0;
  return (
    <div style={{ position: "absolute", fontFamily: EN, fontWeight: 800, fontSize: size, lineHeight: 1.06, letterSpacing: "-0.04em", color: C.offwhite, ...style }}>
      {lines.map((ln, li) => (
        <div key={li} style={{ whiteSpace: "nowrap" }}>
          {ln.split("|").flatMap((seg, si) => seg.split(" ").filter(Boolean).map((w) => ({ w, muted: si % 2 === 1 }))).map(({ w, muted }, wi) => {
            const idx = k++;
            const inn = ramp(t, t0 + idx * stagger, t0 + idx * stagger + 0.75, E.out);
            return (
              <span key={wi} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: "0.14em", marginBottom: "-0.14em", marginRight: "0.24em", color: muted ? "#7C858F" : C.offwhite }}>
                <span style={{ display: "inline-block", transform: `translateY(${(1 - inn) * 112 - out * 112}%)` }}>{w}</span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** Secondary line: fades and lifts in, no mask. */
export const Sub: React.FC<{ children: React.ReactNode; t0: number; t1: number; style?: React.CSSProperties }> = ({ children, t0, t1, style }) => {
  const t = useT();
  if (t < t0 - 0.1 || t > t1 + 1) return null;
  const inn = ramp(t, t0, t0 + 0.8, E.out);
  const out = ramp(t, t1, t1 + 0.45, E.inOut);
  return (
    <div style={{ position: "absolute", fontFamily: EN, fontWeight: 400, fontSize: 22, lineHeight: 1.5, color: C.muted, letterSpacing: "-0.005em", opacity: inn * (1 - out), transform: `translateY(${(1 - inn) * 10}px)`, ...style }}>{children}</div>
  );
};
