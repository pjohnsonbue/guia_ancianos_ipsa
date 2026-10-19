#!/usr/bin/env python3
"""Builds the master app icon from the IPSA logo.

Input:
  assets/source/logo-ipsa.png   the logo as supplied: a light emblem (shield,
                                saltire and burning bush) on navy

Outputs:
  assets/source/app-icon.png             1024² master icon: emblem centred on navy
  assets/source/app-icon-background.png  1024² plain navy (Android adaptive background)
  assets/source/emblem.png               the emblem alone on transparency (1024 tall)

The supplied logo is small, so instead of simply enlarging it (which blurs),
the emblem is re-drawn as a clean two-tone mask: the logo's brightness is
upsampled and then re-thresholded, which gives crisp anti-aliased edges at
any size.

Then run make_icons.py to produce every icon, splash and store image:

    pip install pillow numpy
    python scripts/build_logo_icon.py
    python scripts/make_icons.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "source" / "logo-ipsa.png"
OUT = ROOT / "assets" / "source" / "app-icon.png"
OUT_BG = ROOT / "assets" / "source" / "app-icon-background.png"
OUT_EMBLEM = ROOT / "assets" / "source" / "emblem.png"

SIZE = 1024
NAVY = (26, 43, 81)  # #1A2B51, sampled from the logo's background
EMBLEM = (238, 241, 243)  # the emblem's light tone, slightly brightened
EMBLEM_HEIGHT = 0.74  # emblem height as a fraction of the icon


def emblem_mask(target_height: int) -> Image.Image:
    rgb = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float32)
    lum = rgb.mean(axis=-1)
    navy, light = np.percentile(lum, 5), np.percentile(lum, 97)
    alpha = np.clip((lum - navy) / (light - navy), 0, 1)

    ys, xs = np.where(alpha > 0.5)
    pad = 3
    box = (max(xs.min() - pad, 0), max(ys.min() - pad, 0), min(xs.max() + pad + 1, alpha.shape[1]), min(ys.max() + pad + 1, alpha.shape[0]))
    crop = Image.fromarray((alpha * 255).astype(np.uint8), "L").crop(box)

    # Upsample well past the target, re-threshold for crisp edges, then
    # downsample to the target size for smooth anti-aliasing.
    big_h = target_height * 2
    big_w = round(crop.width * big_h / crop.height)
    big = crop.resize((big_w, big_h), Image.BICUBIC).filter(ImageFilter.GaussianBlur(big_h / 900))
    a = np.asarray(big).astype(np.float32) / 255
    a = np.clip((a - 0.5) / 0.08 + 0.5, 0, 1)  # steep ramp around the midpoint
    sharp = Image.fromarray((a * 255).astype(np.uint8), "L")
    return sharp.resize((round(big_w / 2), target_height), Image.LANCZOS)


def main():
    mask = emblem_mask(round(SIZE * EMBLEM_HEIGHT))
    icon = Image.new("RGB", (SIZE, SIZE), NAVY)
    emblem = Image.new("RGB", mask.size, EMBLEM)
    icon.paste(emblem, ((SIZE - mask.width) // 2, (SIZE - mask.height) // 2), mask)
    icon.save(OUT)
    Image.new("RGB", (SIZE, SIZE), NAVY).save(OUT_BG)
    big = emblem_mask(SIZE)
    emblem_only = Image.new("RGBA", big.size, EMBLEM + (0,))
    emblem_only.putalpha(big)
    emblem_only.save(OUT_EMBLEM)
    print(f"Wrote {OUT.relative_to(ROOT)} and {OUT_BG.relative_to(ROOT)} (emblem {mask.width}×{mask.height})")


if __name__ == "__main__":
    main()
