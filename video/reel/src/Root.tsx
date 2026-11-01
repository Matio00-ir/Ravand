import { Composition, Still } from "remotion";
import { Reel, TIMELINES, type Variant } from "./Reel";
import { Cover } from "./Cover";
import { RavandFilm } from "./film/RavandFilm";
import { DURATION } from "./film/timeline";

const FPS = 30;

export const Root: React.FC = () => (
  <>
    {(["A", "B", "C"] as Variant[]).map((v) => (
      <Composition
        key={v}
        id={`Reel-${v}`}
        component={Reel}
        durationInFrames={Math.ceil(TIMELINES[v].duration * FPS)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ variant: v }}
      />
    ))}
    <Composition id="RavandFilm" component={RavandFilm} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />
    <Still id="Cover" component={Cover} width={1080} height={1920} />
  </>
);
