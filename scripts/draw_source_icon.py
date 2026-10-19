#!/usr/bin/env python3
"""Draws the master app icon (assets/source/app-icon.png) from scratch:
an open Bible on San Andrés blue, over a tone-on-tone saltire (the cross of
Saint Andrew), with a small gold cross above it.

Also writes assets/source/app-icon-background.png (the background alone),
which make_icons.py uses for the Android adaptive-icon background layer.

Run it only if you want to tweak the drawing; otherwise replace
assets/source/app-icon.png with any square artwork and run make_icons.py.

    pip install pillow numpy
    python scripts/draw_source_icon.py
    python scripts/make_icons.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "source" / "app-icon.png"

S = 4096  # supersampled canvas, downsampled to 1024 at the end
BG_TOP = np.array([18, 92, 176], np.float32)  # #125CB0
BG_BOTTOM = np.array([8, 52, 112], np.float32)  # #083470
SALTIRE = (24, 104, 190)
CREAM = (250, 244, 228)
CREAM_SHADE = (232, 222, 198)
GOLD = (214, 166, 58)
GOLD_DEEP = (170, 124, 30)
RIBBON = (168, 38, 56)
LINE = (196, 186, 164)


def lerp(a, b, t):
    return a + (b - a) * t


def page(x_spine, y_top_spine, y_bot_spine, x_outer, y_top_outer, y_bot_outer, steps=60):
    """Polygon for one page: straight spine edge, gently curved top/bottom."""
    pts = []
    for i in range(steps + 1):
        t = i / steps
        x = lerp(x_spine, x_outer, t)
        # Curved top edge: dips near the spine, rises toward the outer edge.
        y = lerp(y_top_spine, y_top_outer, t) - np.sin(np.pi * t) * 120
        pts.append((x, y))
    for i in range(steps + 1):
        t = 1 - i / steps
        x = lerp(x_spine, x_outer, t)
        y = lerp(y_bot_spine, y_bot_outer, t) - np.sin(np.pi * t) * 70
        pts.append((x, y))
    return pts


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    # Background: vertical gradient.
    ramp = (BG_TOP + (BG_BOTTOM - BG_TOP) * np.linspace(0, 1, S)[:, None]).astype(np.uint8)
    img = Image.fromarray(np.repeat(ramp[:, None, :], S, axis=1), "RGB")
    d = ImageDraw.Draw(img)

    # Tone-on-tone saltire.
    w = 520
    d.line([(-200, -200), (S + 200, S + 200)], fill=SALTIRE, width=w)
    d.line([(S + 200, -200), (-200, S + 200)], fill=SALTIRE, width=w)

    # Background-only layer (gradient + saltire), used by make_icons.py as the
    # Android adaptive-icon background so no ghost of the art shows behind it.
    img.resize((1024, 1024), Image.LANCZOS).save(OUT.with_name("app-icon-background.png"))

    cx = S // 2
    spine_top, spine_bot = 1720, 3120
    outer_top, outer_bot = 1560, 2980
    half = 1500

    # Soft shadow under the book.
    shadow = Image.new("L", (S, S), 0)
    sd = ImageDraw.Draw(shadow)
    sd.ellipse([cx - 1550, 3000, cx + 1550, 3330], fill=150)
    shadow = shadow.filter(ImageFilter.GaussianBlur(90))
    img.paste((4, 30, 70), (0, 0), shadow)
    d = ImageDraw.Draw(img)

    # Cover (gold), slightly larger than the pages.
    for sign in (-1, 1):
        d.polygon(page(cx, spine_top + 70, spine_bot + 90, cx + sign * (half + 90), outer_top + 60, outer_bot + 110), fill=GOLD_DEEP)
        d.polygon(page(cx, spine_top + 40, spine_bot + 60, cx + sign * (half + 60), outer_top + 30, outer_bot + 75), fill=GOLD)

    # Page stack edges then the top pages.
    for sign in (-1, 1):
        for k, col in ((36, CREAM_SHADE), (18, (240, 232, 212))):
            d.polygon(page(cx, spine_top + k, spine_bot + k, cx + sign * (half + k * 0.6), outer_top + k, outer_bot + k), fill=col)
        d.polygon(page(cx, spine_top, spine_bot, cx + sign * half, outer_top, outer_bot), fill=CREAM)

    # Text lines on both pages.
    for sign in (-1, 1):
        for row in range(9):
            t0, t1 = 0.12, 0.86
            y0 = spine_top + 210 + row * 125
            pts = []
            for i in range(40):
                t = lerp(t0, t1, i / 39)
                x = lerp(cx, cx + sign * half, t)
                y = y0 + (outer_top - spine_top) * t - np.sin(np.pi * t) * 120
                pts.append((x, y))
            if row == 8:
                pts = pts[: int(len(pts) * 0.55)]
            d.line(pts, fill=LINE, width=34, joint="curve")

    # Spine gutter shading.
    d.line([(cx, spine_top - 10), (cx, spine_bot + 10)], fill=CREAM_SHADE, width=40)

    # Ribbon bookmark.
    rx = cx + 120
    d.polygon([(rx - 70, spine_bot - 40), (rx + 70, spine_bot - 40), (rx + 70, spine_bot + 430), (rx, spine_bot + 340), (rx - 70, spine_bot + 430)], fill=RIBBON)

    # Gold cross above the book.
    cw, ch, arm = 200, 1050, 660
    top = 380
    d.rounded_rectangle([cx - cw // 2, top, cx + cw // 2, top + ch], radius=50, fill=GOLD)
    d.rounded_rectangle([cx - arm // 2, top + 260, cx + arm // 2, top + 260 + cw], radius=50, fill=GOLD)

    img = img.resize((1024, 1024), Image.LANCZOS)
    img.save(OUT)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
