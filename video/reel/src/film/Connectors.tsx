import React from "react";
import { C, E, HEIGHT, SIGNAL, SIGNAL_HI, WIDTH, alpha, ramp, useT } from "./tokens";
import { BUS_Y, RAILS } from "./layout";
import { S } from "./timeline";
import { MODULES, byKey } from "./modules";
import { nodeGeom } from "./geometry";
import { FLOW, polyD, polyLen, pointAt, routePts, stubPts, type Pt } from "./flow";
import { SYMBOL } from "../marks";

const CX = WIDTH / 2;

/** A pulse is a lit slit travelling a route: soft glow → body → hot head, like the edge-light in the brand's dark artwork. */
const Pulse: React.FC<{ pts: Pt[]; head: number; fade: number }> = ({ pts, head, fade }) => {
  const total = polyLen(pts);
  const layers: [number, number, number, string][] = [
    [190, 8, 0.16, SIGNAL],
    [110, 3, 0.5, SIGNAL],
    [44, 2.2, 1, SIGNAL_HI],
  ];
  return (
    <>
      {layers.map(([tail, sw, op, col], i) => {
        const a = Math.max(0, head - tail), b = Math.min(total, head);
        if (b <= a) return null;
        return <path key={i} d={polyD(pts)} fill="none" stroke={col} strokeWidth={sw} strokeOpacity={op * fade} strokeDasharray={`${b - a} ${total * 2}`} strokeDashoffset={-a} />;
      })}
    </>
  );
};

/** Hollow square marking an open, unterminated end. */
const OpenEnd: React.FC<{ x: number; y: number; o: number }> = ({ x, y, o }) => (
  <rect x={x - 3.5} y={y - 3.5} width={7} height={7} fill="none" stroke={alpha("#ffffff", 0.34)} strokeOpacity={o} strokeWidth={1} />
);

