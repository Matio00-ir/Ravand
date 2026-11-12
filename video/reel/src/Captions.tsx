import { C, fa, prog, useSec } from "./brand";

type Word = { t: number; d: number; w: string };
type Seg = { id: string; start: number; end: number; words: Word[] };

// Pain words glow in the semantic error red; the product's promise sits on an off-white chip.
const PAIN = new Set(["پول", "ضرر", "زنگ", "دیگه", "تیکه‌تیکه‌ست", "اکسل", "جواب"]);
const PROMISE = new Set(["روند", "یه‌جا", "لحظه‌ای", "دمو", "رایگانِ"]);

type Chunk = { start: number; end: number; words: Word[]; seg: string };

export function chunk(segs: Seg[]): Chunk[] {
  const out: Chunk[] = [];
  for (const s of segs) {
    let cur: Word[] = [];
    const flush = () => { if (cur.length) out.push({ start: cur[0].t, end: 0, words: cur, seg: s.id }); cur = []; };
    for (const w of s.words) {
      const len = cur.reduce((a, x) => a + x.w.length, 0);
      const prev = cur[cur.length - 1];
      if (cur.length >= 3 || len + w.w.length > 17 || (prev && w.t - (prev.t + prev.d) > 0.28)) flush();
      cur.push(w);
    }
    flush();
  }
  out.forEach((c, i) => {
    const last = c.words[c.words.length - 1];
    const next = out[i + 1];
    c.end = next ? Math.min(next.start, last.t + last.d + 0.6) : last.t + last.d + 0.6;
  });
  return out;
}

export const Captions: React.FC<{ segs: Seg[]; top: (segId: string) => number; size: (segId: string) => number }> = ({ segs, top, size }) => {
  const t = useSec();
  const chunks = chunk(segs);
  const c = chunks.find((k) => t >= k.start - 0.04 && t < k.end);
  if (!c) return null;
  // the very first chunk is fully on at frame 0 — the opening frame is the thumbnail people judge
  const pop = c.start < 0.1 ? 1 : prog(t, c.start - 0.04, 0.15);
  const fs = size(c.seg);
  return (
    <div style={{ position: "absolute", top: top(c.seg), left: 70, right: 160, display: "flex", justifyContent: "center" }}>
      <div style={{ direction: "rtl", fontFamily: fa, fontWeight: 700, fontSize: fs, lineHeight: 1.45,
        textAlign: "center", padding: "10px 30px", borderRadius: 14, background: "rgba(11,13,16,0.72)",
        transform: `scale(${0.92 + 0.08 * pop}) translateY(${(1 - pop) * 14}px)`, opacity: pop,
        display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `0 ${fs * 0.26}px` }}>
        {c.words.map((w, i) => {
          const on = t >= w.t - 0.03;
          const pain = PAIN.has(w.w), promise = PROMISE.has(w.w);
          const hot = on && (pain || promise);
          return (
            <span key={i} style={{
              color: hot ? (promise ? C.black : C.offwhite) : on ? C.offwhite : "rgba(247,248,250,0.38)",
              background: hot ? (promise ? C.offwhite : C.error) : "transparent",
              borderRadius: 10, padding: hot ? `0 ${fs * 0.16}px` : 0,
              transform: `scale(${on ? 1 : 0.96})`, display: "inline-block",
            }}>{w.w}</span>
          );
        })}
      </div>
    </div>
  );
};
