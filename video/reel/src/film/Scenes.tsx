import React from "react";
import { C, E, EN, SIGNAL, alpha, ramp, useT } from "./tokens";
import { RAILS } from "./layout";
import { S, SCENES } from "./timeline";
import { STAGES, STAGE_T } from "./flow";
import { Headline, Marker, Sub } from "./primitives";

/** Bottom-left statement position shared by the three "world" scenes. */
const BOTTOM = { left: 160, top: 858 } as const;
const SUB = { left: 160, top: 948 } as const;
/** Left editorial column used once the product is on screen. */
const COLUMN = { left: 160, top: 322 } as const;

const marker = (i: number) => <Marker n={SCENES[i].n} label={SCENES[i].label} t0={SCENES[i].from + 0.8} t1={SCENES[i].to - 0.4} />;

/** 01 — a business is many things at once. Quiet, sparse, nodes arriving one at a time. */
export const ComplexityScene: React.FC = () => (
  <>
    {marker(0)}
    <Headline lines={["A business is| many things at once."]} t0={1.6} t1={7.2} style={BOTTOM} />
    <Sub t0={3.2} t1={7.2} style={SUB}>Orders. Stock. Invoices. Customers. People.</Sub>
  </>
);

/** 02 — the same parts, drifting apart; connectors that stop short. */
export const FragmentationScene: React.FC = () => (
  <>
    {marker(1)}
    <Headline lines={["Kept apart,| none of it adds up."]} t0={8.7} t1={15.4} style={BOTTOM} />
    <Sub t0={10.2} t1={15.4} style={SUB}>Every tool holds its own data. None of them shows the whole picture.</Sub>
  </>
);

/** 03 — RAVAND appears as structure: the centre rail wakes, a bus grows, planes register. */
export const AppearsScene: React.FC = () => (
  <>
    {marker(2)}
    <Headline lines={["Start with| one structure."]} t0={17.0} t1={22.4} style={BOTTOM} />
    <Sub t0={18.4} t1={22.4} style={SUB}>Modules on one data structure.</Sub>
  </>
);

/** 04 — the flow. The workflow stages light along the rails as the pulses reach their owners. */
export const FlowScene: React.FC = () => {
  const t = useT();
  const o = ramp(t, S.flow + 0.8, S.flow + 1.6, E.out) * (1 - ramp(t, S.product - 0.7, S.product - 0.1, E.inOut));
  return (
    <>
      {marker(3)}
      <Headline lines={["Then let the work| move through it."]} t0={23.6} t1={35.8} style={BOTTOM} />
      {o > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: o }}>
          {STAGES.map((s, i) => {
            const lit = ramp(t, STAGE_T[i], STAGE_T[i] + 0.3, E.flow);
            const last = i === STAGES.length - 1;
            return (
              <div key={s} style={{ position: "absolute", left: RAILS[i], top: 812, transform: last ? "translateX(-100%)" : undefined, display: "flex", alignItems: "center", gap: 10, flexDirection: last ? "row-reverse" : "row" }}>
                <span style={{ width: 7, height: 7, background: lit > 0.01 ? SIGNAL : alpha("#ffffff", 0.16), opacity: 0.4 + 0.6 * lit }} />
                <span style={{ fontFamily: EN, fontWeight: 700, fontSize: 11.5, letterSpacing: "0.12em", textTransform: "uppercase", color: lit > 0.5 ? C.offwhite : C.steel, whiteSpace: "nowrap" }}>{`0${i + 1}  ${s}`}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </>
  );
};

/** 05 — the product. Modules have become the sidebar; then only the ones you choose stay on. */
export const ProductScene: React.FC = () => (
  <>
    {marker(4)}
    <Headline lines={["Everything,", "in| one view."]} t0={37.9} t1={43.9} size={54} style={COLUMN} />
    <Headline lines={["Only the", "modules|", "you choose."]} t0={44.9} t1={48.7} size={54} style={COLUMN} />
    <Sub t0={46.0} t1={48.7} style={{ left: 160, top: 530, width: 360 }}>The rest stays out of the way.</Sub>
  </>
);

const PRINCIPLES = ["Designed around the real process", "Modular from the ground up", "Scales with the organization"];

/** 06 — control and clarity: every module, one shared set of data. */
export const ClarityScene: React.FC = () => {
  const t = useT();
  const out = ramp(t, S.convergence - 0.6, S.convergence - 0.1, E.inOut);
  return (
    <>
      {marker(5)}
      <Headline lines={["Every module,", "on| shared data."]} t0={50.0} t1={54.4} size={54} style={COLUMN} />
      {t > 51 && out < 1 ? (
        <div style={{ position: "absolute", left: 160, top: 560, width: 340, opacity: 1 - out }}>
          {PRINCIPLES.map((p, i) => {
            const a = ramp(t, 51.2 + i * 0.38, 52.0 + i * 0.38, E.out);
            return (
              <div key={p} style={{ display: "flex", gap: 16, padding: "14px 0", borderTop: `1px solid ${alpha("#ffffff", 0.1)}`, opacity: a, transform: `translateY(${(1 - a) * 8}px)` }}>
                <span style={{ fontFamily: EN, fontWeight: 700, fontSize: 13, letterSpacing: "0.12em", color: C.steel, paddingTop: 3 }}>{`0${i + 1}`}</span>
                <span style={{ fontFamily: EN, fontWeight: 500, fontSize: 17, lineHeight: 1.4, color: C.silver }}>{p}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </>
  );
};
