/**
 * Reel registry. A new reel = one content JSON + one generated timing JSON
 * (+ an override file) and three lines here. See README → "Make reel #2".
 */
import type { Content, Override, Timing } from "./lib/reel";
import content01 from "./content/reel-01.json";
import timing01 from "./timing/reel-01.json";
import override01 from "./timing/reel-01.override.json";

export type ReelSource = { content: Content; timing: Timing; override: Override | null };

export const reels: Record<string, ReelSource> = {
  "reel-01": { content: content01 as Content, timing: timing01 as Timing, override: override01 as Override },
};
