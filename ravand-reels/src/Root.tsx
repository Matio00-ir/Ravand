import { Composition, Still } from "remotion";
import { Cover } from "./Cover";
import { Reel, calculateReelMetadata, type ReelProps } from "./Reel";
import { video } from "./theme";

const defaults = (reel: string): ReelProps => ({ reel, hasMusic: false, hasFootage: {}, showSafeZones: false });

export const Root: React.FC = () => (
  <>
    <Composition
      id="reel-01"
      component={Reel}
      width={video.width}
      height={video.height}
      fps={video.fps}
      durationInFrames={60 * video.fps}
      defaultProps={defaults("reel-01")}
      calculateMetadata={calculateReelMetadata}
    />
    <Still id="reel-01-cover" component={Cover} width={video.width} height={video.height} defaultProps={{ reel: "reel-01" }} />
  </>
);