export const Connectors: React.FC = () => {
  const t = useT();
  const exit = 1 - ramp(t, S.product - 0.1, S.product + 0.9, E.inOut);

  // ---- RAVAND's core: appears on the centre rail, then the bus extends from it.
  const chip = ramp(t, 16.0, 16.9, E.out);
  const spine = ramp(t, 16.5, 18.2, E.out);
  const busHalf = ramp(t, 18.6, 21.1, E.inOut) * 800;
  const ringT = [16.1, 18.7, 21.2].map((t0) => ramp(t, t0, t0 + 1.4, E.out));

  const dashedO = (i: number) => {
    const m = MODULES[i];
    return ramp(t, m.appear + 0.7, m.appear + 1.7, E.flow) * (1 - ramp(t, S.appears + 0.1, S.appears + 1.5, E.inOut));
  };
  const signalsO = ramp(t, S.fragment + 0.6, S.fragment + 2.2, E.flow) * (1 - ramp(t, S.appears + 0.0, S.appears + 1.0, E.inOut));

  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {/* ---- fragmented: connectors that stop short */}
      {t < S.appears + 2 &&
        MODULES.map((m, i) => {
          const o = dashedO(i);
          if (o <= 0.01) return null;
          const g = nodeGeom(m, t).rect, p = nodeGeom(byKey[m.partner], t).rect;
          const sx = Math.sign(p.cx - g.cx) || 1, sy = Math.sign(p.cy - g.cy) || 1;
          const a = Math.min(Math.abs(p.cx - g.cx) * 0.38, 230), b = Math.min(Math.abs(p.cy - g.cy) * 0.34, 140);
          const pts: Pt[] = [[g.cx + (sx * g.w) / 2, g.cy], [g.cx + (sx * g.w) / 2 + sx * a, g.cy], [g.cx + (sx * g.w) / 2 + sx * a, g.cy + sy * b]];
          const L = polyLen(pts);
          const s = (t * 0.36 + i * 0.29) % 1;
          const sp = pointAt(pts, s * L);
          return (
            <g key={m.key} opacity={o}>
              <path d={polyD(pts)} fill="none" stroke={alpha("#ffffff", 0.24)} strokeWidth={1} strokeDasharray="5 7" />
              <OpenEnd x={pts[2][0]} y={pts[2][1]} o={1} />
              {signalsO > 0.01 ? <rect x={sp[0] - 2.5} y={sp[1] - 2.5} width={5} height={5} fill={SIGNAL} opacity={signalsO * Math.sin(Math.PI * Math.min(1, s * 1.05)) * 0.9} /> : null}
            </g>
          );
        })}

      <g opacity={exit}>
        {/* ---- the spine: the centre rail wakes up */}
        {spine > 0 && t < 22 ? (
          <line x1={CX} x2={CX} y1={BUS_Y - 560 * spine} y2={BUS_Y + 560 * spine} stroke={SIGNAL} strokeOpacity={0.5 * (1 - ramp(t, 19, 22))} strokeWidth={1} />
        ) : null}

        {/* ---- the bus */}
        {busHalf > 0 ? (
          <>
            <line x1={CX - busHalf} x2={CX + busHalf} y1={BUS_Y} y2={BUS_Y} stroke={alpha("#ffffff", 0.2)} strokeWidth={1} />
            {[RAILS[1], RAILS[3]].map((x) => (
              Math.abs(x - CX) < busHalf ? (
                <g key={x} stroke={alpha("#ffffff", 0.3)} strokeWidth={1}>
                  <line x1={x - 6} x2={x + 6} y1={BUS_Y} y2={BUS_Y} />
                  <line x1={x} x2={x} y1={BUS_Y - 6} y2={BUS_Y + 6} />
                </g>
              ) : null
            ))}
          </>
        ) : null}

        {/* ---- stubs and ports */}
        {MODULES.map((m) => {
          const pts = stubPts(m.key);
          const sp = ramp(t, S.appears + 4.4 + m.reg * 0.2, S.appears + 5.5 + m.reg * 0.2, E.out);
          if (sp <= 0) return null;
          const L = polyLen(pts);
          const [jx, jy] = pts[1];
          return (
            <g key={m.key}>
              <path d={polyD([pts[1], pts[0]])} fill="none" stroke={alpha("#ffffff", 0.2)} strokeWidth={1} strokeDasharray={`${L * sp} ${L * 2}`} />
              <rect x={jx - 3} y={jy - 3} width={6} height={6} fill="#1E242C" stroke={alpha("#ffffff", 0.3)} strokeWidth={1} opacity={ramp(t, S.appears + 4.4 + m.reg * 0.2, S.appears + 4.9 + m.reg * 0.2)} />
            </g>
          );
        })}

        {/* ---- business events */}
        {FLOW.map((e, i) => {
          if (t < e.t0 || t > e.t0 + e.dur + 0.5) return null;
          const pts = routePts(e.from, e.to);
          const total = polyLen(pts);
          const head = ramp(t, e.t0, e.t0 + e.dur, E.soft) * (total + 30);
          return <Pulse key={i} pts={pts} head={head} fade={1 - ramp(t, e.t0 + e.dur, e.t0 + e.dur + 0.4)} />;
        })}

        {/* ---- RAVAND's core */}
        {chip > 0 ? (
          <g transform={`translate(${CX} ${BUS_Y})`}>
            {ringT.map((r, i) => (r > 0 && r < 1 ? <rect key={i} x={-26 - r * 40} y={-26 - r * 40} width={52 + r * 80} height={52 + r * 80} rx={8} fill="none" stroke={SIGNAL} strokeOpacity={0.5 * (1 - r)} strokeWidth={1} /> : null))}
            <rect x={-26} y={-26} width={52} height={52} rx={8} fill="#12161C" stroke={alpha("#ffffff", 0.2)} strokeWidth={1} opacity={chip} />
            <g transform={`translate(-14 -12.9) scale(0.28)`} opacity={chip}>
              <path d={SYMBOL.leg} fill="#8A929C" fillRule="evenodd" />
              <path d={SYMBOL.ribbon} fill={C.offwhite} fillRule="evenodd" />
            </g>
          </g>
        ) : null}
      </g>
    </svg>
  );
};
