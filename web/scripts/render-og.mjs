/**
 * Renders the link-preview images (Open Graph) → public/og-fa.png, og-en.png
 *
 *   node scripts/render-og.mjs           (dev server on :3100)
 *
 * The card is drawn inside the running site so it uses the real brand
 * fonts (Vazirmatn / Manrope, loaded by next/font) and the real logo SVG
 * from the masthead — no separate design file to keep in sync. Re-run
 * whenever the headline in messages/*.json changes.
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(here, "../../ravand-reels/package.json"));
const { chromium } = require("playwright-core");

const BASE = process.env.SITE_URL ?? "http://localhost:3100";
const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";

const LOCALES = [
  { id: "fa", prefix: "", dir: "rtl", demo: "۱۴ روز دموی رایگان · بدون نصب" },
  { id: "en", prefix: "/en", dir: "ltr", demo: "14-day free demo · Nothing to install" },
];

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });

for (const locale of LOCALES) {
  const messages = JSON.parse(readFileSync(path.join(here, `../messages/${locale.id}.json`), "utf8"));
  await page.goto(`${BASE}${locale.prefix}/`, { waitUntil: "networkidle" });
  await page.evaluate(
    ({ title, eyebrow, demo, dir }) => {
      const logo = document.querySelector("header a")?.innerHTML ?? "";
      document.body.innerHTML = `
        <div id="og" dir="${dir}" style="
          position:fixed; inset:0; width:1200px; height:630px; box-sizing:border-box;
          padding:72px 84px; display:flex; flex-direction:column; justify-content:space-between;
          background:#0b0d10; color:#f7f8fa; overflow:hidden;
          background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),
                           linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);
          background-size:60px 60px;">
          <div style="transform:scale(1.9); transform-origin:${dir === "rtl" ? "right" : "left"} top; height:64px">${logo}</div>
          <div>
            <p style="margin:0 0 22px; font-size:26px; color:#98a0aa; font-weight:500">${eyebrow}</p>
            <h1 style="margin:0; font-size:${dir === "rtl" ? 70 : 66}px; line-height:1.25; font-weight:700; max-width:980px">${title}</h1>
          </div>
          <div style="display:flex; align-items:center; gap:18px; font-size:24px; color:#b7bec7">
            <span style="width:56px; height:2px; background:#7f8fa6"></span>${demo}
          </div>
        </div>`;
      document.body.style.margin = "0";
    },
    { title: messages.hero.title, eyebrow: messages.hero.eyebrow, demo: locale.demo, dir: locale.dir }
  );
  await page.waitForTimeout(400);
  const file = path.join(here, `../public/og-${locale.id}.png`);
  await page.locator("#og").screenshot({ path: file });
  console.log("saved", path.relative(path.join(here, ".."), file));
}
await browser.close();
