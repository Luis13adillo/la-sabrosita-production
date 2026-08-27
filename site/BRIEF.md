# La Sabrosita website — the brief every builder and every critic reads first

A bilingual website for an ice cream and snack shop in Swedesboro, New Jersey.
It shows the **whole menu** with big cut-out food photography.

The bar is **https://michoacana.com** for the site overall and
**https://heladosmexico.com** for how a single product is photographed and framed.
Ours has to be **clearly better**, not merely as good. Neither of those sites shows
a full menu well, so beating them on the menu grid is the **floor**, not the goal.

---

## Hard rules — these are not preferences

1. **Never paste a hex code or a font name.** Brand values come from
   `brand/brand.json` through `site/styles/tokens.css`, which is generated. Use
   `var(--c-brand)`, `var(--font)`. If you need a colour that is not a token,
   you are about to invent a brand rule — don't.
2. **Never touch anything under `assets/`.** Not rename, not move, not
   recompress. Rubric's catalog stores those exact paths and a human approved
   those exact bytes. Read them; write derivatives elsewhere.
3. **Never write product copy.** The client-approved bilingual lines are in
   `site/data/menu.json` (`copy.en`, `copy.es`). `null` means the client has not
   approved a line — that card renders **name only**. Do not fill it in, do not
   re-word what is there, do not translate a product name.
4. **No prices. Anywhere.** There are none.
5. **No invented facts.** No street address, no hours, no phone, no social
   handles, no claims about ingredients. `Swedesboro, New Jersey` is the only
   location fact, and it comes from `brand.json`.
6. **Anything `brand.json` marks `null` that you choose goes in `INVENTED.md`** —
   by editing `site/data/invented.json` and re-running `npm run tokens`, never by
   editing `INVENTED.md` directly. Your choices are not brand rules.
7. **Page 17 of the guidelines prints an approved menu card. Follow it.**
   Measurements below.

## What page 17 actually says, measured

Rendered at 300 dpi and sampled. This is evidence, not taste:

| Thing | Measured |
| --- | --- |
| Card | cream `#FFF7EE` panel, 1406 × 704 px on a 1280 px-wide slide |
| Corner radius | 32 px arc = **2.3% of the card's width** |
| Item name | **deep purple** (`#4E115E`), bold, ~26 px |
| Description | regular weight, warm grey, ~19 px, **line-height 1.35** |
| Divider | 1 px warm grey rule between description and note |
| Supporting note | **electric blue** (`#1896D7`), bold, ~13 px |
| Text size ratio | **1 : 0.72 : 0.50** (name : description : note) |
| Padding | left inset of all three text levels = **6.0% of card width** |
| Motif squares (page 19) | corner radius = **23% of the side** |

`brand.json` also states, verbatim from the PDF: hot pink is the dominant colour;
deep purple creates contrast and structure; blue and yellow bring energy; cream
provides the reading areas. "Use rounded panels, subtle drips, soft waves, stars,
and clean cut-out food imagery. Keep menu text on cream reading areas."

## What we have that they do not

- **45 products, 62 photographs**, all real cut-outs with true transparency.
- 38 products carry a **client-approved line in both languages**.
- 13 products have **more than one photograph** (Crazy Shake has four).
- Every derivative is trimmed to the product's alpha box and then **re-padded to
  a square with a constant 6% margin** — so the export is *not* tight to the food.
  `data/images.json` publishes the exact geometry rather than making you measure
  PNGs: `geometry.canvasFill` (0.8929, the most of the square any product spans)
  and per-photo `fillW` / `fillH` (the fraction of the square this particular
  product actually occupies on each axis — 0.170 to 0.893 across the catalogue).
  It is also normalised by ink coverage: `visualScale`, applied as `--scale`, so
  a paleta and a tray of nachos carry the same visual weight.

## Where things live

```
site/
  data/menu.json       45 products; name, category, copy.en/copy.es, images[]
  data/images.json     per photo: productAspect, tall, wide, visualScale, lqip
  data/ui.json         every interface string, both languages
  data/invented.json   -> INVENTED.md.  Edit this, never INVENTED.md.
  src/shell.html       page skeleton, <!--@name--> slots
  src/partials/*.html  one file per slot
  src/app/*.js         ES modules, no framework, no bundler
  styles/*.css         one file per piece; cascade order is in build-site.mjs
  public/              GENERATED. Never edit. Never commit-check by reading it.
  .bench/              the two benchmark sites, captured at fixed viewports
  .shots/              your screenshots
```

## Commands

```bash
cd site
node scripts/verify.mjs --out .shots/<yourname>          # build + screenshot both viewports
node scripts/verify.mjs --out .shots/<yourname> --lang en
node scripts/verify.mjs --out .shots/<yourname> --scroll 1600   # a specific scroll position
node scripts/blind.mjs --a <ours.png> --b <theirs.png> --out .shots/<yourname>/blind
```

`verify.mjs` builds, serves on a free port, screenshots, and shuts down. It takes
a lock around the build so parallel workers cannot collide. Never start a
long-running server yourself.

## Benchmark screenshots, already captured

```
.bench/mich-home-desktop.png     .bench/mich-home-mobile.png
.bench/mich-grid-desktop.png     .bench/mich-grid-mobile.png
.bench/mich-product-desktop.png
.bench/hm-home-desktop.png       .bench/hm-home-mobile.png
.bench/hm-grid-desktop.png       .bench/hm-grid-mobile.png
.bench/hm-product-desktop.png    .bench/hm-product-mobile.png
```

## File ownership

Two people never edit the same file. If your piece needs a change in someone
else's file, say so in your report instead of making it.

| Piece | Owns |
| --- | --- |
| type | `styles/type.css` |
| nav | `src/partials/nav.html`, `styles/nav.css` |
| hero | `src/partials/hero.html`, `styles/hero.css`, the `HERO` block in `src/app/main.js` |
| grid | `src/app/grid.js`, `styles/grid.css`, `src/partials/menu.html` |
| card | `src/app/card.js`, `styles/card.css` |
| detail | `src/app/detail.js`, `styles/detail.css`, `src/partials/detail.html` |
| motion | `src/app/motion.js`, `styles/motion.css` |
| mobile | `styles/mobile.css` |

Shared and owned by the lead only: `styles/tokens.css`, `styles/base.css`,
`scripts/*`, `data/*`, `src/shell.html`.

---

## Contrast — measured, and it constrains real decisions

Every pair below is the brand's own palette. These are facts about the colours,
not opinions, and two of them bite:

| Text on field | Ratio | What it is allowed to be |
| --- | --- | --- |
| white on hot pink | **4.06** | large text only (≥24px, or ≥18.7px bold). **Never body copy.** |
| cream on hot pink | 3.85 | large text only |
| hot pink on cream | 3.85 | large text only — this is exactly the CATEGORY TITLE on page 17 |
| white on electric blue | 3.28 | large text only |
| electric blue on cream | **3.11** | below AA at any size for body. Page 17's small blue note line does not pass — do not reuse that treatment for anything a customer needs to read. |
| white on sunny yellow | **1.66** | never |
| deep purple on cream | 12.90 | anything |
| deep purple on hot pink | 3.35 | large text only |
| white on deep purple | 13.60 | anything |
| deep purple / near-black on sunny yellow | 8.17 / 11.67 | anything |

Consequences you must design around:

- A hot-pink field can carry a headline. It cannot carry a paragraph in white.
  Put paragraphs on cream, which is what the guidelines say cream is for.
- Yellow is a highlight, never a text field.
- If you need small text on a coloured field, the field is deep purple.

## Known open defect

`scripts/smoke.mjs` currently reports one failure, and it belongs to whoever owns
the nav: **`.nav__lang` is 39px tall on mobile; every tap target must be ≥ 44px.**
Run `node scripts/smoke.mjs` before you report done — 34 checks, and it catches
things a screenshot cannot (broken images, missing alt text, unapproved copy
appearing on a card, a stray price, horizontal overflow).

---

## Fixed mid-flight, 2026-08-24 — the ink normalisation was silently off

`data/images.json` was being written one step before `visualScale` was computed,
so every card was getting `--scale: undefined`, the transform was invalid, and
all 62 photographs were rendering at bounding-box size. That is why thin products
(Choco Banana, Elote, Mango en Flor, the paletas) looked like slivers next to wide
ones (Chicharron Preparado, Nachos) in any screenshot taken before this note.

It is fixed. `data/images.json` now carries `visualScale` for all 62 photographs
(0.82 to 1.45), `build-site.mjs` throws if it is ever missing again, and the card
already applies it as `--scale`. **Re-run `node scripts/verify.mjs` and look
again — the grid you screenshotted earlier is not the grid you have now.**

Two consequences for whoever owns the card and the grid:

- A `--scale` above 1 makes the cut-out overflow its own box on purpose. The
  photo frame needs `overflow: visible` and the card needs headroom, or tall
  products get clipped at the top.
- `data/images.json` also marks each photo `tall` or `wide` and gives its
  `productAspect`. A tall paleta and a wide tray genuinely want different
  amounts of vertical room; the metadata is there to be used.

## Lead's own read of the grid after the ink fix

Screenshot: `.shots/lead-inkcheck/desktop.png`. Three things are plainly wrong
and they belong to different owners, so they are listed rather than fixed:

1. **Cream panels on a cream page.** `--c-reading` is both the card panel and the
   page ground, so the card has almost no edge. The guidelines say cream is the
   reading area — they do not say the page behind it must also be cream. This is
   the most obvious flaw in the grid right now. (card / grid)
2. **Ragged bottoms.** Card panels are content-height, so a two-line name next to
   a one-line name leaves the row uneven and the grid loses its rhythm. (card)
3. **The multi-photo badge floats.** With `--scale` above 1 the photo now
   overflows the card box, and the "2" badge sits in open space rather than on
   anything. It needs to attach to the panel, not to the hit area. (card)

