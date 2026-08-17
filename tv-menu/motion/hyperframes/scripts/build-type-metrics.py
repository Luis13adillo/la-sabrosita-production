#!/usr/bin/env python3
"""
Write data/type-metrics.json — per-glyph advance widths for the brand face.

WHY THIS EXISTS
The adaptive title layout has to know how wide "Chicharron Preparado" will be
at 96px BEFORE it writes the HTML, so it can decide whether that name fits the
free space it picked or has to step down a size or wrap. Guessing an average
glyph width is what the old .pill floor did (PILL_EM = 0.60) and it is wrong in
both directions: it over-reserves for narrow strings ("Elote") and under-reserves
for wide ones ("Mangonada"), which is exactly how a name card ends up either
floating in a box twice its size or overflowing into its neighbour.

So the widths are measured from the actual shipped font file, once, and frozen
into data/type-metrics.json. build-frames.py then reads that table and needs no
font library at build time — the layout stays deterministic and reproducible
even if fontTools is not installed.

Re-run this ONLY if assets/fonts/ changes.

Needs fontTools + brotli (woff2 decompression):
    uv pip install --python <venv> fonttools brotli

Run:  python3 scripts/build-type-metrics.py
"""

import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
PROJECT = HERE.parent
OUT = PROJECT / "data" / "type-metrics.json"

# Weight -> the woff2 files that carry it. latin-ext is merged over latin so
# accented menu names (Bionico, Mangonada, Piña) measure correctly too.
FACES = {
    # 400 is the description line inside the name card. It was added when the
    # card replaced the bare display title: a name is one measured string, but a
    # description WRAPS, and deciding how many lines it takes needs the regular
    # weight's own advances — the 700 table over-measures body text by ~4%,
    # which is enough to predict two lines where three render.
    "400": ["NotoSans-400-latin.woff2", "NotoSans-400-latin-ext.woff2"],
    "700": ["NotoSans-700-latin.woff2", "NotoSans-700-latin-ext.woff2"],
    "900": ["NotoSans-900-latin.woff2", "NotoSans-900-latin-ext.woff2"],
}


def measure(paths, weight):
    """
    Advance widths for one weight.

    VARIABLE FONT, 2026-08-17. Google's css2 API serves ONE variable file for
    every weight requested, so assets/fonts/ holds six names and two distinct
    files — NotoSans-400/700/900-latin.woff2 are byte-identical, a wght
    100-900 variable font whose default instance is 400.

    Reading hmtx straight off that file therefore returned 400-weight advances
    for all three weights. The table said 700 and 900 were exactly as wide as
    400, the fitter believed it, and "Elote y Esquite Hot Cheetos" was measured
    at two lines and rendered at three — about 10% narrower than the truth.

    So a variable font is INSTANCED at the requested weight first, which bakes
    the wght axis into hmtx and gives the advances the browser will actually
    use. A static font is read as before.
    """
    from fontTools.ttLib import TTFont

    adv = {}
    upm = None
    for p in paths:
        f = TTFont(str(p))
        if "fvar" in f and any(a.axisTag == "wght" for a in f["fvar"].axes):
            from fontTools.varLib import instancer
            f = instancer.instantiateVariableFont(f, {"wght": weight}, inplace=True)
        upm = f["head"].unitsPerEm
        cmap = f.getBestCmap()
        hmtx = f["hmtx"]
        for code, glyph in cmap.items():
            if 32 <= code < 0x2E80:          # latin + punctuation + symbols
                adv.setdefault(chr(code), hmtx[glyph][0] / upm)
    return adv, upm


def main():
    try:
        import fontTools  # noqa: F401
    except ImportError:
        sys.exit(
            "fontTools not installed. This script only needs to run when the font\n"
            "files change; data/type-metrics.json is committed and build-frames.py\n"
            "reads that. To regenerate:\n"
            "  uv venv /tmp/ft && uv pip install --python /tmp/ft/bin/python fonttools brotli\n"
            "  /tmp/ft/bin/python scripts/build-type-metrics.py"
        )

    fonts = PROJECT / "assets" / "fonts"
    out = {
        "_generated": "scripts/build-type-metrics.py — advance widths from the shipped woff2",
        "_units": "fractions of font-size (already divided by unitsPerEm)",
        "_note": "Sum of advances only. Kerning is NOT applied, so a measured string is "
                 "very slightly WIDER than it renders — the safe direction for fitting.",
        "weights": {},
    }
    for weight, names in FACES.items():
        paths = [fonts / n for n in names]
        missing = [p.name for p in paths if not p.exists()]
        if missing:
            sys.exit(f"missing font file(s): {', '.join(missing)}")
        adv, upm = measure(paths, int(weight))
        out["weights"][weight] = {
            "unitsPerEm": upm,
            "glyphs": len(adv),
            "advance": {k: round(v, 5) for k, v in sorted(adv.items())},
        }
        print(f"weight {weight}: {len(adv)} glyphs from {len(paths)} file(s), upm={upm}")

    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    print(f"wrote {OUT.relative_to(PROJECT)}")


if __name__ == "__main__":
    main()
