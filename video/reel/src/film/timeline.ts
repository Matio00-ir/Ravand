import { FPS } from "./tokens";

/** Scene boundaries in seconds. Everything in the film hangs off this one table. */
export const S = {
  complexity: 0,
  fragment: 8,
  appears: 16,
  flow: 23,
  product: 37,
  configure: 44.4,
  clarity: 49.2,
  convergence: 55,
  brand: 57,
  end: 66,
} as const;

export const DURATION_S = S.end;
export const DURATION = Math.round(DURATION_S * FPS);

export const SCENES = [
  { n: "01", label: "The business", from: S.complexity, to: S.fragment },
  { n: "02", label: "The problem", from: S.fragment, to: S.appears },
  { n: "03", label: "The structure", from: S.appears, to: S.flow },
  { n: "04", label: "The flow", from: S.flow, to: S.product },
  { n: "05", label: "The system", from: S.product, to: S.clarity },
  { n: "06", label: "The result", from: S.clarity, to: S.convergence },
] as const;
