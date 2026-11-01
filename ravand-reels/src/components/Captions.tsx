import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { fa } from "../brand/fonts";
import { prog } from "../lib/anim";
import { captionGroups, type Resolved } from "../lib/reel";
import { display } from "../lib/persian";
import { bands, color, radius, safeBox, type } from "../theme";

/**
 * Burned-in captions: 3–5 script words at a time, current word on an accent
 * chip. Words are the canonical script text (never ASR output); only their
 * timing comes from the audio. Lives in the lower safe band, below every
 * scene's headline band.
 */
export const Captions: React.FC<{ resolved: Resolved }> = ({ resolved }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const groups = useMemo(() => captionGroups(resolved.timing, resolved.content), [resolved]);

  const g = groups.find((x) => t >= x.start - 0.08 && t < x.end);
  if (!g) return null;

  const enter = prog(t, g.start - 0.08, 0.16);
  const size = type.caption.fontSize;
  // the active word: the last one whose start has passed (stays lit through short gaps)
  let active = -1;
  g.words.forEach((w, i) => {
    if (t >= w.s - 0.03) active = i;
  });

  return (
    <div
      style={{
        position: "absolute",
        top: bands.caption.top,
        height: bands.caption.height,
        left: safeBox.left,
        width: safeBox.width,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          direction: "rtl",
          fontFamily: fa,
          fontWeight: 700,
          fontSize: size,
          lineHeight: type.caption.lineHeight,
          letterSpacing: 0,
          textAlign: "center",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          rowGap: 6,
          columnGap: size * 0.12,
          maxWidth: safeBox.width,
          padding: "14px 22px",
          borderRadius: radius.lg,
          background: "rgba(11,13,16,0.78)",
          border: `1px solid ${color.lineDark}`,
          opacity: enter,
          translate: `0 ${(1 - enter) * 10}px`,
        }}
      >
        {g.words.map((w, i) => {
          const on = i === active;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                padding: `0 ${size * 0.16}px`,
                borderRadius: radius.md,
                background: on ? color.accent : "transparent",
                color: color.offwhite,
                opacity: i <= active || active === -1 ? 1 : 0.62,
              }}
            >
              {display(w.w)}
            </span>
          );
        })}
      </div>
    </div>
  );
};
