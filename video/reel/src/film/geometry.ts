import { E, lerp, ramp } from "./tokens";
import { NODE_H, NODE_W } from "./layout";
import { S } from "./timeline";
import { rowRect, slotRect, type ModuleDef, type Rect } from "./modules";

const mix = (a: Rect, b: Rect, k: number): Rect => ({ cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k) });

/**
 * One module's geometry at time t. A node travels through three states —
 * scattered (skewed, drifting) → registered (on the rail grid) → sidebar row of the product.
 * The same object is used by the node, its dangling connector, and the product frame, so they
 * can never disagree.
 */
export const nodeGeom = (m: ModuleDef, t: number) => {
  const ap = ramp(t, m.appear, m.appear + 1.0, E.out);
  const D = Math.pow(Math.min(t, S.appears) / S.appears, 1.5);
  const scatter: Rect = { cx: m.s.x + m.s.dx * D, cy: m.s.y + m.s.dy * D, w: NODE_W * m.s.z, h: NODE_H * m.s.z };
  const r0 = S.appears + 0.6 + m.reg * 0.2;
  const rp = ramp(t, r0, r0 + 2.8, E.inOut);
  const d0 = S.product + m.nav * 0.07;
  const dp = ramp(t, d0, d0 + 1.5, E.inOut);
  const rect = mix(mix(scatter, slotRect(m), rp), rowRect(m), dp);
  return { ap, rp, dp, rect, skew: lerp(m.s.skew, 0, rp) };
};
