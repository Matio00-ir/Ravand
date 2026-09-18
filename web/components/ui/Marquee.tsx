import { type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * An infinite horizontal strip: the children are laid out twice, back to
 * back, and slid left by exactly one copy's width plus the gap — so the
 * loop point is invisible. `--gap`/`--duration` drive both the flex gap
 * and the CSS animation in globals.css, kept in sync from one prop each.
 * Forced to `dir="ltr"`: the loop math assumes an LTR flex order, and on
 * an RTL page the inherited `dir` would mirror the two duplicated tracks
 * and desync the forward/reverse rows from each other.
 */
export function Marquee({
  children,
  reverse = false,
  pauseOnHover = true,
  duration = 40,
  gap = 24,
  className,
}: {
  children: ReactNode;
  reverse?: boolean;
  pauseOnHover?: boolean;
  duration?: number;
  gap?: number;
  className?: string;
}) {
  const trackStyle = {
    gap: `${gap}px`,
    "--gap": `${gap}px`,
    "--duration": `${duration}s`,
  } as CSSProperties;

  return (
    <div
      dir="ltr"
      className={cn("group flex w-full overflow-hidden", className)}
      style={{ gap: `${gap}px` }}
    >
      {[0, 1].map((i) => (
        <div
          key={i}
          aria-hidden={i === 1}
          className={cn(
            "flex shrink-0 items-stretch",
            reverse ? "animate-marquee-reverse" : "animate-marquee",
            pauseOnHover && "group-hover:[animation-play-state:paused]"
          )}
          style={trackStyle}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
