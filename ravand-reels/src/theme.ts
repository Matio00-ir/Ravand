/**
 * RAVAND design tokens for reels — extracted from the app, not invented:
 *   colors / radii / easing  ← web/app/globals.css (Design System v3)
 *   type families + weights   ← web/lib/fonts.ts, .t-display / .t-label rules
 *   logo colors               ← web/components/ui/Logo.tsx (inverse tone)
 * The app is read-only; if its tokens change, update this file by hand.
 */
import { Easing } from "remotion";

export const color = {
  // dark identity (the product surface + dark site zones)
  deep: "#0B0D10", // --deep / --black: page background
  deepRaised: "#12161C", // --deep-raised: panels
  deepPanel: "#171C23", // --deep-panel: nested panels
  graphite: "#15191F",
  carbon: "#252A31",
  steel: "#69727D", // muted text on dark
  silver: "#B7BEC7", // secondary text on dark
  offwhite: "#F7F8FA", // primary text on dark
  inkInverseMuted: "#98A0AA",

  // the single "signal" colour — used only for activity
  accent: "#71859E",
  accentStrong: "#55677D",

  // semantic — status dots only, never decoration
  success: "#2E7D32",
  warning: "#F59E08",
  error: "#EF4444",
  info: "#3B82F6",

  lineDark: "rgba(255,255,255,0.08)",
  lineDarkStrong: "rgba(255,255,255,0.14)",

  // logo, inverse tone
  logoRibbon: "#F7F8FA",
  logoLeg: "#8A929C",
} as const;

export const radius = { xs: 4, sm: 6, md: 8, lg: 10 } as const;

/** The site's ordered background grid: one 56px cell, ~4% white on dark. */
export const grid = { cell: 56, opacity: 0.04 } as const;

export const font = {
  // Both OFL (Google Fonts) — safe to embed. Loaded in src/brand/fonts.ts.
  fa: "Vazirmatn",
  latin: "Manrope",
  weights: { regular: 400, medium: 500, semibold: 600, bold: 700, display: 800 },
} as const;

/**
 * Persian type scale for 1080×1920. Vazirmatn needs zero tracking and a
 * looser line-height than Latin (globals.css: fa display 1.28, h2 1.32).
 */
export const type = {
  display: { fontSize: 92, lineHeight: 1.32, fontWeight: 700 },
  h2: { fontSize: 68, lineHeight: 1.36, fontWeight: 700 },
  h3: { fontSize: 46, lineHeight: 1.5, fontWeight: 700 },
  body: { fontSize: 36, lineHeight: 1.7, fontWeight: 500 },
  label: { fontSize: 30, lineHeight: 1.6, fontWeight: 600 },
  caption: { fontSize: 58, lineHeight: 1.55, fontWeight: 700 },
} as const;

/** --ease-flow. No bounce anywhere in the brand. */
export const easeFlow = Easing.bezier(0.22, 0.61, 0.36, 1);
/** Spring config for the few springs we use: heavily damped, no overshoot. */
export const springFlow = { damping: 200, stiffness: 120, mass: 1 } as const;

export const video = { width: 1080, height: 1920, fps: 30 } as const;

/**
 * Instagram Reels safe zones. Nothing that matters goes outside `safe`.
 * The right inset is wider: that's where IG stacks like/comment/share.
 */
export const safe = {
  top: 250,
  bottom: 380,
  left: 72,
  right: 150,
} as const;

/** Vertical bands inside the safe area, so headlines and captions never collide. */
export const bands = {
  headline: { top: 290, height: 470 }, // 290 → 760
  stage: { top: 640, height: 640 }, // 640 → 1280 (visuals; may sit under headline edge)
  caption: { top: 1300, height: 240 }, // 1300 → 1540 (= 1920 - safe.bottom)
} as const;

export const safeBox = {
  left: safe.left,
  right: video.width - safe.right,
  width: video.width - safe.left - safe.right,
} as const;
