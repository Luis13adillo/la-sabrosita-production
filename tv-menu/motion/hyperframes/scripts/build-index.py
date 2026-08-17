#!/usr/bin/env python3
"""
Generate index.html — the root composition.

WHAT THE ROOT OWNS (changed 2026-08-17)
---------------------------------------
It used to own nothing but a list of mounts; every frame drew its own opaque
background and its own copy of the logo. That is wrong for a reel with
continuous chrome: a ticker that restarts every 3.4s is not a ticker, and a
logo handed from one frame to the next flickers at the cut however carefully
the two copies are aligned.

So the root now carries every layer that must survive a scene change:

  .field    the approved artwork, drifting slowly across the whole reel
  .ring     eight products framing the open and the close
  mounts    the 41 frames, transparent, painted over the field
  .ticker   one strip, one linear pass, never restarted
  .logo     one lockup — big in the centre for the cold open, then it flies
            to the corner and stays there until the close brings it back

This is hyperframes-core's shared-background pattern
(references/full-screen-motion.md): a shared layer plus transparent timed
content. None of these four is a clip — they exist for the whole composition
and the root timeline drives them.

MOUNT WINDOWS
-------------
A mount opens PRE_ROLL before its beat and closes TAIL after it, so the
outgoing product is still leaving while the next one arrives. Two mounts are
therefore alive at once, which is why product mounts alternate between two
tracks: HyperFrames rejects an overlap of even 0.001s on ONE track.

Reads  : ../data/scene-plan.json, ../compositions/reel-chrome.css,
         ../assets/brand-tokens.css
Writes : ../index.html

Run:  python3 scripts/build-index.py
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
CHROME = PROJECT / "compositions" / "reel-chrome.css"
TOKENS = PROJECT / "assets" / "brand-tokens.css"
OUT = PROJECT / "index.html"

GSAP = "https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"
BACKGROUND = "assets/backgrounds/LS_Menu_Background_v01.png"
LOGO = "assets/brand/logos/LS_Logo_Primary_v01.png"

RING_COUNT = len(RS.RING_POS)


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace('"', "&quot;"))


def ring_picks(plan):
    """
    Eight cut-outs to frame the open and the close.

    Chosen, not curated: solo scenes only (a cluster or a pair would put two
    of the same thing in the ring), cut-outs only (a photo-on-white would show
    as a white square floating on the artwork), then eight spread evenly
    across the reel so all four categories are represented. Deterministic —
    the same plan always yields the same eight.
    """
    solos = [f for f in plan["frames"]
             if f.get("sceneType") == "solo" and f["products"][0].get("cutout", True)]
    if len(solos) <= RING_COUNT:
        return [f["products"][0] for f in solos]
    step = len(solos) / RING_COUNT
    return [solos[int(i * step)]["products"][0] for i in range(RING_COUNT)]


def ring_html(picks, bboxes):
    out = []
    for i, p in enumerate(picks):
        cx, cy = RS.RING_POS[i]
        left = cx - RS.RING_BOX / 2
        top = cy - RS.RING_BOX / 2
        style = RS.place_style(bboxes[p["file"]], (RS.RING_BOX, RS.RING_BOX))
        out.append(
            f'        <div class="ring-item" id="ring-{i}" '
            f'style="left: {left:.0f}px; top: {top:.0f}px;">\n'
            f'          <div class="ring-float">\n'
            f'            <img src="assets/manual/{p["file"]}" alt="{esc(p["name"])}" '
            f'style="{style}" />\n'
            f'          </div>\n'
            f'        </div>'
        )
    return "\n".join(out)


def ticker_html(sets):
    """
    One strip, repeated `sets` times.

    The strip has to be long enough that its tail never reaches the left edge
    of the frame during the single linear pass, so it holds two more sets than
    the pass travels. Cheap: this is ~60 spans of text.
    """
    one = "".join(f'<span>{esc(w)}<i class="star">&#10022;</i></span>'
                  for w in RS.TICKER_WORDS)
    # One line per set: this is generated markup nobody reads word by word, and
    # 8 sets on 8 lines keeps index.html inspectable.
    return "\n".join(f"          {one}" for _ in range(sets))


def ticker_travel(sets_needed):
    """Width of one set of ticker words, measured from the shipped font."""
    face = RS.Face(700, RS.TICKER_TRACK)
    star = face.width("✦", RS.TICKER_SIZE)
    one = sum(face.width(w, RS.TICKER_SIZE) for w in RS.TICKER_WORDS)
    one += len(RS.TICKER_WORDS) * (star + 2 * RS.TICKER_GAP)
    return one


def main():
    plan = json.loads(PLAN.read_text())
    bboxes = json.loads(BBOX.read_text())["masters"]
    frames = plan["frames"]
    products = [f for f in frames if f["kind"] == "products"]
    total = RS.total_seconds(len(products))
    finale = round(RS.COLD_OPEN + len(products) * RS.BEAT, 2)

    if abs(total - plan["totalSeconds"]) > 0.001:
        sys.exit(f"plan says {plan['totalSeconds']}s, reel_spec computes {total}s — "
                 "re-run scripts/build-scene-plan.py")

    # ---- mounts -----------------------------------------------------------
    # Track 0 carries the two chrome frames (cold open, close); they never
    # overlap each other. Product mounts alternate 1 and 2 because consecutive
    # mounts overlap by PRE_ROLL + TAIL.
    mounts = []
    pi = 0
    for fr in frames:
        if fr["kind"] == "products":
            start, dur = RS.mount_window(pi)
            track = 1 + (pi % 2)
            pi += 1
        elif fr["kind"] == "cold-open":
            start, dur, track = 0.0, RS.COLD_OPEN, 0
        else:
            start, dur, track = finale, RS.CLOSE, 0
        mounts.append(
            f'      <div class="mount" id="mount-{fr["frame"]:02d}" '
            f'data-composition-id="{fr["id"]}" '
            f'data-composition-src="compositions/frames/{fr["id"]}.html"\n'
            f'           data-start="{start}" data-duration="{dur}" '
            f'data-track-index="{track}" data-width="1920" data-height="1080"></div>'
        )

    # ---- ticker -----------------------------------------------------------
    set_w = ticker_travel(1)
    passes = max(1, round(total * RS.TICKER_SPEED / set_w))
    travel = round(set_w * passes, 1)
    sets = passes + 2

    picks = ring_picks(plan)

    tokens = TOKENS.read_text().rstrip().replace(":root {", "#root {")
    css = tokens + "\n\n" + CHROME.read_text().rstrip()

    bx, by, bs = RS.LOGO_BIG
    sx, sy, ss = RS.LOGO_SMALL

    html = f"""<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1920, height=1080">
    <script src="{GSAP}"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #0D0D0F; }}

