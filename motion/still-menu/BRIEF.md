---
workflow: general-video
flow: automation
storyboard: no
message: "The whole La Sabrosita menu, in Spanish and in English, on the TV."
destination: in-store TV, played from a USB stick (silent, continuous playback)
aspect: "16:9"
resolution: 1920x1080
fps: 30
language: es + en, 30 seconds each
audience: walk-in customers reading the board in Swedesboro, NJ
length: 60s, seamless loop
angle: none — the piece was already designed and approved
---

# La Sabrosita — Still Menu Motion (the menu board video)

## Intent

Render the client's finished menu-board animation to a USB-ready MP4, with one
correction: the logo.

**This project designs nothing.** The video arrived already made, as
`StillMenuMotion.zip` — a Claude Design project holding a React scene that draws
the full Spanish board for 30 seconds, cross-dissolves to the full English board
for 30 seconds, and lands on the frame it started on so an in-store player can
repeat it all day.

Layout, copy, colour, timing, animation, product photos, category grouping and
the loop seam are all the client's, and all of them are out of scope. The one
authorised change is the logo, below.

## The one change

The logo in the supplied video is `assets/logo3.png`, a **fully opaque** raster
of the La Sabrosita mark — its background is baked-in white — and the scene sat
it inside a white rounded card with a drop shadow, which is how the white was
made to look deliberate.

It is now the workspace's official transparent logo, `brand/logos/LS_Logo_Primary_v01.png`,
placed on the pink blob with no card and no shadow behind it. Same anchor point
(x 44, y 20), same width (262), same rise-in, same breathing scale, same timing.

Luis chose to drop the card as well as swap the file: swapping the image alone
leaves the white card, which is the thing that reads as "the logo has a white
background". Dropping the shadow follows the brand guidelines, which prohibit
drop shadows, glows and outlines on the mark.

That is the whole visual delta. `src/sabrosita-scene.jsx` differs from the
client's file by three lines in one place, and `src/animations-v3.jsx` and
`src/tweaks-panel.jsx` are byte-identical to the ZIP.

## Route

Same route as the Menu Items Motion video (`tv-menu/motion/hyperframes/`):
a HyperFrames project, `hyperframes render` to H.264 MP4 at 1920x1080 / 30fps.

Unlike that video, this one is not authored in HyperFrames — it is *hosted* by
it. See [README.md](README.md) for why that is the right shape and how the
handoff works.

## The Menu Items Motion video is reference only

`tv-menu/motion/hyperframes/` is a separate, finished deliverable — 41 products,
one at a time, 2m21.6s. It was read here to match its render settings and
nothing else. It is not modified, extended, joined to this piece, or rebuilt.

## Assets

- 4 product cut-outs — the only images the scene places. Reached by symlink from
  `motion/product-showcase/assets/products/`, where the same bytes already live
  (verified by md5). Nothing was copied, converted or re-exported.
- The official logo, reached by symlink from `brand/logos/`.
- Noto Sans, the brand typeface, self-hosted — see `scripts/build-fonts.mjs`.

`assets/bg-tv.png` and the other 9 product images in the ZIP are not used by this
scene and were not brought in.

## Notes

- Silent by design. No voiceover, no music; in-store TVs run muted.
- `npx hyperframes check` reports 80 layout warnings and 8 contrast errors. Every
  one of them is a property of the client's approved design, not of this build —
  see README.md § "What check reports". They were not fixed, because fixing them
  would mean redesigning the video.
