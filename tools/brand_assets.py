# -*- coding: utf-8 -*-
"""Generate the RAVAND favicon set and Open Graph image.

Everything is built from the traced brand vectors in tools/*.json and the
real Manrope face (instantiated from the variable font Next caches), so no
asset is a stand-in.

Contours are filled with an even-odd rule via XOR accumulation, which is
what keeps the counters in R / A / A / D open in the wordmark.
"""
import glob
import json
import os
import re
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

WEB = sys.argv[1]
TOOLS = os.path.join(os.path.dirname(WEB.rstrip("/\\")), "tools")
OUT_APP = os.path.join(WEB, "app")
SCRATCH = os.path.dirname(os.path.abspath(__file__))

BLACK = (11, 13, 16)
OFFWHITE = (247, 248, 250)
SILVER = (183, 190, 199)
STEEL = (105, 114, 125)
ACCENT = (113, 133, 158)


# ---------------------------------------------------------------- vectors

def contours(path_d):
    """Parse the traced 'M x y L x y ... Z' path data into point lists."""
    out, cur = [], []
    for m in re.finditer(r"([MLZ])\s*([-\d.]+)?\s*([-\d.]+)?", path_d):
        cmd = m.group(1)
        if cmd == "Z":
            if len(cur) > 2:
                out.append(cur)
            cur = []
        else:
            cur.append((float(m.group(2)), float(m.group(3))))
    if len(cur) > 2:
        out.append(cur)
    return out


def shape_mask(path_d, size, scale, offset=(0.0, 0.0)):
    """Even-odd fill of a multi-contour path, as a 1-bit mask."""
    acc = Image.new("1", size, 0)
    for pts in contours(path_d):
        layer = Image.new("1", size, 0)
        ImageDraw.Draw(layer).polygon(
            [(x * scale + offset[0], y * scale + offset[1]) for x, y in pts], fill=1
        )
        acc = ImageChops.logical_xor(acc, layer)
    return acc


def paste_path(target, path_d, color, scale, offset):
    mask = shape_mask(path_d, target.size, scale, offset)
    target.paste(Image.new("RGB", target.size, color), (0, 0), mask)


SYMBOL = json.load(open(os.path.join(TOOLS, "symbol.json")))
# the tracer named the main body "dark"; expose it under the brand term
SYMBOL["ribbon"] = SYMBOL.get("ribbon") or SYMBOL["dark"]
WORDMARK = json.load(open(os.path.join(TOOLS, "wordmark.json")))
WORDMARK_FA = json.load(open(os.path.join(TOOLS, "wordmark-fa.json")))
for _w in (WORDMARK, WORDMARK_FA):
    _w["d"] = _w.get("d") or _w["mark"]


# ------------------------------------------------------------------ fonts

def manrope(weight, px):
    """Manrope at a real weight, pulled from the cached variable font."""
    cache = os.path.join(SCRATCH, f"manrope-{weight}.ttf")
    if not os.path.exists(cache):
        best, best_glyphs = None, -1
        for f in glob.glob(os.path.join(WEB, ".next/static/media/*.woff2")):
            try:
                ft = TTFont(f)
            except Exception:
                continue
            if "Manrope" not in (ft["name"].getDebugName(1) or ""):
                continue
            n = len(ft.getGlyphOrder())
            if n > best_glyphs:
                best, best_glyphs = f, n
        if best is None:
            raise SystemExit("Manrope not found in the Next font cache")
        ft = TTFont(best)
        if "fvar" in ft:
            ft = instancer.instantiateVariableFont(ft, {"wght": weight})
        ft.flavor = None
        ft.save(cache)
    return ImageFont.truetype(cache, px)


def tracked_text(draw, xy, text, font, fill, tracking=0.0, anchor_left=True):
    """PIL has no letter-spacing; draw glyph by glyph."""
    x, y = xy
    if not anchor_left:
        total = sum(draw.textlength(c, font=font) + tracking for c in text) - tracking
        x -= total
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking
    return x


def tracked_width(draw, text, font, tracking=0.0):
    return sum(draw.textlength(c, font=font) + tracking for c in text) - tracking


# ------------------------------------------------------------- app icon

def app_icon(px, simplified=False):
    """Dark rounded square + the mark, per the identity's app-icon panel."""
    ss = 4
    size = px * ss
    img = Image.new("RGB", (size, size), BLACK)

    # rounded square ground
    radius = int(size * 0.22)
    ground = Image.new("L", (size, size), 0)
    ImageDraw.Draw(ground).rounded_rectangle([0, 0, size - 1, size - 1], radius, fill=255)

    plate = Image.new("RGB", (size, size), BLACK)

    # the mark, inset and centred
    inset = size * 0.22
    avail = size - inset * 2
    scale = min(avail / SYMBOL["w"], avail / SYMBOL["h"])
    ox = (size - SYMBOL["w"] * scale) / 2
    oy = (size - SYMBOL["h"] * scale) / 2

    if not simplified:
        paste_path(plate, SYMBOL["leg"], SILVER, scale, (ox, oy))
    paste_path(plate, SYMBOL["ribbon"], OFFWHITE, scale, (ox, oy))

    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(plate, (0, 0), ground)
    return out.resize((px, px), Image.LANCZOS)


# ------------------------------------------------------------ og image

