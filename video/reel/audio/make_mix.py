# Synthesises a royalty-free music bed + sound design around the voice-over,
# driven by the same timeline the visuals use.   python audio/make_mix.py
# Output: public/mix-{A,B,C}.wav
import json, wave
import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def read_wav(p):
    with wave.open(p) as f:
        return np.frombuffer(f.readframes(f.getnframes()), np.int16).astype(np.float32) / 32768


def env(n, a=0.005, r=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)


def lowpass(x, k):  # cheap one-pole
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += k * (v - acc); y[i] = acc
    return y


def noise(n):
    return rng.uniform(-1, 1, n).astype(np.float32)


# ---------- instruments ----------
def kick():
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 42 + 90 * np.exp(-t / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.16)


def hat():
    n = int(0.06 * SR); x = noise(n)
    x = x - lowpass(x, 0.5)
    return x * env(n, 0.001, 0.015) * 0.5


def sub(freq, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * freq * t) * env(n, 0.01, dur * 0.6)


def pad(freqs, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * t * d) for f in freqs for d in (0.997, 1.003)) / (len(freqs) * 2)
    a = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.6)
    return x * a


def impact():
    n = int(1.4 * SR); t = np.arange(n) / SR
    f = 38 + 70 * np.exp(-t / 0.05)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.5)
    crack = lowpass(noise(n), 0.25) * env(n, 0.001, 0.05)
    return body * 0.9 + crack * 0.6


def whoosh(dur=0.45):
    n = int(dur * SR); t = np.arange(n) / SR
    x = noise(n); k = 0.02 + 0.35 * (t / dur) ** 2
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += k[i] * (v - acc); y[i] = acc
    return y * np.sin(np.pi * t / dur) ** 2 * 1.4


def riser(dur=1.2):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 200 + 1400 * (t / dur) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    return (tone + lowpass(noise(n), 0.15) * 0.5) * (t / dur) ** 2


def tick():
    n = int(0.025 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * 2400 * t) * env(n, 0.0005, 0.006) * 0.5


def ring(dur=1.6):  # phone ring-back tone, two short bursts
    n = int(dur * SR); t = np.arange(n) / SR
    tone = (np.sin(2 * np.pi * 440 * t) + np.sin(2 * np.pi * 480 * t)) * 0.2
    gate = ((t % 0.8) < 0.45).astype(np.float32)
    return tone * lowpass(gate, 0.01)


def buzz():
    n = int(0.35 * SR); t = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * 110 * t)) * 0.18
    return lowpass(x, 0.08) * env(n, 0.002, 0.2)


def glitch():
    n = int(0.3 * SR); x = noise(n) * 0.35
    gate = (rng.random(n // 480 + 1) > 0.5).repeat(480)[:n]
    return x * gate


def ding():
    n = int(1.2 * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * t) * g for f, g in ((1318, .5), (1976, .3), (2637, .15)))
    return x * env(n, 0.002, 0.35) * 0.5


def key():
    n = int(0.04 * SR)
    return (noise(n) - lowpass(noise(n), 0.3)) * env(n, 0.0005, 0.01) * 0.4


# ---------- mix ----------
def place(buf, clip, t, g=1.0):
    i = int(t * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(clip))
    buf[i:j] += clip[: j - i] * g


def build(v):
    tl = json.load(open(f"src/timeline-{v}.json", encoding="utf-8"))
    S = {s["id"]: s for s in tl["segments"]}
    total = tl["duration"]
    N = int(total * SR)
    vo = read_wav(f"public/vo-{v}.wav")
    vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
    vo = vo / (np.abs(vo).max() + 1e-6) * 0.9

    music = np.zeros(N, np.float32)
    sfx = np.zeros(N, np.float32)
    bpm = 104; beat = 60 / bpm
    roots = [55.0, 43.65, 65.41, 49.0]           # A1 F1 C2 G1
    chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [261.6, 329.6, 392], [196, 246.9, 293.7]]

    groove_on = S["bridge"]["start"]
    drop = (S["turn"]["start"], S["sol"]["start"])  # tension: drums out
    bar = beat * 4
    b = 0; t = 0.0
    while t < total:
        ci = b % 4
        place(music, pad(chords[ci], bar + 0.3), t, 0.18)
        for q in range(4):
            bt = t + q * beat
            in_drop = drop[0] - 0.05 <= bt < drop[1] - 0.05
            if bt >= groove_on and not in_drop:
                place(music, kick(), bt, 0.55)
                place(music, hat(), bt + beat / 2, 0.35)
                place(music, sub(roots[ci], beat * 0.9), bt, 0.35)
            elif bt < groove_on:
                place(music, sub(roots[0], beat * 0.9), bt, 0.25)
        t += bar; b += 1

    # sound design, synced to scenes
    place(sfx, impact(), 0.0, 0.9)
    if v == "A":  # money counter ticks
        for k in np.arange(0.15, S["hook"]["end"], 0.09): place(sfx, tick(), k, 0.5)
    if v == "B":  # spreadsheet chaos
        for k in np.arange(0.1, S["hook"]["end"], 0.14): place(sfx, key(), k, 0.8)
    if v == "C":  # slot-machine digits
        for k in np.arange(0.2, S["hook"]["end"], 0.07): place(sfx, tick(), k, 0.35)
    for sid in ["bridge", "s1", "s2", "s3", "turn", "cta"]:
        place(sfx, whoosh(), S[sid]["start"] - 0.3, 0.5)
    place(sfx, ring(), S["s1"]["start"] + 0.5, 0.35)
    for k in range(6): place(sfx, tick(), S["s2"]["start"] + 0.5 + k * 0.28, 0.8)
    place(sfx, buzz(), S["s3"]["start"] + 1.5, 0.8)
    place(sfx, glitch(), S["turn"]["start"] + 0.05, 0.6)
    place(sfx, riser(1.3), S["sol"]["start"] - 1.3, 0.5)
    place(sfx, impact(), S["sol"]["start"], 0.8)
    for k in range(3): place(sfx, whoosh(0.3), S["sol"]["start"] + 1.3 + k * 0.95, 0.3)
    for k in range(4): place(sfx, key(), S["cta"]["start"] + 0.9 + k * 0.12, 0.9)
    place(sfx, ding(), S["cta"]["start"] + 1.5, 0.6)
    if "loop" in S:
        place(sfx, riser(1.3), total - 1.35, 0.35)

    # duck the bed under the voice
    act = np.zeros(N, np.float32)
    for s in tl["segments"]:
        act[int(s["start"] * SR): int(s["end"] * SR)] = 1
    duck = 1 - 0.55 * lowpass(act, 0.0008)
    music *= duck
    fade = np.minimum(1, np.arange(N) / (0.02 * SR)) * np.minimum(1, (N - np.arange(N)) / (0.25 * SR))
    mix = (vo + music * 0.55 + sfx * 0.6) * fade
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)          # soft limiter
    mix = mix / np.abs(mix).max() * 0.95
    st = np.stack([mix, mix], 1)
    with wave.open(f"public/mix-{v}.wav", "wb") as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR)
        f.writeframes((st * 32767).astype(np.int16).tobytes())
    print("mixed", v, round(total, 2), "s")


for v in "ABC":
    build(v)