## The disclosure rule is now checked, not promised

```bash
node scripts/check-invented.mjs          # add --stub to get a paste-ready block
```

It reads every custom property defined anywhere in `styles/` and compares it
against the tokens declared in `data/invented.json`, and it separately looks for
literal hex codes, `rgb(120 40 ...)` colours and literal font families typed into
a stylesheet. Three findings:

- **UNDISCLOSED** — you invented a value and `INVENTED.md` does not mention it.
  Fix by adding it to `data/invented.json` and running `npm run tokens`.
- **STALE** — `INVENTED.md` documents a token that no longer exists.
- **HARDCODED** — a colour or font typed in directly instead of coming through a
  token. White and white-with-alpha are allowed (brand.json lists white as an
  approved field); everything else is a finding.

If you define a `--token` in your own stylesheet, disclose it. `--stub` prints
the token with its actual value read out of the CSS, so all you write is the note.

## Two things the lead changed under you

**The logo was 3 MB.** `/brand/logo.png` is drawn at 44px in the header and the
master is a 1915px PNG, so the logo alone was nearly half the page weight. The
build now emits proportional derivatives — the master is untouched, and resizing
is not one of brand.json's six misuses. In any partial you own, use:

```html
<img src="/brand/logo.png" srcset="{{logoSrcset}}"
     sizes="44px" alt="" width="1915" height="1788" decoding="async">
```

`{{logoSrcset}}` is substituted at build time (96 / 240 / 480 / 720 webp).
`/brand/logo.png` is now a 512px PNG for the favicon and the social card.
Page weight went from 7.1 MB to 4.2 MB; mobile first screen from 4.9 MB to 1.9 MB.

**The footer exists now.** `styles/foot.css` and `src/partials/footer.html` are
the lead's. Deep purple field, the logo whole and uncropped at its brand minimum
of 250px with clear space, and a cream drip edge at the seam — the "subtle drips"
motif brand.json's visual direction asks for. Do not restyle it from another
file; say so instead.

## Measuring weight

```bash
node scripts/perf.mjs
```

Reports first-screen bytes, whole-page bytes and LCP at both viewports. 45
products is a lot of picture, and the whole point of the site is that someone
outside the shop on a phone can see all of it — so the mobile first-screen number
is the one that matters.

## The accessibility audit is now real, and every open finding is in the header

```bash
node scripts/a11y.mjs
```

It does not walk the DOM to guess what is behind a piece of text — that gets the
hero wrong, because the hero's field is a sibling element. It hides the *glyphs*
only, photographs the rectangle, averages the pixels, and compares that against
the colour the text is painted in. So it is measuring what a customer sees,
including gradients, semi-transparent pills, and text over a photo.

It also checks heading order, landmarks and accessible names.

**Everything it still reports belongs to the nav**, and the nav owner has to fix
all of it:

| Element | Measured | Needs |
| --- | --- | --- |
| `.nav__word` 17px bold, white on hot pink | 4.06 | 4.5 |
| `.nav__cat` 15px bold, white on hot pink | 4.06 | 4.5 |
| `.nav__lang` 14px bold, white on hot pink | 3.93 | 4.5 |

There are exactly three legal ways out, and darkening the pink is not one of them:

1. Take the text to **18.66px bold or larger**, where the AA floor drops to 3:1
   and 4.06 passes.
2. Put the text on **deep purple** instead of pink — 13.6:1, and it is an approved
   field.
3. Put the text on a **cream or white pill** on the pink, which is what the
   guidelines mean by a reading area.

The lead already fixed the one finding outside the header: `--c-muted` was page
17's supporting grey at 4.20:1, and is now the lightest value on the same hue
that passes (5.15:1). That is disclosed in INVENTED.md.

## The benchmark grid captures were wrong and have been replaced

`.bench/mich-grid-*.png` and `.bench/hm-grid-*.png` were captured at the top of
each collection page, which on both sites is a hero — so anyone comparing "their
grid" was actually comparing our grid against their hero. They are now captured
scrolled to the real product grid.

What they actually look like, which is worth knowing before judging ours:

- **heladosmexico**: three across, one packaged paleta per tile on a flat yellow
  card, name underneath in caps. About six products fit on a 1440x900 screen.
  No description, no category, no way to see the range.
- **michoacana**: three across, one packaged bar per cream card on a pink page,
  name underneath in condensed caps. About six products per screen. Same.

Both are catalogues of packaged goods. Ours is 45 prepared items, photographed
as cut-outs, with a client-approved line in two languages, grouped by category,
searchable. The density comparison is not close and it is not the interesting
question. **The interesting question is whether a single product in our grid looks
as appetising as a single product in theirs** — and right now the cut-out
occupies a much smaller share of its card than their packshot does of its tile.

## Motion has a shipping-blocking defect, and it is measured

`scripts/filmstrip.mjs` photographs a page six times while scrolling, 120ms after
each jump — what a customer sees while flicking. Ours, at
`.shots/lead-strip/strip.png`, is half empty in four of six frames. Theirs
(`.bench/strip-hm-desktop-live.png`, `.bench/strip-mich-desktop-live.png`) are
fully painted in every frame, because neither of them staggers a reveal.

Measured on the current build:

| Scroll position | Cards painted after 120ms | after 400ms | after 800ms |
| --- | --- | --- | --- |
| 20% down | **0 of 9** | 9 of 9 | 9 of 9 |
| 40% down | **0 of 12** | 8 of 12 | 12 of 12 |
| 60% down | **0 of 12** | 7 of 12 | **7 of 12** |
| 80% down | **0 of 12** | 5 of 12 | **9 of 12** |

Two separate faults. The stagger (`calc(var(--i) * 22ms)` with `--i` counting
across the whole filtered list) means a card 30 places in waits 660ms before it
even starts. And some cards **never** paint — at 60% down, five of twelve are
still invisible after 800ms, because the IntersectionObserver's `rootMargin` and
threshold never fire for elements that were already on screen when the jump
landed.

`node scripts/smoke.mjs` now fails unless at least 90% of on-screen cards have
painted 450ms after a scroll jump. That check is not optional and it belongs to
whoever owns motion.

A reveal animation that makes the menu slower to read is worse than no reveal.
The brand's word is "playful", not "slow".

## Mobile, as it actually stands — evidence, not opinion

`.shots/lead-strip/strip-mobile.png` is a six-frame filmstrip of the current
build at 390x844. Four things are visibly wrong and they belong to two owners:

1. **The header collides with itself.** The wordmark and the search field
   overlap — it renders as "La SabrositaBuscar…". (nav)
2. **The filter chips are clipped.** "Antojitos" renders as "An…", and the
   "45 de 45" count sits on top of the chips rather than beside them. There is no
   visible way to reach Postres or Bebidas. (nav / mobile)
3. **The reveal leaves the screen empty.** The 80%-down frame is a blank cream
   field with one category heading on it. Same defect as desktop, worse, because
   a phone screen holds fewer cards so a stalled reveal empties all of it. (motion)
4. **Two-across works** and the cut-outs read at that size — that part is right,
   and should not be traded away to fix the other three.

## Corrections the lead owes you

**"Trimmed to the product" was wrong** and the card owner was right to measure it
instead of believing it. The export is trimmed *then re-padded to a square with a
6% margin*, so the product spans at most 89.29% of the side. That constant was
being carried by hand in `card.js` as `CANVAS_FILL = 0.895`. It is now published:

```js
import { geometry } from './data.js';   // { square, margin, canvasFill }
// and per photo, in item.images[n]:      fillW, fillH
```

`fillW` / `fillH` are the fraction of the square that *this* product occupies on
each axis, so a card can seat the food on a specific edge without measuring
anything. They range 0.170 to 0.893 — the thinnest paleta really is a sliver of
its own square, which is exactly why `--scale` exists.

Delete any hard-coded 0.895 and read `geometry.canvasFill`.

## The decisive number, now that there is one

Every critique of the grid has circled the same thing — the food looks small —
without a number attached. There is one now, measured identically on all three
sites: take one product tile, find its flat background colour, count the pixels
that differ from it. That fraction is **the product's share of its own tile**.

```bash
node scripts/fill-check.mjs      # measures all 45 cards, both viewports
```

| | Product's share of its tile |
| --- | --- |
| michoacana.com | **44.4%** (43.8 / 50.0 / 44.4) |
| heladosmexico.com | **36.8%** (36.9 / 36.8 / 31.0) |
| **ours, today** | **16.6%** desktop, 16.9% mobile |

We are **20 points behind the weaker benchmark and 28 behind the stronger one.**
Our worst cards are the tall thin ones — Choco Banana 11%, Elote 12% — and even
our best is 21%. The feature tile measures 14%.

This is not a taste question and it is not going to be argued away. A cut-out
that fills a sixth of its card is a sticker in a box, however well the box is
drawn. The card and the grid both have levers on it:

- The frame is currently sized so that the *most extreme* `--scale` in the
  catalogue (1.45, the thinnest paleta) fits without cropping. That decision
  makes all 45 products smaller to protect one. Sizing to a high percentile and
  letting the outlier bleed past the field — which is what a cut-out is *for* —
  is worth trying.
- 17cqw of vertical clearance and 14cqw horizontal is a lot of air.
- Neither benchmark keeps its product inside a square. heladosmexico's paleta
  runs off the bottom of its tile.

**Target: beat 36.8% first, then 44.4%.** Re-run `fill-check.mjs` and put the
median in your report.

## Cross-engine check — the scroll-timeline cliff is real and it is covered

`motion.css` drives its reveals with `animation-timeline: view()`. That is the
right technique: a scroll-driven reveal has no "mid-flight" state to be caught
in, which is exactly the defect it replaced. But it has a cliff — Firefox does
not support it, and if the rules were not gated, Firefox users would get a page
of invisible cards.

```bash
node scripts/browsers.mjs
```

