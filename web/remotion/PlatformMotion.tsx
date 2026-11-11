import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ModuleIcon, type ModuleKey } from "../components/system/ModuleIcon";

/**
 * The platform section's motion: one sales order travels through the
 * modules it touches — sales → inventory → finance → analytics — along a
 * single hairline. Each module lights up as the data reaches it and shows
 * what it recorded. The point: enter once, everything updates.
 *
 * Two layouts of the same story: a row for wide screens, a column for
 * phones. Composition pixels; the Player scales to fit.
 */

export const PLATFORM_MOTION = {
  wide: { width: 1200, height: 380 },
  tall: { width: 600, height: 1000 },
  fps: 30,
  durationInFrames: 360,
} as const;

export type PlatformMotionProps = {
  locale: "fa" | "en";
  layout: "wide" | "tall";
  caption: string;
  waiting: string;
  steps: { key: ModuleKey; code: string; name: string; event: string; meta: string }[];
};

const C = {
  card: "#ffffff",
  line: "rgba(11,13,16,0.09)",
  lineStrong: "rgba(11,13,16,0.16)",
  ink: "#0b0d10",
  muted: "#69727d",
  faint: "rgba(11,13,16,0.05)",
  accent: "#55677d",
  live: "#2e7d32",
};

// timeline (frames @30fps)
const START = 18;
const STEP = 62; // one module to the next
const TRAVEL = 34; // pulse travel time along a connector
const FADE_OUT = 330;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.22, 0.61, 0.36, 1);

type Box = { x: number; y: number; w: number; h: number };

function layoutBoxes(layout: PlatformMotionProps["layout"], rtl: boolean, n: number): Box[] {
  if (layout === "wide") {
    const w = 246;
    const gap = (PLATFORM_MOTION.wide.width - n * w) / (n - 1);
    return Array.from({ length: n }, (_, i) => {
      const x = i * (w + gap);
      return { x: rtl ? PLATFORM_MOTION.wide.width - w - x : x, y: 24, w, h: 260 };
    });
  }
  const h = 190;
  const gap = 42;
  return Array.from({ length: n }, (_, i) => ({ x: 0, y: i * (h + gap), w: 600, h }));
}

export const PlatformMotion: React.FC<PlatformMotionProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const rtl = p.locale === "fa";
  const wide = p.layout === "wide";
  const boxes = layoutBoxes(p.layout, rtl, p.steps.length);
  const exit = interpolate(frame, [FADE_OUT, durationInFrames], [1, 0], clamp);
  const at = (i: number) => START + i * STEP;

  const captionIn = interpolate(frame, [at(p.steps.length - 1) + 30, at(p.steps.length - 1) + 50], [0, 1], {
    ...clamp,
    easing: ease,
  });

  return (
    <AbsoluteFill
      dir={rtl ? "rtl" : "ltr"}
      style={{
        fontFamily: rtl
          ? "var(--font-vazirmatn, Vazirmatn), system-ui, sans-serif"
          : "var(--font-manrope, Manrope), system-ui, sans-serif",
        color: C.ink,
      }}
    >
      {/* connectors: a resting hairline, and the data drawn over it */}
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
        aria-hidden="true"
      >
        {boxes.slice(0, -1).map((a, i) => {
          const b = boxes[i + 1];
          const [x1, y1, x2, y2] = wide
            ? [rtl ? a.x : a.x + a.w, a.y + a.h / 2, rtl ? b.x + b.w : b.x, b.y + b.h / 2]
            : [a.x + a.w / 2, a.y + a.h, b.x + b.w / 2, b.y];
          const t = interpolate(frame, [at(i) + 14, at(i) + 14 + TRAVEL], [0, 1], { ...clamp, easing: ease });
          const px = x1 + (x2 - x1) * t;
          const py = y1 + (y2 - y1) * t;
          const pulse = t > 0 && t < 1 ? 1 : 0;
          return (
            <g key={i} opacity={exit}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.lineStrong} strokeWidth={1.5} strokeDasharray="3 5" />
              <line x1={x1} y1={y1} x2={px} y2={py} stroke={C.accent} strokeWidth={2} />
              <circle cx={px} cy={py} r={9} fill={C.accent} opacity={0.18 * pulse} />
              <circle cx={px} cy={py} r={4} fill={C.accent} opacity={pulse} />
            </g>
          );
        })}
      </svg>

      {p.steps.map((s, i) => (
        <ModuleCard key={s.key} step={s} box={boxes[i]} activeAt={at(i)} frame={frame} fps={fps} exit={exit} waiting={p.waiting} wide={wide} />
      ))}

      <div
        style={{
          position: "absolute",
          insetInline: 0,
          bottom: wide ? 14 : 8,
          paddingInline: 24,
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
          fontSize: wide ? 21 : 26,
          lineHeight: 1.5,
          fontWeight: 600,
          color: C.ink,
          opacity: captionIn * exit,
          transform: `translateY(${(1 - captionIn) * 10}px)`,
        }}
      >
        {wide ? <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: 99, background: C.live }} /> : null}
        <span>{p.caption}</span>
      </div>
    </AbsoluteFill>
  );
};

