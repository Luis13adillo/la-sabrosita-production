#!/usr/bin/env python3
"""
Generate compositions/frames/*.html from data/scene-plan.json.

Each frame is a HyperFrames SUB-composition, which has a strict shape:

  - everything the runtime needs lives inside <template> (the runtime clones
    only the template contents and throws the rest away, <head> included);
  - the root is styled by #root, never by a class on the root — the compiler
    scopes each file's CSS to its data-composition-id, and a rule keyed off the
    root's own class stops matching once scoped;
  - <link rel="stylesheet"> is unreliable here for the same scoping reason, so
    the shared CSS is INLINED. That is why these files are generated rather than
    hand-written: compositions/product-scene.css and assets/brand-tokens.css
    stay the single source, and this script copies them in.

WHAT A FRAME IS NOW (rewritten 2026-08-17)
------------------------------------------
The product on the right, a name card on the left, and nothing else. The
background, the logo and the ticker moved to index.html, because they have to
survive the cut between frames — see scripts/build-index.py.

So a frame is transparent, and it is the same shape every time: same card
position, same product zone, same beat. The previous pass placed each name
adaptively against measured negative space, which gave 39 frames 39 different
answers to the same question. scripts/title_layout.py still exists and is no
longer called; see the note at the top of compositions/product-scene.css.

MOTION
------
Timing comes from scripts/reel_spec.py, which build-index.py also reads. The
mount window and the motion inside it are the same numbers seen from two sides;
a private copy here is how a product ends up entering before its own mount is
on screen.

Rules composed, per the scene plan's citations:
  spring-pop-entrance   the product arrives (back.out — the playful variant,
                        which this brand is; OVERSHOOT well under the cap of 2)
  waterfall-entry       product, then card, then description
  sine-wave-loop        the slow push-in across the hold

Copy comes from data/descriptions.json and nowhere else.

Run:  python3 scripts/build-frames.py
"""

import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import reel_spec as RS          # noqa: E402  (needs HERE on the path first)

PROJECT = HERE.parent
PLAN = PROJECT / "data" / "scene-plan.json"
BBOX = PROJECT / "data" / "master-bboxes.json"
COPY = PROJECT / "data" / "descriptions.json"
SHARED = PROJECT / "compositions" / "product-scene.css"
TOKENS = PROJECT / "assets" / "brand-tokens.css"
OUTDIR = PROJECT / "compositions" / "frames"

# Breathing room inside each shot box in a cluster, per side, so two cut-outs
# never touch at their widest point.
SHOT_PAD = 12

# Filled during a run so main() can report what it did and where it needs help.
CARDS = []
MISSING_COPY = []
TALL = []


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace('"', "&quot;"))


def indent(text, n):
    pad = " " * n
    return "\n".join(pad + ln if ln.strip() else ln for ln in text.splitlines())


def shell(fid, css, body, script):
    return f"""<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <!-- Sub-composition. The runtime clones ONLY <template> contents;
         this head is metadata for the source file and is discarded. -->
  </head>
  <body>
    <template>
      <style>
{css}
      </style>

      <div id="root" data-composition-id="{fid}" data-width="1920" data-height="1080">
{body}
      </div>

      <script>
        window.__timelines = window.__timelines || {{}};
        (function () {{
          var tl = gsap.timeline({{ paused: true }});
{script}
          window.__timelines["{fid}"] = tl;
        }})();
      </script>
    </template>
  </body>
</html>
"""


# --------------------------------------------------------------- the copy ---
def card_copy(fr, copy):
    """
    (name, description) for one frame.

    A solo, cluster or hero scene is keyed by its displayName. The two
    client-named pairs have no single displayName, so they are keyed by their
    two product names joined — and they carry their own headline, because
    "Elote" and "Esquite" share one card.
    """
    if fr["nameMode"] == "single":
        name = fr["displayName"]
        entry = copy["items"].get(name)
    else:
        key = " + ".join(p["name"] for p in fr["products"])
        entry = copy["pairs"].get(key)
        name = entry["name"] if entry else " y ".join(p["name"] for p in fr["products"])

    if not entry:
        MISSING_COPY.append((fr["id"], name))
        return name, None
    return name, entry["desc"]


