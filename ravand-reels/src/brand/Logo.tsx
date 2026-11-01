import { SYMBOL, WORDMARK, WORDMARK_FA } from "./marks";
import { color } from "../theme";

/** The traced RAVAND symbol (inverse tone, as on the site's dark zones). */
export const LogoMark: React.FC<{ height: number; legOpacity?: number; ribbonOpacity?: number }> = ({
  height,
  legOpacity = 1,
  ribbonOpacity = 1,
}) => (
  <svg viewBox={`0 0 ${SYMBOL.w} ${SYMBOL.h}`} style={{ height, width: (height * SYMBOL.w) / SYMBOL.h }}>
    <path d={SYMBOL.leg} fill={color.logoLeg} fillRule="evenodd" clipRule="evenodd" opacity={legOpacity} />
    <path d={SYMBOL.ribbon} fill={color.logoRibbon} fillRule="evenodd" clipRule="evenodd" opacity={ribbonOpacity} />
  </svg>
);

export const Wordmark: React.FC<{ height: number }> = ({ height }) => (
  <svg viewBox={`0 0 ${WORDMARK.w} ${WORDMARK.h}`} style={{ height, width: (height * WORDMARK.w) / WORDMARK.h }}>
    <path d={WORDMARK.d} fill={color.offwhite} fillRule="evenodd" clipRule="evenodd" />
  </svg>
);

export const WordmarkFa: React.FC<{ height: number }> = ({ height }) => (
  <svg viewBox={`0 0 ${WORDMARK_FA.w} ${WORDMARK_FA.h}`} style={{ height, width: (height * WORDMARK_FA.w) / WORDMARK_FA.h }}>
    <path d={WORDMARK_FA.d} fill={color.offwhite} fillRule="evenodd" clipRule="evenodd" />
  </svg>
);

/** Bilingual lockup from the identity: symbol · RAVAND | روند (always LTR as a unit). */
export const Lockup: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <div style={{ direction: "ltr", display: "flex", alignItems: "center", gap: 26 * scale }}>
    <LogoMark height={52 * scale} />
    <Wordmark height={26 * scale} />
    <div style={{ width: 2 * scale, height: 36 * scale, background: "rgba(255,255,255,0.25)" }} />
    <WordmarkFa height={31 * scale} />
  </div>
);
