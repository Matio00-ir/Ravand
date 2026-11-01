"use client";

import { MotionPlayer } from "@/components/product/MotionPlayer";
import { HeroMotion, HERO_MOTION, type HeroMotionProps } from "@/remotion/HeroMotion";

/** The hero's live dashboard; reduced motion shows the fully-assembled panel. */
export function HeroMotionPlayer({ label, ...props }: HeroMotionProps & { label: string }) {
  return (
    <MotionPlayer
      component={HeroMotion}
      inputProps={props}
      {...HERO_MOTION}
      stillFrame={330}
      label={label}
      className="overflow-hidden rounded-[var(--radius-lg)] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]"
    />
  );
}