# ------------------------------------------------------------ the product ---
def zone_boxes(fr, bboxes):
    """
    [(product, box_w, box_h)] for every shot, laid out inside PRODUCT_BOX.

    One product takes the whole zone. Several share it: each is capped by the
    zone's HEIGHT, so its width follows from its own aspect ratio, and if the
    row would then be wider than the zone every box shrinks by the SAME factor.
    Shrinking one box alone would break the shared optical scale that makes a
    fan of four shakes read as one product rather than four.
    """
    _, _, W, H = RS.PRODUCT_BOX
    prods = fr["products"]
    n = len(prods)
    if n == 1:
        return [(prods[0], W, H)]

    gap = (RS.PAIR_GAP if fr["sceneType"] == "pair"
           else RS.CLUSTER_GAP.get(n, 24))
    overlap = RS.CLUSTER_OVERLAP.get(n, 0)
    span = (gap - overlap) * (n - 1)

    aspects = [RS.food_aspect(bboxes[p["file"]]) for p in prods]
    # box_w = aspect * h + 2*PAD, summed with the gaps, must fit W.
    h = min(H, (W - span - 2 * SHOT_PAD * n) / sum(aspects))
    return [(p, a * h + 2 * SHOT_PAD, h) for p, a in zip(prods, aspects)]


def zone_html(fr, bboxes):
    boxes = zone_boxes(fr, bboxes)
    n = len(boxes)
    cls = "zone"
    if fr["sceneType"] == "pair":
        cls += " pair"
    elif n > 1:
        cls += f" of-{n}"

    tilt = RS.CLUSTER_TILT.get(n, ()) if fr["sceneType"] == "cluster" else ()
    rows = []
    for i, (p, bw, bh) in enumerate(boxes):
        style = RS.place_style(bboxes[p["file"]], (bw, bh))
        if i < len(tilt):
            style += f" transform: rotate({tilt[i]}deg);"
        card = "" if p.get("cutout", True) else " oncard"
        rows.append(
            f'              <div class="shot" style="width: {bw:.0f}px; height: {bh:.0f}px;">\n'
            f'                <img class="shot-img{card}" src="assets/manual/{p["file"]}" '
            f'alt="{esc(p["name"])}"\n'
            f'                     style="{style}" />\n'
            f'              </div>')
    return f'            <div class="{cls}">\n' + "\n".join(rows) + "\n            </div>"


# --------------------------------------------------------------- the card ---
def card_html(fr, name, desc):
    """The name card, with its type sized to fit rather than guessed."""
    name_face = RS.Face(900, RS.NAME_TRACK)
    desc_face = RS.Face(400, RS.DESC_TRACK)

    name_size, name_lines = RS.fit(
        name_face, name, RS.NAME_SIZES, RS.CARD_INNER, RS.NAME_MAX_LINES)
    if desc:
        desc_size, desc_lines = RS.fit(
            desc_face, desc, RS.DESC_SIZES, RS.CARD_INNER, RS.DESC_MAX_LINES)
    else:
        desc_size, desc_lines = 0, []

    h = RS.card_height(name_size, len(name_lines), desc_size, len(desc_lines))
    bottom = RS.CARD_Y + h
    CARDS.append((fr["id"], name, name_size, len(name_lines),
                  desc_size, len(desc_lines), bottom))
    if bottom > RS.CARD_MAX_BOTTOM:
        TALL.append((fr["id"], name, bottom))

    fid = fr["id"]
    lines = [
        f'          <div class="card-panel">',
        f'            <div class="pill">{esc(fr["categoryRibbon"])}</div>',
        f'            <div class="name" style="font-size: {name_size}px;">{esc(name)}</div>',
    ]
    if desc:
        lines.append(
            f'            <div class="desc" id="f{fid}-desc" '
            f'style="font-size: {desc_size}px;">{esc(desc)}</div>')
    lines.append("          </div>")
    return "\n".join(lines), bool(desc)


