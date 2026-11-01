/**
 * Record REAL RAVAND UI for the product scene → public/footage/order-flow.mp4
 *
 *   1. start the app:   npm --prefix ../web run dev      (or the "ravand-web" launch config)
 *   2. npm run footage  [-- --url http://localhost:3000]
 *
 * Captures the real /dashboard/sales screen (the app's own sample data — no
 * customer data) frame by frame with Playwright driving your local Chrome,
 * then encodes 30 fps H.264 with ffmpeg. Frame-stepped capture is smooth and
 * deterministic, unlike screen recording. Nothing in the app is modified; the
 * only injection is a style that turns off CSS transitions during capture.
 *
 * NOTE: the app has no live order flow yet (create → warehouse → status →
 * notification). This records the real "recent orders" table and its status
 * pills. When the flow exists, replace this file's choreography (or drop in
 * your own screen recording at the same path).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const base = args.includes("--url") ? args[args.indexOf("--url") + 1] : process.env.RAVAND_URL ?? "http://localhost:3000";
const FPS = 30;
const DURATION = 12; // seconds; the product scene is ~10s
// matches the WindowFrame content area in the reel (856×636 CSS px), rendered at 2×
const VIEW = { width: 856, height: 636 };

const frames = path.join(ROOT, "out", "tmp", "footage-frames");
rmSync(frames, { recursive: true, force: true });
mkdirSync(frames, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.REMOTION_BROWSER ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: 2, colorScheme: "dark" });
await page.goto(`${base}/dashboard/sales`, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important} nextjs-portal{display:none!important}" });
await page.evaluate(() => document.fonts.ready);

// geometry of the real orders table
const geo = await page.evaluate(() => {
  const heading = [...document.querySelectorAll("h2,h3,h4,div,span")].find((el) => el.textContent?.trim() === "سفارش‌های اخیر");
  const panel = heading?.closest("section, div[class*='rounded']") ?? heading;
  const rows = [...document.querySelectorAll("tbody tr")].map((r) => {
    const b = r.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + window.scrollY + b.height / 2 };
  });
  const top = (panel?.getBoundingClientRect().top ?? 0) + window.scrollY;
  return { tableTop: top, rows, maxScroll: document.documentElement.scrollHeight - window.innerHeight };
});
if (!geo.rows.length) throw new Error("orders table not found — is the app running at " + base + " ?");

const target = Math.min(geo.maxScroll, Math.max(0, geo.tableTop - 24));
const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

const total = DURATION * FPS;
for (let f = 0; f < total; f++) {
  const s = f / FPS;
  // 0–1.0s hold on the stats; 1.0–3.6s scroll to the orders table; then walk the rows
  const scrollY = target * smooth((s - 1.0) / 2.6);
  await page.evaluate((y) => window.scrollTo(0, y), scrollY);
  const rowIdx = Math.floor((s - 4.0) / 1.25);
  if (s >= 4.0 && rowIdx < geo.rows.length) {
    const r = geo.rows[rowIdx];
    await page.mouse.move(r.x, r.y - scrollY);
  } else {
    await page.mouse.move(VIEW.width - 4, 4);
  }
  await page.screenshot({ path: path.join(frames, `f${String(f).padStart(4, "0")}.png`) });
  if (f % 60 === 0) console.log(`frame ${f}/${total}`);
}
await browser.close();

const out = path.join(ROOT, "public", "footage", "order-flow.mp4");
execFileSync("ffmpeg", [
  "-y", "-v", "error", "-framerate", String(FPS), "-i", path.join(frames, "f%04d.png"),
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-movflags", "+faststart", out,
]);
console.log("wrote", path.relative(ROOT, out));
