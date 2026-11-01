// node preview.mjs A 1.0 6.5 ...   → out/preview/A-<t>.png  (quick stills without a full render)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "path";
import { mkdirSync } from "fs";

const [variant, ...times] = process.argv.slice(2);
mkdirSync("out/preview", { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const id = variant === "Cover" ? "Cover" : `Reel-${variant}`;
const browser = { browserExecutable: "C:/Program Files/Google/Chrome/Application/chrome.exe", chromeMode: "chrome-for-testing" };
const composition = await selectComposition({ serveUrl, id, inputProps: {}, ...browser });
for (const t of times.length ? times : ["0"]) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(parseFloat(t) * 30));
  await renderStill({ composition, serveUrl, output: `out/preview/${variant}-${t}.png`, frame, imageFormat: "png", ...browser });
}
console.log("ok");
