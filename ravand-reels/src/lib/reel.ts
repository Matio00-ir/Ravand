/**
 * The data model every reel shares, and the merge of
 *   content (copy)  +  generated timing  +  manual override
 * into one resolved timeline the composition renders from.
 */
import { bare, endsClause } from "./persian";

// ---------- content: src/content/<reel>.json ----------

export type Segment = {
  id: string;
  vo: string;
  pauseAfter?: number;
  /** false = no burned-in captions for this segment (e.g. the headline already says it) */
  captions?: boolean;
};

export type SceneSpec = {
  id: string;
  component: string;
  segment: string;
  startsAtZero?: boolean;
  props: Record<string, unknown> & { beats?: Record<string, string> };
};

export type Content = {
  id: string;
  title: string;
  ctaKeyword: string;
  tagline: string;
  audio: { voiceStartsAt: number; tail: number; musicVolume: number; musicDuckedVolume: number };
  tts: { voice: string; rate?: string };
  segments: Segment[];
  scenes: SceneSpec[];
};

// ---------- timing: src/timing/<reel>.json (generated) ----------

export type Word = { w: string; s: number; e: number };
export type TimedSegment = { id: string; start: number; end: number; words: Word[] };
export type Timing = {
  reel: string;
  audio: string;
  source: "tts" | "whisper" | "manual";
  duration: number;
  segments: TimedSegment[];
};

// ---------- override: src/timing/<reel>.override.json (hand-edited) ----------

export type Override = {
  _doc?: string;
  /** use a different audio file than the generated timing says */
  audio?: string;
  /** shift every word of a segment by N seconds */
  shift?: Record<string, number>;
  /** pin single words: key "<segmentId>/<wordIndex>" (0-based) */
  words?: Record<string, { s?: number; e?: number }>;
};

export function applyOverride(t: Timing, o: Override | null): Timing {
  if (!o) return t;
  const segments = t.segments.map((seg) => {
    const shift = o.shift?.[seg.id] ?? 0;
    const words = seg.words.map((w, i) => {
      const pin = o.words?.[`${seg.id}/${i}`];
      return { w: w.w, s: pin?.s ?? w.s + shift, e: pin?.e ?? w.e + shift };
    });
    return { ...seg, start: words[0].s, end: words[words.length - 1].e, words };
  });
  return { ...t, audio: o.audio ?? t.audio, segments };
}

// ---------- resolved timeline (all times in composition seconds) ----------

export type ResolvedScene = SceneSpec & {
  from: number; // seconds
  to: number;
  segmentTiming: TimedSegment;
  /** beat name → composition second at which that script word starts */
  beatAt: Record<string, number>;
};

export type Resolved = {
  content: Content;
  timing: Timing; // already offset into composition time
  duration: number;
  scenes: ResolvedScene[];
};

export function resolve(content: Content, rawTiming: Timing, override: Override | null): Resolved {
  const merged = applyOverride(rawTiming, override);
  const off = content.audio.voiceStartsAt;
  const timing: Timing = {
    ...merged,
    segments: merged.segments.map((s) => ({
      ...s,
      start: s.start + off,
      end: s.end + off,
      words: s.words.map((w) => ({ ...w, s: w.s + off, e: w.e + off })),
    })),
  };
  const lastWord = timing.segments[timing.segments.length - 1].end;
  const duration = Math.max(off + merged.duration, lastWord) + content.audio.tail;

  const segById = (id: string) => {
    const s = timing.segments.find((x) => x.id === id);
    if (!s) throw new Error(`scene references unknown segment "${id}"`);
    return s;
  };

  const scenes: ResolvedScene[] = content.scenes.map((spec, i) => {
    const seg = segById(spec.segment);
    // A scene starts a beat before its VO, so the picture leads the voice.
    const LEAD = 0.25;
    const from = spec.startsAtZero || i === 0 ? 0 : Math.max(0, seg.start - LEAD);
    const beatAt: Record<string, number> = {};
    for (const [name, word] of Object.entries(spec.props.beats ?? {})) {
      const hit = seg.words.find((w) => bare(w.w) === bare(word));
      if (!hit) throw new Error(`beat "${name}" → word "${word}" not found in segment "${seg.id}"`);
      beatAt[name] = hit.s;
    }
    return { ...spec, from, to: 0, segmentTiming: seg, beatAt };
  });
  scenes.forEach((s, i) => (s.to = i < scenes.length - 1 ? scenes[i + 1].from : duration));

  return { content, timing, duration, scenes };
}

// ---------- caption groups ----------

export type CaptionGroup = { segment: string; words: Word[]; start: number; end: number };

/**
 * 3–5 words per caption. Groups never cross a sentence end; within a clause
 * run the words are split evenly so we don't leave a 1-word orphan.
 */
export function captionGroups(timing: Timing, content: Content): CaptionGroup[] {
  const out: CaptionGroup[] = [];
  for (const seg of timing.segments) {
    const spec = content.segments.find((s) => s.id === seg.id);
    if (spec?.captions === false) continue;

    // split into runs at clause ends
    const runs: Word[][] = [];
    let cur: Word[] = [];
    for (const w of seg.words) {
      cur.push(w);
      if (endsClause(w.w)) {
        runs.push(cur);
        cur = [];
      }
    }
    if (cur.length) runs.push(cur);

    // fold tiny runs (≤2 words) into the previous run; the even split below re-balances sizes
    const merged: Word[][] = [];
    for (const r of runs) {
      const prev = merged[merged.length - 1];
      if (prev && (r.length <= 2 || prev.length <= 2)) {
        merged[merged.length - 1] = [...prev, ...r];
      } else merged.push(r);
    }

    for (const r of merged) {
      const k = Math.ceil(r.length / 5);
      const base = Math.floor(r.length / k);
      let extra = r.length % k;
      let i = 0;
      for (let g = 0; g < k; g++) {
        const size = base + (extra-- > 0 ? 1 : 0);
        const words = r.slice(i, i + size);
        i += size;
        out.push({ segment: seg.id, words, start: words[0].s, end: words[words.length - 1].e });
      }
    }
  }
  // Hold each caption until the next one starts (bridging short gaps), max +0.6s.
  out.forEach((g, i) => {
    const next = out[i + 1];
    const hold = g.end + 0.6;
    g.end = next && next.segment === g.segment ? next.start : next ? Math.min(hold, next.start) : hold;
  });
  return out;
}
