"""Original sound effects, synthesised from scratch (no samples, no third-party SFX).

    python scripts/sfx.py      → public/sfx/*.wav

All are short, soft and low in the mix: the brand is restrained, so nothing
here is a "whoosh-boom" trailer sound.
"""

import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public/sfx"
SR = 48000
rng = np.random.default_rng(11)


def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def env(t, attack, decay):
    return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / decay)


def tone(freq, dur, attack=0.003, decay=0.08, partials=((1, 1.0),)):
    t = t_axis(dur)
    x = sum(a * np.sin(2 * np.pi * freq * k * t) for k, a in partials)
    return x * env(t, attack, decay)


def place(dur, *events):
    out = np.zeros(int(dur * SR), np.float32)
    for at, sig in events:
        i = int(at * SR)
        n = min(len(sig), len(out) - i)
        out[i : i + n] += sig[:n]
    return out


def write(name, x, peak=0.7):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    # 4 ms fade in/out to avoid clicks
    f = int(0.004 * SR)
    x[:f] *= np.linspace(0, 1, f)
    x[-f:] *= np.linspace(1, 0, f)
    with wave.open(str(OUT / name), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
    print("  sfx/" + name, f"{len(x) / SR:.2f}s")


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    # message notification: two quick rising glassy blips
    blip = lambda f: tone(f, 0.12, decay=0.035, partials=((1, 1), (2.01, 0.25), (3.0, 0.08)))
    write("ping.wav", place(0.2, (0, blip(1318)), (0.055, blip(1760))), peak=0.6)
    # a second, slightly different notification so a burst doesn't sound looped
    write("ping2.wav", place(0.2, (0, blip(1175)), (0.05, blip(1568))), peak=0.55)

    # message falls out of the thread: soft descending sine glide + air
    t = t_axis(0.6)
    f = 700 * np.exp(-t / 0.25) + 160
    glide = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.01, 0.18)
    air = rng.uniform(-1, 1, len(t)) * env(t, 0.02, 0.12) * 0.08
    write("drop.wav", glide + air, peak=0.5)

    # clock tick: tiny filtered click
    t = t_axis(0.05)
    click = rng.uniform(-1, 1, len(t)) * env(t, 0.0005, 0.004)
    write("tick.wav", click + tone(2400, 0.05, decay=0.006) * 0.4, peak=0.45)

    # phone ring: two short soft two-tone pulses (original pattern)
    pulse = tone(880, 0.22, attack=0.01, decay=0.12, partials=((1, 1), (1.5, 0.5)))
    write("ring.wav", place(0.75, (0, pulse), (0.3, pulse)), peak=0.45)

    # status step in the product: muted marimba-like note
    note = lambda fr: tone(fr, 0.5, attack=0.002, decay=0.14, partials=((1, 1), (4.0, 0.12), (10.0, 0.03)))
    write("step.wav", note(784), peak=0.45)

    # CTA keyword: two-note resolve (fifth → octave), soft
    write("resolve.wav", place(0.9, (0, note(523)), (0.12, note(784)), (0.24, note(1046) * 0.8)), peak=0.5)

    # low, quiet "lost" pulse for the counter
    write("lost.wav", tone(196, 0.35, attack=0.01, decay=0.12, partials=((1, 1), (2, 0.3))), peak=0.4)


if __name__ == "__main__":
    main()
