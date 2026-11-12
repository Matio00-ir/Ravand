/**
 * Render review stills (RTL / shaping / safe-zone check) to out/stills/.
 *
 *   npm run stills -- reel-01              key frames picked from the timing
 *   npm run stills -- reel-01 3.2 17 41.5  specific seconds
 *   add --safe to draw the IG safe-zone guides
 */
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const reel = args.find((a) => /^reel-/.test(a)) ?? "reel-01";
const safe = args.includes("--safe");
let secs = args.filter((a) => /^\d+(\.\d+)?$/.test(a)).map(Number);

if (!secs.length) {
  const content = JSON.parse(readFileSync(path.join(ROOT, "src/content", `${reel}.json`), "utf8"));
  const timing = JSON.parse(readFileSync(path.join(ROOT, "src/timing", `${reel}.json`), "utf8"));
  const off = content.audio.voiceStartsAt;
  const seg = (id) => timing.segments.find((s) => s.id === id);
  const at = (id, f) => off + seg(id).start + (seg(id).end - seg(id).start) * f;
  // one frame per scene, near where its key state is visible
  secs = [0, 1.5, at("hook", 0.95), at("relay", 0.85), at("wait", 0.95), at("rehook", 1), at("loss", 0.97), at("product", 0.9), at("cta", 0.98)];
}

const browserExecutable = process.env.REMOTION_BROWSER ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts") });
const composition = await selectComposition({
  serveUrl,
  id: reel,
  inputProps: { reel, showSafeZones: safe },
  browserExecutable,
});
const outDir = path.join(ROOT, "out", "stills");
mkdirSync(outDir, { recursive: true });
for (const s of secs) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(s * composition.fps));
  const output = path.join(outDir, `${reel}-${s.toFixed(1)}s${safe ? "-safe" : ""}.png`);
  await renderStill({ composition, serveUrl, frame, output, inputProps: composition.props, browserExecutable });
  console.log(path.relative(ROOT, output));
}