# -------------------------------------------------------------- the frame ---
def product_frame(fr, css, bboxes, copy):
    fid = fr["id"]
    d = RS.MOUNT
    name, desc = card_copy(fr, copy)
    panel, has_desc = card_html(fr, name, desc)

    body = f"""        <!-- {fr['treatment']}: {fr['treatmentNote']} -->
        <div class="product clip" id="f{fid}-product"
             data-start="0" data-duration="{d}" data-track-index="0">
          <div class="product-slide" id="f{fid}-slide">
            <div class="product-drift" id="f{fid}-drift">
{zone_html(fr, bboxes)}
            </div>
          </div>
        </div>

        <div class="card clip" id="f{fid}-card"
             data-start="0" data-duration="{d}" data-track-index="1">
          <div class="card-rise" id="f{fid}-rise">
{panel}
          </div>
        </div>"""

    drift_dur = round(RS.T_EXIT - RS.T_DRIFT_IN, 2)
    script = f"""          /* spring-pop-entrance, playful variant: the product slides in from
             the right and settles. back.out(1.4) is well inside the rule's
             OVERSHOOT <= 2 cap, and this brand is the explicitly-playful case
             the rule carves out. */
          tl.fromTo("#f{fid}-slide",
            {{ x: {RS.X_IN}, opacity: 0 }},
            {{ x: 0, opacity: 1, duration: {RS.D_PRODUCT_IN}, ease: "back.out(1.4)" }},
            {RS.T_PRODUCT_IN});

          /* The slow push-in across the hold. One way, never returning — it
             reads as the camera easing in rather than the product pulsing.
             Its own wrapper, so it never shares a transform with the slide. */
          tl.fromTo("#f{fid}-drift",
            {{ scale: {RS.DRIFT_FROM} }},
            {{ scale: {RS.DRIFT_TO}, duration: {drift_dur}, ease: "none" }},
            {RS.T_DRIFT_IN});

          /* waterfall-entry: the food lands first, then the card, then the
             line under it. The eye goes to the picture and reads after. */
          tl.fromTo("#f{fid}-rise",
            {{ y: {RS.Y_CARD_IN}, opacity: 0 }},
            {{ y: 0, opacity: 1, duration: {RS.D_CARD_IN}, ease: "power3.out" }},
            {RS.T_CARD_IN});"""

    if has_desc:
        script += f"""

          tl.fromTo("#f{fid}-desc",
            {{ y: 18, opacity: 0 }},
            {{ y: 0, opacity: 1, duration: {RS.D_DESC_IN}, ease: "power2.out" }},
            {RS.T_DESC_IN});"""

    script += f"""

          /* The card leaves first, and hands over exactly as the next card
             starts arriving — both sit at 110,340, so any overlap stacks two
             names on one spot. See T_CARD_EXIT in reel_spec.py. */
          tl.to("#f{fid}-rise",
            {{ y: {RS.Y_CARD_OUT}, opacity: 0, duration: {RS.D_CARD_EXIT}, ease: "power2.in" }},
            {RS.T_CARD_EXIT});

          /* The product leaves after it, travelling further left than the next
             one arrives from the right, so the two cross rather than pile. */
          tl.to("#f{fid}-slide",
            {{ x: {RS.X_OUT}, opacity: 0, duration: {RS.D_EXIT}, ease: "power2.in" }},
            {RS.T_EXIT});"""

    return shell(fid, css, body, script)


