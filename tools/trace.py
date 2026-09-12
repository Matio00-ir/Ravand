"""Trace flat-colour regions of a brand image into SVG paths.

Pure PIL + stdlib: crack-following boundary extraction, Chaikin smoothing,
then Douglas-Peucker simplification. Good enough for logo artwork where the
source is a clean render on a plain background.
"""
import sys, json
from PIL import Image


def mask_of(img, lo, hi):
    w, h = img.size
    px = img.load()
    m = bytearray(w * h)
    for y in range(h):
        row = y * w
        for x in range(w):
            v = px[x, y]
            if lo <= v <= hi:
                m[row + x] = 1
    return m, w, h


def bbox(m, w, h):
    xs0, ys0, xs1, ys1 = w, h, -1, -1
    for y in range(h):
        row = y * w
        for x in range(w):
            if m[row + x]:
                if x < xs0: xs0 = x
                if x > xs1: xs1 = x
                if y < ys0: ys0 = y
                if y > ys1: ys1 = y
    return xs0, ys0, xs1, ys1


def loops(m, w, h):
    """Follow the cracks between filled and empty pixels -> closed loops."""
    def at(x, y):
        if x < 0 or y < 0 or x >= w or y >= h: return 0
        return m[y * w + x]

    edges = {}
    for y in range(h):
        for x in range(w):
            if not at(x, y):
                continue
            # directed so the filled pixel stays on the left
            if not at(x, y - 1): edges.setdefault((x, y), []).append((x + 1, y))
            if not at(x + 1, y): edges.setdefault((x + 1, y), []).append((x + 1, y + 1))
            if not at(x, y + 1): edges.setdefault((x + 1, y + 1), []).append((x, y + 1))
            if not at(x - 1, y): edges.setdefault((x, y + 1), []).append((x, y))

    out = []
    while edges:
        start = next(iter(edges))
        loop = [start]
        cur = start
        while True:
            nxts = edges.get(cur)
            if not nxts:
                break
            nxt = nxts.pop()
            if not nxts:
                del edges[cur]
            loop.append(nxt)
            cur = nxt
            if cur == start:
                break
        if len(loop) > 8:
            out.append(loop)
    return out


def chaikin(pts, rounds=2):
    for _ in range(rounds):
        n = len(pts)
        new = []
        for i in range(n):
            p = pts[i]
            q = pts[(i + 1) % n]
            new.append((p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25))
            new.append((p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75))
        pts = new
    return pts


def dp(pts, tol):
    if len(pts) < 3: return pts
    ax, ay = pts[0]; bx, by = pts[-1]
    dx, dy = bx - ax, by - ay
    den = (dx * dx + dy * dy) ** 0.5 or 1e-9
    worst, idx = 0.0, 0
    for i in range(1, len(pts) - 1):
        px, py = pts[i]
        d = abs(dy * px - dx * py + bx * ay - by * ax) / den
        if d > worst: worst, idx = d, i
    if worst <= tol:
        return [pts[0], pts[-1]]
    return dp(pts[:idx + 1], tol)[:-1] + dp(pts[idx:], tol)


def simplify_loop(loop, tol):
    pts = chaikin([(float(x), float(y)) for x, y in loop], rounds=2)
    k = len(pts) // 2
    a = dp(pts[:k + 1], tol)
    b = dp(pts[k:] + [pts[0]], tol)
    return a[:-1] + b[:-1]


def to_path(loops_, ox, oy, scale, tol):
    parts = []
    for lp in loops_:
        pts = simplify_loop(lp, tol)
        if len(pts) < 3: continue
        d = " ".join(
            ("M" if i == 0 else "L") + f"{(x-ox)*scale:.2f} {(y-oy)*scale:.2f}"
            for i, (x, y) in enumerate(pts)
        )
        parts.append(d + "Z")
    return " ".join(parts)


def trace(path, regions, crop=None, out_size=100.0, tol=0.9):
    img = Image.open(path).convert("L")
    if crop: img = img.crop(crop)
    results = {}
    allbb = None
    masks = {}
    for name, (lo, hi) in regions.items():
        m, w, h = mask_of(img, lo, hi)
        masks[name] = (m, w, h)
        b = bbox(m, w, h)
        if b[2] < 0: continue
        allbb = b if allbb is None else (
            min(allbb[0], b[0]), min(allbb[1], b[1]),
            max(allbb[2], b[2]), max(allbb[3], b[3]))
    x0, y0, x1, y1 = allbb
    bw, bh = (x1 - x0 + 1), (y1 - y0 + 1)
    scale = out_size / max(bw, bh)
    for name, (m, w, h) in masks.items():
        results[name] = to_path(loops(m, w, h), x0, y0, scale, tol)
    return results, bw * scale, bh * scale


def components(m, w, h, min_frac=0.02):
    """Keep only connected components that matter; drops antialias halos."""
    seen = bytearray(w * h)
    comps = []
    for i in range(w * h):
        if not m[i] or seen[i]:
            continue
        stack = [i]
        seen[i] = 1
        cells = []
        while stack:
            j = stack.pop()
            cells.append(j)
            x, y = j % w, j // w
            for nx, ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
                if 0 <= nx < w and 0 <= ny < h:
                    k = ny * w + nx
                    if m[k] and not seen[k]:
                        seen[k] = 1
                        stack.append(k)
        comps.append(cells)
    if not comps:
        return m
    biggest = max(len(c) for c in comps)
    out = bytearray(w * h)
    for c in comps:
        if len(c) >= biggest * min_frac:
            for j in c:
                out[j] = 1
    return out
