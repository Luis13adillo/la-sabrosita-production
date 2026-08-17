#!/usr/bin/env python3
"""
Write data/background-busy.json — where the approved background is calm enough
to put type on, measured in FINAL CANVAS coordinates.

WHY MEASURE INSTEAD OF LOOK
assets/backgrounds/LS_Menu_Background_v01.png is 1792x1024 and the canvas is
1920x1080, so nothing in the artwork sits where the raw file says it does: the
CSS scales it by 1.0714 and anchors it to the bottom, dropping 17px off the top.
A title placed by eyeballing the source file would be off by that transform. So
this script applies the SAME transform the CSS applies, then reports per cell.

WHAT "BUSY" MEANS
Hard-edge density, not colour variance. The field is a smooth pink-to-purple
gradient across most of the frame; a variance metric flags that gradient as
"busy" when in fact it is the calmest part of the picture. What actually breaks
type is a hard boundary running through it — the edge of a cream drip, the rim
of a wave, the point of a star. So: count adjacent-sample colour jumps over a
threshold, per 1000 samples.

The title layout uses this to prefer calm ground, and to decide when a name
needs the brand's cream reading area (page 19: "Keep menu text on cream reading
areas so every item is easy to understand").

Read-only. Never writes to assets/.

Run:  python3 scripts/measure-background.py
"""

import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
PROJECT = HERE.parent
BG = PROJECT / "assets" / "backgrounds" / "LS_Menu_Background_v01.png"
OUT = PROJECT / "data" / "background-busy.json"

CANVAS_W, CANVAS_H = 1920, 1080
CELL = 40                      # 48 x 27 grid
STEP = 2                       # source-pixel sampling stride
JUMP = 45                      # per-channel sum that counts as a hard edge

# Cream #FFF8EF has relative luminance 0.947, so its contrast against a
# background of luminance L is 0.997/(L+0.05). WCAG AA for large text is 3.0,
# which caps L at 0.283. Anything brighter cannot carry cream type.
CREAM_SAFE_L = 0.283

# Must mirror .field.bg in compositions/product-scene.css.
FIT = "cover"
ANCHOR_Y = "bottom"


def main():
    if not BG.exists():
        sys.exit(f"background not found: {BG.relative_to(PROJECT)}")
    try:
        from PIL import Image
    except ImportError:
        sys.exit("Pillow required: python3 -m pip install --user Pillow")

    im = Image.open(BG).convert("RGB")
    W, H = im.size
    px = im.load()

    # `cover`: scale so BOTH axes are covered, i.e. the larger of the two ratios.
    scale = max(CANVAS_W / W, CANVAS_H / H)
    off_x = (W * scale - CANVAS_W) / 2                      # centre horizontally
    off_y = (H * scale - CANVAS_H) if ANCHOR_Y == "bottom" else (H * scale - CANVAS_H) / 2

    def to_src(cx, cy):
        return (cx + off_x) / scale, (cy + off_y) / scale

    def lin(v):
        v /= 255.0
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4

    cols = CANVAS_W // CELL
    rows = CANVAS_H // CELL
    grid = []
    luma = []
    hotfrac = []
    for r in range(rows):
        line, lline, pline = [], [], []
        for c in range(cols):
            sx0, sy0 = to_src(c * CELL, r * CELL)
            sx1, sy1 = to_src((c + 1) * CELL, (r + 1) * CELL)
            sx0, sx1 = max(0, int(sx0)), min(W, int(sx1))
            sy0, sy1 = max(0, int(sy0)), min(H, int(sy1))
            hits = total = 0
            lsum = 0.0
            lmax = 0.0
            hot = 0
            for y in range(sy0, sy1, STEP):
                prev = None
                for x in range(sx0, sx1, STEP):
                    c_ = px[x, y]
                    total += 1
                    if prev is not None and sum(abs(a - b) for a, b in zip(c_, prev)) > JUMP:
                        hits += 1
                    prev = c_
                    L = 0.2126 * lin(c_[0]) + 0.7152 * lin(c_[1]) + 0.0722 * lin(c_[2])
                    lsum += L
                    lmax = max(lmax, L)
                    if L > CREAM_SAFE_L:
                        hot += 1
            line.append(round(hits / max(1, total) * 1000, 1))
            lline.append(round(lsum / max(1, total), 4))
            pline.append(round(hot / max(1, total), 3))
        grid.append(line)
        luma.append(lline)
        hotfrac.append(pline)

    flat = [v for line in grid for v in line]
    calm = sum(1 for v in flat if v < 2)
    OUT.write_text(json.dumps({
        "_generated": "scripts/measure-background.py — read-only measurement of the approved background",
        "_source": str(BG.relative_to(PROJECT)),
        "_units": "hard colour transitions per 1000 samples, in 1920x1080 canvas space",
        "_transform": {
            "sourceSize": [W, H], "canvas": [CANVAS_W, CANVAS_H],
            "fit": FIT, "anchorY": ANCHOR_Y,
            "scale": round(scale, 5),
            "croppedTopPx": round(off_y, 1), "croppedSidePx": round(off_x, 1),
            "_note": "mirrors .field.bg; if that CSS changes, re-run this",
        },
        "cell": CELL, "cols": cols, "rows": rows,
        "calmThreshold": 2.0,
        "grid": grid,
        "_luma": "WCAG relative luminance. mean = average over the cell; "
                 "hot = FRACTION of samples too bright for cream. Cream product names are drawn "
                 "straight onto the artwork with no reading card behind them, so "
                 "a name may only sit where the artwork stays DARK enough for "
                 "cream to hold contrast. Cream #FFF8EF is L=0.947, so contrast "
                 "against a cell is (0.997)/(L+0.05); AA for large text is 3.0, "
                 "which means L must stay under ~0.283. peak is what actually "
                 "matters — a cell averaging dark because it is half purple and "
                 "half cream drip would still swallow the glyphs crossing it. "
                 "A FRACTION rather than the peak, because one star lands a single "
                 "bright sample in an otherwise-purple cell and vetoing that cell "
                 "would forbid most of the frame for no legibility gain.",
        "luma": luma,
        "lumaHot": hotfrac,
    }, indent=1) + "\n")

    # Anchoring to the BOTTOM means the overflow comes off the TOP, so name the
    # edge that actually loses pixels rather than the edge being anchored.
    cropped_edge = "top" if ANCHOR_Y == "bottom" else "top and bottom evenly"
    print(f"background: {W}x{H} -> scale {scale:.4f}, anchored {ANCHOR_Y}, "
          f"{off_y:.0f}px cropped off the {cropped_edge}")
    print(f"grid {cols}x{rows} @ {CELL}px — {calm}/{len(flat)} cells calm (<2.0)")
    print(f"wrote {OUT.relative_to(PROJECT)}")


if __name__ == "__main__":
    main()
