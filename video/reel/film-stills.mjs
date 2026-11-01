// node film-stills.mjs 2 8.5 20 ...   → out/film/t<seconds>.png  (quick stills, one bundle)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "path";
import { mkdirSync } from "fs";

const times = process.argv.slice(2).map(Number);
mkdirSync("out/film", { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = { browserExecutable: "C:/Program Files/Google/Chrome/Application/chrome.exe", chromeMode: "chrome-for-testing" };
const composition = await selectComposition({ serveUrl, id: "RavandFilm", inputProps: {}, ...browser });
for (const t of times) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(t * composition.fps));
  await renderStill({ composition, serveUrl, output: `out/film/t${t.toFixed(1)}.png`, frame, imageFormat: "png", ...browser });
}
console.log("ok", times.length);
