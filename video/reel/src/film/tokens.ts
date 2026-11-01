import { Easing, interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadVazirmatn } from "@remotion/google-fonts/Vazirmatn";
import { C } from "../brand";

export { C };

// Manrope (Latin) / Vazirmatn (Persian) — the brand's two faces. 800 is the display weight on the site.
export const EN = loadManrope("normal", { weights: ["300", "400", "500", "600", "700", "800"], subsets: ["latin"] }).fontFamily;
export const FA = loadVazirmatn("normal", { weights: ["400", "500", "600", "700"], subsets: ["arabic", "latin"] }).fontFamily;

/** The product's chart tint — the only "signal" colour in the film, used for activity and connection. */
export const SIGNAL = "#9FB0C4";
export const SIGNAL_HI = "#DCE5EF";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const E = {
  /** --ease-flow from globals.css */
  flow: Easing.bezier(0.22, 0.61, 0.36, 1),
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  soft: Easing.bezier(0.45, 0, 0.2, 1),
};

export const ramp = (t: number, a: number, b: number, easing: (n: number) => number = E.flow) =>
  interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Current time in seconds. */
export const useT = () => useCurrentFrame() / FPS;

export const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const mixHex = (a: string, b: string, k: number) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, k));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};
