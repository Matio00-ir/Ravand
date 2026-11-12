import { FLOW } from "./flow";
import { MODULES } from "./modules";
import { S } from "./timeline";

/**
 * Sound-design map. The film has no audio track; every audible moment is listed here with its
 * time, so a mix can be built against it (or this can be exported to a DAW marker list) without
 * re-reading the animation code. Times are seconds from the start; the picture works with sound off.
 *
 *  - "pulse":  low-frequency swell under the central core appearing / the bus extending
 *  - "tick":   soft UI tick — a node registering, a signal arriving, a toggle
 *  - "slide":  filtered noise sweep — a structural move (nodes into the sidebar, rails converging)
 *  - "open":   the product surface opening
 *  - "hit":    the logo resolving — the one real impact in the film
 */
export type Cue = { t: number; kind: "pulse" | "tick" | "slide" | "open" | "hit"; note: string };

export const CUES: Cue[] = ([
  ...MODULES.map((m) => ({ t: m.appear + 0.35, kind: "tick" as const, note: `${m.code} appears` })),

  { t: S.appears + 0.0, kind: "pulse", note: "core appears on the centre rail" },
  ...MODULES.map((m) => ({ t: S.appears + 0.6 + m.reg * 0.2 + 2.2, kind: "tick" as const, note: `${m.code} registers on the grid` })),
  { t: 18.6, kind: "slide", note: "bus extends from the core" },

  ...FLOW.map((e) => ({ t: e.t0 + e.dur, kind: "tick" as const, note: `${e.from} → ${e.to} arrives` })),

  { t: S.product, kind: "slide", note: "nodes travel into the sidebar" },
  { t: S.product + 1.0, kind: "open", note: "product surface opens" },
  { t: 42.6 + 0.3, kind: "tick", note: "GRN-0918 settles" },
  ...[0, 1, 2, 3].map((i) => ({ t: S.configure + 0.65 + i * 0.24, kind: "tick" as const, note: "module toggled off" })),
  ...[0, 1, 2, 3].map((i) => ({ t: S.clarity + 0.5 + i * 0.22, kind: "tick" as const, note: "module toggled on" })),

  { t: S.convergence, kind: "slide", note: "rails converge to one line" },
  { t: 58.1, kind: "hit", note: "symbol unifies — the impact" },
  { t: 58.5, kind: "slide", note: "wordmark reveals" },
  { t: 60.8, kind: "tick", note: "tagline" },
]  as Cue[]).sort((a, b) => a.t - b.t);
