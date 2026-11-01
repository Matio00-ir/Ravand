import React from "react";
import { AbsoluteFill } from "remotion";
import { C, E, alpha, lerp, ramp, useT } from "./tokens";
import { HEIGHT, WIDTH } from "./tokens";
import { RAILS } from "./layout";
import { S } from "./timeline";
import { planePts, roundedPoly } from "./primitives";

/** Rails, ordered grid, grain, vignette. Rails converge to one line for the brand reveal. */
export const Backdrop: React.FC = () => {
  const t = useT();
  const conv = ramp(t, S.convergence, S.brand, E.inOut);
  const gridO = ramp(t, 0.2, 2.4, E.out) * (1 - ramp(t, S.convergence - 0.5, S.convergence + 1.2, E.inOut));
  const centerRetract = ramp(t, S.brand + 3.1, S.brand + 4.1, E.inOut);
  return (
    <AbsoluteFill style={{ background: C.black }}>
      <AbsoluteFill style={{
        opacity: 0.045 * gridO,
        backgroundImage: "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)",
        backgroundSize: "56px 56px", backgroundPosition: "center top",
        WebkitMaskImage: "radial-gradient(ellipse 75% 70% at 50% 42%, #000 28%, transparent 100%)",
      }} />
      {RAILS.map((x, i) => {
        const draw = ramp(t, 0.3 + i * 0.16, 2.1 + i * 0.16, E.out);
        const isCenter = i === 2;
        const px = lerp(x, WIDTH / 2, conv);
        const o = isCenter ? 1 : 1 - conv;
        return (
          <div key={i} style={{
            position: "absolute", left: px, top: 0, width: 1, height: HEIGHT, background: alpha("#ffffff", 0.085 + (isCenter ? conv * 0.12 : 0)),
            transformOrigin: isCenter && centerRetract > 0 ? "50% 100%" : "50% 0%",
            transform: `scaleY(${isCenter ? draw * (1 - centerRetract) : draw})`, opacity: o,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};

/** Grain + vignette sit above the world but under the type. */
export const Finish: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ opacity: 0.05, backgroundImage: "radial-gradient(rgba(255,255,255,.6) 1px, transparent 1px)", backgroundSize: "4px 4px" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 80% at 50% 48%, transparent 55%, rgba(0,0,0,.55) 100%)" }} />
  </AbsoluteFill>
);

type P = { cx: number; cy: number; w: number; h: number; skew: number };
const PLANES: { s: P; r?: P; drift: number; delay: number }[] = [
  { s: { cx: 700, cy: 330, w: 980, h: 190, skew: 0.16 }, r: { cx: 960, cy: 400, w: 1600, h: 204, skew: 0 }, drift: 6, delay: 0 },
  { s: { cx: 1300, cy: 700, w: 900, h: 170, skew: -0.14 }, r: { cx: 960, cy: 680, w: 1600, h: 204, skew: 0 }, drift: -5, delay: 0.25 },
  { s: { cx: 900, cy: 520, w: 700, h: 120, skew: 0.2 }, r: { cx: 960, cy: 540, w: 1600, h: 38, skew: 0 }, drift: 4, delay: 0.5 },
  { s: { cx: 280, cy: 520, w: 520, h: 140, skew: 0.18 }, drift: -4, delay: 0.75 },
  { s: { cx: 1680, cy: 430, w: 540, h: 150, skew: -0.2 }, drift: 5, delay: 1.0 },
];

/** The brand's plane stack: fragmented parallelograms that register into structural bands. */
export const PlaneField: React.FC = () => {
  const t = useT();
  const exit = 1 - ramp(t, S.product, S.product + 1.3, E.inOut);
  if (exit <= 0) return null;
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      {PLANES.map((p, i) => {
        const ap = ramp(t, 0.5 + p.delay, 2.6 + p.delay, E.flow);
        const rp = p.r ? ramp(t, S.appears + 0.8 + p.delay, S.appears + 3.6 + p.delay, E.inOut) : ramp(t, S.appears + 0.8, S.appears + 2.6, E.inOut);
        const a = p.r ?? p.s;
        const cx = lerp(p.s.cx + p.drift * Math.min(t, S.appears), a.cx, rp) + (p.r ? 0 : -p.drift * 30 * rp);
        const cy = lerp(p.s.cy, a.cy, rp), w = lerp(p.s.w, a.w, rp), h = lerp(p.s.h, a.h, rp), sk = lerp(p.s.skew, a.skew, rp);
        const o = ap * (p.r ? 1 : 1 - rp) * exit;
        const d = roundedPoly(planePts(w, h, sk), 6);
        return (
          <path key={i} d={d} transform={`translate(${cx - w / 2} ${cy - h / 2})`} fill={alpha("#ffffff", 0.026)} stroke={alpha("#ffffff", 0.07)} strokeWidth={1} opacity={o} />
        );
      })}
    </svg>
  );
};
