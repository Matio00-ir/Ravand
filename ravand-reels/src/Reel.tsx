import { useMemo } from "react";
import { AbsoluteFill, Sequence, useVideoConfig, type CalculateMetadataFunction, staticFile } from "remotion";
import { AudioMix } from "./components/AudioMix";
import { Backdrop } from "./components/Backdrop";
import { Captions } from "./components/Captions";
import { resolve } from "./lib/reel";
import { reels } from "./reels";
import { sceneComponents } from "./scenes";
import { video } from "./theme";

export type ReelProps = {
  reel: string;
  hasMusic: boolean;
  hasFootage: Record<string, boolean>;
  /** draws the IG safe-zone guides (studio only) */
  showSafeZones: boolean;
};

export const useResolved = (reel: string) =>
  useMemo(() => {
    const src = reels[reel];
    if (!src) throw new Error(`unknown reel "${reel}" — register it in src/reels.ts`);
    return resolve(src.content, src.timing, src.override);
  }, [reel]);

export const Reel: React.FC<ReelProps> = ({ reel, hasMusic, hasFootage, showSafeZones }) => {
  const { fps } = useVideoConfig();
  const resolved = useResolved(reel);

  return (
    <AbsoluteFill style={{ background: "#0B0D10" }}>
      <Backdrop />
      {resolved.scenes.map((scene) => {
        const Scene = sceneComponents[scene.component];
        if (!Scene) throw new Error(`unknown scene component "${scene.component}"`);
        const from = Math.round(scene.from * fps);
        const to = Math.round(scene.to * fps);
        return (
          <Sequence key={scene.id} name={scene.id} from={from} durationInFrames={Math.max(1, to - from)} premountFor={fps}>
            <Scene scene={scene} resolved={resolved} hasFootage={hasFootage[String(scene.props.footage)] ?? false} />
          </Sequence>
        );
      })}
      <Captions resolved={resolved} />
      <AudioMix resolved={resolved} hasMusic={hasMusic} />
      {showSafeZones ? <SafeZones /> : null}
    </AbsoluteFill>
  );
};

const SafeZones: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 250, background: "rgba(239,68,68,0.18)" }} />
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 380, background: "rgba(239,68,68,0.18)" }} />
    <div style={{ position: "absolute", top: 250, bottom: 380, right: 0, width: 150, background: "rgba(245,158,8,0.14)" }} />
    <div style={{ position: "absolute", top: 250, bottom: 380, left: 0, width: 72, background: "rgba(245,158,8,0.14)" }} />
  </AbsoluteFill>
);

const exists = async (path: string) => {
  try {
    const r = await fetch(staticFile(path), { method: "HEAD" });
    return r.ok;
  } catch {
    return false;
  }
};

/** Duration follows the voice: voice offset + audio length + tail hold. */
export const calculateReelMetadata: CalculateMetadataFunction<ReelProps> = async ({ props }) => {
  const src = reels[props.reel];
  const r = resolve(src.content, src.timing, src.override);
  const footage = src.content.scenes.map((s) => s.props.footage).filter((x): x is string => typeof x === "string");
  const hasFootage: Record<string, boolean> = {};
  for (const f of footage) hasFootage[f] = await exists(f);
  return {
    durationInFrames: Math.ceil(r.duration * video.fps),
    props: { ...props, hasMusic: await exists("audio/music.mp3"), hasFootage },
  };
};
