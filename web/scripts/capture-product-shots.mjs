/**
 * Captures real screens of the RAVAND tour (/dashboard) for the marketing
 * site's product gallery → public/product/<locale>-<screen>.png
 *
 *   node scripts/capture-product-shots.mjs            (dev server on :3100)
 *   SITE_URL=http://localhost:3000 node scripts/capture-product-shots.mjs
 *
 * These are the same screens a visitor gets in the no-signup tour, with
 * sample data — so the gallery shows the product honestly. Re-run after
 * the dashboard UI changes. Uses the local Chrome through playwright-core
 * from ../ravand-reels (web/ does not depend on Playwright itself).
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(here, "../../ravand-reels/package.json"));
const { chromium } = require("playwright-core");

const BASE = process.env.SITE_URL ?? "http://localhost:3100";
const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = path.join(here, "../public/product");

const SCREENS = [
  { id: "overview", path: "/dashboard" },
  { id: "sales", path: "/dashboard/sales" },
  { id: "inventory", path: "/dashboard/inventory" },
  { id: "finance", path: "/dashboard/finance" },
];
const LOCALES = [
  { id: "fa", prefix: "" },
  { id: "en", prefix: "/en" },
];

/**
 * Two sizes: a desktop frame, and a phone frame for small screens (a
 * desktop shot scaled down to a phone's width is unreadable).
 * File names: <locale>-<screen>.png and <locale>-<screen>-mobile.png.
 */
const DEVICES = [
  { suffix: "", viewport: { width: 1440, height: 900 }, scale: 1.5 },
  { suffix: "-mobile", viewport: { width: 390, height: 780 }, scale: 2 },
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });

for (const device of DEVICES) {
  const context = await browser.newContext({
    viewport: device.viewport,
    deviceScaleFactor: device.scale,
    reducedMotion: "reduce",
  });
  // Close the guided tour before any page script runs.
  await context.addInitScript(() => sessionStorage.setItem("ravand-tour-closed", "1"));
  const page = await context.newPage();

  for (const locale of LOCALES) {
    for (const screen of SCREENS) {
      await page.goto(`${BASE}${locale.prefix}${screen.path}`, { waitUntil: "networkidle" });
      // Dev-only overlays (Next.js badge) and the tour's own strip never
      // belong in a product shot.
      await page.addStyleTag({
        content: "nextjs-portal,[data-demo-banner]{display:none!important}",
      });
      await page.waitForTimeout(800);
      const file = path.join(OUT, `${locale.id}-${screen.id}${device.suffix}.png`);
      await page.screenshot({ path: file });
      console.log("saved", path.relative(path.join(here, ".."), file));
    }
  }
  await context.close();
}
await browser.close();