const ModuleCard: React.FC<{
  step: PlatformMotionProps["steps"][number];
  box: Box;
  activeAt: number;
  frame: number;
  fps: number;
  exit: number;
  waiting: string;
  wide: boolean;
}> = ({ step, box, activeAt, frame, fps, exit, waiting, wide }) => {
  const enter = interpolate(frame, [0, 16], [0, 1], { ...clamp, easing: ease });
  const on = spring({ frame: frame - activeAt, fps, config: { damping: 200 }, durationInFrames: 18 });
  const ring = interpolate(frame, [activeAt, activeAt + 8, activeAt + 40], [0, 1, 0], clamp);
  const text = interpolate(frame, [activeAt + 6, activeAt + 22], [0, 1], { ...clamp, easing: ease });
  const iconColor = on > 0.5 ? C.ink : C.muted;

  return (
    <div
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        boxSizing: "border-box",
        padding: wide ? "24px 22px 22px" : "26px 30px",
        background: C.card,
        border: `1px solid ${on > 0.5 ? C.lineStrong : C.line}`,
        borderRadius: 10,
        boxShadow: `0 0 0 ${4 * ring}px rgba(85,103,125,${0.18 * ring}), 0 ${18 * on}px ${40 * on}px -24px rgba(11,13,16,${0.35 * on})`,
        opacity: enter * exit,
        transform: `translateY(${(1 - enter) * 12 - on * 4}px)`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Icon only: the module code (ANL, FIN…) means nothing to a
          Persian-speaking owner — same rule as the module cards. */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <ModuleIcon name={step.key} style={{ width: 26, height: 26, color: iconColor }} />
      </div>
      <div style={{ marginTop: wide ? 18 : 12, fontSize: 26, fontWeight: 700 }}>{step.name}</div>

      <div style={{ marginTop: "auto", position: "relative", minHeight: wide ? 96 : 70 }}>
        {/* resting state */}
        <div style={{ position: "absolute", inset: 0, opacity: 1 - text, display: "flex", flexDirection: "column", gap: 10, justifyContent: "flex-end" }}>
          <span style={{ fontSize: 15, color: C.muted }}>{waiting}</span>
          <span style={{ height: 8, width: "70%", borderRadius: 4, background: C.faint }} />
        </div>
        {/* what this module recorded */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: text,
            transform: `translateY(${(1 - text) * 8}px)`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <span style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: wide ? 18 : 20, fontWeight: 600, lineHeight: 1.45 }}>
            <span style={{ flexShrink: 0, width: 8, height: 8, marginTop: wide ? 9 : 10, borderRadius: 99, background: C.live }} />
            {step.event}
          </span>
          <span style={{ fontSize: 15, color: C.muted, paddingInlineStart: 18 }}>{step.meta}</span>
        </div>
      </div>
    </div>
  );
};
