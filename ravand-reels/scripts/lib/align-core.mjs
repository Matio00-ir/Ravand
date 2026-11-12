/**
 * Map observed word/token timings (from TTS boundaries or Whisper) onto the
 * canonical script words. The script text is the only thing ever displayed;
 * observed text is used purely to locate each canonical word in time.
 *
 * Method: normalise both sides to bare Persian letters, align the two letter
 * streams with an edit-distance DP, then give each canonical word the time
 * span of its matched letters. Words with no matched letters (ASR misses,
 * "سیصد" heard as "300", …) are interpolated between their neighbours in
 * proportion to their length.
 */

/** Canonical word split — must match src/lib/persian.ts splitWords(). */
export const splitWords = (text) => text.trim().split(/ +/).filter(Boolean);

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Letters only: drop ZWNJ, diacritics, tatweel, punctuation; unify Arabic/Persian variants. */
export function normalize(s) {
  return s
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ةۀ]/g, "ه")
    .replace(/[أإآ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/[٠-٩]/g, (d) => FA_DIGITS[AR_DIGITS.indexOf(d)])
    .replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)])
    .replace(/[^ء-يپچژکگی۰-۹a-zA-Z]/g, "")
    .toLowerCase();
}

/**
 * @param {{w:string}[]} words canonical words (in order)
 * @param {{text:string,s:number,e:number}[]} tokens observed tokens (in order)
 * @returns {{w:string,s:number,e:number,matched:boolean}[]}
 */
export function alignWords(words, tokens) {
  // canonical letter stream
  const A = [];
  words.forEach((wd, wi) => {
    for (const ch of normalize(wd.w)) A.push({ ch, wi });
  });
  // observed letter stream, each letter timed by linear interpolation inside its token
  const B = [];
  for (const tk of tokens) {
    const letters = [...normalize(tk.text)];
    const n = letters.length;
    letters.forEach((ch, i) => {
      const s = tk.s + ((tk.e - tk.s) * i) / n;
      const e = tk.s + ((tk.e - tk.s) * (i + 1)) / n;
      B.push({ ch, s, e });
    });
  }

  // edit-distance DP with traceback (sizes are a few hundred letters — fine)
  const n = A.length, m = B.length;
  const W = m + 1;
  const D = new Uint32Array((n + 1) * W);
  for (let i = 0; i <= n; i++) D[i * W] = i;
  for (let j = 0; j <= m; j++) D[j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const sub = D[(i - 1) * W + j - 1] + (A[i - 1].ch === B[j - 1].ch ? 0 : 1);
      const del = D[(i - 1) * W + j] + 1;
      const ins = D[i * W + j - 1] + 1;
      D[i * W + j] = Math.min(sub, del, ins);
    }
  }
  const span = words.map(() => ({ s: Infinity, e: -Infinity, hits: 0 }));
  let i = n, j = m;
  while (i > 0 && j > 0) {
    const same = A[i - 1].ch === B[j - 1].ch;
    if (D[i * W + j] === D[(i - 1) * W + j - 1] + (same ? 0 : 1)) {
      // a substitution still places the canonical letter at that time
      const sp = span[A[i - 1].wi];
      sp.s = Math.min(sp.s, B[j - 1].s);
      sp.e = Math.max(sp.e, B[j - 1].e);
      if (same) sp.hits++;
      i--; j--;
    } else if (D[i * W + j] === D[(i - 1) * W + j] + 1) {
      i--;
    } else {
      j--;
    }
  }

  // a word counts as located only if at least a third of its letters matched exactly
  const out = words.map((wd, k) => {
    const len = Math.max(1, normalize(wd.w).length);
    const ok = span[k].hits >= Math.ceil(len / 3) && Number.isFinite(span[k].s);
    return { w: wd.w, s: ok ? span[k].s : NaN, e: ok ? span[k].e : NaN, matched: ok };
  });

  // interpolate unmatched runs
  const t0 = tokens.length ? tokens[0].s : 0;
  const t1 = tokens.length ? tokens[tokens.length - 1].e : 0;
  for (let k = 0; k < out.length; k++) {
    if (out[k].matched) continue;
    let r = k;
    while (r < out.length && !out[r].matched) r++;
    const from = k > 0 ? out[k - 1].e : t0;
    const to = r < out.length ? out[r].s : t1;
    const lens = out.slice(k, r).map((x) => Math.max(1, normalize(x.w).length));
    const total = lens.reduce((a, b) => a + b, 0);
    let acc = from;
    for (let q = k; q < r; q++) {
      const d = ((to - from) * lens[q - k]) / total;
      out[q].s = acc;
      out[q].e = acc + d;
      acc += d;
    }
    k = r - 1;
  }

  // enforce monotonic, non-overlapping spans
  for (let k = 1; k < out.length; k++) {
    if (out[k].s < out[k - 1].e) out[k].s = out[k - 1].e;
    if (out[k].e < out[k].s) out[k].e = out[k].s;
  }
  return out.map((x) => ({ w: x.w, s: round(x.s), e: round(x.e), matched: x.matched }));
}

const round = (x) => Math.round(x * 1000) / 1000;