{css}
    </style>
  </head>
  <body>
    <!-- GENERATED by scripts/build-index.py from data/scene-plan.json.
         Do not hand-edit: edit the plan or scripts/reel_spec.py and re-run,
         or Studio drags will be overwritten on the next build.

         {plan['frameCount']} frames, {plan['imagesPlaced']} images, {plan['distinctNamesOnScreen']} products, {total}s.
         Every product holds the screen for {RS.BEAT}s. -->
    <div id="root" data-composition-id="main"
         data-start="0" data-duration="{total}"
         data-width="1920" data-height="1080">

      <!-- The one continuous field. Not a clip: it exists for the whole reel,
           and the root timeline drifts it. The brand gradient stays underneath
           as the declared background, so the frame still paints correctly if
           the artwork is ever missing at render time. -->
      <div class="field">
        <div class="field-img" id="bg-img"></div>
      </div>

      <!-- Eight products framing the open and the close. -->
      <div class="ring" id="ring">
{ring_html(picks, bboxes)}
      </div>

{chr(10).join(mounts)}

      <!-- One strip, one linear pass. Never restarted, so it reads as a real
           ticker rather than 41 short ones. -->
      <!-- data-layout-allow-overflow: the strip is DELIBERATELY wider than the
           frame — that is what a ticker is. .ticker clips it, so nothing is
           ever painted outside the canvas; only the element's own box extends
           past it. Verified against renders/look before the attribute was
           added, per hyperframes-core's rule on silencing overflow findings. -->
      <div class="ticker">
        <div class="ticker-strip" id="ticker-strip" data-layout-allow-overflow>
{ticker_html(sets)}
        </div>
      </div>

      <!-- One lockup for the whole reel: centre-stage for the cold open, then
           it flies to the corner and holds there until the close.

           The transparent PNG straight onto the artwork — nothing behind it.
           See .logo-mark in reel-chrome.css. -->
      <img class="logo-mark" id="logo" src="{LOGO}"
           alt="La Sabrosita Ice Cream &amp; Snacks" />
    </div>

    <script>
      window.__timelines = window.__timelines || {{}};
      (function () {{
        var tl = gsap.timeline({{ paused: true }});
        var TOTAL = {total};
        var FINALE = {finale};

        /* --- the field drifts, once, one way -----------------------------
           A slow push across {total}s. sine-wave-loop's amplitude caps govern a
           BREATH (something that returns); this never returns, so it reads as
           the camera easing in rather than the background pulsing. */
        tl.fromTo("#bg-img",
          {{ scale: 1.04 }},
          {{ scale: 1.09, duration: TOTAL, ease: "none" }}, 0);

        /* --- the ring clears, then comes back ---------------------------- */
        tl.to("#ring",
          {{ opacity: 0, duration: {RS.D_RING_OUT}, ease: "power2.inOut" }}, {RS.T_RING_OUT});
        tl.to("#ring",
          {{ opacity: 1, duration: 1.40, ease: "power2.out" }}, FINALE - 0.5);

        /* Each product pops back in on its own beat at the finale.
           immediateRender:false is load-bearing: without it GSAP applies the
           from-state at page load and all eight sit at 0.7 scale through the
           entire cold open. */
        for (var i = 0; i < {len(picks)}; i++) {{
          tl.fromTo("#ring-" + i,
            {{ scale: 0.70 }},
            {{ scale: 1, duration: {RS.D_RING_IN}, ease: "power3.out",
              immediateRender: false }},
            FINALE - 0.4 + i * {RS.RING_STAGGER});
        }}

        /* A little life while the ring is on screen. It rides a separate
           wrapper from the scale pop above, so two tweens never fight over
           one element's transform. Phase tween is linear — the sine is the
           curve (sine-wave-loop). */
        var phase = {{ p: 0 }};
        var floats = gsap.utils.toArray(".ring-float");
        tl.to(phase, {{
          p: Math.PI * 2 * 18, duration: TOTAL, ease: "none",
          onUpdate: function () {{
            for (var j = 0; j < floats.length; j++) {{
              floats[j].style.transform =
                "translateY(" + (Math.sin(phase.p + j * 0.8) * 7).toFixed(2) + "px)";
            }}
          }}
        }}, 0);

        /* --- the logo flies to the corner, and back ---------------------- */
        tl.fromTo("#logo",
          {{ x: {bx}, y: {by}, scale: {bs} }},
          {{ x: {sx}, y: {sy}, scale: {ss},
            duration: {RS.D_LOGO_MOVE}, ease: "power3.inOut" }}, {RS.T_LOGO_MOVE});
        tl.to("#logo",
          {{ x: {bx}, y: {by}, scale: {bs},
             duration: 1.20, ease: "power3.inOut" }}, FINALE - 0.2);

        /* --- the ticker ------------------------------------------------- */
        tl.fromTo("#ticker-strip",
          {{ x: 0 }},
          {{ x: -{travel}, duration: TOTAL, ease: "none" }}, 0);

        window.__timelines["main"] = tl;
      }})();
    </script>
  </body>
</html>
"""
    OUT.write_text(html)
    print(f"wrote index.html — {plan['frameCount']} mounts, {total}s "
          f"({total / 60:.0f}m{total % 60:04.1f}s)")
    print(f"  cold open  0.0 -> {RS.COLD_OPEN}s")
    print(f"  products   {RS.COLD_OPEN}s -> {finale}s  "
          f"({len(products)} x {RS.BEAT}s, mounts overlap "
          f"{RS.PRE_ROLL + RS.TAIL:.2f}s)")
    print(f"  close      {finale}s -> {total}s")
    print(f"  ticker     {set_w:.0f}px per set, {passes} passes, "
          f"{sets} sets in the strip ({RS.TICKER_SPEED}px/s)")
    print("  ring       " + ", ".join(p["name"] for p in picks))


if __name__ == "__main__":
    main()
