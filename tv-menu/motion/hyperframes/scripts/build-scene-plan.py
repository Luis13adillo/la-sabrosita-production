#!/usr/bin/env python3
"""
Build the deterministic scene plan for the La Sabrosita TV showcase.

Reads   : ../data/source-inventory.json   (the client's manual image selection)
Writes  : ../data/scene-plan.json

SOURCE CHANGE, 2026-08-16
-------------------------
This used to read tv-menu/assets/products/products.json — Rubric's 47-entry
MASTER catalog. It no longer does. The client hand-picked the images for this
reel into ~/Downloads/LaSabrosita, and that folder is now the source of truth
for what the video shows. Rubric's catalog is untouched and still governs
production state; it simply is not what this reel reads.

Practical consequences of the swap:
  - 46 images, 41 products (was 47 images, 37 products);
  - five products arrive that had no approved master before — Banana Split,
    Chicharron Preparado, Coctel de Fruta, Fresas Dubai, Marucha Loca;
  - Pastel Tres Leche leaves: the client did not select an image for it;
  - Paletas and Aguas Frescas are now GROUPED shots, so each carries its own
    scene as a hero rather than sitting in a row of unrelated products.

GROUPING RULES (locked by the client, 2026-08-16)
-------------------------------------------------
ONE customer-facing product per scene. Unrelated products are never packed into
a shared scene to save frames or time.

The only scenes holding more than one product are the ones the client named:

  - Crazy Shake      all four approved images, one scene, one name card
  - Paletas          the grouped hero shot, its own scene
  - Aguas Frescas    the grouped hero shot, its own scene
  - Elote + Esquite              together, one scene
  - Elote Hot Cheetos + Esquite Hot Cheetos   together, one scene

A product that owns several images still gets ONE scene: the images sit together
under a single name card, because they are flavours of one menu item, not
separate items. That is true of Crazy Shake (4), Gelatina (2) and Helado Chino
(2). The flavour is carried by the picture; the words never name it, and no
flavour name is invented anywhere in this pipeline.

Consequence: a product name appears in exactly one scene, ever, and every scene
is either one product or one of the five client-named groupings.

This replaced the earlier "2-3 products per scene" packing, which produced 20
frames by putting unrelated items side by side. The cost is pacing: 39 product
scenes inside a 60s loop leaves about 1.3s per single product. See design.md.

Timing is computed in integer centiseconds and only converted to seconds on
output, so no scene start can land on a float like 28.400000002 and collide
with the next clip on the same track (HyperFrames rejects overlaps).

Run:  python3 scripts/build-scene-plan.py
"""

import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import reel_spec as RS          # noqa: E402  (needs HERE on the path first)

PROJECT = HERE.parent
INVENTORY = PROJECT / "data" / "source-inventory.json"
OUT = PROJECT / "data" / "scene-plan.json"

# The four approved categories, in menu-board order, with their on-screen ribbons.
CATEGORY_RIBBON = {
    "HELADOS":   "Helados & Paletas",
    "ANTOJITOS": "Antojitos & Preparados",
    "POSTRES":   "Postres & Dulces",
    "BEBIDAS":   "Bebidas",
}

# One image, one scene, sized to its own aspect ratio instead of a product box.
# Both of these are GROUPED shots the client supplied: a whole range in one
# frame. Dropping either into a 520px product slot beside two unrelated items
# would throw away the reason it was shot that way.
HERO_IMAGES = {
    "RealPaletas.png":
        "the whole paleta range fanned on ice — already the 'here is everything' "
        "shot, so it carries the Paletas scene alone",
    "AguasFrescas.png":
        "a full row of aguas frescas with the fruit they are made from — the same "
        "'here is everything' shot for the drinks wall",
}

# The ONLY scenes allowed to hold two different products. Client-named, ordered
# pairs; the scene takes the earlier product's place in menu-board order so the
# pair still lands where the board puts it.
GROUPED_PAIRS = [
    ("Elote", "Esquite"),
    ("Elote Hot Cheetos", "Esquite Hot Cheetos"),
]

# Images deliberately not shown, each with a reason. The generator asserts that
# every inventory entry is either placed exactly once or listed here.
EXCLUDED_IMAGES = {}

