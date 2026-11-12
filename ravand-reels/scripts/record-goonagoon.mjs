/**
 * Record REAL footage of the ERP panel (local DEMO database, fictional data)
 * for the "goonagoon-promo" composition → public/footage/erp/<scene>.mp4
 *
 *   node scripts/record-goonagoon.mjs [scene ...]     (PANEL_URL defaults to http://localhost:3010)
 *
 * Frame-stepped capture (Playwright + local Chrome) at 30 fps, 1440×810 CSS px
 * at 4/3 DPR → 1920×1080 frames. Nothing in the app is modified; at capture
 * time the client's brand (name + logo) is swapped for RAVAND's in the DOM,
 * a visible cursor is drawn, and transitions/dev overlays are disabled.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.PANEL_URL ?? "http://localhost:3010";
const API = process.env.PANEL_API ?? "http://127.0.0.1:4000";
const FPS = 30;
const VIEW = { width: 1440, height: 810 };
const only = process.argv.slice(2);

// RAVAND symbol, straight from the traced marks (dark tone for a light tile)
const marks = readFileSync(path.join(ROOT, "src/brand/marks.ts"), "utf8");
const grab = (key) => marks.match(new RegExp(`${key}:\\s*"([^"]+)"`))[1];
const symbolBlock = marks.slice(marks.indexOf("export const SYMBOL"));
const SYM = {
  w: Number(symbolBlock.match(/w:\s*([\d.]+)/)[1]),
  h: Number(symbolBlock.match(/h:\s*([\d.]+)/)[1]),
  ribbon: grab("ribbon"),
  leg: grab("leg"),
};
const SYMBOL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SYM.w} ${SYM.h}" style="height:28px;width:${(28 * SYM.w) / SYM.h}px;display:block"><path d="${SYM.leg}" fill="#8A929C" fill-rule="evenodd"/><path d="${SYM.ribbon}" fill="#F7F8FA" fill-rule="evenodd"/></svg>`;

const login = await (
  await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "Admin@12345" }),
  })
).json();
const { accessToken, refreshToken } = login.data;

const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const lerp = (a, b, p) => a + (b - a) * p;

/**
 * Scene choreography. `steps` run once when their time is reached; `frame`
 * runs every frame (scroll + cursor). Cursor path = keyframes [t, x, y].
 */
const SCENES = {
  orders: {
    path: "/orders",
    duration: 7,
    cursor: [[0, 700, 760], [1.2, 760, 330], [2.4, 760, 400], [3.6, 760, 470], [4.8, 760, 540], [6, 760, 610]],
  },
  stock: {
    path: "/warehouse",
    duration: 7,
    scroll: [[0, 0], [0.6, 0], [2.4, 300]],
    cursor: [[0, 900, 700], [2.4, 1000, 560], [3.6, 760, 440], [5, 760, 300], [6.5, 760, 260]],
  },
  production: {
    path: "/production",
    duration: 10,
    cursor: [[0, 700, 600], [0.8, 1100, 297], [2.0, 1100, 297], [2.6, 1100, 380], [4.4, 1100, 380], [5.4, 600, 700], [9, 600, 700]],
    steps: [
      [1.0, async (page) => {
        const sel = page.locator("select").first();
        const opt = await sel.locator("option", { hasText: "محصول صنعتی" }).getAttribute("value");
        await sel.selectOption(opt);
      }],
      [2.7, async (page) => { const i = page.locator("input").first(); await i.click(); await i.fill(""); }],
      [3.0, async (page) => page.locator("input").first().type("5")],
      [3.25, async (page) => page.locator("input").first().type("0")],
      [3.5, async (page) => page.locator("input").first().type("0")],
    ],
    scroll: [[0, 0], [5.0, 0], [6.6, 470]],
  },
  producible: {
    path: "/warehouse",
    duration: 9,
    cursor: [[0, 700, 600], [0.8, 260, 167], [1.6, 260, 167], [3.2, 700, 420], [8, 640, 520]],
    steps: [
      [1.2, async (page) => {
        const sel = page.locator("select").first();
        const opt = await sel.locator("option", { hasText: "محصول ممتاز" }).getAttribute("value");
        await sel.selectOption(opt);
      }],
    ],
    scroll: [[0, 0], [3.4, 0], [5.4, 120]],
  },
  invoices: {
    path: "/invoices",
    duration: 7,
    cursor: [[0, 700, 700], [1.5, 760, 330], [3, 760, 400], [4.5, 760, 470], [6.5, 760, 470]],
  },
  finance: {
    path: "/finance",
    duration: 7,
    scroll: [[0, 0], [1.2, 0], [3.8, 760]],
    cursor: [[0, 700, 700], [1.2, 900, 160], [3.8, 860, 520], [6.5, 820, 545]],
  },
  dashboard: {
    path: "/dashboard",
    duration: 8,
    scroll: [[0, 0], [3.5, 0], [6, 230]],
    cursor: [[0, 400, 700], [1.2, 1050, 230], [2.4, 760, 230], [3.4, 430, 340], [6, 600, 560], [8, 600, 560]],
  },
};

