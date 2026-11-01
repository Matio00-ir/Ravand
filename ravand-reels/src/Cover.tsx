import { AbsoluteFill } from "remotion";
import { Backdrop } from "./components/Backdrop";
import { useResolved } from "./Reel";
import { sceneComponents } from "./scenes";

/**
 * Reel cover: the opening scene in its key state (thread stopped on the order
 * message, full hook headline). Everything sits inside the 3:4 centre crop
 * (y 240–1680) that the profile grid shows.
 */
export const Cover: React.FC<{ reel: string }> = ({ reel }) => {
  const resolved = useResolved(reel);
  const first = resolved.scenes[0];
  const Scene = sceneComponents[first.component];
  return (
    <AbsoluteFill>
      <Backdrop />
      <Scene scene={first} resolved={resolved} cover />
    </AbsoluteFill>
  );
};