# ------------------------------------------------------------------ timing ---
# Working values for this project. brand.json lists motion timing under
# notSpecifiedInSource, so these are NOT brand rules — see design.md.
#
# RETIMED 2026-08-17. Every product scene now runs the SAME 3.4s beat.
#
# The old table gave each scene shape its own length (1.28s solo, 1.70s pair,
# 2.00s hero) because the whole reel had to fit a 60s ceiling. Two things
# retired that:
#
#   1. The ceiling is gone. Luis chose the reference reel's 3.4s beat over the
#      60s cap — this loops in the shop window, so length costs nothing, and
#      1.28s was never enough to read a name AND a description.
#   2. Every scene now carries the same furniture — a card with a category
#      pill, a name and a description — so the reading load no longer varies by
#      scene shape. A hero is not slower to read than a solo; it was only ever
#      slower because it had more picture in it.
#
# One beat for everything is also what makes the reel feel like a reel: 39
# products arriving on the same pulse, not a sequence that speeds up and slows
# down for reasons a customer cannot see.
#
# reel_spec.py owns these numbers — build-frames.py animates INSIDE the window
# they define, so a private copy here would tear the two apart.
COLD_OPEN_CS = int(RS.COLD_OPEN * 100)   # 4.00s  ring clears, logo flies to corner
CLOSE_CS = int(RS.CLOSE * 100)           # 5.00s  ring returns, logo back to centre
BEAT_CS = int(RS.BEAT * 100)             # 3.40s  every product scene
RIBBON_BONUS_CS = 0     # retired: the category is a pill on every card now, so
                        # a category opener has nothing extra to introduce.
CEILING_CS = 20000      # 200s — a sanity backstop, not a brief requirement.
                        # The 60s ceiling was dropped by Luis on 2026-08-17.

# Entrance treatments rotate so the product scenes never feel like one loop.
# Each name maps to blueprint + rule ids that really exist in
# ~/.claude/skills/hyperframes-animation (blueprints-index.md / rules-index.md).
#
# SOLO scenes are now 32 of the 39, so their rotation carries the whole reel's
# sense of variety. Five shapes cycle, and the generator still asserts that no
# two consecutive scenes share one — with 32 solos a repeat would be very
# visible at 1.28s apart.
SOLO_TREATMENTS = [
    {
        "id": "solo-slam",
        "blueprint": "titlecard-reveal",
        "rules": ["waterfall-entry", "spring-pop-entrance", "motion-blur-streak", "sine-wave-loop"],
        "note": "the product whips up from below and overshoots, name card slams in under it",
    },
    {
        "id": "solo-pop",
        "blueprint": "titlecard-reveal",
        "rules": ["center-outward-expansion", "spring-pop-entrance", "particle-burst", "sine-wave-loop"],
        "note": "the product scales up from the centre point, confetti punctuating the landing",
    },
    {
        "id": "solo-tumble",
        "blueprint": "titlecard-reveal",
        "rules": ["depth-scatter-assemble", "spring-pop-entrance", "sine-wave-loop"],
        "note": "the product tumbles in out of depth and settles flat to camera",
    },
    {
        "id": "solo-swipe",
        "blueprint": "titlecard-reveal",
        "rules": ["nudge-curve", "reactive-displacement", "spring-pop-entrance", "sine-wave-loop"],
        "note": "the product arcs in from the wing and shoves the outgoing one off-frame",
    },
    {
        "id": "solo-bloom",
        "blueprint": "titlecard-reveal",
        "rules": ["ambient-glow-bloom", "spring-pop-entrance", "gradient-text-sweep", "sine-wave-loop"],
        "note": "a glow blooms behind the product as it rises, the name sweeping in after it",
    },
]

# The two client-named pairs. Both hold two DIFFERENT products, so both names
# have to be readable — the motion separates them rather than merging them.
PAIR_TREATMENT = {
    "id": "pair-tilt",
    "blueprint": "comparison-split",
    "rules": ["split-tilt-cards", "spring-pop-entrance", "sine-wave-loop"],
    "note": "the two arrive from opposite wings with mirrored book-open tilts — same dish, "
            "two ways, and the mirror is what says they belong together",
}
PAIR_TREATMENT_ALT = {
    "id": "pair-rise",
    "blueprint": "comparison-split",
    "rules": ["waterfall-entry", "spring-pop-entrance", "sine-wave-loop"],
    "note": "the two rise together from below the frame, name cards slamming after",
}

