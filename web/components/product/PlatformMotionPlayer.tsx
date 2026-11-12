"use client";

import { useSyncExternalStore } from "react";
import { MotionPlayer } from "@/components/product/MotionPlayer";
import { PlatformMotion, PLATFORM_MOTION, type PlatformMotionProps } from "@/remotion/PlatformMotion";

/**
 * The platform section's data-flow motion: a row on wide screens, a column
 * on phones, where a row would shrink the text past legibility.
 */
export function PlatformMotionPlayer({
  label,
  wide,
  tall,
}: {
  label: string;
  wide: PlatformMotionProps;
  tall: PlatformMotionProps;
}) {
  const isWide = useSyncExternalStore(subscribe, matchesWide, () => true);
  const size = isWide ? PLATFORM_MOTION.wide : PLATFORM_MOTION.tall;

  return (
    <MotionPlayer
      key={isWide ? "wide" : "tall"}
      component={PlatformMotion}
      inputProps={isWide ? wide : tall}
      {...size}
      fps={PLATFORM_MOTION.fps}
      durationInFrames={PLATFORM_MOTION.durationInFrames}
      stillFrame={300}
      label={label}
      className={isWide ? "w-full" : "mx-auto w-full max-w-sm"}
    />
  );
}

const QUERY = "(min-width: 768px)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function matchesWide() {
  return window.matchMedia(QUERY).matches;
}
