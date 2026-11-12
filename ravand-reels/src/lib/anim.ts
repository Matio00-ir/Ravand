import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { easeFlow } from "../theme";
import type { ResolvedScene } from "./reel";

/** Absolute composition time (seconds) inside a scene's <Sequence>. */
export const useSceneTime = (scene: ResolvedScene): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return scene.from + frame / fps;
};

/** 0→1 progress of [start, start+dur] with the brand's --ease-flow. */
export const prog = (t: number, start: number, dur: number, easing = easeFlow): number =>
  interpolate(t, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export const mix = (a: number, b: number, p: number): number => a + (b - a) * p;