# Variant clusters get their own shapes. Both say the same thing with motion —
# "this is ONE product, here are its flavours" — which is exactly the job the
# words are no longer allowed to do.
CLUSTER_FAN = {
    "id": "variant-fan",
    "blueprint": "grid-card-assemble",
    "rules": ["center-outward-expansion", "spring-pop-entrance", "particle-burst", "sine-wave-loop"],
    "note": "all flavours of one product bloom outward from a single point, then settle in a row "
            "under one name card — the spread itself reads as 'same drink, many ways'",
}
CLUSTER_PAIR = {
    "id": "variant-pair",
    "blueprint": "comparison-split",
    "rules": ["split-tilt-cards", "spring-pop-entrance", "sine-wave-loop"],
    "note": "the two flavours swing in from opposite wings with mirrored book-open tilts "
            "and meet under one name card",
}
CLUSTER_FAN_ALT = {
    "id": "variant-tumble",
    "blueprint": "grid-card-assemble",
    "rules": ["depth-scatter-assemble", "spring-pop-entrance", "sine-wave-loop"],
    "note": "the flavours tumble out of a rotating 3D depth cloud and settle into one row "
            "under a single name card",
}
CLUSTER_PAIR_ALT = {
    "id": "variant-swap",
    "blueprint": "comparison-split",
    "rules": ["scale-swap-transition", "spring-pop-entrance", "sine-wave-loop"],
    "note": "the first flavour lands centre and the second swaps in beside it at the same "
            "centre, both settling under one name card",
}

# A hero image gets the frame to itself, sized to its own aspect ratio.
HERO_TREATMENT = {
    "id": "hero-reveal",
    "blueprint": "titlecard-reveal",
    "rules": ["spring-pop-entrance", "ambient-glow-bloom", "sine-wave-loop"],
    "note": "one restrained move — the wide arrangement scales up onto a blooming glow and "
            "holds, the single calm beat in a fast reel",
}
HERO_TREATMENT_ALT = {
    "id": "hero-sweep",
    "blueprint": "titlecard-reveal",
    "rules": ["gradient-text-sweep", "ambient-glow-bloom", "spring-pop-entrance", "sine-wave-loop"],
    "note": "the wide arrangement wipes on behind a travelling highlight, the name sweeping "
            "in after it — the same calm beat, arriving a different way",
}

def build_scenes(images):
    """
    Turn one category's images into scenes, one product per scene.

      - a grouped hero image gets its own scene;
      - a client-named pair gets one scene holding both products;
      - a product with 2+ images gets ONE scene, all images, one name card;
      - every other product gets its own scene.

    Every scene's rank is an index into the PRODUCT sequence (menu-board order),
    so scenes come back in the order the board prints them. A pair takes the
    rank of its FIRST product, which keeps it where the board puts it.
    """
    order, buckets = [], {}
    for im in images:
        if im["file"] in EXCLUDED_IMAGES:
            continue
        b = im["name"]
        if b not in buckets:
            buckets[b] = []
            order.append(b)
        buckets[b].append(im)

    rank = {name: i for i, name in enumerate(order)}
    pair_of = {}
    for a, b in GROUPED_PAIRS:
        if a in buckets and b in buckets:
            pair_of[a] = (a, b)
            pair_of[b] = (a, b)

    scenes, done = [], set()
    for name in order:
        if name in done:
            continue
        items = buckets[name]

        if name in pair_of:
            a, b = pair_of[name]
            for p in (a, b):
                assert len(buckets[p]) == 1, \
                    f"{p} is in a client-named pair but has {len(buckets[p])} images"
            done.update((a, b))
            scenes.append({"rank": min(rank[a], rank[b]), "kind": "pair", "label": None,
                           "products": buckets[a] + buckets[b]})
            continue

        done.add(name)
        if any(i["file"] in HERO_IMAGES for i in items):
            assert len(items) == 1, \
                f"{name} is a hero but has {len(items)} images — a hero scene holds exactly one"
            scenes.append({"rank": rank[name], "kind": "hero", "label": name, "products": items})
        elif len(items) > 1:
            scenes.append({"rank": rank[name], "kind": "cluster", "label": name, "products": items})
        else:
            scenes.append({"rank": rank[name], "kind": "solo", "label": name, "products": items})

    scenes.sort(key=lambda s: s["rank"])
    return scenes


