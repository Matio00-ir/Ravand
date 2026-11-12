// Renders promo.html frame-by-frame with headless Chrome → MP4 (ffmpeg).
// Usage: node render.mjs            full render → ravand-promo.mp4
//        node render.mjs 3 10.5 ... preview stills → preview/*.png
import puppeteer from "puppeteer-core";
import { spawn, execSync } from "child_process";
import { mkdirSync } from "fs";
import path from "path";

const FPS = 30;
const ffmpeg = execSync(`python -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"`).toString().trim();
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true,
  args: ["--allow-file-access-from-files"] });
const p = await b.newPage();
await p.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await p.goto("file:///" + path.resolve("promo.html").split(path.sep).join("/"), { waitUntil: "networkidle0" });
await p.evaluate(() => document.fonts.ready);
const dur = await p.evaluate(() => window.DURATION);

const stills = process.argv.slice(2).map(Number);
if (stills.length) {
  mkdirSync("preview", { recursive: true });
  for (const t of stills) { await p.evaluate(t => seek(t), t); await p.screenshot({ path: `preview/${t.toFixed(1)}.png` }); }
} else {
  const ff = spawn(ffmpeg, ["-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "ravand-promo.mp4"],
    { stdio: ["pipe", "ignore", "inherit"] });
  const n = Math.round(dur * FPS);
  for (let i = 0; i < n; i++) {
    await p.evaluate(t => seek(t), i / FPS);
    const buf = await p.screenshot({ type: "jpeg", quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await new Promise(r => ff.on("close", r));
  console.log("rendered", n, "frames");
}
await b.close();
