import React from "react";
import { C, E, EN, SIGNAL, alpha, lerp, mixHex, ramp, useT } from "./tokens";
import { NODE_H, NODE_W } from "./layout";
import { S } from "./timeline";
import { MODULES, type ModuleDef } from "./modules";
import { nodeGeom } from "./geometry";
import { activity, navPos } from "./flow";
import { Icon, planePts, roundedPoly } from "./primitives";

/** Modules the "Only the modules you choose" beat switches off, then back on for "Every module". */
const OFF: string[] = ["crm", "hr", "workflow", "analytics"];

const enabled = (key: string, t: number) => {
  const i = OFF.indexOf(key);
  if (i < 0) return 1;
  const off = ramp(t, S.configure + 0.3 + i * 0.24, S.configure + 0.65 + i * 0.24, E.flow);
  const on = ramp(t, S.clarity + 0.15 + i * 0.22, S.clarity + 0.5 + i * 0.22, E.flow);
  return Math.min(1, Math.max(0, 1 - off + on));
};

const Node: React.FC<{ m: ModuleDef; t: number }> = ({ m, t }) => {
  const { ap, dp, rect, skew } = nodeGeom(m, t);
  if (ap <= 0) return null;
  const { cx, cy, w, h } = rect;
  const exit = 1 - ramp(t, S.convergence - 0.5, S.convergence + 0.4, E.inOut);
  if (exit <= 0) return null;

  const flowAct = activity(m.key, t);
  const nav = Math.max(0, 1 - Math.abs(navPos(t) - m.nav)) * ramp(dp, 0.85, 1);
  const act = Math.max(flowAct, 0);
  const en = enabled(m.key, t);

  const cardO = 1 - ramp(dp, 0, 0.35, E.flow);
  const rowO = ramp(dp, 0.6, 1, E.flow);
  const shapeO = 1 - ramp(dp, 0.1, 0.8, E.flow);
  const depth = m.s.z < 0.95 ? 0.88 : 1;
  const scale = Math.min(w / NODE_W, h / NODE_H);

  const fill = mixHex("#12161C", "#1B222B", act);
  const k = Math.min(1, act);
  const stroke = `rgba(${Math.round(lerp(255, 159, k))},${Math.round(lerp(255, 176, k))},${Math.round(lerp(255, 196, k))},${lerp(0.14, 0.72, k) * shapeO})`;
  const path = roundedPoly(planePts(w, h, skew), 8);

  const togO = ramp(t, S.configure - 0.2, S.configure + 0.4) * (1 - ramp(t, S.clarity + 1.4, S.clarity + 2.0));

  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, opacity: ap * depth * exit, transform: `translateY(${(1 - ap) * 14}px)` }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <path d={path} fill={fill} fillOpacity={shapeO} stroke={stroke} strokeWidth={1} />
        {act > 0.02 ? <path d={`M${Math.abs(skew) * w + 14} 0.5 H${w - 14 - Math.abs(skew) * w * 0.2}`} stroke={SIGNAL} strokeOpacity={act * 0.9} strokeWidth={2} /> : null}
      </svg>

      {/* card face */}
      {cardO > 0.01 ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: NODE_W, height: NODE_H, transform: `scale(${scale})`, transformOrigin: "0 0", opacity: cardO, padding: "26px 36px", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Icon paths={m.icon} fill={m.iconFill} size={24} color={mixHex("#69727D", "#DCE5EF", Math.min(1, 0.25 + act))} />
            <span style={{ fontFamily: EN, fontWeight: 700, fontSize: 12.5, letterSpacing: "0.14em", color: C.steel }}>{m.code}</span>
          </div>
          <div style={{ fontFamily: EN, fontWeight: 700, fontSize: 27, letterSpacing: "-0.025em", color: C.offwhite, marginTop: 24 }}>{m.name}</div>
          <div style={{ fontFamily: EN, fontWeight: 400, fontSize: 15, color: C.muted, marginTop: 6 }}>{m.cap}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
            <span style={{ width: 6, height: 6, background: mixHex("#3A424C", SIGNAL, Math.min(1, act * 1.2)) }} />
            <span style={{ width: 44, height: 1, background: alpha("#ffffff", 0.14) }} />
          </div>
        </div>
      ) : null}

      {/* sidebar row face */}
      {rowO > 0.01 ? (
        <div style={{ position: "absolute", inset: 0, opacity: rowO * lerp(0.36, 1, en), borderRadius: 4, background: alpha("#ffffff", 0.075 * nav), display: "flex", alignItems: "center", gap: 12, padding: "0 12px 0 14px", boxSizing: "border-box" }}>
          <span style={{ position: "absolute", left: 0, top: 6, bottom: 6, width: 2, borderRadius: 1, background: C.accent, opacity: nav }} />
          <Icon paths={m.icon} fill={m.iconFill} size={17} color={mixHex("#69727D", "#B7BEC7", nav)} />
          <span style={{ fontFamily: EN, fontWeight: 500, fontSize: 14.5, color: mixHex("#98A0AA", "#F7F8FA", nav), flex: 1 }}>{m.name}</span>
          {togO > 0.01 ? (
            <span style={{ width: 26, height: 14, borderRadius: 7, background: mixHex("#2A3038", "#71859E", en), position: "relative", opacity: togO }}>
              <span style={{ position: "absolute", top: 2, left: 2 + 12 * en, width: 10, height: 10, borderRadius: 5, background: mixHex("#8A929C", "#F7F8FA", en) }} />
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export const NodeField: React.FC = () => {
  const t = useT();
  return <>{MODULES.map((m) => <Node key={m.key} m={m} t={t} />)}</>;
};
