#!/usr/bin/env python3
"""
Where the project reads each selected image from.

One question, one answer, one place. Before this, five scripts each built their
own path by joining "assets/manual" to a filename, and "assets/manual" was an
absolute symlink into ~/Downloads — so every one of them silently depended on
one folder on one Mac.

Now they all call src_for() / abs_for(), and the answer comes from
data/image-paths.json, which scripts/build-asset-map.py generates by hashing.
Nothing here guesses a path or falls back to a default: an image the map does
not know about is an error, loudly, rather than a broken <img> discovered later
in a render.
"""

import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
PROJECT = HERE.parent
MAP = PROJECT / "data" / "image-paths.json"

_cache = None


def _load():
    global _cache
    if _cache is None:
        if not MAP.exists():
            raise SystemExit(
                f"missing {MAP.relative_to(PROJECT)} — run:\n"
                "    python3 scripts/build-asset-map.py")
        _cache = json.loads(MAP.read_text())["images"]
    return _cache


def src_for(filename):
    """
    Project-relative path for one selected image, for use in composition HTML.

    The returned path is relative to the project root, which is what the
    HyperFrames runtime resolves an <img src> against — and it stays inside the
    repo, which is the whole point.
    """
    images = _load()
    entry = images.get(filename)
    if entry is None:
        raise SystemExit(
            f"{filename} is not in data/image-paths.json.\n"
            "Either it is new to the scene plan, or it was never resolved.\n"
            "Run:  python3 scripts/build-asset-map.py")
    return entry["path"]


def abs_for(filename):
    """Absolute path on disk, for the read-only measurement scripts."""
    return PROJECT / src_for(filename)


def all_images():
    """{filename: {path, md5, bytes}} for everything the reel places."""
    return dict(_load())
