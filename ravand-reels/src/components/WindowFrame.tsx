import { fa } from "../brand/fonts";
import { LogoMark } from "../brand/Logo";
import { color, radius } from "../theme";

/**
 * A product window in the site's panel style (panel--dark: deep-raised,
 * 1px hairline, radius-lg). Title bar carries the RAVAND symbol, not OS chrome.
 */
export const WindowFrame: React.FC<{
  title: string;
  width: number;
  height: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ title, width, height, style, children }) => (
  <div
    style={{
      position: "absolute",
      width,
      height,
      borderRadius: radius.lg + 4,
      border: `1px solid ${color.lineDarkStrong}`,
      background: color.deepRaised,
      overflow: "hidden",
      boxShadow: "0 40px 80px rgba(0,0,0,0.45)",
      display: "flex",
      flexDirection: "column",
      ...style,
    }}
  >
    <div
      style={{
        height: 72,
        flexShrink: 0,
        borderBottom: `1px solid ${color.lineDark}`,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 26px",
        direction: "rtl",
        fontFamily: fa,
        fontSize: 26,
        fontWeight: 600,
        color: color.silver,
      }}
    >
      <LogoMark height={26} />
      <span>{title}</span>
    </div>
    <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>{children}</div>
  </div>
);
