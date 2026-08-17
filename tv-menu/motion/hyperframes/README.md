# La Sabrosita — animated TV showcase (HyperFrames)

A 1920×1080, **2m21.6s** looping product reel for the in-store TV. **46 images,
41 products, each shown exactly once**, grouped by the four approved menu
categories, one product per scene, each named and described.

Every product holds the screen for **3.4 seconds**: it slides in from the right
while a name card rises on the left carrying the category, the product name and
one line of Spanish description. The background, the logo and the ticker run
continuously underneath and never restart at a cut.

Built with [HyperFrames](https://hyperframes.heygen.com) — video rendered from
HTML. The composition is a webpage; `hyperframes render` turns it into an MP4.

## Where the pictures come from

The reel reads the client's **manual selection** in `~/Downloads/LaSabrosita`.
That folder is the source of truth for product imagery (client, 2026-08-16).

It replaced Rubric's 47-entry MASTER catalog, which the reel used to read.
`tv-menu/assets/products/products.json` is **untouched** and still governs
production state — it is simply not what this video reads any more.

## The rule that matters most

**Nothing in `assets/` is ever modified.** Everything under it is a *symlink* to
the real folder — images and brand files are read in place, never copied,
regenerated, recompressed, renamed, or moved.

```
assets/manual   -> ~/Downloads/LaSabrosita       (46 client-selected PNGs)
assets/products -> ../../../assets/products      (Rubric's catalog — no longer read)
assets/brand    -> ../../../../brand             (brand.json, logos, guidelines)
```

## Brand values are imported, never pasted

`brand/brand.json` is the one source of brand truth, and a composition cannot
read it at render time (renders must be deterministic — no fetch). So:

```bash
python3 scripts/build-brand-css.py
```

reads `brand.json` and generates `assets/brand-tokens.css` — CSS custom
properties for every palette colour, the type stack, and the gradient. The
generated file is disposable; re-run after any brand revision. No hex code is
authored anywhere in this project.

That script also self-hosts Noto Sans (the brand typeface) into `assets/fonts/`
so renders never depend on Google Fonts being reachable.

## Layout of this project

```
BRIEF.md                    why this video exists, and what was agreed
design.md                   the look spec — and every value the guidelines DON'T define
STORYBOARD.md               the 20 frames (generated — see scripts/)
index.html                  root composition, mounts every frame (generated)
data/source-inventory.json  what each selected image depicts (generated)
data/scene-plan.json        which product is in which scene, and when (generated)
data/master-bboxes.json     measured alpha bbox of each image (generated)
data/descriptions.json      the Spanish copy, one line per item (HAND-WRITTEN)
data/type-metrics.json      glyph advance widths, weights 400/700/900 (generated)
compositions/
  product-scene.css         frame layout — the product zone and the name card
  reel-chrome.css           root layout — field, ring, ticker, logo
  frames/*.html             one sub-composition per frame (generated)
scripts/
  build-inventory.py        assets/manual -> source-inventory.json  (the reviewed table)
  measure-masters.py        images -> master-bboxes.json  (read-only measurement)
  build-scene-plan.py       inventory -> scene-plan.json
  build-frames.py           plan + bboxes + CSS -> compositions/frames/*.html
  build-index.py            plan -> index.html
  build-storyboard.py       plan + inventory -> STORYBOARD.md
  build-brand-css.py        brand.json -> brand-tokens.css + fonts
  build-type-metrics.py     assets/fonts/*.woff2 -> type-metrics.json
  reel_spec.py              NOT a generator — the timing and geometry both
                            builders read. Change a number here, not in them.
assets/                     symlinks + generated tokens (see above)
renders/                    MP4 output (gitignored)
```

`scripts/` is the reason the plan is trustworthy: scene order, category
grouping, product placement and cut-out scale are all computed, not typed.
`index.html` is generated too — it was hand-maintained once and silently went
stale, still naming 19 frames with old ids after the plan had moved on.

The generators assert their own invariants and refuse to write output that
breaks one:

- every image placed **exactly once**, or excluded with a written reason;
- **no product name in more than one scene**, ever;
- names on screen == products in the inventory (nothing quietly dropped);
- every display name is a real line on the client's menu board;
- a cluster holds only one product;
- no two consecutive scenes share a motion treatment;
- no gaps or overlaps between beats in the plan;
- the length build-index.py computes matches the length the plan recorded;
- every card's rendered height clears the ticker, reported per frame.

Re-run in this order after any change:

```bash
python3 scripts/build-brand-css.py     # only when brand.json changes
python3 scripts/build-inventory.py     # when the image selection changes
python3 scripts/measure-masters.py     # ditto
python3 scripts/build-scene-plan.py
python3 scripts/build-frames.py
python3 scripts/build-index.py
python3 scripts/build-storyboard.py
```

## Working on it

```bash
npm run dev      # Studio preview at localhost:3002 — long-running, run in background
npm run check    # lint + runtime + layout + contrast. Must pass before any render.
npm run render   # MP4 into renders/
```

Storyboard board: `http://localhost:<port>/?view=storyboard#project/hyperframes`

## Status

**Motion pass, complete. Nothing has been rendered yet.**

All 41 frames are built and animated to the reference reel Luis approved
(the 15-item React piece in "Motion graphics for food items"), extended to all
39 product scenes. `npx hyperframes check` passes with 0 errors and 0 warnings
across lint, runtime, layout, motion and contrast — 64/64 text checks pass
WCAG AA.

Open with the client:

- **The Spanish descriptions.** 15 came verbatim from the approved reel; ~24
  are drafts written here and not client-checked. Six carry an explicit
  `check` note in `data/descriptions.json` where the wording is a guess about
  what the shop actually serves.
- **Elote + Esquite** share one card as "Elote y Esquite", because the board
  names them as a pair. Splitting them into two beats costs 3.4s each.

- **Pastel Tres Leche** is on the menu board but has no image in the selection,
  so it is not in the reel.
- **Helado Chino** is back, with 2 images. It was removed earlier as
  not-customer-facing; the new selection includes it.
- Three images are photographs on white rather than cut-outs and sit on cream
  cards — see STORYBOARD.md.

Review images: `renders/look/`, `renders/look2/`, `renders/look3/` (contact
sheets from the motion pass) and `renders/storyboard/` (the earlier per-frame
board). Regenerate the board with:

```bash
npx hyperframes snapshot . -o renders/storyboard --at "$(cat data/poster-times.txt)" --no-end
```

## Attribution

The storyboard and composition patterns come from the RoboNuggets HyperFrames
kit, CC BY 4.0 — visible credit is required on anything shipped to the client.
Not yet placed; decide where it goes before delivery.
