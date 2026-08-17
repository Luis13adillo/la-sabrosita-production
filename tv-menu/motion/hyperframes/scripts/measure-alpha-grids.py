#!/usr/bin/env python3
"""
Write data/master-alpha.json — a coarse opacity map for every master.

WHY A GRID AND NOT JUST THE BOUNDING BOX
data/master-bboxes.json already records each product's opaque bounding box, and
that is the right tool for SIZING — it answers "how big is the food". It is the
wrong tool for PLACEMENT, because a bounding box says a banana split occupies
x396-1524 by y190-890 when most of that rectangle is empty air above the boat
dish and around the cherries. Placing a name against the bbox would refuse the
frame's best negative space and push every title into the same thin strip.

So this records WHERE the pixels actually are: a 64x64 coverage grid per master,
each cell a 1 if any meaningful alpha falls inside it. The title placer maps that
grid through each frame's own scale/offset to find real empty space.

Stored as 64 strings of 64 characters so the file stays diffable and reviewable
rather than an opaque blob, and so build-frames.py needs no image library at all.

Read-only: opens the masters through assets/manual and writes only to data/.

Run:  python3 scripts/measure-alpha-grids.py
"""

import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
PROJECT = HERE.parent
SRC = PROJECT / "assets" / "manual"
OUT = PROJECT / "data" / "master-alpha.json"

N = 64              # grid resolution per axis
ALPHA_ON = 32       # a pixel counts as present above this alpha
CELL_ON = 0.02      # a cell is occupied if >2% of its samples are present
SAMPLES = 6         # samples per cell per axis


def grid_for(im):
    """64x64 occupancy strings for one RGBA master."""
    w, h = im.size
    a = im.split()[3].load()
    rows = []
    for r in range(N):
        line = []
        for c in range(N):
            x0, x1 = c * w // N, max(c * w // N + 1, (c + 1) * w // N)
            y0, y1 = r * h // N, max(r * h // N + 1, (r + 1) * h // N)
            on = tot = 0
            for sy in range(SAMPLES):
                y = y0 + (y1 - y0) * sy // SAMPLES
                for sx in range(SAMPLES):
                    x = x0 + (x1 - x0) * sx // SAMPLES
                    tot += 1
                    if a[x, y] > ALPHA_ON:
                        on += 1
            line.append("1" if on / tot > CELL_ON else "0")
        rows.append("".join(line))
    return rows


def main():
    try:
        from PIL import Image
    except ImportError:
        sys.exit("Pillow required: python3 -m pip install --user Pillow")

    if not SRC.exists():
        sys.exit(f"source folder missing: {SRC}")

    files = sorted(p for p in SRC.iterdir()
                   if p.suffix.lower() == ".png" and not p.name.startswith("."))
    out = {}
    opaque = []
    for p in files:
        im = Image.open(p)
        if im.mode != "RGBA":
            # No alpha channel at all: a photo on white, not a cut-out. Treat the
            # whole canvas as occupied — it IS a solid rectangle on screen.
            out[p.name] = {"n": N, "rows": ["1" * N] * N, "cutout": False}
            opaque.append(p.name)
            continue
        rows = grid_for(im.convert("RGBA"))
        filled = sum(row.count("1") for row in rows) / (N * N)
        # Content touching every edge means there is no transparent margin to
        # find; the master is effectively a filled rectangle.
        full = filled > 0.985
        out[p.name] = {"n": N, "rows": rows, "cutout": not full}
        if full:
            opaque.append(p.name)

    OUT.write_text(json.dumps({
        "_generated": "scripts/measure-alpha-grids.py — read-only measurement of assets/manual",
        "_units": f"{N}x{N} grid per master, row-major, '1' = product pixels present",
        "_thresholds": {"alphaOn": ALPHA_ON, "cellOn": CELL_ON, "samplesPerAxis": SAMPLES},
        "_note": "Placement input only. Sizing still comes from data/master-bboxes.json.",
        "masters": out,
    }, indent=1) + "\n")

    print(f"measured {len(files)} master(s) at {N}x{N}")
    if opaque:
        print(f"  {len(opaque)} with no transparent margin (treated as solid):")
        for n in opaque:
            print(f"    {n}")
    print(f"wrote {OUT.relative_to(PROJECT)}")


if __name__ == "__main__":
    main()
