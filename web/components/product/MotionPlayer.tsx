"use client";

import { useSyncExternalStore, type ComponentType } from "react";
import { Player } from "@remotion/player";

/**
 * Plays a Remotion composition in place as a silent, looping illustration.
 * Visitors who ask for reduced motion get a still of `stillFrame` instead.
 */
export function MotionPlayer<P extends Record<string, unknown>>({
  component,
  inputProps,
  width,
  height,
  fps,
  durationInFrames,
  stillFrame,
  label,
  className,
}: {
  component: ComponentType<P>;
  inputProps: P;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  stillFrame: number;
  label: string;
  className?: string;
}) {
  const reduced = useSyncExternalStore(subscribe, prefersReduced, () => false);

  return (
    // The Player positions its scaled canvas assuming LTR; under the page's
    // RTL it would anchor right and crop the left side. Compositions set
    // their own direction inside.
    <div
      dir="ltr"
      role="img"
      aria-label={label}
      className={className}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <Player
        key={reduced ? "still" : "loop"}
        component={component}
        inputProps={inputProps}
        durationInFrames={durationInFrames}
        compositionWidth={width}
        compositionHeight={height}
        fps={fps}
        initialFrame={reduced ? stillFrame : 0}
        autoPlay={!reduced}
        loop
        controls={false}
        clickToPlay={false}
        doubleClickToFullscreen={false}
        spaceKeyToPlayOrPause={false}
        numberOfSharedAudioTags={0}
        acknowledgeRemotionLicense
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function prefersReduced() {
  return window.matchMedia(QUERY).matches;
}
