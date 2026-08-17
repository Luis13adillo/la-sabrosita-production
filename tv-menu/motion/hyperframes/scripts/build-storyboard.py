#!/usr/bin/env python3
"""
Emit STORYBOARD.md from data/scene-plan.json and data/source-inventory.json.

Every frame gets a block (the block is the dispatch unit the build stage reads).
Frames listed in DETAILED get a full written treatment; the rest are generated
from the plan, so they can never drift from what the frames actually contain.

Run:  python3 scripts/build-storyboard.py
"""

import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
PROJECT = HERE.parent
PLAN = PROJECT / "data" / "scene-plan.json"
INVENTORY = PROJECT / "data" / "source-inventory.json"
OUT = PROJECT / "STORYBOARD.md"

DETAILED = {
1: {
"scene": "Black. The mascot drops in, the wordmark springs open, confetti fires, cut to food.",
"poster": "2.2s",
"body": """**The promise, in three seconds.** No slow logo fade — this has to feel like a
door opening on a busy shop.

*On screen*
- Opens on `--ls-dark-contrast`, not the gradient. The gradient arrives *with* the logo.
- `LS_Logo_Primary_v01.png` centred at 760px, whole and unaltered — mascot, wordmark and
  banner together, as `brand.json` → `logo.summaryRule` requires.
- Cream kicker line beneath: **ICE-CREAM AND SNACKS** (`brand.brand.banner`, verbatim).

*Motion* — blueprint `logo-assemble-lockup`
- `0.00–0.35` gradient wipes on under a rising `ambient-glow-bloom`.
- `0.20–0.75` logo `spring-pop-entrance`, `back.out(2.2)` — overshoot deliberately hot;
  this is the energy thesis for the whole reel.
- `0.55–0.95` `particle-burst`, ~24 deterministic index-seeded confetti particles.
- `0.90–1.60` kicker sweeps in with `gradient-text-sweep`.
- `1.60–3.00` hold on a `sine-wave-loop` breathe.

*Why it's here* — establishes the mark before any food, so the 41 products that follow
read as La Sabrosita's. The only frame with no product in it.""",
},
2: {
"scene": "HELADOS & PALETAS ribbon drops in; three different products cascade up from below.",
"poster": "2.1s",
"body": """**The mixed-scene grammar: several products, one name card each.**

*On screen*
- Category ribbon top-centre: **HELADOS & PALETAS**, cream on the pink field, 900 weight,
  all caps. Only ever on a category's first scene.
- Logo upper-left at its 250px minimum, sitting at action-safe (54px) rather than
  title-safe — it is artwork, not text, and the 42px that frees goes to the food.
- Three *different* products — **Banana Split**, **Choco Banana**, **Helado en Cono** —
  each with its own cream pill. Three silhouettes that don't repeat: a long boat, a
  vertical stick, a cone.
- Banana Split arrived first as a photograph on white and sat on a cream card. The client
  supplied a transparent cut-out on 2026-08-16, so it now floats on the gradient like
  every other product. Nothing else about the frame changed.

*Motion* — blueprint `grid-card-assemble`, treatment `cascade-slam`
- `0.00–0.30` ribbon drops from above the safe line, overshoots, settles.
- `0.25–0.75` products `waterfall-entry` up from below, 0.11s stagger — each starts before
  the one before it settles, so it reads as one accelerating wave. `motion-blur-streak`
  peaks mid-travel and resolves to zero.
- `0.60–0.95` pills land a beat behind their product, `spring-pop-entrance`, `back.out(1.8)`.
- `0.95–3.10` hold, each cut-out breathing on its own `sine-wave-loop` phase.

*Why it's here* — helados leads the printed board, so it leads here.""",
},
3: {
"scene": "Four Crazy Shakes fan out, overlapping, under a single name card.",
"poster": "1.9s",
"body": """**The variant-cluster grammar, at its largest.**

The client selected **four** Crazy Shake images — four flavours of one menu item, not four
menu items. They arrive together, once, under one word.

*On screen*
- All four Crazy Shake images in a **fan**: the shot boxes overlap by 56px and each cut-out
  tilts (−6°, −2°, +2°, +6°), so the four read as one fanned set rather than four separate
  drinks.
- **One** cream name card, centred below: **Crazy Shake**, 46px.
- No flavour word anywhere. The Oreo, the marshmallows, the wafer sticks and the cake slice
  are visible in the photographs; nothing labels them, and nothing is invented to describe
  them.
- Overlap occludes, it never crops — each of the four is identified by its topping, which
  sits top-centre, clear of the seam.

*Motion* — blueprint `grid-card-assemble`, treatment `variant-fan`
- `0.00–0.45` all four `center-outward-expansion` from a single point at frame centre, then
  settle into the fan. The spread itself is the message: same drink, many ways.
- `0.35–0.60` `particle-burst` on the settle, as punctuation.
- `0.55–0.85` the single name card `spring-pop-entrance`, `back.out(2.0)` — one card landing
  hard reads more confident than four landing softly.
- `0.85–2.40` hold, each cup on its own `sine-wave-loop` phase, pivoting on its base.
- 2.40s rather than a mixed scene's 2.70s: one name to read instead of three.

*Why it's here* — the densest moment in the reel. Four pictures, one word.""",
},
6: {
"scene": "One wide grouped shot of the whole paleta range, with the name in a type column.",
"poster": "1.8s",
"body": """**The Paletas hero — a frame built around a single grouped photograph.**

*On screen*
- `RealPaletas.png` alone: the full paleta range fanned across crushed ice with fruit.
  **1380×920**, which is 104% of the useful title-safe height and 85% of the frame height.
- **Paletas** in a cream card in a **type column** down the left, under the logo.
- No product row, no pills, no ribbon.

*Why the layout changes here*
The image is 1536×1024 — a 3:2 photograph in a 16:9 frame. It **cannot** fill the width
without cropping: at 1920 wide it would need 1280px of height and only 1080 exist. So it is
height-limited, and roughly 480px of width is left over no matter what.

Centring it would leave two symmetric dead margins. Instead the image is pushed right to
the action-safe edge and the leftover strip becomes the type column — which is how the
frame uses the 16:9 space the 3:2 artwork cannot reach. 1380×920 is exactly 3:2, so the
artwork lands pixel-exact: **no crop, no letterbox, no distortion.**

That column is also the tell. It is one of only two frames without a centred name card,
and that difference is what reads as *hero* rather than *another product row*.

*Why it is a hero at all* — this is a grouped shot: one photograph that already contains
the whole range. Dropping it into a 520px slot beside two unrelated products would throw
away the reason it was taken that way.

*Motion* — blueprint `titlecard-reveal`, treatment `hero-reveal`
- `0.00–0.55` the arrangement scales up from 0.92 with `spring-pop-entrance`, `back.out(1.4)` —
  a softer overshoot than the product scenes, because this frame is a breath in the reel.
- `0.30–0.90` `ambient-glow-bloom` rises behind it, peaking at ≤0.45 opacity.
- `0.50–0.85` the name card and logo column arrive together, left, `spring-pop-entrance`.
- `0.90–2.90` hold on a slow `sine-wave-loop`.""",
},
8: {
"scene": "Esquimal, Esquite and Esquite Hot Cheetos — the corn cups side by side.",
"poster": "1.9s",
"body": """**Where the duplicate problem used to live.**

The previous storyboard showed Esquites Hot Cheetos **twice**, because two files existed for
it and the plan was reading files rather than products. The client's manual selection has one
image per esquite, and this scene puts the plain cup and the Hot Cheetos cup next to each
other on purpose.

*On screen*
- **Esquimal** — sprinkle-coated bar on a stick.
- **Esquite** — white foam cup, corn under cheese, chile and lime.
- **Esquite Hot Cheetos** — the same cup under a tall red Hot Cheetos mound.
- The two cups are deliberately adjacent: side by side, the difference *is* the menu
  distinction, and the stick beside them keeps the row from reading as two of one thing.

*Why this order* — it is the order on the client's printed board. Products are sequenced by
the board, not by filename, which is also what keeps **Elote** and **Elote Hot Cheetos**
together in Frame 7.

*Motion* — blueprint `grid-card-assemble`, treatment `burst-pop`
- `0.00–0.40` all three `center-outward-expansion` from frame centre.
- `0.30–0.55` `particle-burst` punctuates the landing.
- `0.45–0.80` pills `spring-pop-entrance` under each product.
- `0.80–2.70` hold on `sine-wave-loop`.""",
},
17: {
"scene": "The drinks wall in one wide shot, with BEBIDAS and the name in the type column.",
"poster": "1.8s",
"body": """**The second hero, and the only one that also opens a category.**

*On screen*
- `AguasFrescas.png` alone at **1380×920**: a full row of aguas frescas jars with the fruit
  each is made from banked around them.
- The **BEBIDAS** ribbon and the **Aguas Frescas** name card both live in the left type
  column, stacked under the logo.

*Why the ribbon moves* — every other category ribbon sits top-centre. Here the artwork starts
at x=486 and runs to the action-safe edge, so a centred ribbon would sit on top of it. In a
hero the ribbon joins the type column instead: smaller (40px), left-aligned, above the name.
The column is already the hero's signature, so the ribbon reads as part of it rather than as
an exception.

*Motion* — blueprint `titlecard-reveal`, treatment `hero-reveal`
- `0.00–0.55` the arrangement scales up with `spring-pop-entrance`.
- `0.30–0.90` `ambient-glow-bloom` behind it.
- `0.45–0.90` ribbon then name arrive down the column, 0.12s apart, so the category reads
  before the product does.
- `0.90–3.30` hold on `sine-wave-loop`.""",
},
20: {
"scene": "The mark returns, larger, with the banner and the town.",
"poster": "2.4s",
"body": """**Land it back on the brand.**

*On screen*
- `LS_Logo_Primary_v01.png` centred at 820px — larger than the cold open, because this is
  the frame that holds while the loop restarts.
- **ICE-CREAM AND SNACKS** (`brand.brand.banner`) and **Swedesboro, New Jersey**
  (`brand.brand.location`), both verbatim from `brand.json`.

*Motion* — blueprint `logo-assemble-lockup`
- `0.00–0.50` logo `spring-pop-entrance` onto the held gradient.
- `0.40–0.90` banner and town line `waterfall-entry` beneath it.
- `0.90–3.60` `ambient-glow-bloom` swells and holds. The longest hold in the reel so the
  loop point doesn't feel abrupt.

*Why it's here* — a TV loop has no end card in the usual sense; this is the seam. It has to
be calm enough to sit behind, and branded enough to be worth the time.""",
},
}