def main():
    inv = json.loads(INVENTORY.read_text())
    images = inv["images"]
    cat_order = inv["categoryOrder"]
    by_cat = {c: [im for im in images if im["category"] == c] for c in cat_order}

    frames = []
    t = 0
    frames.append({
        "frame": 1,
        "id": "01-cold-open",
        "kind": "cold-open",
        "title": "Cold open — the mark drops",
        "startCs": t, "durationCs": COLD_OPEN_CS,
        "blueprint": "logo-assemble-lockup",
        "rules": ["spring-pop-entrance", "particle-burst", "ambient-glow-bloom", "gradient-text-sweep"],
        "products": [],
    })
    t += COLD_OPEN_CS

    solo_n = 0
    prev_treat = None   # so no two consecutive scenes arrive the same way
    for cat in cat_order:
        ribbon = CATEGORY_RIBBON[cat]
        for si, sc in enumerate(build_scenes(by_cat[cat])):
            opener = si == 0
            kind = sc["kind"]
            n = len(sc["products"])

            # Every product scene is one beat long now, whatever its shape.
            # The treatment still rotates — it decides how the scene ARRIVES,
            # not how long it stays.
            dur = BEAT_CS
            if kind == "hero":
                treat = HERO_TREATMENT_ALT if prev_treat == HERO_TREATMENT["id"] else HERO_TREATMENT
                title = f"{sc['label']} — hero"
            elif kind == "cluster":
                if n == 2:
                    treat = CLUSTER_PAIR_ALT if prev_treat == CLUSTER_PAIR["id"] else CLUSTER_PAIR
                else:
                    treat = CLUSTER_FAN_ALT if prev_treat == CLUSTER_FAN["id"] else CLUSTER_FAN
                title = f"{sc['label']} — every flavour"
            elif kind == "pair":
                treat = PAIR_TREATMENT_ALT if prev_treat == PAIR_TREATMENT["id"] else PAIR_TREATMENT
                title = " + ".join(p["name"] for p in sc["products"])
            else:
                treat = SOLO_TREATMENTS[solo_n % len(SOLO_TREATMENTS)]
                if treat["id"] == prev_treat:
                    solo_n += 1
                    treat = SOLO_TREATMENTS[solo_n % len(SOLO_TREATMENTS)]
                solo_n += 1
                title = sc["label"]
            dur += RIBBON_BONUS_CS if opener else 0
            prev_treat = treat["id"]

            frames.append({
                "frame": len(frames) + 1,
                "id": f"{len(frames) + 1:02d}-{cat.lower()}-{si + 1}",
                "kind": "products",
                "sceneType": sc["kind"],
                # 'single' = one name card for the whole scene (solo, cluster, hero).
                # 'per-product' = one name card under each product (the two pairs).
                "nameMode": "per-product" if sc["kind"] == "pair" else "single",
                "displayName": sc["label"],
                "title": title,
                "category": cat,
                "categoryRibbon": ribbon,
                "showsRibbon": opener,
                "startCs": t, "durationCs": dur,
                "blueprint": treat["blueprint"],
                "rules": treat["rules"],
                "treatment": treat["id"],
                "treatmentNote": treat["note"],
                "products": [
                    {"name": p["name"], "file": p["file"],
                     "depicts": p["depicts"], "cutout": p["cutout"]}
                    for p in sc["products"]
                ],
            })
            t += dur

    frames.append({
        "frame": len(frames) + 1,
        "id": f"{len(frames) + 1:02d}-close",
        "kind": "close",
        "title": "Close — logo, banner, town",
        "startCs": t, "durationCs": CLOSE_CS,
        "blueprint": "logo-assemble-lockup",
        "rules": ["spring-pop-entrance", "ambient-glow-bloom", "waterfall-entry"],
        "products": [],
    })
    t += CLOSE_CS

    # ---- invariants: fail loudly rather than emit a plan that cannot render ----
    assert t <= CEILING_CS, f"total {t/100:.2f}s exceeds the {CEILING_CS/100:.0f}s ceiling"

    # Every inventory image is either placed exactly once, or explicitly excluded
    # with a written reason. Silence is not an option: an image that is simply
    # missing fails here rather than quietly vanishing from the reel.
    placed_files = [p["file"] for f in frames for p in f["products"]]
    assert len(set(placed_files)) == len(placed_files), "an image was placed in two scenes"
    inv_files = {e["file"] for e in images}
    unaccounted = inv_files - set(placed_files) - set(EXCLUDED_IMAGES)
    assert not unaccounted, f"images neither placed nor excluded: {sorted(unaccounted)}"
    stale = set(EXCLUDED_IMAGES) - inv_files
    assert not stale, f"EXCLUDED_IMAGES names files not in the inventory: {sorted(stale)}"

    for a, b in zip(frames, frames[1:]):
        assert a["startCs"] + a["durationCs"] == b["startCs"], f"gap/overlap at frame {b['frame']}"

    # A product name may appear in exactly one scene.
    seen = {}
    for f in frames:
        for b in {p["name"] for p in f["products"]}:
            seen.setdefault(b, []).append(f["frame"])
    repeated = {k: v for k, v in seen.items() if len(v) > 1}
    assert not repeated, f"product name appears in more than one scene: {repeated}"
    assert len(seen) == inv["productCount"], \
        f"{len(seen)} names on screen, inventory has {inv['productCount']} products"

    # No two consecutive scenes may share an entrance treatment, or the reel
    # starts to read as a loop.
    prod = [f for f in frames if f["kind"] == "products"]
    for a, b in zip(prod, prod[1:]):
        assert a["treatment"] != b["treatment"], \
            f"frames {a['frame']} and {b['frame']} both use {a['treatment']}"

    # The locked display rules, enforced. A scene may hold two DIFFERENT products
    # only if the client named that exact pair; everything else is one product.
    allowed_pairs = {frozenset(p) for p in GROUPED_PAIRS}
    for f in frames:
        if f["kind"] != "products":
            continue
        n = len(f["products"])
        names = {p["name"] for p in f["products"]}
        if f["sceneType"] == "pair":
            assert frozenset(names) in allowed_pairs, \
                f"frame {f['frame']} pairs {sorted(names)}, which the client did not group"
            assert n == 2, f"pair frame {f['frame']} holds {n} images, expected 2"
        else:
            assert len(names) == 1, \
                (f"frame {f['frame']} holds unrelated products {sorted(names)} — only the "
                 f"client-named pairs may share a scene")
            if f["sceneType"] == "hero":
                assert n == 1, f"hero frame {f['frame']} holds {n}, expected exactly 1"
            elif f["sceneType"] == "cluster":
                assert n >= 2, f"cluster frame {f['frame']} holds {n}, expected 2+"
            else:
                assert n == 1, f"solo frame {f['frame']} holds {n}, expected exactly 1"

    # Every client-named grouping actually exists as a scene, so a grouping can
    # never be silently dropped by a change upstream.
    for a, b in GROUPED_PAIRS:
        assert any(f.get("sceneType") == "pair" and {p["name"] for p in f["products"]} == {a, b}
                   for f in frames), f"client-named pair {a} + {b} is missing from the plan"
    for hero_file, why in HERO_IMAGES.items():
        assert any(f.get("sceneType") == "hero" and f["products"][0]["file"] == hero_file
                   for f in frames), f"hero {hero_file} is missing from the plan"

    clusters = [f for f in frames if f.get("sceneType") == "cluster"]
    heroes = [f for f in frames if f.get("sceneType") == "hero"]
    pairs = [f for f in frames if f.get("sceneType") == "pair"]
    solos = [f for f in frames if f.get("sceneType") == "solo"]
    plan = {
        "_generated": "scripts/build-scene-plan.py — do not hand-edit; edit the script and re-run",
        "_source": inv["_source"],
        "format": "1920x1080",
        "fps": 30,
        "totalSeconds": round(t / 100, 2),
        "ceilingSeconds": CEILING_CS / 100,
        "frameCount": len(frames),
        "productFrameCount": sum(1 for f in frames if f["kind"] == "products"),
        "clusterFrameCount": len(clusters),
        "heroFrameCount": len(heroes),
        "pairFrameCount": len(pairs),
        "soloFrameCount": len(solos),
        "excluded": [{"file": k, "reason": v} for k, v in EXCLUDED_IMAGES.items()],
        "imagesPlaced": len(placed_files),
        "distinctNamesOnScreen": len(seen),
        "categoryCounts": {c: len({im["name"] for im in by_cat[c]}) for c in cat_order},
        "frames": [
            {**f,
             "start": round(f["startCs"] / 100, 2),
             "duration": round(f["durationCs"] / 100, 2)}
            for f in frames
        ],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(plan, indent=2, ensure_ascii=False) + "\n")

    print(f"wrote {OUT.relative_to(PROJECT)}")
    print(f"  {plan['frameCount']} frames = {plan['productFrameCount']} product scenes + cold open + close")
    print(f"    {plan['soloFrameCount']:>2} solo (one product, one image)")
    print(f"    {plan['clusterFrameCount']:>2} one product, several images")
    print(f"    {plan['pairFrameCount']:>2} client-named pairs")
    print(f"    {plan['heroFrameCount']:>2} grouped heroes")
    print(f"  {plan['imagesPlaced']}/{len(images)} images placed, "
          f"showing all {plan['distinctNamesOnScreen']} products exactly once")
    print(f"  total {plan['totalSeconds']}s (ceiling {plan['ceilingSeconds']}s, "
          f"{plan['ceilingSeconds'] - plan['totalSeconds']:.2f}s spare)")
    print()
    for f in heroes:
        print(f"  HERO     frame {f['frame']:>2}  {f['displayName']:<24} {f['products'][0]['file']}")
    for f in clusters:
        print(f"  cluster  frame {f['frame']:>2}  {f['displayName']:<24} "
              f"{len(f['products'])} images, 1 name card")
    for f in pairs:
        print(f"  PAIR     frame {f['frame']:>2}  "
              f"{' + '.join(p['name'] for p in f['products'])}")


if __name__ == "__main__":
    main()
