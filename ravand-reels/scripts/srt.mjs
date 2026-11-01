/**
 * Export the burned-in captions as SRT → out/<reel>.srt
 * (same grouping and timing the video uses; every segment is included, also
 * the ones whose captions are hidden on screen because a headline says it).
 *
 *   npm run srt -- reel-01
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reel = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "reel-01";

// Reuse the exact TS logic (resolve + captionGroups + digits) instead of re-implementing it.
const out = await build({
  entryPoints: [path.join(ROOT, "src/lib/reel.ts")],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
});
const lib = await import("data:text/javascript;base64," + Buffer.from(out.outputFiles[0].text).toString("base64"));
const fa = await build({ entryPoints: [path.join(ROOT, "src/lib/persian.ts")], bundle: true, write: false, format: "esm" });
const persian = await import("data:text/javascript;base64," + Buffer.from(fa.outputFiles[0].text).toString("base64"));

const read = (p) => JSON.parse(readFileSync(path.join(ROOT, p), "utf8"));
const content = read(`src/content/${reel}.json`);
const timing = read(`src/timing/${reel}.json`);
let override = null;
try {
  override = read(`src/timing/${reel}.override.json`);
} catch {}

const resolved = lib.resolve(content, timing, override);
const allOn = { ...content, segments: content.segments.map((s) => ({ ...s, captions: true })) };
const groups = lib.captionGroups(resolved.timing, allOn);

const ts = (sec) => {
  const ms = Math.max(0, Math.round(sec * 1000));
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
// Players lay out SRT text by its first strong character; an RLM prefix keeps lines
// that start with a digit or Latin text right-to-left.
const RLM = "‏";
const srt = groups
  .map((g, i) => `${i + 1}\n${ts(g.start)} --> ${ts(g.end)}\n${RLM}${persian.display(g.words.map((w) => w.w).join(" "))}\n`)
  .join("\n");

mkdirSync(path.join(ROOT, "out"), { recursive: true });
const file = path.join(ROOT, "out", `${reel}.srt`);
writeFileSync(file, srt, "utf8");
console.log(`wrote ${path.relative(ROOT, file)} (${groups.length} cues)`);