def fmt(sec):
    return f"{sec:g}s"


def main():
    plan = json.loads(PLAN.read_text())
    inv = json.loads(INVENTORY.read_text())
    f = plan["frames"]
    opaque = set(inv["opaqueImages"])
    multi = inv["multiImageProducts"]

    out = [
        "---",
        f"format: {plan['format']}",
        f"duration: {fmt(plan['totalSeconds'])}",
        'message: "La Sabrosita — helados, antojitos, postres, bebidas, all of it"',
        "arc: Mark → Helados → Antojitos → Postres → Bebidas → Mark",
        "audience: walk-in customers reading the in-store TV menu, Swedesboro NJ",
        "mode: collaborative",
        "---",
        "",
        "<!-- GENERATED by scripts/build-storyboard.py from data/scene-plan.json.",
        "     Timings and product assignments come from the plan — re-run the script",
        "     rather than hand-editing those. Narrative prose is safe to edit here. -->",
        "",
        "# La Sabrosita — animated TV showcase",
        "",
        f"**{plan['frameCount']} frames · {fmt(plan['totalSeconds'])} · "
        f"{plan['imagesPlaced']} images · "
        f"{plan['distinctNamesOnScreen']} products, each shown exactly once · "
        f"ceiling {fmt(plan['ceilingSeconds'])}**",
        "",
        "## Source",
        "",
        "The images are the client's **manual selection**, read in place from",
        "`~/Downloads/LaSabrosita` through the `assets/manual` symlink. Nothing in that",
        "folder is moved, renamed, copied or modified.",
        "",
        "This replaced Rubric's 47-entry MASTER catalog as the source for this reel.",
        "`tv-menu/assets/products/products.json` is untouched and still governs production",
        "state; it is simply not what the video reads any more. What changed in practice:",
        "",
        "- **46 images → 41 products** (was 47 images → 37 products);",
        "- five products arrive that had no approved master before — Banana Split,",
        "  Chicharron Preparado, Coctel de Fruta, Fresas Dubai, Marucha Loca;",
        "- **Pastel Tres Leche leaves** — the client selected no image for it;",
        "- Paletas and Aguas Frescas are now **grouped shots**, so each carries its own",
        "  hero scene instead of sitting in a row of unrelated products.",
        "",
        "## Grouping rules",
        "",
        "**One product, one scene, one name.** Three products have more than one selected",
        "image — " + ", ".join(f"{k} ({len(v)})" for k, v in multi.items()) + ". Those are",
        "different flavours photographed separately, not different menu items. Each gets",
        "**one scene** holding **all** of its images under **one name card**. The flavour is",
        "shown, never named — no flavour word is written anywhere, and none is invented.",
        "",
        "**A product name appears in exactly one scene, ever.** The generator asserts this,",
        "asserts that every one of the 46 images is placed exactly once, and asserts that the",
        "number of names on screen equals the number of products in the inventory. It refuses",
        "to write a plan that breaks any of them.",
        "",
        "**Order comes from the menu board, not from filenames.** Products are sequenced the",
        "way they are printed on the client's board (`tv-menu/concept/widths.json`), which is",
        "what puts **Elote** beside **Elote Hot Cheetos** and **Esquite** beside **Esquite Hot",
        "Cheetos**. Sorting by filename had put `elote-con-hot-cheetos` ahead of",
        "`elote-regular` purely because *c* sorts before *r*. Every display name is also",
        "checked against that board: a name that is not a real menu line stops the build.",
        "",
        "### Product scale",
        "",
        "Each image is a transparent PNG, but the food inside fills anywhere from **17% to",
        "100%** of its canvas. Fitting the canvas rendered some products nearly 5× smaller",
        "than others. `scripts/measure-masters.py` measures the real alpha bounding box of",
        "all 46 (read-only), and each cut-out is scaled and placed by its **food** instead —",
        "600–620px tall, i.e. **68–70% of the useful title-safe height**. The full image is",
        "still drawn; it just overflows the box as transparent padding, so nothing is ever",
        "cropped.",
        "",
        "### Transparency",
        "",
    ] + ([
        "**All 46 images are transparent cut-outs.** Banana Split, Elote and Crepa Dubai",
        "arrived first as photographs on a white background and were placed on cream cards;",
        "the client supplied corrected transparent versions on 2026-08-16 and they now float",
        "on the gradient like everything else. Scene assignments, sizes, positions and timings",
        "were not touched by that swap.",
    ] if not opaque else [
        "These arrived as ordinary photographs on a white background, with no transparency:",
        "",
        "| Image | Product |",
        "|---|---|",
    ] + [
        f"| `{fn}` | " +
        next(e["name"] for e in inv["images"] if e["file"] == fn) + " |"
        for fn in sorted(opaque)
    ] + [
        "",
        "Floated on the pink gradient they would read as white rectangles someone forgot to",
        "mask. They are **not edited** — the source folder is read-only. Instead the white is",
        "made deliberate: each sits on a rounded cream card with a soft shadow. The card",
        "disappears automatically once a transparent version is supplied.",
    ]) + [
        "",
        "### Scene shapes",
        "",
        "| | Scenes | Images |",
        "|---|---|---|",
        f"| Hero (one grouped shot, own aspect ratio) | {plan.get('heroFrameCount', 0)} | "
        f"{sum(len(x['products']) for x in f if x.get('sceneType') == 'hero')} |",
        f"| Variant clusters (one name each) | {plan['clusterFrameCount']} | "
        f"{sum(len(x['products']) for x in f if x.get('sceneType') == 'cluster')} |",
        f"| Mixed scenes (2–3 different items) | "
        f"{plan['productFrameCount'] - plan['clusterFrameCount'] - plan.get('heroFrameCount', 0)} | "
        f"{sum(len(x['products']) for x in f if x.get('sceneType') == 'mixed')} |",
        "| Cold open + close | 2 | 0 |",
        "",
        f"Products per category: " + ", ".join(
            f"**{c}** {n}" for c, n in plan["categoryCounts"].items()) + ".",
        "",
        f"## The {plan['frameCount']} frames",
        "",
        "| # | Time | Shape | On screen | Name card(s) |",
        "|---|---|---|---|---|",
    ]

    for fr in f:
        span = f"{fr['start']:.2f}–{fr['start'] + fr['duration']:.2f}"
        if fr["kind"] == "cold-open":
            out.append(f"| {fr['frame']} | {span} | cold open | Logo lockup, confetti, banner | — |")
            continue
        if fr["kind"] == "close":
            out.append(f"| {fr['frame']} | {span} | close | Logo, banner, Swedesboro NJ | — |")
            continue
        if fr["sceneType"] == "hero":
            shape = "**hero** ×1"
            on = f"`{fr['products'][0]['file']}` at 1380×920, full artwork"
            cards = f"**{fr['displayName']}** (type column)"
        elif fr["sceneType"] == "cluster":
            shape = f"**cluster** ×{len(fr['products'])}"
            on = f"{len(fr['products'])} images of one product"
            cards = f"**{fr['displayName']}** (one)"
        else:
            shape = f"mixed ×{len(fr['products'])}"
            on = ", ".join(p["name"] for p in fr["products"])
            cards = f"{len(fr['products'])} pills"
        if fr["showsRibbon"]:
            on += f"  ·  *+ {fr['categoryRibbon']} ribbon*"
        out.append(f"| {fr['frame']} | {span} | {shape} | {on} | {cards} |")

    out += ["",
            f"**All {plan['frameCount']} frames are sketched** — every one is a real layout with the",
            "real images at their real sizes. No frame has motion yet; that is the next pass.",
            ""]

    for fr in f:
        d = DETAILED.get(fr["frame"])
        out += [
            f"## Frame {fr['frame']} — {fr['title']}",
            "",
            "- status: built",
            f"- src: compositions/frames/{fr['id']}.html",
            f"- duration: {fmt(fr['duration'])}",
            f"- start: {fr['start']:.2f}s",
        ]
        if d:
            out.append(f"- scene: {d['scene']}")
            out.append(f"- poster: {d['poster']}")
        elif fr["kind"] == "products":
            if fr["sceneType"] == "hero":
                out.append(f"- scene: {fr['displayName']} hero — "
                           f"{fr['products'][0]['file']} at 1380x920, full artwork")
            elif fr["sceneType"] == "cluster":
                out.append(f"- scene: {fr['displayName']} — all "
                           f"{len(fr['products'])} selected images, one name card")
            else:
                out.append("- scene: " + ", ".join(p["name"] for p in fr["products"]))
        out.append("- transition_in: cut")
        out.append(f"- blueprint: {fr['blueprint']}")
        out.append(f"- rules: {', '.join(fr['rules'])}")
        if fr["kind"] == "products":
            out.append(f"- scene_type: {fr['sceneType']}")
            out.append(f"- name_mode: {fr['nameMode']}")
            if fr["sceneType"] in ("hero", "cluster"):
                out.append(f"- name_card: {fr['displayName']}")
            out.append(f"- category: {fr['categoryRibbon']}")
            out.append(f"- treatment: {fr['treatment']}")
            out.append(f"- shows_ribbon: {'yes' if fr['showsRibbon'] else 'no'}")
            out.append("- products:")
            for p in fr["products"]:
                flag = "  ·  *photo on white — sits on a card*" if p["file"] in opaque else ""
                out.append(f"    - {p['name']} · `{p['file']}` — {p['depicts']}{flag}")
        out.append("")
        if d:
            out.append(d["body"])
        elif fr["kind"] == "products":
            if fr["sceneType"] == "hero":
                what = (f"**{fr['displayName']}** hero — one grouped image, "
                        f"`{fr['products'][0]['file']}`, sized to its own aspect ratio.")
            elif fr["sceneType"] == "cluster":
                what = (f"All **{len(fr['products'])}** selected images of "
                        f"**{fr['displayName']}**, together, under one name card. "
                        f"No flavour word on screen.")
            else:
                names = ", ".join("**" + x["name"] + "**" for x in fr["products"])
                what = f"{len(fr['products'])} different products — {names} — one cream pill each."
            ribbon = (f" Opens **{fr['categoryRibbon']}**, so it also carries the category ribbon "
                      f"and an extra 0.40s to read it." if fr["showsRibbon"] else "")
            out.append(f"{what}{ribbon}")
            out.append("")
            out.append(f"*Motion* — blueprint `{fr['blueprint']}`, treatment "
                       f"`{fr['treatment']}`: {fr['treatmentNote']}.")
        else:
            out.append("_Outline._")
        out.append("")

    OUT.write_text("\n".join(out))
    print(f"wrote {OUT.relative_to(PROJECT)}  ({len(f)} frame blocks, {len(DETAILED)} detailed)")


if __name__ == "__main__":
    main()
