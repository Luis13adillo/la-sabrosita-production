---
workflow: general-video
flow: automation
storyboard: no
message: "La Sabrosita's food looks worth walking in for."
destination: in-store TV (large display, silent, continuous playback)
aspect: "16:9"
resolution: 1920x1080
fps: 30
language: es-with-en-support
audience: walk-in customers standing in front of the counter in Swedesboro, NJ
length: proof pass — one short loop; full piece TBD after approval
angle: premium food-commercial product showcase — one hero product at a time
---

# La Sabrosita Product Showcase (VIDEO #2)

## Intent

A standalone product-showcase reel for a large in-store TV. Premium
food-commercial motion graphics: one product at a time, presented large, with
professional entrances and exits, tasteful camera and depth movement, energetic
branded backgrounds, strong product-name typography, and playful supporting
graphics. The product is always the visual hero.

This is **not** a menu board. It does not list categories, prices, or the full
catalog. It sells appetite.

## This is not the Menu Motion TV Display

There is a separate, finished video — the Menu Motion TV Display — that lives at
`tv-menu/motion/hyperframes/` in this repository. That project is **out of
scope and must not be modified, rebuilt, extended, or joined to this one.**
No transition is authored to or from it. The two videos are independent
deliverables that happen to share a brand.

## Assets

Single source: `StillMenuMotion.zip` (delivered by the client, extracted to a
scratch folder and copied into this project's `assets/` unchanged). Nothing was
generated, redrawn, substituted, or sourced from anywhere else.

- 13 product cut-outs, transparent PNG, hero-usable
- 2 product photographs that are not cut-outs (rectangular, opaque background)
- 1 branded background plate (`bg-tv.png`)
- 6 logo files — all with a baked-in opaque background, none transparent

## Customizations

- Seamless loop: the piece must end on the frame it started on so an in-store
  player can repeat it all day with no visible seam.
- Silent by design. No voiceover, no music track; in-store TVs run muted.
- Brand values are read from `brand/brand.json` at the repository root, which is
  the transcription of the same 20-page guidelines PDF included in the ZIP
  (`uploads/brand-1786927364547-81xx.pdf`). Hex codes are not pasted into the
  composition by hand — see the repo `CLAUDE.md` brand rule.

## Notes

- First pass is one proof only: 3–5 representative products, one scene cycle.
  No full-catalog build until the proof is approved.
- Product assets are never regenerated, recompressed, renamed, or materially
  altered. They are placed, scaled, and animated — nothing more.
