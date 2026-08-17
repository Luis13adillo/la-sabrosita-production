#!/usr/bin/env python3
"""
Prove the reel can be built from the repo alone.

Four things are checked, and any one of them failing exits non-zero:

  1. Every image in data/image-paths.json exists at its mapped path.
  2. Its bytes still hash to what the reel was built from. A path that exists
     but holds a different picture is worse than a missing one — it renders,
     and nobody notices the wrong product on the menu.
  3. Every path stays inside the repository. A path that escapes through a
     symlink is exactly the bug this whole change removes, so it is checked
     against the resolved real path, not the string.
  4. Every <img src> in index.html and in all 41 frames resolves to a real
     file, and none of them still points at assets/manual.

Run:  python3 scripts/verify-assets.py
"""

import hashlib
import json
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import asset_paths as AP            # noqa: E402

PROJECT = HERE.parent
REPO = PROJECT.parents[2]
FRAMES = PROJECT / "compositions" / "frames"
INDEX = PROJECT / "index.html"

SRC_RE = re.compile(r'src="([^"]+)"')


def md5(path):
    h = hashlib.md5()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def main():
    fail = []

    # ---- 1-3: the map itself ------------------------------------------
    images = AP.all_images()
    for name, entry in sorted(images.items()):
        p = PROJECT / entry["path"]
        if not p.exists():
            fail.append(f"MISSING   {entry['path']}  (for {name})")
            continue
        real = p.resolve()
        if not str(real).startswith(str(REPO.resolve())):
            fail.append(f"ESCAPES   {entry['path']} -> {real}")
            continue
        got = md5(p)
        if got != entry["md5"]:
            fail.append(f"CHANGED   {entry['path']}\n"
                        f"            expected {entry['md5']}\n"
                        f"            found    {got}")

    print(f"map: {len(images)} images checked")

    # ---- 4: every src in the compositions ------------------------------
    files = [INDEX] + sorted(FRAMES.glob("*.html"))
    srcs = 0
    for f in files:
        for src in SRC_RE.findall(f.read_text()):
            if src.startswith(("http://", "https://", "data:")):
                continue
            srcs += 1
            if src.startswith("assets/manual"):
                fail.append(f"STALE     {f.name} still points at {src}")
                continue
            target = PROJECT / src
            if not target.exists():
                fail.append(f"BROKEN    {f.name} -> {src}")
                continue
            if not str(target.resolve()).startswith(str(REPO.resolve())):
                fail.append(f"ESCAPES   {f.name} -> {src} -> {target.resolve()}")

    print(f"compositions: {srcs} image references across {len(files)} files")

    # ---- the old symlink must be gone ----------------------------------
    legacy = PROJECT / "assets" / "manual"
    if legacy.exists() or legacy.is_symlink():
        fail.append(f"assets/manual still exists -> {legacy.resolve()}")

    if fail:
        print()
        print(f"FAILED — {len(fail)} problem(s):")
        for f in fail:
            print(f"  {f}")
        sys.exit(1)

    print()
    print("PASS — every image resolves inside the repository.")
    print("       Nothing reads ~/Downloads.")


if __name__ == "__main__":
    main()
