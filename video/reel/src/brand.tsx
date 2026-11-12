import { loadFont as loadVazirmatn } from "@remotion/google-fonts/Vazirmatn";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SYMBOL, WORDMARK, WORDMARK_FA } from "./marks";

// RAVAND brand system — photo/color palette.JPG, photo/typography.JPG, web/app/globals.css
export const C = {
  black: "#0B0D10",
  graphite: "#15191F",
  carbon: "#252A31",
  steel: "#69727D",
  silver: "#B7BEC7",
  offwhite: "#F7F8FA",
  accent: "#71859E",
  raised: "#12161C",
  panel: "#171C23",
  muted: "#98A0AA",
  line: "rgba(255,255,255,0.08)",
  lineStrong: "rgba(255,255,255,0.14)",
  success: "#2E7D32",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
};

export const fa = loadVazirmatn("normal", { weights: ["400", "500", "600", "700"], subsets: ["arabic", "latin"] }).fontFamily;
export const en = loadManrope("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] }).fontFamily;

// --ease-flow: cubic-bezier(0.22, 0.61, 0.36, 1)
export const FLOW = Easing.bezier(0.22, 0.61, 0.36, 1);

export const useSec = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return f / fps;
};

/** 0→1 over [t0, t0+d] with the brand ease. */
export const prog = (t: number, t0: number, d = 0.22) =>
  interpolate(t, [t0, t0 + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: FLOW });

export const faNum = (n: number) => Math.round(n).toLocaleString("fa-IR");
export const faDigits = (s: string | number) => String(s).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

/** Rails — the continuous structural grid, and a whisper of grain. */
export const Backdrop: React.FC = () => (
  <AbsoluteFill style={{ background: C.black }}>
    {[0, 25, 50, 75, 100].map((p) => (
      <div key={p} style={{ position: "absolute", top: 0, bottom: 0, width: 1, background: C.line,
        left: `calc(64px + (100% - 128px) * ${p / 100})` }} />
    ))}
    <AbsoluteFill style={{ opacity: 0.05, backgroundImage: "radial-gradient(rgba(255,255,255,.6) 1px, transparent 1px)", backgroundSize: "4px 4px" }} />
  </AbsoluteFill>
);

export const Symbol: React.FC<{ size: number; legT?: number; ribT?: number; style?: React.CSSProperties }> = ({ size, legT = 1, ribT = 1, style }) => (
  <svg viewBox={`0 0 ${SYMBOL.w} ${SYMBOL.h}`} style={{ width: size, overflow: "visible", ...style }}>
    <path d={SYMBOL.leg} fill="#8A929C" fillRule="evenodd"
      style={{ opacity: legT, transform: `translate(${(1 - legT) * 22}px, ${(1 - legT) * 20}px)` }} />
    <path d={SYMBOL.ribbon} fill={C.offwhite} fillRule="evenodd"
      style={{ opacity: ribT, transform: `translate(${(1 - ribT) * -24}px, ${(1 - ribT) * -16}px)` }} />
  </svg>
);

/** Bilingual lockup: symbol + RAVAND | روند — the real traced marks. */
export const Lockup: React.FC<{ height: number }> = ({ height }) => (
  <div style={{ display: "flex", alignItems: "center", gap: height * 0.45, direction: "ltr" }}>
    <Symbol size={height * 1.15} />
    <svg viewBox={`0 0 ${WORDMARK.w} ${WORDMARK.h}`} style={{ height: height * 0.52 }}>
      <path d={WORDMARK.d} fill={C.offwhite} fillRule="evenodd" />
    </svg>
    <div style={{ width: 2, height: height * 0.8, background: C.steel }} />
    <svg viewBox={`0 0 ${WORDMARK_FA.w} ${WORDMARK_FA.h}`} style={{ height: height * 0.78 }}>
      <path d={WORDMARK_FA.d} fill={C.offwhite} fillRule="evenodd" />
    </svg>
  </div>
);

/** Panel matching the product surface: raised graphite, hairline, 10px radius. */
export const Panel: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div style={{ background: C.raised, border: `1px solid ${C.lineStrong}`, borderRadius: 10,
    boxShadow: "0 40px 90px rgba(0,0,0,.55)", overflow: "hidden", ...style }}>{children}</div>
);

/** Brand parallelogram plane (PlaneStack). */
export const Plane: React.FC<{ w?: number; h?: number; color?: string; style?: React.CSSProperties; children?: React.ReactNode }> =
  ({ w = 330, h = 150, color = C.carbon, style, children }) => (
    <div style={{ position: "absolute", width: w, height: h, background: color,
      clipPath: "polygon(22% 0, 100% 0, 78% 100%, 0 100%)", display: "flex", alignItems: "center",
      justifyContent: "center", ...style }}>{children}</div>
  );
