import React from "react";
import { C, E, EN, FA, alpha, lerp, mixHex, ramp, useT } from "./tokens";
import { S } from "./timeline";
import { SYMBOL, WORDMARK, WORDMARK_FA } from "../marks";

// Lockup proportions follow components/ui/Logo + video/reel/src/brand.tsx (Lockup).
const H = 120;
const SYM_W = H * 1.15;
const WM_H = H * 0.52, WM_W = WM_H * (WORDMARK.w / WORDMARK.h);
const FA_H = H * 0.78, FA_W = FA_H * (WORDMARK_FA.w / WORDMARK_FA.h);
const GAP = H * 0.45;
const DIV_H = H * 0.8;

const MODULES_LINE = ["ERP", "CRM", "Finance", "Inventory", "HR", "Sales", "Workflow", "Analytics"];

/**
 * 07 — the flow resolves into the identity. Follows the brand's own logo-animation sheet:
 * segments appear → connection forms → unified symbol; then the bilingual lockup and the line.
 */
export const BrandReveal: React.FC = () => {
  const t = useT();
  if (t < S.convergence) return null;

  const seg = ramp(t, 56.0, 57.2, E.out);
  const unify = ramp(t, 57.2, 58.3, E.inOut);
  const scale = lerp(1.5, 1, ramp(t, 58.4, 59.5, E.inOut));
  const wm = ramp(t, 58.5, 59.9, E.inOut);
  const div = ramp(t, 59.7, 60.3, E.inOut);
  const fa = ramp(t, 59.9, 60.9, E.inOut);

  const legX = (1 - seg) * 26 + (1 - unify) * 10, legY = (1 - seg) * 24 + (1 - unify) * 9;
  const ribX = -(1 - seg) * 28 - (1 - unify) * 10, ribY = -(1 - seg) * 18 - (1 - unify) * 7;
  const op = seg * (0.55 + 0.45 * unify);

    const tagFa = ramp(t, 61.4, 62.2, E.out);
  const desc = ramp(t, 62.4, 63.3, E.out);

  const words = "Business, in flow.".split(" ");

  return (
    <>
      <div style={{ position: "absolute", left: "50%", top: 470, transform: "translate(-50%, -50%)", display: "flex", alignItems: "center", direction: "ltr" }}>
        <svg viewBox={`0 0 ${SYMBOL.w} ${SYMBOL.h}`} style={{ width: SYM_W * scale, flex: "none", overflow: "visible", display: "block" }}>
          <path d={SYMBOL.leg} fill={mixHex("#3A4048", "#8A929C", unify)} fillRule="evenodd" opacity={op} transform={`translate(${legX} ${legY})`} />
          <path d={SYMBOL.ribbon} fill={mixHex("#69727D", "#F7F8FA", unify)} fillRule="evenodd" opacity={op} transform={`translate(${ribX} ${ribY})`} />
        </svg>
        <div style={{ width: (WM_W + GAP) * wm, overflow: "hidden", flex: "none", display: "flex", alignItems: "center" }}>
          <svg viewBox={`0 0 ${WORDMARK.w} ${WORDMARK.h}`} style={{ height: WM_H, flex: "none", marginLeft: GAP, display: "block", opacity: wm }}>
            <path d={WORDMARK.d} fill={C.offwhite} fillRule="evenodd" />
          </svg>
        </div>
        <div style={{ width: (2 + GAP * 2) * div, overflow: "hidden", flex: "none", display: "flex", justifyContent: "center" }}>
          <span style={{ width: 2, height: DIV_H * div, background: C.steel, flex: "none", alignSelf: "center" }} />
        </div>
        <div style={{ width: FA_W * fa, overflow: "hidden", flex: "none", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          <svg viewBox={`0 0 ${WORDMARK_FA.w} ${WORDMARK_FA.h}`} style={{ height: FA_H, flex: "none", display: "block", opacity: fa, transform: `translateX(${(1 - fa) * 18}px)` }}>
            <path d={WORDMARK_FA.d} fill={C.offwhite} fillRule="evenodd" />
          </svg>
        </div>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 604, textAlign: "center", fontFamily: EN, fontWeight: 300, fontSize: 46, letterSpacing: "-0.02em", color: C.offwhite }}>
        {words.map((w, i) => {
          const a = ramp(t, 60.8 + i * 0.1, 61.6 + i * 0.1, E.out);
          return (
            <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: "0.16em", marginBottom: "-0.16em", marginRight: i < words.length - 1 ? "0.28em" : 0 }}>
              <span style={{ display: "inline-block", transform: `translateY(${(1 - a) * 112}%)` }}>{w}</span>
            </span>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 676, textAlign: "center", direction: "rtl", fontFamily: FA, fontWeight: 400, fontSize: 36, color: C.muted, opacity: tagFa, transform: `translateY(${(1 - tagFa) * 10}px)` }}>
        کسب‌وکار شما، در جریان است.
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 932, textAlign: "center", opacity: desc, transform: `translateY(${(1 - desc) * 8}px)` }}>
        <div style={{ fontFamily: EN, fontWeight: 400, fontSize: 18, color: C.silver, letterSpacing: "0.005em" }}>The operating system for business flow.</div>
        <div style={{ marginTop: 14, fontFamily: EN, fontWeight: 500, fontSize: 13.5, color: C.steel, letterSpacing: "0.04em", display: "flex", justifyContent: "center", gap: 14 }}>
          {MODULES_LINE.map((m, i) => (
            <React.Fragment key={m}>
              {i > 0 ? <span style={{ color: alpha("#ffffff", 0.22) }}>/</span> : null}
              <span>{m}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
};
