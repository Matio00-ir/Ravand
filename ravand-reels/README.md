# ravand-reels

Persian (RTL) vertical reels for RAVAND, built with Remotion. Reel #1:
«سفارش‌هایی که توی واتس‌اپ گم میشن».

The RAVAND app (`../web`) is **read-only** here. Design tokens, fonts and the logo
were extracted from it into this project (see `src/theme.ts`, `src/brand/`).

```bash
npm install
npm run studio                 # live preview (Remotion Studio)
npm run render -- reel-01      # → out/reel-01.mp4, out/reel-01-cover.png, out/reel-01.srt
npm run stills -- reel-01      # key-frame PNGs for the RTL review → out/stills/
```

Rendering uses your installed Chrome (`C:/Program Files/Google/Chrome/Application/chrome.exe`);
override with `REMOTION_BROWSER`. The Python scripts need `pip install edge-tts numpy imageio-ffmpeg`;
`ffmpeg`/`ffprobe` must be on PATH.

## How it fits together

```
src/content/reel-01.json        ALL copy: VO segments, on-screen text, scene list, CTA keyword
src/timing/reel-01.json         GENERATED word timings (canonical script words + times)
src/timing/reel-01.override.json  manual timing fixes (applied on top at render time)
src/theme.ts                    RAVAND tokens + IG safe zones + layout bands
src/scenes/*.tsx                one reusable component per scene type
src/components/Captions.tsx     3–5 word captions, current word on the accent chip
src/components/AudioMix.tsx     voice + optional ducked music
src/reels.ts                    registry of reels
public/audio/                   voiceover.tts.wav (temp), voiceover.wav (yours), music.mp3 (optional)
public/sfx/                     original synthesized SFX (scripts/sfx.py)
public/footage/order-flow.mp4   real product footage (scripts/record-footage.mjs)
```

Duration is **not hardcoded**: `calculateMetadata` computes it from the timing file
(`voiceStartsAt` + audio length + `tail`). Each scene starts 0.25s before its VO segment
and runs until the next scene, and scene "beats" are tied to named script words
(`"beats": { "turn": "دفعه‌ی" }`), so everything follows the real voice.

### Persian / RTL rules the code enforces

- Text is split only on spaces (words) or explicit lines — never into letters.
  ZWNJ (نیم‌فاصله) is not a space and stays inside its word.
- All visible text goes through `faDigits` / `display` → Persian digits, `...` → `…`.
- Headlines and captions are RTL flex rows of whole words.

## Swap in your own voice

1. Record the script from `src/content/reel-01.json` (`segments[].vo`, in order). Leave a short
   breath between segments; exact pauses don't matter.
2. Save it as `public/audio/voiceover.wav` (any sample rate, mono or stereo).
3. Run the timing:
   ```bash
   npm run align -- reel-01 --source whisper --audio audio/voiceover.wav
   ```
   This runs whisper.cpp locally (free; first run downloads the binary + the
   `large-v3-turbo` model ≈ 1.6 GB into `whisper.cpp/`). Whisper's Persian text is
   used **only for timing** — it is aligned letter-by-letter onto the script words; the
   words displayed are always the script's. The script prints how many words it located;
   unlocated ones are interpolated.
4. `npm run studio` to check sync, then `npm run render -- reel-01`.

If a word is off, fix it in `src/timing/reel-01.override.json` (re-running align never touches it):

```json
{ "shift": { "cta": 0.12 }, "words": { "loss/18": { "s": 21.4 } } }
```

`shift` moves a whole segment; `words` pins `"<segmentId>/<wordIndex>"` (0-based) in
voiceover-file seconds. If the opening needs a longer silent hook, change
`audio.voiceStartsAt` in the content JSON.

### Temporary TTS (what's in the current render)

`npm run tts -- reel-01` then `npm run align -- reel-01 --source tts`. Uses
**edge-tts** (`fa-IR-FaridNeural`, no API key, free — but it is an unofficial endpoint of
Edge's read-aloud, so treat it as a timing scaffold, not a production voice). Voice/rate are in
the content JSON (`tts`).

## Music

Drop a licensed track at `public/audio/music.mp3`; it's detected automatically, looped,
faded and ducked under the voice (`audio.musicVolume` / `musicDuckedVolume`). No music is
included. The final MP4 is loudness-normalised to ≈ −14 LUFS.

## Product footage

`npm run footage` records the real `/dashboard/sales` screen of the local app frame-by-frame
with Playwright + your Chrome and encodes `public/footage/order-flow.mp4`. Start the app first —
note that under **Turbopack** the app's dev server currently 500s (`next/font/google` can't
resolve); webpack mode works:

```bash
cd ../web && npx next dev --webpack -p 3100
npm run footage -- --url http://localhost:3100
```

(also available as the `ravand-web-webpack` launch config). If the footage file is missing,
the scene shows a labelled placeholder — never a mock-up.

## Make reel #2

1. Copy `src/content/reel-01.json` → `src/content/reel-02.json`; rewrite `segments` (VO) and
   `scenes` (component + props + beats). Reuse existing scene components; add a new one in
   `src/scenes/` and register it in `src/scenes/index.ts` only if needed.
2. Create the voice + timing: `npm run tts -- reel-02 && npm run align -- reel-02 --source tts`
   (or record and use `--source whisper`). Create `src/timing/reel-02.override.json` with `{}`.
3. Register it in `src/reels.ts` (3 lines) and add a `<Composition id="reel-02">` +
   `<Still id="reel-02-cover">` in `src/Root.tsx` (copy the reel-01 pair).
4. `npm run stills -- reel-02` to review RTL, then `npm run render -- reel-02`.

Scene props are plain data, e.g. `ChatHook` takes any thread title/messages/headline, so a reel
about lost invoices can reuse it unchanged.

## Instagram safe zones

Top 250px and bottom 380px are kept clear; right inset 150px for the action buttons.
`npm run stills -- reel-01 --safe` overlays the guides. Captions live in y 1300–1540, headlines
in y 290–760. Cover content sits inside the 3:4 grid crop (y 240–1680).

## Licensing

Vazirmatn and Manrope: SIL Open Font License (Google Fonts). SFX: synthesized from scratch in
`scripts/sfx.py`. Logo: RAVAND's own traced marks (copied from `web/lib/brand-marks.ts`).
No third-party music, sounds or images.
