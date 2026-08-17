#!/usr/bin/env python3
"""
Write data/image-paths.json — where each selected image actually lives.

WHY THIS EXISTS
---------------
The client hand-picked 46 images into ~/Downloads/LaSabrosita and this project
read them through `assets/manual`, an ABSOLUTE symlink to that folder. Every
frame therefore resolved its product photo through a path outside the repo, on
one specific Mac. Move the folder, empty Downloads, or open the project
anywhere else and the reel has no pictures.

Hashing the whole workspace showed the selection was never unique:

    36 of 46  already at tv-menu/assets/products/
     4 of 46  already at assets/products/masters/ (repo root)
     6 of 46  genuinely nowhere else

So 40 of them did not need copying at all — only reaching by a path that stays
inside the repo. This script records which path that is, per image.

WHAT IT MATCHES ON
------------------
CONTENT, not filenames. The Downloads copies carry export names like
`lasabrosita_churros_master_v01_1786751660230.png` while the same bytes sit in
the workspace as `LS_Churros_MASTER_v01.png`. Matching on the name would have
found nothing; matching on MD5 found 40.

The map keeps the ORIGINAL selection filename as the key. That name is the
identity used by data/source-inventory.json and data/scene-plan.json, and those
decide which product appears in which scene — so renaming the key would
reshuffle the reel. Only the resolved PATH changes.

The recorded md5 is not decoration: scripts/verify-assets.py re-hashes every
path and fails if a file at a mapped location is not the file the reel was
built from. That is what makes this safe to trust after the Downloads folder is
gone.

Run:  python3 scripts/build-asset-map.py
      python3 scripts/verify-assets.py     (checks the result)
"""

import hashlib
import json
import os
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
PROJECT = HERE.parent
REPO = PROJECT.parents[2]                    # .../la-sabrosita
PLAN = PROJECT / "data" / "scene-plan.json"
OUT = PROJECT / "data" / "image-paths.json"

# Where a resolved path may point, best first. Every one of these is reached
# from the project by a RELATIVE link that stays inside the repo:
#
#   assets/products -> ../../../assets/products          (tv-menu/assets/products)
#   assets/masters  -> ../../../../assets/products/masters
#   assets/selected                                       (real files, in-project)
#
# Order matters. tv-menu/assets/products is preferred because the project
# already had that symlink; assets/selected is last because a file only belongs
# there when it exists nowhere else.
SEARCH = [
    ("assets/products", REPO / "tv-menu" / "assets" / "products"),
    ("assets/masters", REPO / "assets" / "products" / "masters"),
    ("assets/selected", PROJECT / "assets" / "selected"),
]

# Never walked: build output, caches, and the .git object store. Also never
# followed: symlinks — assets/manual points at ~/Downloads and following it
# would let the scan "find" the source folder and call it portable.
SKIP_DIRS = {".git", "renders", ".thumbnails", ".hyperframes", "node_modules"}
IMAGE_EXT = {".png", ".jpg", ".jpeg"}


def md5(path):
    h = hashlib.md5()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def index(root):
    """{md5: [path]} for every real image under root. Symlinks are skipped."""
    out = {}
    if not root.exists():
        return out
    for dirpath, dirnames, filenames in os.walk(root, followlinks=False):
        dirnames[:] = [d for d in dirnames
                       if d not in SKIP_DIRS
                       and not os.path.islink(os.path.join(dirpath, d))]
        for name in filenames:
            p = pathlib.Path(dirpath) / name
            if p.suffix.lower() in IMAGE_EXT and not p.is_symlink():
                out.setdefault(md5(p), []).append(p)
    return out


def wanted(plan):
    """Every image filename the scene plan places, in plan order."""
    seen, order = set(), []
    for fr in plan["frames"]:
        for p in fr["products"]:
            if p["file"] not in seen:
                seen.add(p["file"])
                order.append(p["file"])
    return order


def main():
    plan = json.loads(PLAN.read_text())
    names = wanted(plan)

    # The old absolute symlink, if it is still there. It is the ONLY place a
    # first run can read the original bytes from, so it is used to compute the
    # hash to search for — and never recorded as an answer.
    legacy = PROJECT / "assets" / "manual"

    indexes = [(prefix, index(root)) for prefix, root in SEARCH]

    mapping, unresolved = {}, []
    for name in names:
        digest = None
        src = legacy / name
        if src.exists():
            digest = md5(src)

        hit = None
        for prefix, idx in indexes:
            if digest is not None:
                if digest in idx:
                    hit = (prefix, idx[digest][0], digest)
                    break
            else:
                # Re-run after the Downloads folder is gone: fall back to the
                # path already recorded, verified by its own hash.
                prev = json.loads(OUT.read_text())["images"].get(name) if OUT.exists() else None
                if prev and (PROJECT / prev["path"]).exists():
                    p = PROJECT / prev["path"]
                    if md5(p) == prev["md5"]:
                        hit = (prev["path"].rsplit("/", 1)[0], p, prev["md5"])
                        break
        if hit is None:
            unresolved.append(name)
            continue
        prefix, path, digest = hit
        rel = f"{prefix}/{path.name}" if not prefix.count("/") > 1 else prefix
        mapping[name] = {
            "path": f"{prefix}/{path.name}",
            "md5": digest,
            "bytes": path.stat().st_size,
        }

    if unresolved:
        print("UNRESOLVED — these are in the scene plan but exist nowhere the")
        print("project can reach without ~/Downloads:")
        for n in unresolved:
            print(f"    {n}")
        print()
        print("Copy them into assets/selected/ and re-run. Nothing was written.")
        sys.exit(1)

    by_prefix = {}
    for v in mapping.values():
        by_prefix[v["path"].rsplit("/", 1)[0]] = by_prefix.get(v["path"].rsplit("/", 1)[0], 0) + 1

    OUT.write_text(json.dumps({
        "_generated": "scripts/build-asset-map.py — do not hand-edit",
        "_what": "selection filename -> the path this project reads it from, "
                 "relative to the project root. Every path stays inside the repo.",
        "_matchedOn": "md5 of the file contents, never the filename",
        "images": dict(sorted(mapping.items())),
    }, indent=1) + "\n")

    print(f"wrote {OUT.relative_to(PROJECT)} — {len(mapping)} images")
    for prefix, n in sorted(by_prefix.items(), key=lambda kv: -kv[1]):
        print(f"  {n:>3}  {prefix}/")
    total = sum(v["bytes"] for v in mapping.values())
    copied = sum(v["bytes"] for v in mapping.values()
                 if v["path"].startswith("assets/selected"))
    print(f"  {total / 1048576:.0f} MB referenced, of which "
          f"{copied / 1048576:.0f} MB had to be copied into the project")


if __name__ == "__main__":
    main()
