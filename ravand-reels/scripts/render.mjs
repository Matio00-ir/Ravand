/**
 * Render everything for a reel:
 *   out/<reel>.mp4          H.264 / AAC, 1080×1920, 30 fps
 *   out/<reel>-cover.png    cover image
 *   out/<reel>.srt          subtitles
 *
 *   npm run render -- reel-01
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reel = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "reel-01";
const run = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, stdio: "inherit", shell: process.platform === "win32" });

run("npx", ["remotion", "render", reel, `out/${reel}.raw.mp4`]);
// Loudness-normalise for Instagram (≈ -14 LUFS, true peak -1.5 dB); video stream is copied untouched.
run("ffmpeg", [
  "-y", "-v", "error", "-i", `out/${reel}.raw.mp4`, "-c:v", "copy",
  "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "aac", "-b:a", "192k",
  "-movflags", "+faststart", `out/${reel}.mp4`,
]);
run("npx", ["remotion", "still", `${reel}-cover`, `out/${reel}-cover.png`]);
run("node", ["scripts/srt.mjs", reel]);
