/**
 * Build the word-timing file a reel renders from:  src/timing/<reel>.json
 *
 *   npm run align -- reel-01 --source tts
 *       uses the TTS word boundaries written by `npm run tts`
 *
 *   npm run align -- reel-01 --source whisper [--audio audio/voiceover.wav] [--model large-v3-turbo]
 *       transcribes your own recording with whisper.cpp (local, free) for
 *       timestamps only, then aligns them onto the canonical script words
 *
 * Either way the words in the output are exactly the script's words; the
 * observed text (TTS tokens / Whisper's Persian, which will have errors) is
 * used only to place them in time. Manual fixes go in
 * src/timing/<reel>.override.json and are applied at render time, so
 * re-running this never clobbers them.
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { alignWords, splitWords } from "./lib/align-core.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WHISPER_VERSION = "1.7.6";

const args = process.argv.slice(2);
const reel = args.find((a) => !a.startsWith("--")) ?? "reel-01";
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const source = opt("source", existsSync(path.join(ROOT, "public/audio/voiceover.wav")) ? "whisper" : "tts");

const content = JSON.parse(readFileSync(path.join(ROOT, "src/content", `${reel}.json`), "utf8"));
const canon = content.segments.map((s) => ({ id: s.id, words: splitWords(s.vo).map((w) => ({ w })) }));

const probeDuration = (file) =>
  Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], {
      encoding: "utf8",
    }).trim(),
  );

let audio, duration, segments;

if (source === "tts") {
  const raw = JSON.parse(readFileSync(path.join(ROOT, "src/timing", `${reel}.raw-tts.json`), "utf8"));
  audio = raw.audio;
  duration = raw.duration;
  // TTS was synthesised per segment, so align segment by segment.
  segments = canon.map((c) => {
    const r = raw.segments.find((s) => s.id === c.id);
    if (!r) throw new Error(`segment "${c.id}" missing from raw-tts — re-run npm run tts`);
    const words = alignWords(c.words, r.tokens);
    return { id: c.id, start: words[0].s, end: words.at(-1).e, words };
  });
} else {
  audio = opt("audio", "audio/voiceover.wav");
  const audioPath = path.join(ROOT, "public", audio);
  if (!existsSync(audioPath)) throw new Error(`no audio at public/${audio}`);
  duration = probeDuration(audioPath);
  const tokens = await whisperTokens(audioPath, opt("model", "large-v3-turbo"));
  // Your recording has no known segment boundaries: align the whole script at once.
  const flat = canon.flatMap((c) => c.words.map((w) => ({ ...w, seg: c.id })));
  const aligned = alignWords(flat, tokens);
  segments = canon.map((c) => {
    const words = aligned.filter((_, k) => flat[k].seg === c.id);
    return { id: c.id, start: words[0].s, end: words.at(-1).e, words };
  });
}

const all = segments.flatMap((s) => s.words);
const missed = all.filter((w) => !w.matched).map((w) => w.w);
const out = {
  reel,
  audio,
  source,
  duration: Math.round(duration * 1000) / 1000,
  generatedAt: new Date().toISOString(),
  segments: segments.map((s) => ({ ...s, words: s.words.map(({ w, s: ws, e }) => ({ w, s: ws, e })) })),
};
const outPath = path.resolve(ROOT, opt("out", `src/timing/${reel}.json`));
writeFileSync(outPath, JSON.stringify(out, null, 1) + "\n");
console.log(
  `wrote ${path.relative(ROOT, outPath)} — ${source}, ${out.duration}s, ` +
    `${all.length - missed.length}/${all.length} words located` +
    (missed.length ? `, interpolated: ${missed.join(" ")}` : ""),
);
for (const s of out.segments) console.log(`  ${s.id.padEnd(8)} ${s.start.toFixed(2)} → ${s.end.toFixed(2)}`);

async function whisperTokens(audioPath, model) {
  const { installWhisperCpp, downloadWhisperModel, transcribe } = await import("@remotion/install-whisper-cpp");
  const whisperPath = path.join(ROOT, "whisper.cpp");
  // On Windows the release zip unpacks to Release/, but @remotion/install-whisper-cpp
  // (≥1.7.4) looks for build/bin/whisper-cli.exe — mirror it there.
  const fixWindowsLayout = () => {
    const rel = path.join(whisperPath, "Release");
    const bin = path.join(whisperPath, "build", "bin");
    if (process.platform === "win32" && existsSync(rel) && !existsSync(path.join(bin, "whisper-cli.exe"))) {
      cpSync(rel, bin, { recursive: true });
    }
  };
  fixWindowsLayout();
  await installWhisperCpp({ to: whisperPath, version: WHISPER_VERSION, printOutput: false });
  fixWindowsLayout();
  await downloadWhisperModel({ model, folder: whisperPath });

  // whisper.cpp wants 16 kHz mono 16-bit wav
  const tmpDir = path.join(ROOT, "out", "tmp");
  mkdirSync(tmpDir, { recursive: true });
  const wav16 = path.join(tmpDir, "whisper-16k.wav");
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", audioPath, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wav16]);

  const result = await transcribe({
    inputPath: wav16,
    whisperPath,
    whisperCppVersion: WHISPER_VERSION,
    model,
    modelFolder: whisperPath,
    tokenLevelTimestamps: true,
    language: "fa",
    splitOnWord: true,
    printOutput: false,
  });
  writeFileSync(path.join(tmpDir, `${reel}.whisper.json`), JSON.stringify(result, null, 1));

  // Flatten tokens; whisper.cpp marks specials like [_BEG_] — drop them.
  const tokens = [];
  for (const item of result.transcription) {
    for (const t of item.tokens) {
      if (/^\[_|^\[/.test(t.text.trim()) || !t.text.trim()) continue;
      tokens.push({ text: t.text.trim(), s: t.offsets.from / 1000, e: t.offsets.to / 1000 });
    }
  }
  console.log(`whisper heard: ${result.transcription.map((t) => t.text).join(" ").trim()}`);
  return tokens;
}
