"""Temporary Persian TTS track, for timing only.

    python scripts/tts.py [reel-01]

Reads src/content/<reel>.json, synthesises each segment with edge-tts
(free Microsoft Edge read-aloud voices, no API key; same fa-IR neural voices
as Azure), joins them with the per-segment pauses and writes:

    public/audio/voiceover.tts.wav          the temp voice track
    src/timing/<reel>.raw-tts.json          observed word boundaries from the TTS

Then run `npm run align -- <reel> --source tts` to map those boundaries onto
the canonical script words (src/timing/<reel>.json). The TTS tokens are only
used for timing; the displayed text always comes from the script.
"""

import asyncio
import json
import subprocess
import sys
import wave
from pathlib import Path

import edge_tts
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR = 48000


def ffmpeg_exe():
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return "ffmpeg"


async def synth(text, voice, rate):
    comm = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    mp3, tokens = b"", []
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            mp3 += chunk["data"]
        elif chunk["type"] == "WordBoundary":
            s = chunk["offset"] / 1e7
            tokens.append({"text": chunk["text"], "s": s, "e": s + chunk["duration"] / 1e7})
    pcm = subprocess.run(
        [ffmpeg_exe(), "-v", "quiet", "-i", "-", "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
        input=mp3,
        capture_output=True,
        check=True,
    ).stdout
    audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
    # Trim the synthesiser's leading/trailing silence so pauses come only from the script.
    loud = np.where(np.abs(audio) > 0.01)[0]
    lead = max(0, loud[0] - int(0.03 * SR))
    tail = min(len(audio), loud[-1] + int(0.1 * SR))
    audio = audio[lead:tail]
    shift = lead / SR
    for t in tokens:
        t["s"] = round(max(0.0, t["s"] - shift), 3)
        t["e"] = round(max(0.0, t["e"] - shift), 3)
    return audio, tokens


async def main(reel):
    content = json.loads((ROOT / "src/content" / f"{reel}.json").read_text(encoding="utf-8"))
    voice = content["tts"]["voice"]
    rate = content["tts"].get("rate", "+0%")

    t, chunks, segments = 0.0, [], []
    for seg in content["segments"]:
        audio, tokens = await synth(seg["vo"], voice, rate)
        dur = len(audio) / SR
        segments.append(
            {
                "id": seg["id"],
                "start": round(t, 3),
                "end": round(t + dur, 3),
                "tokens": [{**k, "s": round(t + k["s"], 3), "e": round(t + k["e"], 3)} for k in tokens],
            }
        )
        pause = float(seg.get("pauseAfter", 0.3))
        chunks += [audio, np.zeros(int(pause * SR), np.float32)]
        t += dur + pause
        print(f"  {seg['id']:<8} {dur:5.2f}s  {len(tokens)} tokens")

    full = np.concatenate(chunks)
    out_wav = ROOT / "public/audio/voiceover.tts.wav"
    with wave.open(str(out_wav), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes((np.clip(full, -1, 1) * 32767).astype(np.int16).tobytes())

    raw = {
        "audio": "audio/voiceover.tts.wav",
        "source": "tts",
        "voice": voice,
        "duration": round(len(full) / SR, 3),
        "segments": segments,
    }
    out_json = ROOT / "src/timing" / f"{reel}.raw-tts.json"
    out_json.write_text(json.dumps(raw, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {out_wav.relative_to(ROOT)} ({raw['duration']}s) and {out_json.relative_to(ROOT)}")


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else "reel-01"))
