#!/usr/bin/env python3
"""
Measure the opaque bounding box of every approved MASTER.

Why this exists
---------------
Every MASTER is a 2000x2000 transparent PNG, but the food inside occupies only
part of that square — a Crazy Shake fills 53% of the width, a wide sandwich
fills most of it. CSS `object-fit: contain` fits the SQUARE CANVAS into the shot
box, not the food, so products with tall narrow silhouettes render far smaller
than products that fill their canvas. On a TV read across a room that is the
difference between appetising and lost.

This pass measures the real alpha bounding box of each master once, so the
frame builder can scale and place each cut-out by its FOOD rather than by its
canvas. Nothing is cropped: the full master is still drawn, it is just scaled
and offset so the opaque region fills the shot box.

Three images in the client's manual selection are ordinary photographs on a
white background, not cut-outs. There is no alpha to measure, so their box is
the whole canvas and the frame builder puts them on a white card instead of
floating them on the gradient. They are measured here, not skipped, so every
image still gets a placement.

Reads  : ../assets/manual/*.png              (read-only, never modified)
Writes : ../data/master-bboxes.json

Run:  python3 scripts/measure-masters.py
"""

import json
import pathlib
import sys

from PIL import Image

Image.MAX_IMAGE_PIXELS = None

HERE = pathlib.Path(__file__).resolve().parent
PROJECT = HERE.parent
sys.path.insert(0, str(HERE))
import asset_paths as AP        # noqa: E402

# PORTABILITY, 2026-08-17
# ----------------------
# This used to read `assets/manual`, an ABSOLUTE symlink to
# ~/Downloads/LaSabrosita, so it only ran on one Mac. The selection now
# resolves through scripts/asset_paths.py, which reads data/image-paths.json
# and returns a path INSIDE the repository for every image. Nothing here
# reads Downloads any more.
SRC = None   # resolved per image by asset_paths
INVENTORY = PROJECT / "data" / "source-inventory.json"
OUT = PROJECT / "data" / "master-bboxes.json"


def main():
    inv = json.loads(INVENTORY.read_text())
    files = sorted({e["file"] for e in inv["images"]})

    out = {}
    opaque = 0
    for f in files:
        with Image.open(AP.abs_for(f)) as im:
            w, h = im.size
            bb = im.getchannel("A").getbbox() if im.mode in ("RGBA", "LA") else None
            if bb == (0, 0, w, h) or bb is None:
                # Content reaches every edge, so the box IS the frame. Either a
                # grouped shot filling its canvas, or a photo with no alpha at
                # all. Both place the same way; neither is an error.
                bb = (0, 0, w, h)
                opaque += 1
        x0, y0, x1, y1 = bb
        out[f] = {
            # normalised 0-1 against the canvas, so the numbers stay valid
            # whatever size the master is
            "x0": round(x0 / w, 6), "y0": round(y0 / h, 6),
            "x1": round(x1 / w, 6), "y1": round(y1 / h, 6),
            "w": round((x1 - x0) / w, 6), "h": round((y1 - y0) / h, 6),
            "canvas": [w, h],
        }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(
        {"_generated": "scripts/measure-masters.py — read-only measurement of the manual selection",
         "_note": "normalised alpha bounding boxes; used to scale each image by its food, not its canvas",
         "masters": out}, indent=2) + "\n")

    fills = sorted(((v["w"] * v["h"], k) for k, v in out.items()))
    print(f"measured {len(out)} images -> {OUT.relative_to(PROJECT)}")
    print(f"  canvas coverage ranges {fills[0][0]:.1%} ({fills[0][1]}) "
          f"to {fills[-1][0]:.1%} ({fills[-1][1]})")
    print(f"  {opaque} fill their canvas edge to edge — boxed to the full frame")


if __name__ == "__main__":
    main()