Runs the real page in Chromium, Firefox and WebKit. Current result:

```
pass  chromium  scroll-timeline yes · 45 cards · 12/12 painted mid-page · overflow 0px
pass  firefox   scroll-timeline no  · 45 cards · 12/12 painted mid-page · overflow 0px
pass  webkit    scroll-timeline yes · 45 cards · 12/12 painted mid-page · overflow 0px
```

Firefox gets the finished layout with no reveal, which is the correct direction
to fail in. Do not remove the `@supports (animation-timeline: view())` gate, and
never give `.card` a base `opacity: 0` outside it.

## One command before you report done

```bash
npm run check     # smoke + a11y + disclosure + three engines
npm run fill      # the product's share of its tile, vs both benchmarks
```

## Who owns the fill number — read this before round 2

Both the grid critique and the card critique have now converged on the same
arithmetic, and it lives in **one owner's files**:

```
styles/card.css   .card__frame  height: calc((100% - 17cqw) / var(--fit))
src/app/card.js   FIT = geometry.canvasFill * max(visualScale)   // 0.8929 * 1.45
```

**That is the card owner's job and a round is already in flight on it.**

- **Card owner**: this is your whole round. The 62 `visualScale` values run
  min 0.82, median 1.00, p85 1.202, p95 1.345, max 1.45 — *nine photographs are
  sizing all sixty-two*. Size `FIT` to a high percentile and let the outliers
  bleed past the field, which is what a cut-out is for.
- **Grid owner**: do **not** edit `card.css` or `card.js`. Your levers on the same
  number are different ones — tile aspect, how much of the card the cream panel
  takes, how many across, and which products get promoted to a feature tile.
  A shorter panel on a shorter tile raises the food's share without touching the
  card's internals at all.

If your round's critique tells you to change a file you do not own, say so in
`blocked` and take the lever you do have. Two people editing the same declaration
from two workflows will silently overwrite each other.

## The hero has a number now too

heladosmexico.com is the stated bar for *how a single product is photographed and
framed*, and its whole move is scale. Measured the same way on all three — the
vertical extent of the subject on the first screen, with the field sampled per
row so a gradient does not defeat it:

```bash
node scripts/hero-scale.mjs <image.png> <x,w>   # column whose left edge is empty field
```

| | Subject height, as a share of the first screen |
| --- | --- |
| **heladosmexico.com** | **64.3%** — and it keeps going below the fold |
| **ours, today** | **46.3%** |
| michoacana.com | 32.2% (a row of paletas along the bottom edge) |

We already beat michoacana. We are **18 points behind the site the brief names as
the bar**, and closing that is the hero's job.

Two observations that are not instructions, because the hero owner should decide:

- Theirs is *one* subject, overlapped into a single mass, dead centre, with a
  soft radial glow behind it and a contact shadow under it. Ours is three
  separate products floating with gradient between them, which reads as a
  scatter rather than a subject.
- Theirs bleeds off the bottom of the viewport on purpose. A cut-out that ends
  neatly inside the frame is a photograph; one that runs off the edge is a thing
  in the room. The card owner is being told the same thing about the grid.

The hero must also still do a job the benchmarks do not: make it obvious in one
second that this is a menu you can browse, not a brochure. Do not trade the
"see all 45" promise away for a bigger picture.

## The counterweight to the fill number

`fill-check.mjs` now reports a second number next to the fill, because **filling
more of the tile and cropping the food are the same lever pulled too far**:

```
  median             36.7%
  heladosmexico      36.8%   we are 0.1 points behind
  cropped            2 of 45 products lose part of themselves
                     Paletas 3%, Chicharron Preparado 3%
```

Read them together. A median that reaches 45% with a third of the catalogue
losing its cherry, its cone tip or its straw is worse than 37% with nothing lost.
Two products losing 3% of themselves is a healthy trade; twelve losing 15% is not.

For the card owner: the fill went 16.6% → 36.7% desktop and 38.5% mobile between
rounds, which already beats heladosmexico on mobile. **Do not chase michoacana's
44.4% by cropping.** Their 44.4% is a flat packshot that fits its tile naturally;
ours is prepared food with a cherry on top and the cherry is the point.

If you want the last points, they are in the cream panel's share of the tile and
in the gap between tiles — and the panel is partly the grid owner's lever, not
yours. Say so in `blocked` rather than taking it.

## Nav is running in its own workflow — do not also build it

The nav owns every remaining gate failure and was queued third behind grid and
detail, so it was pulled out and started in parallel. If a later wave reaches
`nav` and finds these already fixed, that is why. Its whole backlog, from
`npm run check`:

```
FAIL  [mobile] every tap target is at least 40px — nav__lang 39px
FAIL  4.06 (needs 4.5)  .nav__word  17px bold  on hot pink
FAIL  4.06 (needs 4.5)  .nav__cat   15px bold  on hot pink
FAIL  3.93 (needs 4.5)  .nav__lang  14px bold  on hot pink
```

Plus the two mobile faults from the filmstrip: the wordmark and search field
overlap into "La SabrositaBuscar…", and the category chips clip to "An…" with the
result count sitting on top of them.

## The product dialog was pinned to the corner, and it was the lead's fault

`base.css` had `* { margin: 0 }`. A modal `<dialog>` is centred by the UA's own
`margin: auto` against `inset: 0`, so the universal reset replaced that with
`margin: 0` and pinned the dialog to the top-left of the viewport — cutting 21px
off the top of every product photograph and leaving a correct stylesheet looking
broken. `base.css` now carries `dialog { margin: auto; }` with the reason next to
it, and `smoke.mjs` checks the dialog is centred and its photo uncut in both
languages.

**For the detail owner**: that was a bug, not your design. What is still genuinely
missing, measured on the fixed dialog:

- **No deep link.** `location.hash` is empty after opening a product. The brief
  asks for `#p/churros`, restorable on load, closable with the back button.
- **The alternate photographs are grey thumbnails.** Crazy Shake has four and
  they are the single thing neither benchmark can do — heladosmexico shows three
  tiny greyscale chips under a packshot. Ours should not look like theirs.
- **The copy panel is over half empty** on a one-line product. Either it earns
  that space or it should not have it.
- **Focus is not trapped and does not return** to the card that opened it.

## Build srcset from the data, not from a literal

There are now **four** derivative widths, not three: `400, 600, 800, 1400`. 600
was added because the real slots land between 400 and 800 — a 2-across phone card
is about 170 CSS px, which is 510 device px at 3x, and a 5-across desktop card is
about 230 CSS px, which is 460 at 2x. Without a 600 the browser fetched 800 for
both.

`card.js` and `detail.js` each hard-code `[400, 800, 1400]`. Replace that with the
helper, which reads the widths that actually exist:

```js
import { srcset } from './data.js';
// ...
srcset="${srcset(shot.stem)}"
```

Adding or removing a step is then one line in `build-images.mjs` and nothing else
has to change. Also check your `sizes` attribute against the layout you actually
shipped — `sizes` is what decides which candidate is fetched, and a stale `sizes`
makes the whole srcset pointless.

## verify.mjs does filmstrips now — stop writing your own server

Two flags I had added to `verify.mjs` never actually landed (a bad patch anchor),
which is why the motion owner had to hand-roll `.shots/_tools/strip.mjs`. Both
work now:

```bash
node scripts/verify.mjs --out .shots/x --motion    # screenshots with animations ON
node scripts/verify.mjs --out .shots/x --strip     # + a six-frame filmstrip, both viewports
```

`--strip` implies `--motion` and writes `strip-desktop.png` / `strip-mobile.png`
next to the stills, using the same managed server verify already spawns and kills.
Nobody needs to start a server.

## Two audit bugs the builders exposed, both now fixed

- **`a11y.mjs` was sampling before the scroll settled.** 40ms after
  `scrollIntoView` the page is still moving under scroll-driven animation, so the
  rectangle sampled whatever was passing through it — producing a run of false
  "white on hot pink" findings for text that sits on cream. Settle is now 280ms
  and every one of those findings disappeared.
- **`check-invented.mjs` called a mask a colour.** `#000` inside `mask-image:
  linear-gradient(...)` is an alpha value meaning "fully opaque", not black. Mask
  declarations are now stripped before the literal-colour scan.

If a gate tells you something you are confident is wrong, say so — twice now the
tool was the thing that was wrong.

## The "empty holes" in the motion filmstrip are a grid tail, not a paint stall

A blind judge deducted against our motion filmstrip for "three empty cream holes"
in a row, and that single deduction was the whole difference between a decisive
and a narrow win. It is not motion's bug. It is arithmetic:

```bash
node scripts/tails.mjs
```

```
one 2x2 feature tile per category
  category      n     2col  3col  4col  5col  6col
  Helados       9        —     —     —     3     —
  Antojitos    12        1     —     1     —     3
  Postres      16        1     2     1     1     5
  Bebidas       8        1     1     1     4     1
```

At five columns with a feature tile, Helados leaves **three empty slots** — and a
2x2 feature makes tails worse, not better, because it is one product occupying
four slots. On mobile at two across, Postres ends with Waffle alone beside a full
empty column.

**Grid owner, this is yours.** No single column count tiles all four categories,
so it has to be absorbed by the layout. Three routes, all legitimate:

- **Per-section column counts.** `node scripts/tails.mjs` prints the combinations
  that leave no hole anywhere — with no feature tile, Helados at 3 and the other
  three at 4 is clean.
- **Let the last item of a section span** the remaining columns. A wide final
  card reads as a deliberate close, not as a gap.
- **End each section with something that is not a product** — the count, the
  category's own mark, a link to the next chapter.

**Motion owner: do not chase this.** If your round-2 critique tells you to fix
the holes, report it under `blocked` and spend the round on what the same judge
called your weakest point — "the mid-wipe rule is a liar" — instead.

## Mobile now, and the one thing left that is plainly wrong