const track = (keys, t) => {
  if (!keys) return null;
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, ...a] = keys[i - 1];
      const [t1, ...b] = keys[i];
      const p = smooth((t - t0) / (t1 - t0));
      return a.map((v, k) => lerp(v, b[k], p));
    }
  }
  return keys[keys.length - 1].slice(1);
};

const browser = await chromium.launch({
  executablePath: process.env.REMOTION_BROWSER ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
});

const prepare = async (page) => {
  await page.addStyleTag({
    content: `*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important;caret-color:transparent!important}
      nextjs-portal{display:none!important}
      #rv-cursor{position:fixed;z-index:2147483647;pointer-events:none;width:22px;height:22px;left:0;top:0}`,
  });
  await page.evaluate((svg) => {
    const c = document.createElement("div");
    c.id = "rv-cursor";
    c.innerHTML = `<svg viewBox="0 0 22 22" width="22" height="22"><path d="M3 2 L3 18 L7.5 13.8 L10.6 20.5 L13.4 19.2 L10.4 12.6 L16.5 12.6 Z" fill="#0B0D10" stroke="#F7F8FA" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
    document.body.appendChild(c);
    window.__rvBrand = () => {
      const aside = document.querySelector("aside");
      if (aside && !aside.dataset.rv) {
        const img = aside.querySelector("img");
        if (img) {
          const tile = img.parentElement;
          tile.style.background = "transparent";
          tile.innerHTML = svg;
        }
        aside.dataset.rv = "1";
      }
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.nodeValue.includes("رنگ گوناگون") && n.nodeValue.trim() !== "پنل مدیریت") continue;
        const inAside = aside?.contains(n);
        if (n.nodeValue.trim() === "پنل مدیریت" && inAside) n.nodeValue = "پنل مدیریت تولید";
        else n.nodeValue = n.nodeValue.replace(/رنگ گوناگون/g, inAside ? "روند" : "کارخانه");
      }
    };
    window.__rvBrand();
  }, SYMBOL_SVG);
  await page.evaluate(() => document.fonts.ready);
};

for (const [name, scene] of Object.entries(SCENES)) {
  if (only.length && !only.includes(name)) continue;
  const page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: 4 / 3 });
  await page.addInitScript(
    ([a, r]) => {
      localStorage.setItem("rang-goonagoon.accessToken", a);
      localStorage.setItem("rang-goonagoon.refreshToken", r);
      localStorage.setItem("rg-theme", "dark");
    },
    [accessToken, refreshToken],
  );
  await page.goto(`${BASE}${scene.path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await prepare(page);

  const frames = path.join(ROOT, "out", "tmp", `erp-${name}`);
  rmSync(frames, { recursive: true, force: true });
  mkdirSync(frames, { recursive: true });
  const steps = [...(scene.steps ?? [])];
  const total = Math.round(scene.duration * FPS);
  for (let f = 0; f < total; f++) {
    const t = f / FPS;
    while (steps.length && steps[0][0] <= t) {
      await steps.shift()[1](page);
      await page.waitForTimeout(250);
    }
    const sy = track(scene.scroll, t);
    if (sy) await page.evaluate((y) => window.scrollTo(0, y), sy[0]);
    const cur = track(scene.cursor, t);
    await page.evaluate(([x, y]) => {
      window.__rvBrand?.();
      const c = document.getElementById("rv-cursor");
      if (c) c.style.transform = `translate(${x}px, ${y}px)`;
    }, cur ?? [-50, -50]);
    if (cur) await page.mouse.move(cur[0], cur[1]);
    await page.screenshot({ path: path.join(frames, `f${String(f).padStart(4, "0")}.jpg`), type: "jpeg", quality: 92 });
  }
  await page.close();
  const outDir = path.join(ROOT, "public", "footage", "erp");
  mkdirSync(outDir, { recursive: true });
  execFileSync("ffmpeg", [
    "-y", "-v", "error", "-framerate", String(FPS), "-i", path.join(frames, "f%04d.jpg"),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-movflags", "+faststart", path.join(outDir, `${name}.mp4`),
  ]);
  console.log("wrote", name, total, "frames");
}
await browser.close();