def og_image(w=1200, h=630):
    ss = 2
    W, H = w * ss, h * ss
    img = Image.new("RGB", (W, H), BLACK)
    draw = ImageDraw.Draw(img)

    # --- ordered background grid, faded toward the edges (site device)
    cell = 56 * ss
    grid = Image.new("L", (W, H), 0)
    gd = ImageDraw.Draw(grid)
    for x in range(0, W, cell):
        gd.line([(x, 0), (x, H)], fill=255, width=ss)
    for y in range(0, H, cell):
        gd.line([(0, y), (W, y)], fill=255, width=ss)
    fade = Image.new("L", (W, H), 0)
    fd = ImageDraw.Draw(fade)
    cx, cy = W * 0.42, H * 0.42
    steps = 120
    for i in range(steps, 0, -1):
        t = i / steps
        rx, ry = W * 0.78 * t, H * 0.95 * t
        fd.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=int(255 * (1 - t) ** 1.1))
    grid = ImageChops.multiply(grid, fade)
    grid = grid.point(lambda v: int(v * 0.30))
    img.paste(Image.new("RGB", (W, H), OFFWHITE), (0, 0), grid)

    pad = 84 * ss
    y = 150 * ss

    # --- bilingual lockup: mark | RAVAND | روند
    mark_h = 104 * ss
    mscale = mark_h / SYMBOL["h"]
    paste_path(img, SYMBOL["leg"], SILVER, mscale, (pad, y))
    paste_path(img, SYMBOL["ribbon"], OFFWHITE, mscale, (pad, y))
    cursor = pad + SYMBOL["w"] * mscale + 30 * ss

    word_h = 46 * ss
    wscale = word_h / WORDMARK["h"]
    wy = y + (mark_h - word_h) / 2
    paste_path(img, WORDMARK["d"], OFFWHITE, wscale, (cursor, wy))
    cursor += WORDMARK["w"] * wscale + 28 * ss

    draw.rectangle(
        [cursor, wy - 6 * ss, cursor + max(1, 2 * ss // 2), wy + word_h + 6 * ss],
        fill=(70, 78, 88),
    )
    cursor += 28 * ss

    fa_h = 52 * ss
    fscale = fa_h / WORDMARK_FA["h"]
    paste_path(
        img, WORDMARK_FA["d"], SILVER, fscale,
        (cursor, y + (mark_h - fa_h) / 2),
    )

    # --- tagline, in the real brand face
    tag_font = manrope(800, 62 * ss)
    ty = y + mark_h + 66 * ss
    draw.text((pad, ty), "Business, in flow.", font=tag_font, fill=OFFWHITE)

    sub_font = manrope(500, 25 * ss)
    sy = ty + 90 * ss
    draw.text(
        (pad, sy),
        "Business management systems, built around how you work.",
        font=sub_font,
        fill=STEEL,
    )

    # --- module index rail along the bottom
    rail_y = H - 92 * ss
    draw.rectangle([pad, rail_y - 34 * ss, W - pad, rail_y - 34 * ss + max(1, ss)],
                   fill=(42, 48, 56))
    code_font = manrope(700, 19 * ss)
    codes = ["ERP", "FIN", "CRM", "SLS", "INV", "WFL", "HR", "ANL"]
    x = pad
    for i, code in enumerate(codes):
        if i:
            draw.text((x, rail_y), "·", font=code_font, fill=(60, 68, 78))
            x += draw.textlength("·", font=code_font) + 22 * ss
        x = tracked_text(draw, (x, rail_y), code, code_font, SILVER, tracking=2.4 * ss)
        x += 22 * ss

    # --- one accent hairline, bottom-right
    draw.rectangle([W - pad - 120 * ss, rail_y + 2 * ss, W - pad, rail_y + 2 * ss + 3 * ss],
                   fill=ACCENT)

    return img.resize((w, h), Image.LANCZOS)


# ------------------------------------------------------------------ main

def write_icon_svg():
    """Vector favicon — crisp at every size, no rasterisation."""
    s = SYMBOL
    pad = s["w"] * 0.20
    side = s["w"] + pad * 2
    oy = (side - s["h"]) / 2
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {side:.2f} {side:.2f}">
  <rect width="{side:.2f}" height="{side:.2f}" rx="{side * 0.22:.2f}" fill="#0B0D10"/>
  <g transform="translate({pad:.2f} {oy:.2f})">
    <path d="{s['leg']}" fill="#B7BEC7" fill-rule="evenodd"/>
    <path d="{s['ribbon']}" fill="#F7F8FA" fill-rule="evenodd"/>
  </g>
</svg>
'''
    open(os.path.join(OUT_APP, "icon.svg"), "w", encoding="utf-8").write(svg)
    print("  app/icon.svg")


if __name__ == "__main__":
    write_icon_svg()

    # multi-size .ico; the two smallest drop the second colour so the mark
    # stays legible in a browser tab
    sizes = [16, 32, 48, 64, 128, 256]
    frames = [app_icon(n, simplified=n <= 32) for n in sizes]
    frames[-1].save(
        os.path.join(OUT_APP, "favicon.ico"),
        format="ICO",
        sizes=[(n, n) for n in sizes],
        append_images=frames[:-1],
    )
    print("  app/favicon.ico", sizes)

    app_icon(180).convert("RGB").save(
        os.path.join(OUT_APP, "apple-icon.png"), format="PNG", optimize=True
    )
    print("  app/apple-icon.png 180x180")

    og = og_image()
    og.save(os.path.join(OUT_APP, "opengraph-image.png"), format="PNG", optimize=True)
    print("  app/opengraph-image.png 1200x630",
          os.path.getsize(os.path.join(OUT_APP, "opengraph-image.png")) // 1024, "KB")
