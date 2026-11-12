import { AbsoluteFill } from "remotion";
import { color, grid } from "../theme";

/**
 * The site's dark zone: deep background + the single ordered 56px grid at
 * ~4%, faded toward the edges (globals.css .grid-bg--dark.grid-bg--fade).
 */
export const Backdrop: React.FC = () => (
  <AbsoluteFill style={{ background: color.deep }}>
    <AbsoluteFill
      style={{
        backgroundImage:
          "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
        backgroundSize: `${grid.cell}px ${grid.cell}px`,
        backgroundPosition: "center top",
        opacity: grid.opacity,
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 45%, #000 35%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 45%, #000 35%, transparent 100%)",
      }}
    />
  </AbsoluteFill>
);
