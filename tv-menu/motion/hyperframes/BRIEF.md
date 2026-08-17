---
workflow: general-video
flow: companion
storyboard: yes
message: "La Sabrosita makes 47 kinds of happy — helados, antojitos, postres, bebidas"
aspect: 1920x1080
language: es
length: 141.6s
audience: walk-in customers reading the in-store TV menu, Swedesboro NJ
---

## Intent

An animated product showcase for the shop's in-store TV. It runs on a loop
beside the static menu board, so its job is appetite, not information: show the
real food, name it, keep moving. Fast, playful, high-energy — the pace of the
counter on a Saturday, not a corporate brand film.

Spanish product names, because that is what the menu board and the catalog use.

## Assets

- `assets/products/` — symlink to `tv-menu/assets/products/`. 47 approved
  transparent 2000×2000 PNG MASTERs. **Read-only. Never regenerated or edited.**
- `assets/products/products.json` — the catalog: key, name, filename per MASTER.
- `assets/brand/brand.json` — the brand source of truth; all values import from it.
- `assets/brand/logos/LS_Logo_Primary_v01.png` — the primary lockup, 1915×1788.
- `../../concept/menu_data.py` — the approved 4-category Spanish menu taxonomy,
  reused so the video's grouping cannot disagree with the printed board.

## Customizations

- Every one of the 46 selected images appears exactly once — nothing dropped,
  nothing repeated.
- Grouped by the four approved menu categories, in board order.
- ONE product per scene, except the five groupings the client named.
- Product name visible on every product, plus its category and one line of
  Spanish description.

## Accepted 2026-08-17 — the reference reel

Luis supplied a 15-item reel he had approved ("Motion graphics for food items",
a React/DesignCombo piece) and asked for that treatment across all 39 product
scenes. Three decisions came out of that conversation and they override what is
above them in this file:

1. **The look is the reference reel's**: product on the right, a translucent
   name card on the left carrying a pink category pill / the name / a
   description line, a persistent logo, a scrolling ticker, and a product ring
   framing the open and the close.
2. **3.4 seconds per product, not the 60-second ceiling.** The ceiling was in
   the original brief; Luis dropped it. The reel now runs 2m21.6s and loops.
3. **Claude drafts the missing Spanish copy, Luis reviews it.** 15 lines came
   verbatim from the approved reel; the rest are drafts in
   `data/descriptions.json`, flagged by source, with a `check` note wherever
   the wording guesses at the shop's actual recipe.

## Notes

- Hard ceiling: the MASTERs are approved artefacts. Scale and position only.
- Brand values are never pasted. `scripts/build-brand-css.py` reads
  `brand.json` and generates `assets/brand-tokens.css` at build time.
- Values `brand.json` marks `notSpecifiedInSource` (gradient angle, radii, type
  sizes, motion timing, TV safe margins) are recorded as project working values
  in `design.md`, not promoted to brand rules.
- `brand/guidelines/` on disk contains no PDF — `brand.json` cites
  `LS_Brand-Guidelines_v01.pdf` as its source but the file is absent from the
  working tree and from git. The transcription is being trusted as-is.
- CC BY 4.0: this kit's storyboard/composition patterns come from RoboNuggets.
  Attribution is required somewhere visible on anything shipped to the client.
  Not yet placed — raise before delivery.

## Stop point (this round)

Motion built across all 41 frames, `check` green, contact sheets captured.
**No render until Luis approves the preview and the description copy.**
