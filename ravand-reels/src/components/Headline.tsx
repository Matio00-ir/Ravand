import { fa } from "../brand/fonts";
import { prog } from "../lib/anim";
import { display, splitWords } from "../lib/persian";
import { color, safeBox, type } from "../theme";

export type HeadlineLine = {
  text: string;
  /** composition second at which this line starts revealing; ≤0 = fully visible from the first frame */
  at: number;
  /** optional per-word reveal times (e.g. synced to the voice); overrides the stagger */
  wordAt?: number[];
};

/**
 * Persian headline, revealed by WORD (never by letter — splitting Arabic
 * script into letters breaks its joining). Each word is its own inline-block
 * inside an RTL flex row, so the browser shapes every word whole.
 */
export const Headline: React.FC<{
  t: number;
  lines: HeadlineLine[];
  top: number;
  size?: number;
  weight?: number;
  stagger?: number;
  exitAt?: number;
  tone?: (lineIndex: number) => string;
}> = ({ t, lines, top, size = type.display.fontSize, weight = type.display.fontWeight, stagger = 0.07, exitAt, tone }) => {
  const exit = exitAt === undefined ? 0 : prog(t, exitAt, 0.3);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: safeBox.left,
        width: safeBox.width,
        direction: "rtl",
        fontFamily: fa,
        fontWeight: weight,
        fontSize: size,
        lineHeight: type.display.lineHeight,
        letterSpacing: 0,
        textAlign: "center",
        opacity: 1 - exit,
        translate: `0 ${-12 * exit}px`,
      }}
    >
      {lines.map((line, li) => (
        <div
          key={li}
          style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: size * 0.26 }}
        >
          {splitWords(display(line.text)).map((w, wi) => {
            const start = line.wordAt?.[wi] ?? line.at + wi * stagger;
            const p = line.at <= 0 && !line.wordAt ? 1 : prog(t, start - 0.05, 0.38);
            return (
              <span
                key={wi}
                style={{
                  display: "inline-block",
                  color: tone ? tone(li) : color.offwhite,
                  opacity: p,
                  translate: `0 ${(1 - p) * 0.22 * size}px`,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
