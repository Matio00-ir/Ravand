import { Html5Audio as Audio } from "remotion";
import { useMemo } from "react";
import { Sequence, staticFile, useVideoConfig } from "remotion";
import type { Resolved } from "../lib/reel";

/**
 * Voice is primary. The optional music bed (public/audio/music.mp3 — a
 * licensed track you supply) is ducked whenever the voice is speaking,
 * with a short attack and a slower release so it breathes between lines.
 * SFX live inside the scenes that cue them.
 */
export const AudioMix: React.FC<{ resolved: Resolved; hasMusic: boolean }> = ({ resolved, hasMusic }) => {
  const { fps } = useVideoConfig();
  const { content, timing } = resolved;
  const a = content.audio;

  // speech intervals in composition seconds (merge words closer than 0.35s)
  const speech = useMemo(() => {
    const iv: [number, number][] = [];
    for (const w of timing.segments.flatMap((s) => s.words)) {
      const last = iv[iv.length - 1];
      if (last && w.s - last[1] < 0.35) last[1] = w.e;
      else iv.push([w.s, w.e]);
    }
    return iv;
  }, [timing]);

  const musicVolume = (frame: number) => {
    const t = frame / fps;
    const ATTACK = 0.15, RELEASE = 0.6;
    // 1 = fully ducked
    let duck = 0;
    for (const [s, e] of speech) {
      if (t >= s - ATTACK && t <= e + RELEASE) {
        const inn = Math.min(1, (t - (s - ATTACK)) / ATTACK);
        const out = t > e ? 1 - (t - e) / RELEASE : 1;
        duck = Math.max(duck, Math.min(inn, out));
      }
    }
    const fadeIn = Math.min(1, t / 0.8);
    const fadeOut = Math.min(1, (resolved.duration - t) / 1.2);
    return (a.musicVolume + (a.musicDuckedVolume - a.musicVolume) * duck) * fadeIn * Math.max(0, fadeOut);
  };

  return (
    <>
      <Sequence from={Math.round(a.voiceStartsAt * fps)} name="Voice">
        <Audio src={staticFile(timing.audio)} />
      </Sequence>
      {hasMusic ? (
        <Audio src={staticFile("audio/music.mp3")} volume={musicVolume} loop name="Music" />
      ) : null}
    </>
  );
};

/** One-shot sound effect at an absolute composition second (place inside the root, not a scene Sequence). */
export const Sfx: React.FC<{ src: string; at: number; volume?: number; sceneFrom?: number }> = ({
  src,
  at,
  volume = 0.5,
  sceneFrom = 0,
}) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.round((at - sceneFrom) * fps)} layout="none" name={src}>
      <Audio src={staticFile(src)} volume={volume} />
    </Sequence>
  );
};