def words_frame(fr, css, brand, kind):
    """
    Cold open and close: the words only.

    The mark, the ring and the field belong to index.html and run continuously,
    so these frames deliberately draw none of them — a second copy of the logo
    handed over at the cut is exactly what a viewer reads as a flicker.
    """
    fid = fr["id"]
    d = RS.COLD_OPEN if kind == "cold-open" else RS.CLOSE
    banner = esc(brand["brand"]["banner"])
    town = esc(brand["brand"]["location"])

    inner = [f'            <div class="banner">{banner}</div>']
    if kind == "close":
        inner.append(f'            <div class="town">{town}</div>')

    body = (f'        <div class="words clip" id="f{fid}-words" style="top: 856px;"\n'
            f'             data-start="0" data-duration="{d}" data-track-index="0">\n'
            f'          <div id="f{fid}-words-in">\n'
            + "\n".join(inner) + "\n"
            f'          </div>\n'
            f'        </div>')

    if kind == "cold-open":
        # In, then out before the logo starts its move at 2.60s — the words
        # belong to the centred lockup and should not outlive it.
        script = f"""          tl.fromTo("#f{fid}-words-in",
            {{ y: 26, opacity: 0 }},
            {{ y: 0, opacity: 1, duration: 0.70, ease: "power3.out" }}, 0.55);
          tl.to("#f{fid}-words-in",
            {{ y: -18, opacity: 0, duration: 0.45, ease: "power2.in" }}, 2.30);"""
    else:
        # The logo lands back in the centre ~1.0s into the close; the words
        # arrive under it and hold to the end.
        script = f"""          tl.fromTo("#f{fid}-words-in",
            {{ y: 26, opacity: 0 }},
            {{ y: 0, opacity: 1, duration: 0.80, ease: "power3.out" }}, 1.10);"""

    return shell(fid, css, body, script)


def main():
    plan = json.loads(PLAN.read_text())
    brand = json.loads((PROJECT / "assets" / "brand" / "brand.json").read_text())
    bboxes = json.loads(BBOX.read_text())["masters"]
    copy = json.loads(COPY.read_text())

    # The compiler scopes every rule to this file's data-composition-id, so a
    # ":root { --ls-… }" block would become "[data-composition-id=…] :root" and
    # never match — every brand token would resolve to nothing. Declaring the
    # tokens on #root instead puts them on the composition root, where they
    # still inherit to every descendant. @font-face is an at-rule and is left
    # alone by the scoper, so it survives as written.
    tokens = TOKENS.read_text().rstrip().replace(":root {", "#root {")
    css = indent(tokens, 8) + "\n\n" + indent(SHARED.read_text().rstrip(), 8)
    OUTDIR.mkdir(parents=True, exist_ok=True)

    written = []
    for fr in plan["frames"]:
        if fr["kind"] == "cold-open":
            html = words_frame(fr, css, brand, "cold-open")
        elif fr["kind"] == "close":
            html = words_frame(fr, css, brand, "close")
        else:
            html = product_frame(fr, css, bboxes, copy)
        (OUTDIR / f"{fr['id']}.html").write_text(html)
        written.append(fr["id"])

    print(f"wrote {len(written)} sub-composition(s) to compositions/frames/")
    print(f"  beat {RS.BEAT}s, mount {RS.MOUNT}s "
          f"(pre-roll {RS.PRE_ROLL}s, tail {RS.TAIL}s)")

    if CARDS:
        sizes = [c[2] for c in CARDS]
        two = sum(1 for c in CARDS if c[3] == 2)
        print()
        print(f"cards: {len(CARDS)} — names {min(sizes)}-{max(sizes)}px, "
              f"{two} on two lines, {len(CARDS) - two} on one")
        by_size = {}
        for c in CARDS:
            by_size[c[2]] = by_size.get(c[2], 0) + 1
        print("  name sizes: " + ", ".join(f"{k}px x{v}"
                                           for k, v in sorted(by_size.items(), reverse=True)))
        print(f"  tallest card bottom edge: {max(c[6] for c in CARDS):.0f}px "
              f"(limit {RS.CARD_MAX_BOTTOM})")

    if TALL:
        print()
        print("CARD TOO TALL — these reach the ticker and need shorter copy or")
        print("a smaller name size:")
        for fid, name, bottom in TALL:
            print(f"    {fid}  {name}  bottom {bottom:.0f}px")

    if MISSING_COPY:
        print()
        print(f"NO DESCRIPTION for {len(MISSING_COPY)} frame(s) — the card renders")
        print("with the name only. Add them to data/descriptions.json:")
        for fid, name in MISSING_COPY:
            print(f"    {fid}  {name}")


if __name__ == "__main__":
    main()
