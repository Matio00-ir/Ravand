# Generates the Persian voice-over + word-level timeline for each hook variant.
#   python audio/make_voice.py        (run from video/reel)
# Output: public/vo-{A,B,C}.wav and src/timeline-{A,B,C}.json
# Swap VOICE for "fa-IR-DilaraNeural" for a female voice.
import asyncio, json, subprocess, wave, io
import numpy as np
import edge_tts, imageio_ffmpeg

VOICE = "fa-IR-FaridNeural"
RATE = "+8%"
SR = 48000
FF = imageio_ffmpeg.get_ffmpeg_exe()

HOOKS = {
    "A": "کسب‌وکارت داره بی‌صدا پول از دست می‌ده.",
    "B": "اگه هنوز موجودی انبارت رو با اکسل حساب می‌کنی، این ویدیو مال توئه.",
    "C": "اگه همین الان ازت بپرسم امروز چقدر سود کردی، می‌تونی جواب بدی؟",
}
# (scene id, text, pause after in seconds)
BODY = [
    ("bridge", "این سه تا نشونه رو داری؟ تا آخر ببین.", 0.25),
    ("s1", "یک: برای فهمیدن موجودی انبار، باید به یکی زنگ بزنی.", 0.3),
    ("s2", "دو: آخر ماه، چند روز طول می‌کشه تا بفهمی سود کردی یا ضرر.", 0.3),
    ("s3", "سه: فروش یه عدد می‌گه، حسابداری یه عدد دیگه.", 0.35),
    ("turn", "مشکل از تیمت نیست؛ اطلاعاتت تیکه‌تیکه‌ست.", 0.3),
    ("sol", "روند، فروش و انبار و مالی و مشتری‌ها رو یه‌جا جمع می‌کنه.", 0.15),
    ("sol2", "همه‌چی روی یه صفحه، لحظه‌ای.", 0.3),
    ("cta", "کلمه‌ی «دمو» رو کامنت کن، تا دسترسی رایگانِ چهارده‌روزه رو برات بفرستم.", 0.2),
]
LOOP = ("loop", "چون هر روز بدونِ روند…", 0.1)  # only variant A: flows back into its hook


async def tts(text):
    c = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary")
    mp3, words = b"", []
    async for ch in c.stream():
        if ch["type"] == "audio":
            mp3 += ch["data"]
        elif ch["type"] == "WordBoundary":
            words.append({"t": ch["offset"] / 1e7, "d": ch["duration"] / 1e7, "w": ch["text"]})
    pcm = subprocess.run([FF, "-v", "quiet", "-i", "-", "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                         input=mp3, capture_output=True).stdout
    audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
    # trim leading/trailing silence so pacing is tight (reels hate dead air)
    idx = np.where(np.abs(audio) > 0.01)[0]
    lead = max(0, idx[0] - int(0.03 * SR))
    tail = min(len(audio), idx[-1] + int(0.08 * SR))
    audio = audio[lead:tail]
    shift = lead / SR
    for w in words:
        w["t"] = round(max(0, w["t"] - shift), 3)
    return audio, words


async def build(variant):
    lines = [("hook", HOOKS[variant], 0.2)] + BODY + ([LOOP] if variant == "A" else [])
    t, chunks, segs = 0.0, [], []
    for sid, text, gap in lines:
        audio, words = await tts(text)
        dur = len(audio) / SR
        segs.append({"id": sid, "text": text, "start": round(t, 3), "end": round(t + dur, 3),
                     "words": [{**w, "t": round(t + w["t"], 3)} for w in words]})
        chunks += [audio, np.zeros(int(gap * SR), np.float32)]
        t += dur + gap
    full = np.concatenate(chunks)
    with wave.open(f"public/vo-{variant}.wav", "wb") as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR)
        f.writeframes((np.clip(full, -1, 1) * 32767).astype(np.int16).tobytes())
    json.dump({"variant": variant, "duration": round(t + 0.4, 3), "segments": segs},
              open(f"src/timeline-{variant}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(variant, round(t, 2), "s", [(s["id"], s["start"]) for s in segs])


async def main():
    for v in HOOKS:
        await build(v)

asyncio.run(main())
