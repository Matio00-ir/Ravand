import { cn } from "@/lib/utils";
import { SYMBOL, WORDMARK, WORDMARK_FA } from "@/lib/brand-marks";

/**
 * The real RAVAND marks, traced to vector from the brand artwork in
 * /photo. The symbol is the two-part flowing ribbon (dark body + lighter
 * leg); the wordmark is the custom geometric letterform set — neither is
 * re-created in a system font.
 */

export function LogoMark({
  className,
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "inverse" | "mono";
}) {
  const ribbon =
    tone === "inverse" ? "#F7F8FA" : tone === "mono" ? "currentColor" : "#0B0D10";
  const leg =
    tone === "inverse" ? "#8A929C" : tone === "mono" ? "currentColor" : "#69727D";

  return (
    <svg
      viewBox={`0 0 ${SYMBOL.w} ${SYMBOL.h}`}
      className={cn("h-7 w-auto", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d={SYMBOL.leg} fill={leg} fillRule="evenodd" clipRule="evenodd" />
      <path d={SYMBOL.ribbon} fill={ribbon} fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

export function Wordmark({
  className,
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "inverse";
}) {
  return (
    <svg
      viewBox={`0 0 ${WORDMARK.w} ${WORDMARK.h}`}
      className={cn("h-3 w-auto", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="RAVAND"
    >
      <path
        d={WORDMARK.d}
        fill={tone === "inverse" ? "#F7F8FA" : "#0B0D10"}
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function WordmarkFa({
  className,
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "inverse";
}) {
  return (
    <svg
      viewBox={`0 0 ${WORDMARK_FA.w} ${WORDMARK_FA.h}`}
      className={cn("h-4 w-auto", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="روند"
    >
      <path
        d={WORDMARK_FA.d}
        fill={tone === "inverse" ? "#F7F8FA" : "#0B0D10"}
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * The bilingual lockup from the identity: symbol · RAVAND | روند.
 * `bilingual` shows the Persian half (used in the masthead and footer).
 */
export function Logo({
  className,
  tone = "default",
  bilingual = false,
}: {
  className?: string;
  tone?: "default" | "inverse";
  bilingual?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} dir="ltr">
      <LogoMark tone={tone} className="h-[22px]" />
      <Wordmark tone={tone} className="h-[11px]" />
      {bilingual ? (
        <>
          <span
            aria-hidden="true"
            className={cn(
              "h-4 w-px",
              tone === "inverse" ? "bg-white/25" : "bg-black/20"
            )}
          />
          <WordmarkFa tone={tone} className="h-[13px]" />
        </>
      ) : null}
    </span>
  );
}
