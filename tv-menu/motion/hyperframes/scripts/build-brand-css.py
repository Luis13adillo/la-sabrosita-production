#!/usr/bin/env python3
"""
Generate assets/brand-tokens.css FROM brand/brand.json.

Why this exists
---------------
The workspace rule is: brand.json is the one source of brand values, and you
import it — you never paste hex codes into a project. A HyperFrames composition
cannot read brand.json at render time (no fetch, renders must be deterministic),
so this script is the bridge: it reads brand.json at BUILD time and emits CSS
custom properties. The generated file is disposable. brand.json stays the only
place a brand value is authored.

If the client revises the palette, re-run this. Nothing is hand-copied, so
nothing silently drifts.

It also self-hosts Noto Sans (the brand typeface, per brand.json typography) as
local woff2 files, so renders never depend on Google being reachable.

Run:  python3 scripts/build-brand-css.py
"""

import json
import pathlib
import re
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
PROJECT = HERE.parent
BRAND = PROJECT / "assets" / "brand" / "brand.json"
FONTDIR = PROJECT / "assets" / "fonts"
OUT = PROJECT / "assets" / "brand-tokens.css"

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"
WEIGHTS = [400, 700, 900]
SUBSETS = ("latin", "latin-ext")   # Spanish accents live in latin / latin-ext


def fetch_fonts():
    """Download the Noto Sans latin subsets once. Returns [(weight, filename)]."""
    FONTDIR.mkdir(parents=True, exist_ok=True)
    url = ("https://fonts.googleapis.com/css2?family=Noto+Sans:wght@"
           + ";".join(str(w) for w in WEIGHTS) + "&display=swap")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    css = urllib.request.urlopen(req, timeout=30).read().decode()

    # Google's CSS emits a /* subset */ comment before each @font-face block.
    blocks = re.findall(r"/\*\s*([\w-]+)\s*\*/\s*(@font-face\s*\{.*?\})", css, re.S)
    got = []
    for subset, block in blocks:
        if subset not in SUBSETS:
            continue
        weight = int(re.search(r"font-weight:\s*(\d+)", block).group(1))
        src = re.search(r"url\((https://[^)]+\.woff2)\)", block).group(1)
        name = f"NotoSans-{weight}-{subset}.woff2"
        dest = FONTDIR / name
        if not dest.exists():
            r = urllib.request.Request(src, headers={"User-Agent": UA})
            dest.write_bytes(urllib.request.urlopen(r, timeout=30).read())
            print(f"  downloaded {name} ({dest.stat().st_size // 1024} KB)")
        rng = re.search(r"unicode-range:\s*([^;]+);", block).group(1).strip()
        got.append((weight, name, rng))
    return got


def main():
    brand = json.loads(BRAND.read_text())
    pal = brand["color"]["palette"]
    faces = fetch_fonts()

    lines = [
        "/* ============================================================",
        " * GENERATED FILE — DO NOT EDIT.",
        " * Source of truth: brand/brand.json  (itself transcribed from",
        " * brand/guidelines/LS_Brand-Guidelines_v01.pdf).",
        " * Regenerate:  python3 scripts/build-brand-css.py",
        " *",
        f" * brandVersion: {brand['brandVersion']}   schemaVersion: {brand['schemaVersion']}",
        " * ============================================================ */",
        "",
    ]

    for weight, fname, rng in faces:
        lines += [
            "@font-face {",
            "  font-family: 'Noto Sans';",
            "  font-style: normal;",
            f"  font-weight: {weight};",
            "  font-display: block;",
            f"  src: url('assets/fonts/{fname}') format('woff2');",
            f"  unicode-range: {rng};",
            "}",
        ]
    lines.append("")

    lines.append(":root {")
    lines.append("  /* --- palette (brand.json → color.palette) --- */")
    for key, v in pal.items():
        slug = re.sub(r"(?<!^)(?=[A-Z])", "-", key).lower()
        lines.append(f"  --ls-{slug}: {v['hex']};            /* {v['name']} */")

    dark = brand["color"]["contrastFields"]["darkContrast"]
    lines.append(f"  --ls-dark-contrast: {dark};      /* contrastFields.darkContrast */")

    lines.append("")
    lines.append("  /* --- typography (brand.json → typography) --- */")
    stack = ", ".join(f"'{f}'" if " " in f else f for f in brand["typography"]["fallbackStack"])
    lines.append(f"  --ls-font: {stack};")
    for role, spec in brand["typography"]["roles"].items():
        lines.append(f"  --ls-weight-{role}: {spec['weight']};")

    lines.append("")
    lines.append("  /* --- gradient (brand.json → gradient) ---")
    lines.append("   * brand.json publishes from/to but leaves exactStops and angleDeg null.")
    lines.append("   * The angle below is a PROJECT working value, not a brand rule.")
    lines.append("   * See design.md → 'Values the guidelines do not define'. */")
    lines.append(f"  --ls-gradient-from: var(--ls-{re.sub(r'(?<!^)(?=[A-Z])', '-', brand['gradient']['from']).lower()});")
    lines.append(f"  --ls-gradient-to: var(--ls-{re.sub(r'(?<!^)(?=[A-Z])', '-', brand['gradient']['to']).lower()});")
    lines.append("  --ls-gradient-angle: 155deg;")
    lines.append("  --ls-gradient: linear-gradient(var(--ls-gradient-angle), var(--ls-gradient-from), var(--ls-gradient-to));")

    lines.append("")
    lines.append("  /* --- TV safe area ---")
    lines.append("   * brand.json lists safe-title margins under notSpecifiedInSource.")
    lines.append("   * 5% action / 10% title is the SMPTE convention, used as a working")
    lines.append("   * value pending client confirmation. Not a brand rule. */")
    lines.append("  --ls-safe-action: 54px;   /* 5% of 1080 */")
    lines.append("  --ls-safe-title: 96px;    /* ~9% of 1080 */")
    lines.append("}")
    lines.append("")

    OUT.write_text("\n".join(lines))
    print(f"wrote {OUT.relative_to(PROJECT)}  ({len(faces)} font faces, {len(pal)} palette colours)")


if __name__ == "__main__":
    main()
