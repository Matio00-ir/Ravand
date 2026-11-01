import { BUS_Y, COL_X, NODE_H, ROW_Y } from "./layout";
import { byKey, type ModuleKey } from "./modules";

/**
 * The business events that travel through the system. The chain is the "trading" workflow preset
 * from the product's own builder (Customer request → Stock check → Purchase order → Manager
 * approval → Delivery & invoice), mapped to the modules that own each step, then onward into the
 * ledger and reports.
 */
export type FlowEvent = { from: ModuleKey; to: ModuleKey; t0: number; dur: number; stage?: number };

export const STAGES = ["Customer request", "Stock check", "Purchase order", "Manager approval", "Delivery & invoice"];

export const FLOW: FlowEvent[] = [
  { from: "crm", to: "inventory", t0: 24.4, dur: 1.5, stage: 0 },
  { from: "inventory", to: "erp", t0: 26.2, dur: 1.6, stage: 1 },
  { from: "erp", to: "workflow", t0: 28.1, dur: 1.4, stage: 2 },
  { from: "workflow", to: "sales", t0: 29.8, dur: 1.5, stage: 3 },
  { from: "sales", to: "finance", t0: 31.5, dur: 1.3, stage: 4 },
  { from: "finance", to: "analytics", t0: 33.0, dur: 1.2 },
  // the system running in parallel — increasing movement before the cut to product
  { from: "hr", to: "workflow", t0: 32.2, dur: 1.2 },
  { from: "erp", to: "inventory", t0: 33.8, dur: 1.1 },
  { from: "sales", to: "crm", t0: 34.2, dur: 1.4 },
  { from: "analytics", to: "erp", t0: 34.7, dur: 1.3 },
  { from: "crm", to: "sales", t0: 35.2, dur: 1.2 },
];

/** When each stage of the ticker lights: departure for the first, arrival of the previous hop after. */
export const STAGE_T = [FLOW[0].t0, ...FLOW.slice(0, 4).map((e) => e.t0 + e.dur)];

const decay = (dt: number) => (dt < 0 ? 0 : dt < 0.14 ? dt / 0.14 : Math.exp(-(dt - 0.14) / 0.55));

/** 0→1 activity of a node: a hard arrival flash that settles, plus a softer departure. */
export const activity = (key: ModuleKey, t: number) => {
  let a = 0;
  for (const e of FLOW) {
    if (e.to === key) a = Math.max(a, decay(t - (e.t0 + e.dur)));
    if (e.from === key) a = Math.max(a, 0.45 * decay(t - e.t0));
  }
  return a;
};

export type Pt = [number, number];

/** The node's port on its side of the bus. */
export const port = (key: ModuleKey): Pt => {
  const m = byKey[key];
  const top = m.slot[1] === 0;
  return [COL_X[m.slot[0]], top ? ROW_Y[0] + NODE_H / 2 : ROW_Y[1] - NODE_H / 2];
};

export const stubPts = (key: ModuleKey): Pt[] => [port(key), [port(key)[0], BUS_Y]];

export const routePts = (from: ModuleKey, to: ModuleKey): Pt[] => {
  const a = port(from), b = port(to);
  return [a, [a[0], BUS_Y], [b[0], BUS_Y], b];
};

export const polyLen = (p: Pt[]) =>
  p.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0), 0);
export const polyD = (p: Pt[]) => p.map((q, i) => `${i ? "L" : "M"}${q[0]} ${q[1]}`).join(" ");

/** Point at distance s along a polyline. */
export const pointAt = (p: Pt[], s: number): Pt => {
  let rest = Math.max(0, s);
  for (let i = 1; i < p.length; i++) {
    const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (rest <= l) return [p[i - 1][0] + ((p[i][0] - p[i - 1][0]) * rest) / l, p[i - 1][1] + ((p[i][1] - p[i - 1][1]) * rest) / l];
    rest -= l;
  }
  return p[p.length - 1];
};

// ---------------------------------------------------------------- sidebar navigation marker
/** [time, nav index] — the active marker stepping through the product's modules. */
export const NAV_STEPS: [number, number][] = [
  [0, 0],
  [41.3, 1], [42.0, 2], [42.7, 3], [43.4, 4], [44.1, 5],
  [44.9, 1],
  [50.2, 2], [50.9, 3], [51.6, 4], [52.3, 5], [53.0, 6], [53.7, 7],
];

export const navPos = (t: number) => {
  let prev = 0, cur = 0, t0 = 0;
  for (const [ts, idx] of NAV_STEPS) {
    if (t >= ts) { prev = cur; cur = idx; t0 = ts; }
  }
  const k = Math.min(1, Math.max(0, (t - t0) / 0.28));
  const e = k * k * (3 - 2 * k);
  return prev + (cur - prev) * e;
};