`.shots/lead-mob/strip-mobile.png`. The header no longer collides, every frame is
fully painted, two-across holds real cut-out size, and the chapters read. The
remaining fault is a duplication, and it belongs to nav and mobile together:

**The four categories appear twice on a 390px screen**, once as links in the
header's second row and once as filter chips below it — two horizontal scrollers
doing the same job, both clipped at the right edge, together eating about 100px
of a 844px screen before any food appears.

One of them has to go, or they have to merge into one control. Whichever owner
takes it, say so in `blocked` so the other does not take it too. The nav's second
row and the filter chips are in different files (`nav.css` / `grid.css`), which is
exactly how this got duplicated in the first place.

## The language switch now keeps your place — do not break it

Switching from Spanish to English used to reload the page and drop the category
you had chosen and the word you had typed. On a bilingual menu that is the worst
possible moment to lose state, because the most likely reason somebody switches
is that they just failed to read something.

`src/app/url-state.js` (lead's) puts the category and the search term in the query
string — `/?c=bebidas&q=fresa` — and rewrites the language link's `href` to carry
them across. A category is now linkable too, so "here are their drinks" is a
shareable URL.

Two things that will break it, both in files other people own:

- **The language link must keep a `.nav__lang` class or a `data-lang-link`
  attribute.** Rename it and the state stops carrying. Prefer adding
  `data-lang-link` so the class is free to change.
- **Every route into a filter must go through the grid's `grid:render` event**,
  which is where the state is recorded. A filter control that mutates the list
  without dispatching it will not be remembered.

`smoke.mjs` checks both the URL and the round trip.

## The logo rules are checked against the rendered page now

```bash
node scripts/brand-check.mjs        # part of npm run check
```

It does not read CSS — it looks at what the browser painted, because that is
where a logo actually gets stretched, tinted, clipped or shrunk. Every rule comes
straight out of `brand.json`: the six named misuses (stretch, recolour, rotate,
effects, crop, clutter), `minimumSize.digitalMinWidthPx` (250), and
`approvedBackgrounds`.

**One violation is open, and it is the nav's — but it is now a near miss, not a
miss.** The cream pill was the right answer. It is 5px too short:

```
FAIL  nav__logo 80x75px: below 250px, so it must sit on a clean cream or white area
      — bottom-left and bottom-right of the mark hang off its clean field onto
        rgb(243,20,140) — the field does not cover the whole mark
```

Measured: `.nav__brand` (the cream pill) spans y 8–86 and is 78px tall; the mark
spans y 16–91 and is 75px tall. The bottom 5px of the badge sits on hot pink. The
same thing happens at 390px with the 64px mark. Growing the pill, or seating the
mark higher inside it, fixes both — and `brand.json logo.clearSpace` wants room on
**every** side, not three.

This is not a style note. `brand.json logo.minimumSize` says "avoid reducing the
full logo below 250 px wide", and gives its own escape hatch for when you must:
*"use the official complete logo on a clean cream or white area rather than
removing its elements."* A 80px mark on hot pink takes the exception without
meeting its condition — and the mark's own pink script dissolves into the field,
which is separately what `approvedBackgrounds` means by "enough contrast for the
complete mark".

The blind judge reached the same place independently, calling michoacana's cream
ring behind its badge "the single correct instinct" in that panel. Cream or white
behind the mark satisfies the brand rule and the judge at once.

The footer is compliant: 340px desktop, 250px mobile, whole, on deep purple.

## `npm run check` is six gates in thirty seconds

It used to run them one after another and stop at the first failure, which took
three and a half minutes and hid five answers behind one. The gates are
independent — each spawns its own server on its own free port — so they now run at
once, after a single shared build.

```
  pass  functional      images decode, copy is approved, no prices, search, dialog, tap targets, scroll reveal
  pass  accessibility   contrast against painted pixels, heading order, landmarks, accessible names
  pass  disclosure      every invented value appears in INVENTED.md; no hardcoded colour or font
  pass  widths          eleven viewport widths from 320 to 2560, including 200% zoom
  FAIL  brand           the rendered logo against brand.json's six misuses, minimum size and background rule
  pass  engines         the real page in Chromium, Firefox and WebKit
```

**Disclosure is clean** — every custom property in every stylesheet is now
documented in `INVENTED.md`, and nothing anywhere is a hardcoded colour or font.

**`widths` is new.** Everything had been judged at 1440 and 390, which are the
right two for comparing against the benchmarks but not the only two a customer
has. It checks eleven widths from 320 to 2560 and asserts 45 cards, no horizontal
scroll, and no text overflowing its own box at each. 640 is in the list because
that is what a 1280px screen looks like at 200% zoom, which WCAG 1.4.4 requires
to work. All eleven pass, and it writes a contact sheet to
`.shots/lead-widths/sheet.png` so the widths can be looked at, not just asserted
about.

**The one open failure is the nav's 5px logo overhang**, described above.

## A correction: the hero's opacity is legal, and the audit now proves it either way

The type critique flagged `.hero__kicker { opacity: .88 }` and `.hero__lead` as
throwing away the contrast the type scale was built to earn. Its arithmetic was
right and its conclusion was wrong:

| | painted ratio | floor that applies | verdict |
| --- | --- | --- | --- |
| white on hot pink, opacity 1 | 4.06 | — | — |
| `.hero__kicker` 19px **bold**, opacity .88 | **3.34** | 3.0 (large text) | legal |
| `.hero__lead` 28px, opacity .92 | **3.57** | 3.0 (≥24px) | legal |

4.5 is the *body text* floor. Both of these are large text under WCAG, where the
floor is 3.0 — which is exactly why the type owner put a 19px bold minimum on the
eyebrow and a 24px minimum on the deck in the first place. The two floors are
doing their job.

**Hero owner: do not remove those opacities as an accessibility fix.** There is
nothing to fix. If you want the kicker brighter for design reasons that is your
call, but the margin is thin — 3.34 against a floor of 3.0 — so if you drop the
kicker below 18.66px or take it to regular weight, the floor jumps to 4.5 and it
becomes a real violation.

**`a11y.mjs` was missing this class of bug entirely** and now catches it. It only
skipped `opacity: 0`; it never multiplied partial opacity into the painted colour,
so an element could be styled a perfectly legal colour and painted an illegal one
with nothing in `getComputedStyle().color` to show for it. It now multiplies the
opacity of the element and every ancestor into the ink before measuring, and
prints `at opacity 0.88` next to any finding caused by it.

## All six gates are green

```
pass  functional      images decode, copy is approved, no prices, search, dialog, tap targets, scroll reveal
pass  accessibility   contrast against painted pixels, heading order, landmarks, accessible names
pass  disclosure      every invented value appears in INVENTED.md; no hardcoded colour or font
pass  widths          eleven viewport widths from 320 to 2560, including 200% zoom
pass  brand           the rendered logo against brand.json's six misuses, minimum size and background rule
pass  engines         the real page in Chromium, Firefox and WebKit
```

The nav's cream pill now covers the whole mark at both viewports, so the brand
gate closed. Keep it that way: `npm run check` before you report done, every time.

**One caveat about that green.** The brand check crashed on its own success path
the first time it passed — it built the failure explanation before deciding
whether to print it, and referenced `off[0]` when `off` was empty. A gate that
throws on the pass path is worse than a gate that fails, because it looks like
tooling noise rather than a result. If any check ever ends in a stack trace
instead of a verdict, treat that as a failing gate.

## "assets/ was not touched" is now a check, not a claim

```bash
node scripts/assets-untouched.mjs      # part of npm run check
```

This project has said "nothing under `assets/` was touched" a dozen times. That
is a claim. This proves it three independent ways:

1. **git** — no tracked file under `assets/` or `brand/` is reported modified,
   deleted or renamed. (Untracked files are things that were never committed,
   including the `enhanced/` folder, which predates this work by ten days.)
2. **The guidelines PDF against its own recorded hash.** `brand.json` records a
   sha256 for the PDF it was transcribed from; the file on disk still matches it
   exactly. Its mtime moved when Git LFS materialised it for reading — the bytes
   did not.
3. **A manifest of all 62 masters**, written on first run and compared on every
   run after.

The manifest lives in `site/data/assets-manifest.json` — in the site folder, not
in `assets/`, because writing a file into `assets/` to prove `assets/` is
untouched would be funny in the wrong way.

**If a hash ever stops matching, that is the finding.** The answer is never to
update the manifest to match; it is to find out what wrote to the client's media.

## Data point for the grid's next reveal: 5 columns → 6 columns cost fill

The grid moved from 5 columns to 6 at 1280 and above. Measured either side of that
change, on desktop:

| | median fill | cropped |
| --- | --- | --- |
| 5 columns | 42.2% | none |
| 6 columns | 40.9% | none |

Still above heladosmexico's 36.8%, still 3.5 behind michoacana's 44.4%. Mobile is
unaffected at 45.5%, which beats both.

That is a real trade, not a mistake: six across shows more of the menu per screen,
which is the thing the whole site is for, and it costs 1.3 points of appetite per
tile. Whoever judges it should judge it as a trade. It also changes the tail
arithmetic — re-run `node scripts/tails.mjs`, because the column count that leaves
a category whole is different at 6.

## The widths gate now tests both languages

22 combinations, not 11. English is not a translation of the same length —
"Savory Snacks" is 14 characters where "Antojitos" is 9 — so a header that fits
one can clip the other, and testing only Spanish tested half the site. All 22
pass.

## The menu now survives JavaScript not running

With scripts off, the page was an empty cream field — 45 products, zero of them
visible, because the grid is built client-side. That is not only a
browser-setting edge case: it is what a customer sees if **any** script on the
page throws.

`build-site.mjs` now emits the whole menu inside `<noscript>` — the same data,
the same photographs, the same client-approved copy, set as a plain list grouped
by category, styled in `base.css` under `.plain`. It is not a second design and
it is inert the moment JavaScript runs. 45 items, both languages, and
`smoke.mjs` holds it to the *same copy rule* as the cards: nothing unapproved may
appear there either.

## A check that could not fail

The scroll-reveal guard seeded its "worst case" at a perfect 1/1, so if it ever
measured **no cards at all** it passed and printed `worst was 1/1 at  down the
page` — a green line that had looked at nothing. It now starts from nothing,
counts how many of the four scroll positions actually had cards to measure, and
fails if fewer than four did.

Worth generalising: a check whose initial value is a passing value cannot tell
"everything is fine" from "I found nothing". If you write one, make the empty
case loud.

`smoke.mjs` is 47 checks now. All seven gates green in 41 seconds.

## The handoff package checks itself

```bash
npm run handoff        # writes deliverables/<date>_website/
```

It builds fresh, runs all seven gates and captures their output into
`CHECKS.txt`, then does the thing the gates cannot: **serves the packaged copy
under a plain `python3 -m http.server` and opens it in a real browser.** Every
gate tests `site/public`; none of them tests the copy in the box. A handoff that
only works inside the workshop is not a handoff.

Current result — 343 files, 23.7 MB, both languages rendering 45 products from a
static server with no broken images, no failed requests and no page errors:

```
checking the package the way a client would open it…
  pass  both languages render from a plain static server, no broken images, no errors
```

If that check fails, `CHECKS.txt` says so in the package itself rather than the
package quietly claiming to be green.

## The lead changed one line in card.js, and why

`card.js` was carrying its own `const WIDTHS = [400, 800, 1400]`. A 600 step was
added to the derivatives later — because the real slots land between 400 and 800,
a 2-across phone card being about 170 CSS px, which is 510 device px at 3x — and a
file holding its own list could not see it. So **every phone fetched an 800px
image for a 510px slot, 15 times on the first screen.**

The card piece had already finished its rounds, so there was no owner left to
hand it to. The fix is the one already written in this brief: import `srcset`
from `data.js`, which reads the widths that exist.

What it bought, measured:

| | before | after |
| --- | --- | --- |
| whole page, desktop | 4.89 MB | **3.50 MB** |
| whole page, mobile | 4.86 MB | **3.39 MB** |
| mobile first screen | 1.88 MB | **1.54 MB** |

**`detail.js` still has the same literal** on line 8, and the detail piece has not
run yet. It matters less there — the dialog image is genuinely large, so 1400 is
often the right pick — but it is the same one-line change, and it is yours.

## Icons and add-to-home-screen

A menu is the thing a customer wants one tap away while standing outside the
shop, so `build-icons.mjs` now emits a proper icon set and a per-language web
manifest. The logo is 1915x1788 and `brand.json` forbids cropping, so the mark is
never cut to fit a square: it is trimmed to its **ink** — not its canvas, which is
asymmetric and would sit the mark off-centre — and placed whole on a cream field.

Maskable icons get 22% inset, because a platform may crop a maskable icon to a
circle. Measured on the 512px maskable: the mark's ink centre is 5px from the icon
centre and its radius is 138px against a 205px circular safe area. A circular
crop cannot clip it.

## The site is driven end-to-end by keyboard, and that is now a gate

```bash
node scripts/keyboard.mjs      # part of npm run check
```

`a11y.mjs` checks that every control *has* an accessible name. That is a different
question from whether somebody using only a keyboard can reach it, see where they
are, and get back out of a dialog — and those failures are invisible to every
other check here, because the page looks perfect in a screenshot while being
unusable without a mouse.

It walks: the skip link is the first stop and actually becomes visible; every stop
on the first screen is on-screen and none repeats; **focus is visibly indicated —
measured, by photographing the focused control with and without its ring and
requiring the pixels to differ**, because a ring you cannot see is not a ring;
then Enter opens a product, focus moves into the dialog, ten Tabs stay inside it,
Escape closes it, and focus returns to the card that opened it.

All 22 checks pass in both languages. Worth knowing why the hard part was free:
the dialog is a real `<dialog>` opened with `showModal()`, so the focus trap and
the focus return are the browser's, not ours. That is the argument for using the
platform element instead of building a modal out of divs.

## `npm run check` is eight gates now

functional · accessibility · disclosure · **keyboard** · widths · brand · engines
· media

## The hero's lighting problem has a selection answer, not a retouching one

The hero's blind reveal found something a screenshot cannot name: the five
cut-outs are lit by five different lights. It is measurable, and I built the tool
so it is choosable:

```bash
node scripts/lighting.mjs                       # all 45, sorted by key direction
node scripts/lighting.mjs crazy-shake churros mango-en-flor elote raspado
```

It compares mean luminance of the opaque pixels, top half against bottom half and
left against right. Positive vertical means lit from above; positive horizontal
means lit from the left. The current hero group measures:

```
     19    3   Raspado          ← lit from above
      0   35   Elote            ← keyed hard from the left
     -1    5   Crazy Shake
     -6   -7   Mango en Flor
    -47   34   Churros          ← lit from BELOW
  vertical spread 66 · horizontal spread 42
  these are lit from different directions and will not read as one object
```

**The lever is which products you choose, not correcting them.** The masters are
approved bytes from different shoots; changing how the food is lit would
misrepresent what the shop actually serves, and it is exactly the kind of "fix"
`assets-untouched.mjs` exists to catch. Do not colour-correct a product.

Searching the 22 hero-worthy products for the most coherent five gives a
**vertical spread of 15 and horizontal of 10** — a quarter of what the current
group has:

```
     10   -5   Fresas con Crema
      9    1   Croissant
      2    4   Tostilocos
     -1    5   Crazy Shake
     -5   -1   Bionico con Nieve
```

That is a suggestion, not an instruction: those five may not be the five you want
a customer to see first. Trade appetite against coherence deliberately, and put
the spread you settled on in your report. Crazy Shake is in both lists, which is
convenient — it is the strongest single subject and it is centrally lit.

## Mobile's hero is 31 points behind on the axis the judge rewards

Also from a reveal, also measured: at 390x844 heladosmexico's paleta runs from
y=276 off the bottom — **568px of an 844px screen, 67.3%**. Ours starts at y≈536
and runs 308px — **36.5%**. Desktop is ahead at 74.3% against their 64.3%; mobile
was never given the same treatment. `HERO_MOBILE` in `main.js` is the arithmetic.

## Nav round 4: two corrections before you act on your critique

**1. The mobile owner claimed the category duplication. Do not take it back.**

`styles/mobile.css` hides `.nav .nav__cats` below 1281px, deliberately, and said so
in its report: *"nav should not also take it, or the two rounds will fight over one
control."* Its reasoning was sound — the chip bar is strictly the larger control
(five chips, holds state, is the scroll-spy, carries the live count, and is sticky
so it is on screen for the whole scroll, which is the one job the header row was
there to do). It bought 71px of a 844px screen back for food.

Your round-3 critique tells you to restore those links on mobile. **Leave
`.nav__cats` alone below 1281px.** If you disagree, say so in `blocked` — do not
edit around it.

**2. Its stated reason is not true.** The critique says "the first mobile screen
contains zero food words — Helados, Antojitos, Postres and Bebidas appear nowhere
until the user scrolls." I measured every visible text node at 390x844:

```
es  Buscar en el menú | English | Swedesboro, New Jersey | Todo el menú, en una
    sola página. | Nieves, antojitos, postres y bebidas. | Míralos todos antes de
    llegar. | Ver el menú | 45 cosas para comer
en  Search the menu | Español | Swedesboro, New Jersey | The whole menu, on one
    page. | Ice cream, snacks, desserts and drinks. | See all of it before you
    walk in. | See the menu | 45 things to eat
```

**All four categories are named on the first screen, in both languages** — in the
hero lead, which is client-approved copy. The Spanish uses the client's own word
"Nieves" for ice cream rather than "Helados", which is why a string match for the
category labels missed it.

Spend the round on your critique's real finding instead: the four category links
are the only content in the bar sitting on no field at all, while 614px of that
1440px bar is on a legal reading area. That one is measured and correct.

## The disclosure check now catches literal type sizes

The hero owner flagged something my checker could not see: it wrote
`.hero__lead-b { font-size: 1.5rem }` and reported it honestly, noting that
`check-invented.mjs` would not catch it because it only looked at custom
properties, colours and font families.

That was a real hole. **`brand.json` sets `typography.sizes`,
`typography.lineHeights` and letter-spacing all to `null`** — so every type size
and every piece of tracking on this site is an invented value, and a literal typed
straight into a rule is the easiest kind to introduce without noticing. The check
now fails on any literal `font-size` or `letter-spacing` outside `tokens.css`
unless `data/invented.json` records that exact value.

It found six. All six are now disclosed, and two of them turned out not to be
design decisions at all:

- `nav.css .search__input { font-size: 1rem }` — 16px, and **not taste**: iOS
  Safari zooms the whole page when a field smaller than 16px takes focus, and a
  zoomed page under a sticky header is a trap.
- `hero.css .hero__lead-b { font-size: 1.5rem }` — 24px, which is exactly the
  floor of `--t-deck` that type.css already declares. There is no token for "the
  deck's floor on its own", so it is written as the number it is.

Saying that plainly is more honest than promoting both to tokens to make a
checker quiet.

## Hero, after round 1

`node scripts/hero-scale.mjs <shot> 1152,1728` — the column that is exactly the
stage:

| | subject height, first screen |
| --- | --- |
| **ours** | **81.2%** |
| heladosmexico | 64.5% |
| michoacana | 32.3% |

The builder found that `h` was never the silhouette: the Crazy Shake's top fifth
is a birthday candle 17px wide in an 800px master, so a placement sized by the
alpha box was buying a candle rather than a mass. Every placement is now chosen
against where the product stops being a spike.

## LCP on a real connection is 4.3 seconds, and the fix is in the hero's `sizes`

`npm run perf` now measures a third profile: **mobile on 4G** — 3 Mbit down, 40ms
round trip, 4x CPU throttle. Localhost is not a connection, and the entire promise
of this site is that somebody standing outside the shop can see the menu before
they walk in.

```
mobile  390          LCP  188 ms
mobile  390 on 4G    LCP 4312 ms   ← Chrome's "good" threshold is 2500 ms
```

**The LCP element is the hero's lead cut-out**, and I isolated the cause rather
than guessing:

| | LCP on 4G |
| --- | --- |
| as it ships | 3768–4312 ms |
| with all 14 below-fold card images blocked | 3120 ms |
| with the hero images capped to the 800px candidate | **2928 ms** |
| capped to the 600px candidate | **2528 ms** |

So the below-fold cards cost about a second, and **the hero's own three images cost
more than that**. The reason is in `main.js`:

```js
img.sizes = `${Math.round((side / 100) * stageH)}px`;   // 873px for the lead
```

On a 390px phone the lead cut-out is deliberately drawn **884 CSS px wide** — 2.3x
the viewport, because it bleeds off both edges. At device pixel ratio 3 that asks
for 2652 device px, so the browser correctly picks the 1400 candidate. Three of
them:

```
Crazy Shake   1400: 165 kB    800: 70 kB    saves 95 kB
Mango en Flor 1400:  97 kB    800: 39 kB    saves 57 kB
Raspado       1400: 119 kB    800: 44 kB    saves 75 kB
```

**Hero owner, this is yours and it is one line.** A cut-out that is already
oversized for effect and half off-screen does not need 3x density — nobody can see
it. Dividing the computed `sizes` by a density cap (`/ Math.min(devicePixelRatio,
1.5)` or simply writing a smaller number) takes LCP from 3.8s to about 2.5s and
saves 227 kB on the first screen, with no visible change at 390px. Check it with a
screenshot at 390 before and after — if it *is* visible, say so and keep the
quality.

The lead already carries `fetchpriority="high"`, which is right and is not the
problem. The problem is bytes, not order.

## Ink coverage swings 4.3x, and `fill-check` now says so

The median tells you how appetising the grid is on average. The **spread** tells
you whether it reads as one set of photographs — a row holding one tile four
times fuller than its neighbour looks like a mistake however good the median is.

```
  median             40.7%
  spread             16% to 66% — 4.3x  ← a row can hold two tiles this far apart
```

Choco Banana 16%, Elote 19%, Elote Hot Cheetos 19% at one end; Platano Frito 66%,
Pastel de Tres Leches 62% at the other.

The cause is not the seating and not the photography. `visualScale` **is**
ink-normalised and **does** reach the card — but `card.js` clamps it
`Math.min(1, …)`, so it can only ever shrink a product, never grow a thin one. A
paleta on a stick therefore keeps its sliver while a flat tray fills its tile.

That is the same class of mistake as the very first one this project fixed —
sizing by bounding box rather than by ink — reappearing at the other end of the
range. It is in the whole-site pass's list because the card's rounds are finished.

## The hero's lighting spread went 66 → 25

After round 1 the hero group is three products rather than five, and re-measured:

```
     19    3   Raspado
     -1    5   Crazy Shake
     -6   -7   Mango en Flor
  vertical spread 25 · horizontal spread 12
```

Against 66 and 42 before. Churros — the one lit hard from below, at -47 — is gone,
and the mangonada was swapped for the raspado for silhouette reasons that turned
out to help here too.

The tool still says "will not read as one object" because its threshold is 20 on
both axes, and 25 is over it. **That threshold is my judgement, not a measured
fact** — I picked it because the tightest five hero-worthy products come in at 15.
Treat 25 as close, not as failing, and weigh it against what the three products
are: the strongest single subject in the catalogue, the only chilli-dusted fruit,
and the only cool colour in an otherwise white-and-gold mass.

## Layout shift: the site was fine, my measuring tool was not

`npm run perf` reported a desktop layout shift of **0.139** — above Chrome's 0.1
threshold — with the header's search field jumping 428px sideways at 167ms. I
chased it, and it was an artifact of the measurement.

`perf.mjs` was calling `response.body()` on every response to learn its size,
because `serve.mjs` sent no `Content-Length`. Reading forty response bodies
serialises the load and produces timings — and shifts — that no real visitor would
ever see. `serve.mjs` now sends `Content-Length`, which any real static host does
anyway, and `perf.mjs` no longer reads bodies. Measured again:

```
desktop 1440       layout shift  0      good
mobile  390        layout shift  0      good
mobile  390 on 4G  layout shift  0.019  good
```

**That is the sixth time a check has been wrong before the code was.** If a
measurement disagrees with a direct probe, suspect the instrument.

The chase was still worth it: it produced a real improvement. `styles/fonts.css`
now declares **metric-matched fallbacks** — the same Helvetica Neue and Arial that
`brand.json`'s stack already names, stretched with `size-adjust` and
ascent/descent overrides so they occupy exactly the space Noto Sans will. Measured
in a browser: the fallback now matches Noto's width to **0.66%**, from 3.9%. The
visible font is unchanged and no new typeface is introduced; it only affects the
moment before the webfont arrives. Disclosed in INVENTED.md.

## Correction: the ink clamp is not a bug, and "fixing" it would crop the menu

The grid's final critique said the 4.3x ink spread is caused by `card.js` clamping
`visualScale` with `Math.min(1, …)` so it can only shrink a product. The mechanism
is described accurately. The conclusion is wrong, and I nearly acted on it.

Modelled across all 45 products under the card's own constants:

```
  the five thinnest, and what is limiting them
    Choco Banana        bound by height   norm 1.000   would grow x1.443
    Elote               bound by height   norm 1.000   would grow x1.443
    Elote Hot Cheetos   bound by height   norm 1.000   would grow x1.443
    Paletas             bound by width    norm 1.000   would grow x1.011
    Chicharron Prep.    bound by width    norm 1.000   would grow x1.056

  23 of 45 products are HEIGHT-bound — already as tall as the stage allows
  22 are being shrunk by the clamp at all
  19 would grow if it were lifted
```

**The three thinnest products are not being shrunk by the clamp. Their norm is
exactly 1.** They are height-bound: already as tall as the coloured field permits.
Lifting the clamp would multiply their frame by 1.44, taking a 1.28-card-width
product to 1.85 in a 1.34-tall stage — cropping a chocolate-covered banana by a
third, top and bottom.

The clamp is the thing keeping `cropped: none` true. It is doing its job.

**The spread is mostly the products, not the layout.** A banana on a stick
photographed alone will never cover as much of a rectangle as a tray of pancakes.
The only honest ways to narrow it are to crop the thin ones, or to give them a
narrower tile — a variable column span, which is the grid's lever, not the card's.
Both are trades, and neither is a bug fix.

**This is the seventh time a critique or a check has been wrong before the code
was.** The pattern is consistent enough to name: a measurement that identifies a
real mechanism is not the same as a diagnosis. Verify the fix would help before
taking it.

## Two things I claimed from a screenshot; one was wrong

I said, from a scaled-down full-page image, that two-line card names push their
descriptions out of line with their neighbours. Then I measured it — twelve rows
of ordinary cards at 1440, feature tiles excluded because a 2x2 tile shares a top
edge with the small cards beside it and is not in their row:

```
  rows of ordinary cards checked: 12
  rows whose descriptions do NOT share a baseline: 0
```

**Zero.** The card owner had already fixed it and I was reading a scaled image.
Withdrawn from the whole-site list.

The other claim held up:

```
  Helados      9 cards · 1 feature tile
  Antojitos   12 cards · 1 feature tile
  Postres     16 cards · 1 feature tile
  Bebidas      8 cards · 0 feature tiles · every card 294px
```

Bebidas really is the only chapter without one. Whether to give it one is a
judgement, not a defect: eight items is the smallest chapter, and a feature tile
costs it a whole row of rhythm.

## Live regression: the hero's count pill fails contrast

`npm run check` went from all-green to one failure, and it is new:

```
FAIL  4.03 (needs 4.5)  .hero__count  14px bold  on rgb(237,32,143)  "45 cosas para comer"
```

The count pill is a genuinely good addition — the blind judge on mobile named it
as part of why ours "behaves like a shop instead of a brand campaign". But at
**14px bold** it is below WCAG's large-text threshold of 18.66px bold, so the
floor is 4.5 rather than 3.0, and white on hot pink is 4.06 at full opacity.

Hero owner, three legal fixes, exactly as the nav had:

1. **Take it to 18.66px bold or larger.** The floor drops to 3.0 and 4.06 passes.
   This is what type.css's 19px eyebrow floor exists for, and it is why that floor
   is 19 rather than a round 18.
2. **Put it on deep purple** — 13.60:1, and an approved field.
3. **Put it on a cream or white pill**, which is what the guidelines mean by a
   reading area.

Do not darken the pink and do not raise the opacity — 4.06 is the ceiling at
opacity 1, so no opacity change can reach 4.5.

## URGENT — the closed dialog is covering the whole page

`styles/detail.css` line 79 sets `display: flex` on `.detail` unconditionally.
That overrides the UA's `dialog:not([open]) { display: none }`, so **the product
dialog sits over the entire viewport while closed**:

```
FAIL  [es] the closed dialog is out of the way
          it is display:flex at 1440x900, covering the page while closed
FAIL  [es] nothing under the closed dialog is blocked
          the element on top at mid-screen is .detail__img, inside the dialog
```

`document.elementFromPoint` at the middle of the first screen returns
`.detail__img` — so a tap aimed at the hero's "See the menu" button, or at the
count pill, hits an invisible dialog instead. It looks completely normal in a
screenshot, which is exactly why it needed a check, and `smoke.mjs` has one now.

**Detail owner, this is yours and it is in flight.** A `<dialog>` needs
`display` set only when it is open. Either scope the rule to `.detail[open]`, or
add `.detail:not([open]) { display: none }`. Do not remove the `<dialog>` element
or open it with anything other than `showModal()` — the focus trap and the focus
return that the keyboard gate passes on are the browser's, and only a modal
dialog has them.

This also explains a false accessibility finding I chased for twenty minutes: the
audit reported the hero's count pill as "white on hot pink at 4.03". It is white
on deep purple at 13.6. The audit was photographing the rectangle where the pill
is — and getting the closed dialog's field instead, because the dialog was on top
of it.

## The closed-dialog bug is fixed, in `base.css`, not in `detail.css`

I fixed it in the reset rather than in the detail owner's file, for two reasons.
Their round was in flight and editing the same file would have lost one of our
changes. And `:not([open])` outranks a plain class selector, so the guard holds
wherever the component rule sits in the cascade:

```css
dialog:not([open]) { display: none; }
```

It is a reset, not a patch for one component — any dialog added later inherits the
same guarantee. **Detail owner: your `display: flex` on `.detail` is fine and you
do not need to change it.** It is what lays out the dialog's insides; it simply
must not apply while the dialog is closed, and now it cannot.

`smoke.mjs` is 51 checks and all eight gates are green.

The accessibility false positive went with it: the hero's count pill now measures
as what it is, white on deep purple at 13.6:1. The audit had been photographing
the closed dialog's field.

## The honest position on LCP, now that the arithmetic is in

The first screen on a phone is about **1.4 MB**. On the 3 Mbit profile that is
3.8 seconds of transfer before anything else, so an LCP of 4.3–4.7s is
transfer-bound, not a bug in the code.

Capping the hero's three images to the 800px candidate saves 227 kB and measured
2.9s. Getting under Chrome's 2.5s "good" line needs the first screen under roughly
900 kB, which on this site means loading fewer photographs before the fold — and
the whole point of the page is that the food is enormous and immediate.

So this is a **trade to state plainly, not a defect to eliminate**:

- The hero cap is worth taking: 227 kB and about a second, with no visible loss at
  390px. That is free.
- Going further means either smaller food on the first screen or lower image
  quality, and both undo the thing every blind judge picked us for.
- On wifi or good LTE the same page has an LCP of **168–212 ms**.

Whoever finishes this should record the number honestly in the handoff rather than
tuning the benchmark until it flatters the site.

## Correction to a number I have been quoting all night

The fill figures I have reported since the beginning — 41.3% desktop, 45.5%
mobile — were produced by an estimator that is **wrong at both ends**, and I only
found it because a card suddenly read as 1%.

The estimator took each tile's most common colour as "the field" and counted
pixels differing from it. That works on a flat tile. It fails here twice:

1. **At high fill it inverts.** Once a product covers most of its tile, the
   *product* becomes the most common colour, so the measure starts counting the
   background. It read our 2x2 feature tile — the single biggest photograph on the
   page — as **1% food**.
2. **The tile is a gradient**, so a four-corner variant I tried next reported
   100% for any tile whose corners differ from each other, which is all of them.

Ours is now **computed, not segmented**. The alpha channel of every master was
already measured when the derivatives were built — `ink` in `data/images.json` is
the true opaque fraction of each square canvas. Multiplied by the rendered area of
the image and divided by the rendered area of the tile, that is the same quantity,
exactly, with nothing to separate.

**The corrected numbers:**

| | ours | heladosmexico | michoacana |
| --- | --- | --- | --- |
| desktop | **39.4%** | 36.8% | 44.4% |
| mobile | **42.1%** | 36.8% | 44.4% |
| cropped | none | — | — |

Lower than what I was quoting, because the old estimator counted the contact
shadow and the spotlight glow as product. We still beat heladosmexico at both
viewports and are 5.0 / 2.3 points behind michoacana.

**One asymmetry to state rather than hide:** the benchmark figures are still
pixel-measured, because their images are not ours to measure any other way — and
a pixel measurement of a packshot includes its drop shadow. Ours counts opaque
food only. The comparison is therefore conservative in their favour.

## The fill metric, finally sound — and verified by hand

Three estimators were tried before this one worked. The final method:

1. `ink` from `data/images.json` — the true opaque fraction of each square canvas,
   measured from the alpha channel when the derivatives were built.
2. Clipped against the **product's own box** (`fillW` / `fillH`), not the whole
   image — a cut-out sits in the middle of a square with transparent margin, so
   clipping against the image over-penalises anything that bleeds. Clipping the
   wrong way took the median from 39.4% to 30.2% and would have reported us behind
   both benchmarks.
3. Divided by the rendered area of the tile.

Checked by hand on three cards:

```
  Platano Frito  ink 66.3%  img 236x236  tile 232x238  ->  66.9%   reported 67%
  Choco Banana   ink  9.0%  img 421x421  tile 294x394  ->  13.8%   reported 14%
```

The clipped and unclipped numbers now agree, which is itself the finding: almost
no product actually falls outside its tile even where the image does. The bleed is
transparent margin, which is what a cut-out is supposed to bleed.

**Final: 39.4% desktop, 42.1% mobile.** Ahead of heladosmexico at both viewports,
5.0 and 2.3 points behind michoacana, nothing cropped — and measured more strictly
than either of them, since their figures include their packshots' drop shadows.

---

## NAV — round 5, applied by the lead after the piece's own loop ended

The nav ran four rounds and placed **first, blind, in all four**. It never got past
`narrow`, and round 4's reveal named exactly one reason:

> Every control in the bar is the same object. At 1440 the header draws eight
> things and seven of them share `border-radius: var(--r-pill)` plus a 44px
> height — five `.nav__cat` chips, the `.search` pill, the `.nav__lang` pill.
> So a filter chip, a text input and a locale link are one silhouette in three
> fills, and the only variable left carrying hierarchy is cream-alpha.

That is a true observation about the painted bar and a cheap fix, so it was
applied here rather than spent on a fifth round. Three changes, all in
`styles/nav.css`, none of them touching what won:

1. `.search` moved from `--r-pill` to `--r-card`. A text input is a field. Every
   other place you type on this site is a rectangle.
2. `.nav__lang` lost its 2px ring and became the bar's **only unenclosed
   control** — globe plus word, white on deep purple at 13.60:1, with an
   underline on hover and on `:active` as a second non-colour signal. Six ringed
   objects in a row reads as a toolbar; five and one bare link reads as a header.
3. The focus ring follows the two new shapes, because a 45px arc drawn around a
   10px corner stands off the shape at four places — the same fault the brand
   plaque had and the same fix.

No token was invented: `--r-card` (10px) was already in `tokens.css`.

The five category chips kept `--r-pill` deliberately. A filter chip is the one
control in the bar that earns a lozenge — it is a thing you press and it stays
down — and the chips are what every blind judge across four rounds named as the
reason ours won: *"a shopper reading A or C still does not know what is sold; a
shopper reading B has already started choosing."*

`npm run check` after the change: **all eight gates clean (41s)**.

---

## HERO — round 4, applied by the lead after the piece's own loop ended

The hero ran three rounds and placed **first, blind, in all three**. Round 3's
judge was the most decisive statement any judge made about any piece:

> Only one panel puts unwrapped food in front of the customer. A and C are both
> looking at product through plastic film — crimped sleeves, glossy bags, logo
> roundels — and a wrapper is a picture of packaging, not of dessert. B fills
> half the frame with food shot close enough that the chocolate has a highlight,
> the churros have visible sugar grain and the ice reads as ice.

It was still capped at `narrow`, for one reason:

> The mass has no bottom edge of its own. All five entries in `HERO_DESKTOP`
> carry a negative `b` — churros -51, mango -32, shake -18, elote -16, raspado
> -10 — so every one of the five is terminated by the same horizontal fold line,
> and the silhouette's lower boundary is one straight rule running the full
> 1440px of the screen. Combined with the shake's crown being sliced at the top,
> three of the four sides of the food are straight cuts.

**One number changed:** the raspado moved from `b: -10` to `b: +4`.

That is the whole fix, and it is deliberately the whole fix. The point is not to
stop the food bleeding — the bleed is what the hero owner argued for and what
three judges rewarded. The point is that a boundary made of five identical cuts
reads as one shape, and a boundary with a single step in it reads as objects.
Measured after the change, distance past the fold: churros 444px, mango 299px,
shake 201px, elote 157px, **raspado 2px** — so four still run off and one stands.

The raspado is the correct one to lift because it is the only hero product whose
base is a plain rounded cup. An elote ends in a stick, the churros in a paper
cone, the shake in a spiked crown: lifting any of those shows a severed end. See
`.shots/hero-r4/base.png` — the red cup's foot sits on the field while the
churros and the shake run past it.

The shake's crown is still cropped at the header, and that was left alone: the
hero owner made that call explicitly ("the candle runs off the top, on purpose"),
and it is a different edge from the one being fixed.

---

## MOBILE — finished, and two things the lead checked afterwards

Mobile ran three rounds and placed **first, blind, in all three**. Round 3:

> A is the only screen where a customer can both want something and act on it.
> C matches it on subject scale, but its hero is printed packaging with no route
> into a menu; B offers neither appetite nor a route.

Its round-1 report left two items for other owners. Both were checked. **Neither
needed work, and one of them nearly caused a regression.**

**1. "The chip row still scrolls and CSS cannot fix it — it needs grid.js."**
By the time the loop ended this had already been solved somewhere else, twice
over, and better. The two owners converged on a different resolution than the one
round 1 proposed: below 1280px `styles/mobile.css` hides `.filters` and the
**header row is the phone's only category control** — the two files now carry
matching comments saying the breakpoint is coupled and must move together. And
`src/partials/nav.html` already runs a MutationObserver that mirrors the grid
spy's `data-here` onto the header row and scrolls that rail to keep the marked
word on screen, with a guard that will not yank the rail back if the customer
just swiped it.

Verified at 390px, both languages, all four chapters:

    es helados   marks "Helados"       on screen
    es antojitos marks "Antojitos"     on screen
    es postres   marks "Postres"       on screen
    es bebidas   marks "Bebidas"       on screen
    en helados   marks "Ice Cream"     on screen
    en antojitos marks "Savory Snacks" on screen
    en postres   marks "Desserts"      on screen
    en bebidas   marks "Drinks"        on screen

I had already written a `keepHereVisible()` into `grid.js` to do this before
finding the existing one. **It was reverted**, and not only as duplication: two
independent writers scrolling the same rail is worse than one, and mine had no
swipe guard, so it would have fought the customer for the control. Recorded
because the lesson generalises — before adding a mechanism to a file one owner
left, check whether the owner it was handed to already built it.

**2. The mobile hero's straight-cut silhouette.** Round 3's gap asked for the
desktop's grounded-raspado fix to be carried to the phone. **It does not
transfer, and the change was reverted after measuring.** `lift: 1.32` paints the
cup 32% past its own box, so at 390x844 the box can sit 6px above the fold and
the cup still runs ~90px below it (box 242..838, painted foot ~933). Buying those
90px means raising `b` about 7.5 points of stage height, which lifts the cup's
top from y=330 to y=191 — behind the bare white headline, at roughly 1.6:1. The
reason is now a comment above `HERO_MOBILE` so the next person does not retry it.

The phone stays a wall of food deliberately: that is what all three judges
rewarded, and five objects across 1440px can afford one that stands where two
across 390px cannot.

---

## THE HARNESS BUG THAT COST THE DETAIL PIECE TWO BLIND ROUNDS

**What happened.** Detail rounds 3 and 4 both came back `rank 3, lost`. Neither
was a design loss. Both judges said the same thing about our panel:

> B is ranked last on this one axis and the reason is not quality, it is
> absence: it contains no single product view at all. Five items overlap into a
> pile with no product name, no description, no alternate views.

They were describing **the home page hero**. The image submitted as our
product-detail view was a scroll-0 capture of the site root.

**The cause, exactly.** `scripts/shot.mjs` is the one script every capture in
this project goes through — ours and both benchmark sites. Its `dismissOverlays()`
exists to clear cookie banners and newsletter takeovers off michoacana.com, and
among other things it ran:

```js
document.querySelectorAll('dialog[open]').forEach((d) => { d.close(); kill(d); })
```

**Our product detail view is a `<dialog>`.** So the canonical screenshot tool
deleted the thing it was asked to photograph, on every capture, and handed back
the page behind it. `verify.mjs` then wrote that to `desktop.png` — the exact
filename every critic in this project is handed.

Measured afterwards on the real frames, the piece leads the axis it was judged on
by roughly 35 points: subject height 93.5% of the viewport on Churros and 94.4%
on Nachos against heladosmexico's 50.6% and michoacana's 25.7%. Our *flattest*
product, Paletas at 50.2%, ties their best. It placed last twice.

**The three fixes.**

1. `shot.mjs` now computes `OURS` from the URL and returns from
   `dismissOverlays()` immediately on localhost. There is nothing on our own page
   that needs dismissing — we control it — and everything that function removes
   is, on our origin, content. The takeover-retry loop stands down there too.
2. `shot.mjs --open <slug>` photographs a product's detail view, opened the way a
   customer opens it (clicking the card, not calling `showModal()`), waiting for
   the images to decode. `verify.mjs --open <slug>` routes it so **`desktop.png`
   and `mobile.png` are the dialog** — because a capture route the project's own
   harness cannot take is a route that will be taken wrongly, which is precisely
   what happened.
3. `--open` suppresses the full-page shots: a full-page capture of an open dialog
   is a picture of the page scrolling behind a fixed overlay.

**The rule this earns.** A blind comparison is only as honest as the frame it is
given. Before believing a `lost`, open the submitted image and confirm it is a
picture of the piece. Two rounds of a builder's time and two of a critic's went
into ranking a photograph of the wrong thing.

### And the design gap those rounds should have found

With correct frames the reveal named it immediately: `.detail__copy` carried
`align-self: center`, so the cream reading card floated in the middle of its
column with air on all four sides — "a chip floating in a quarter-screen hole",
with the right 38% of the frame bare category colour for 57% of its height.

Changed to `align-self: end`. The card now anchors to the bottom of the frame,
diagonally opposite the food's bottom-left bleed, and the leftover field is one
quiet area rather than a halo. Checked on the four extremes of the catalogue — a
tall cone (Churros), a wide tray (Nachos), a flat package (Paletas) and a
name-only card with no description line (Nachos) — see `.shots/detail-3up.png`
and `.shots/detail-ab.png`. It also matches what the narrow breakpoint already
did at line 780, so the layout no longer changes alignment at a width.

### One gate had to be corrected, not the design

`smoke.mjs` asserted the dialog photo was cut off by `0px`. That was written for
a real bug — the `* { margin: 0 }` reset pinning a modal to the top-left and
taking 21px off the photo — and it now failed the winning composition at 229px,
because the food deliberately runs off the bottom.

It was not deleted. It now asserts the two things that separate a bleed from a
break: **a deliberate bleed only ever goes off the bottom** (the frame is
anchored at the top and grown downward), so any cut past the TOP is a break; and
at least 60% of the photo must be on screen whichever way it went. The top
measurement also discounts the derivative's own 6% transparent margin, since the
top 6% of every image box is guaranteed to be nothing — the same "measure the
painted pixels, not the box" error that `fill-check.mjs` had to be corrected for
twice. Shipped values: 0px past the top at both viewports, 79.7% of the box on
screen at 1440x900 and 96.5% at 390x844, across all 45 products.

---

## DETAIL — re-run on the correct frames, and what it produced

With `--open` in the harness the piece was blind-ranked twice more, on pictures
of itself. **First place both times.** Round 1's judge:

> Unwrapped food, at scale. A and C are both photographs of packaging — crimped
> sleeves, foil ends, logo roundels, printed strawberries — and a wrapper sells
> a brand, not a dessert. B is the only frame where a customer can see the actual
> thing. That alone would win it; **what makes it decisive rather than narrow** is
> that B is simultaneously the most useful, showing where you are (POSTRES, 25 de
> 45), what is in it, three legible full-colour alternate views, and the next and
> previous items by name.

Round 2's judge measured the axis directly: subject fills **~90% of the frame
height in ours, ~57% and ~26% in the two benchmarks.**

The builder's two rounds changed the view substantially: the reading column is
now cream from the top of the room to the floor with a soft-wave seam (the
brand's own motif, the same device `foot.css` uses for the page seam), the
alternate photographs became a real block at 224px rather than 106px chips, and
the name is set at `--t-display`. No copy was added — the same category, name,
approved line, walk and way back that were in the floating card.

### The gap it ends on, handed to the whole-site pass

Round 2's reveal named it precisely, and it is a genuine consequence of what
round 2 fixed:

| product | photographs | ink in the 501px reading column |
|---|---|---|
| Coctel de Fruta (the judged frame) | 3 | 20.0% |
| Churros | 1 | **3.8%**, 75% of rows blank |

A full-height column is right for a product with a photo row and has nothing to
distribute without one — and **28 of the 45 products have Churros' shape.** The
detail loop has ended, so this is item E of the whole-site brief, with its three
constraints attached: no copy may be invented, the walk row must not move between
products (a customer walking with the arrow keys must not have the control shift
under their hand), and the food's size is banked and may not be quietly traded.
`.shots/dv-churros/desktop.png` against `.shots/dv-coctel/desktop.png` is the
whole problem in two frames.

---

## WHOLE SITE — one blind round, and the fix it produced

The page was judged as one page rather than as eight pieces, against the two
benchmarks' home pages, blind. **First place.**

> Food you can eat, and a way in. B is the only panel whose hero shows
> unwrapped, made-to-order food instead of logo-stamped plastic, and the only
> one that puts the menu itself — categories, search, an explicit promise of
> everything on one page — inside the first screen. A and C both spend their fold
> pointing at a store locator for a product in a wrapper. In a business where the
> purchase is driven by appetite, the panel that makes you hungry and then
> immediately lets you browse wins, **and it is not close.**

Its builder changed 18 files; `smoke` came back 53/53.

### The gap it named, and the fix

> Every one of the five hero cut-outs is terminated by another element rather
> than by its own form... `.nav__drip` hangs purple scalloped lobes into the hero
> while `.hero { overflow: hidden }` cuts the food with a dead-straight full-width
> line that lands within a few CSS px of the lobes' deepest point. The result is
> a sawtooth of purple against a ruler-straight slice through four marshmallows.
> **It reads as a clipping bug.** Two blind judges have now named it.

`.shots/seam/top.png` is that collision at 2x. It is unmistakable.

The hero solves this at its BOTTOM edge by masking the cut with the same
repeating half-disc the cards use. That does not transfer to the top: the drip is
a varying-depth melt — lobes from 7 to 27 units in its own viewBox — not a
uniform scallop, so there is nothing to align a repeating mask to.

**One number changed: the lead cut-out's `b`, from -18 to -29.** `h` is untouched
at 126. Eleven points of crop moved from the top edge to the bottom one — the
bottom being where this hero already bleeds deliberately and where three judges
rewarded it for bleeding, and the top being where a straight line collides with a
shaped one. The crown now closes on its own form at 97% of the stage, clear of
the deepest lobe. `.shots/seam2/top.png` is the same crop after.

**It cost nothing and gained something.** Measured with `scripts/hero-scale.mjs`
on the column that is exactly the stage:

| | subject as a share of the first screen |
|---|---|
| ours, before | 80.7% |
| **ours, after** | **84.6%** |
| heladosmexico.com | 64.6% |
| michoacana.com | 32.3% |

More of the shake is inside the frame, so more of it is subject. All eight gates
clean afterwards.
