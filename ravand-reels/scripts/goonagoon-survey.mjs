// One-off: log into the local DEMO panel and screenshot pages for review.
//   PANEL_USER=... PANEL_PASS=... node scripts/goonagoon-survey.mjs <outDir> [path ...]
// The login comes from the environment, never from this file: the repo is
// public, so anything written here is readable by everyone.
import path from "node:path";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const [outDir, ...paths] = process.argv.slice(2);
const BASE = process.env.PANEL_URL ?? "http://localhost:3010";
const USER = process.env.PANEL_USER;
const PASS = process.env.PANEL_PASS;
if (!outDir || !USER || !PASS) {
  console.error("Usage: PANEL_USER=... PANEL_PASS=... node scripts/goonagoon-survey.mjs <outDir> [path ...]");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
const inputs = page.locator("input");
await inputs.nth(0).fill(USER);
await inputs.nth(1).fill(PASS);
await page.locator("button[type=submit]").click();
await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30000 });
for (const p of paths.length ? paths : ["/dashboard"]) {
  await page.goto(`${BASE}/${p.replace(/^\//, "")}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const name = p.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "root";
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
  console.log("shot", p);
}
await browser.close();
