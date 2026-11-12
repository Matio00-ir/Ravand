/**
 * Building blocks for the landscape (1920×1080) ERP promo.
 * Same RAVAND tokens as the reels; Persian text is only ever split on spaces.
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fa } from "../brand/fonts";
import { display, splitWords } from "../lib/persian";
import { color, easeFlow, grid } from "../theme";

export const W = 1920;
export const H = 1080;
export const FPS = 30;

/** 0→1 over [start, start+dur] seconds with --ease-flow. */
export const p = (t: number, start: number, dur: number) =>
  interpolate(t, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFlow });

/** Seconds since the enclosing <Sequence> started. */
export const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

/** Dark zone + the brand's 56px grid, slowly drifting, faded to the edges. */
export const Stage: React.FC<{ drift?: boolean }> = ({ drift = true }) => {
  const t = useT();
  const off = drift ? (t * 6) % grid.cell : 0;
  return (
    <AbsoluteFill style={{ background: color.deep }}>
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: `${grid.cell}px ${grid.cell}px`,
          backgroundPosition: `${off}px ${off}px`,
          opacity: grid.opacity,
          maskImage: "radial-gradient(ellipse 75% 70% at 50% 50%, #000 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 75% 70% at 50% 50%, #000 30%, transparent 100%)",
        }}
      />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(113,133,158,0.10), transparent 70%)" }}
      />
    </AbsoluteFill>
  );
};

/** Persian line revealed word by word (whole words — Arabic script must never be split into letters). */
export const Words: React.FC<{
  text: string;
  t: number;
  at: number;
  size: number;
  weight?: number;
  color?: string;
  stagger?: number;
  align?: "center" | "flex-start" | "flex-end";
  highlight?: string[];
  lineHeight?: number;
}> = ({ text, t, at, size, weight = 700, color: c = color.offwhite, stagger = 0.06, align = "center", highlight = [], lineHeight = 1.45 }) => (
  <div
    style={{
      direction: "rtl",
      display: "flex",
      flexWrap: "wrap",
      justifyContent: align,
      columnGap: size * 0.26,
      fontFamily: fa,
      fontSize: size,
      fontWeight: weight,
      lineHeight,
      letterSpacing: 0,
    }}
  >
    {splitWords(display(text)).map((w, i) => {
      const k = p(t, at + i * stagger, 0.42);
      const hot = highlight.some((h) => w.includes(h));
      return (
        <span
          key={i}
          style={{
            display: "inline-block",
            opacity: k,
            translate: `0 ${(1 - k) * size * 0.3}px`,
            color: hot ? color.offwhite : c,
            ...(hot
              ? { background: `linear-gradient(transparent 84%, rgba(113,133,158,${0.9 * k}) 84%, rgba(113,133,158,${0.9 * k}) 92%, transparent 92%)`, padding: "0 4px" }
              : {}),
          }}
        >
          {w}
        </span>
      );
    })}
  </div>
);

/** Monoline icons in the RAVAND grammar: 20-unit grid, square caps, mitred joins. No arrows/checks/gears. */
const ICONS: Record<string, string[]> = {
  message: ["M2.5 3.5h15v10H8l-4 3.5v-3.5H2.5z"],
  inventory: ["M2.5 5.5h15v12h-15z", "M2.5 10h15", "M10 10v7.5", "M6.5 2.5h7v3h-7z"],
  calc: ["M4.5 2.5h11v15h-11z", "M7 5.5h6v3H7z", "M7 11.5h1.5M11.5 11.5H13M7 14.5h1.5M11.5 14.5H13"],
  tag: ["M2.5 2.5h7l8 8-7 7-8-8z", "M6 6h1.5v1.5H6z"],
  bucket: ["M4 6.5h12l-1.5 11h-9z", "M4 6.5C4 3 16 3 16 6.5", "M7 11h6"],
  invoice: ["M4.5 2.5h11v15l-2-1.5-2 1.5-1.5-1.5-1.5 1.5-2-1.5-2 1.5z", "M7.5 6.5h5M7.5 9.5h5M7.5 12.5h3"],
  sales: ["M2.5 17.5h4.5V13h4.5V8.5h4.5V4", "M2.5 17.5h15"],
  finance: ["M2.5 2.5v15h15", "M5.5 13.5 9 9.5l3 2.5 4.5-6.5"],
};
export type IconName = "message" | "inventory" | "calc" | "tag" | "bucket" | "invoice" | "sales" | "finance";

/** Icon whose strokes draw in (pathLength-normalised dash). */
export const DrawIcon: React.FC<{ name: IconName; size: number; t: number; at: number; stroke?: string; width?: number }> = ({
  name,
  size,
  t,
  at,
  stroke = color.silver,
  width = 1.1,
}) => {
  const k = p(t, at, 0.9);
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke={stroke} strokeWidth={width}
      strokeLinecap="square" strokeLinejoin="miter" style={{ overflow: "visible" }}>
      {ICONS[name].map((d, i) => (
        <path key={i} d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
      ))}
    </svg>
  );
};

/** Small uppercase-style label chip. */
export const Kicker: React.FC<{ text: string; t: number; at: number }> = ({ text, t, at }) => {
  const k = p(t, at, 0.4);
  return (
    <div
      style={{
        direction: "rtl",
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        fontFamily: fa,
        fontSize: 26,
        fontWeight: 600,
        color: color.silver,
        opacity: k,
        translate: `${(1 - k) * -16}px 0`,
      }}
    >
      <span style={{ width: 10, height: 10, borderRadius: 2, background: color.accent }} />
      {display(text)}
    </div>
  );
};
