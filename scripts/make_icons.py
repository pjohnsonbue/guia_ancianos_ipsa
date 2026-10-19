#!/usr/bin/env python3
"""Generates every icon, splash and store image from the master logo layers
written by build_logo_icon.py:

    assets/source/app-icon.png             square master icon (emblem on navy)
    assets/source/app-icon-background.png  the navy background alone
    assets/source/emblem.png               the emblem alone, transparent

Outputs:
  assets/icon.png                       1024² iOS / store icon (no transparency)
  assets/splash-icon.png                1024² emblem on transparency (native splash + CustomSplashScreen)
  assets/android-icon-foreground.png    1024² adaptive-icon foreground (emblem only, in the safe zone)
  assets/android-icon-background.png    1024² adaptive-icon background (navy)
  assets/android-icon-monochrome.png    1024² Android 13+ themed icon (white silhouette)
  assets/favicon.png                    48² web favicon
  store-assets/icon-hires-512.png       Play Store hi-res icon
  store-assets/feature-graphic-1024x500.png  Play Store feature graphic

    pip install pillow numpy
    python scripts/build_logo_icon.py
    python scripts/make_icons.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "source"
ASSETS = ROOT / "assets"
STORE = ROOT / "store-assets"
FONT_TITLE = ROOT / "node_modules/@expo-google-fonts/fraunces/900Black/Fraunces_900Black.ttf"
FONT_BODY = ROOT / "node_modules/@expo-google-fonts/manrope/800ExtraBold/Manrope_800ExtraBold.ttf"

SIZE = 1024
# Android guarantees only the middle 66/108 of an adaptive icon survives every
# mask shape (a circle 66/108 wide); the shield's corners are kept inside it.
ADAPTIVE_EMBLEM_HEIGHT = 0.45
# The splash emblem fills most of its square; the native splash and
# CustomSplashScreen size the square themselves.
SPLASH_EMBLEM_HEIGHT = 0.92


def fit_centered(emblem: Image.Image, height_fraction: float, size: int = SIZE) -> Image.Image:
    h = round(size * height_fraction)
    w = round(emblem.width * h / emblem.height)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.alpha_composite(emblem.resize((w, h), Image.LANCZOS), ((size - w) // 2, (size - h) // 2))
    return out


def main():
    ASSETS.mkdir(exist_ok=True)
    STORE.mkdir(exist_ok=True)
    icon = Image.open(SRC / "app-icon.png").convert("RGB").resize((SIZE, SIZE), Image.LANCZOS)
    background = Image.open(SRC / "app-icon-background.png").convert("RGB").resize((SIZE, SIZE), Image.LANCZOS)
    emblem = Image.open(SRC / "emblem.png").convert("RGBA")

    icon.save(ASSETS / "icon.png")
    icon.resize((512, 512), Image.LANCZOS).save(STORE / "icon-hires-512.png")
    icon.resize((48, 48), Image.LANCZOS).save(ASSETS / "favicon.png")
    fit_centered(emblem, SPLASH_EMBLEM_HEIGHT).save(ASSETS / "splash-icon.png")

    fit_centered(emblem, ADAPTIVE_EMBLEM_HEIGHT).save(ASSETS / "android-icon-foreground.png")
    background.save(ASSETS / "android-icon-background.png")
    mono = Image.new("RGBA", emblem.size, (255, 255, 255, 0))
    mono.putalpha(emblem.getchannel("A"))
    fit_centered(mono, ADAPTIVE_EMBLEM_HEIGHT).save(ASSETS / "android-icon-monochrome.png")

    # Play Store feature graphic: the emblem on navy, plus the name.
    navy = np.asarray(background).reshape(-1, 3).mean(axis=0)
    top, bottom = navy * 1.15, navy * 0.8
    ramp = (top + (bottom - top) * np.linspace(0, 1, 500)[:, None]).clip(0, 255).astype(np.uint8)
    fg = Image.fromarray(np.repeat(ramp[:, None, :], 1024, axis=1), "RGB").convert("RGBA")
    mark = emblem.resize((round(emblem.width * 380 / emblem.height), 380), Image.LANCZOS)
    fg.alpha_composite(mark, (90 + (300 - mark.width) // 2, 60))
    fg = fg.convert("RGB")
    d = ImageDraw.Draw(fg)
    title_font = ImageFont.truetype(str(FONT_TITLE), 50)
    d.text((440, 130), "Guía de Formación", font=title_font, fill=(255, 255, 255))
    d.text((440, 192), "de Ancianos IPSA", font=title_font, fill=(255, 255, 255))
    d.text((442, 290), "Presbiterio San Andrés", font=ImageFont.truetype(str(FONT_BODY), 30), fill=(232, 190, 96))
    d.text((442, 336), "Tarjetas de estudio y simulacros", font=ImageFont.truetype(str(FONT_BODY), 26), fill=(214, 226, 244))
    fg.save(STORE / "feature-graphic-1024x500.png")

    r, g, b = (int(round(v)) for v in navy)
    print("Icons written to assets/ and store-assets/")
    print(f"Navy for app.json splash/adaptive backgroundColor and CustomSplashScreen: #{r:02X}{g:02X}{b:02X}")


if __name__ == "__main__":
    main()
