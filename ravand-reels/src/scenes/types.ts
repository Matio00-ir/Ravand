import type { Resolved, ResolvedScene } from "../lib/reel";

/** Every scene gets its resolved spec (times in composition seconds) and the whole reel. */
export type SceneProps = {
  scene: ResolvedScene;
  resolved: Resolved;
  /** cover/still mode: show the scene's "key state" regardless of time */
  cover?: boolean;
};
