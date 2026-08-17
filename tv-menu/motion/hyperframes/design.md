# Design truth — La Sabrosita animated TV showcase

This is the look spec for the composition. It is **not** a brand source. Every
brand value here is named by its token and resolved from `brand/brand.json`
through the generated `assets/brand-tokens.css`. No hex code is authored in this
project.

---

## SUPERSEDED IN PART, 2026-08-17 — read this section first

Luis supplied a 15-item reel he had already approved and asked for that
treatment across all 39 product scenes. The layout below — product centred,
name placed adaptively against measured negative space, category ribbon
top-left, an opaque field per frame — **is no longer what is built.** What
replaced it:

| | Before | Now |
|---|---|---|
| Product | centred, filling the frame | right side, an 890×780 zone centred on x1400 |
| Name | display type placed per frame against free space | a fixed card at 110,340 — pill, name, description |
| Category | a ribbon, only on a category's first scene | a pink pill on every card |
| Background | opaque, redrawn per frame | one continuous layer in `index.html`, drifting |
| Logo | redrawn per frame, top-left | one lockup — centre for the open, then the corner |
| Ticker | none | one strip, one linear pass, never restarted |
| Beat | 1.28–2.30s by scene shape | **3.40s, every scene** |
| Length | 59.36s, under a 60s ceiling | **141.6s**; Luis dropped the ceiling |

The numbers all live in `scripts/reel_spec.py`, which both generators read.

Three new deliberate deviations, added to the list further down:

1. **Item names are set at weight 900, not 700.** `brand.json` →
   `typography.roles.emphasis` gives item names weight 700. At 104px on a dark
   translucent panel, 700 reads thin next to the pill's 700 at 28px. Same
   family, same palette; only the weight moves.
2. ~~**The logo sits on a cream card.**~~ **Reversed the same day, by Luis:
   the logo has NO background of any kind.** The reference reel set its mark on
   a white card and this project copied it. The file is a real transparent PNG
   — 51.2% of its pixels fully transparent, all four corners at alpha 0, 21,564
   partial-alpha pixels of anti-aliased edge — and the mark carries its own
   white keyline, so a card was a second answer to a question the artwork had
   already answered. Dropping it also dropped 40px of padding, so the corner
   scale rose 0.36 → 0.38 to hold the mark at the same size and stay over the
   250px digital minimum `brand.json` publishes. `reel_spec.py` asserts that
   floor rather than trusting it. Do not reintroduce a card, panel, scrim or
   plate behind the mark.
3. **Translucency is expressed with `color-mix`, not pasted `rgba()`.** The
   card panel is `--ls-deep-purple` at 72%, the description `--ls-base-cream`
   at 86%. Written as `color-mix(in srgb, var(--token) N%, transparent)` so the
   values still track `brand.json` the day the palette is revised — an
   `rgba(75, 21, 87, .72)` would have frozen a hex into the CSS.

What did NOT change: the source imagery, the product scale reasoning, the
category taxonomy, the one-product-per-scene rule and the five client-named
groupings. Everything below still governs those.

---

## Concept angle

*A menu board that behaves like the shop does* — the products don't fade in
politely, they arrive. Cut-out food on a moving brand-gradient field, each item
tagged with a cream name card, two or three at a time, category by category,
with the tempo of a busy Saturday counter.

## Three scene shapes

**Mixed scene** — 2–3 *different* products, one name pill under each.

**Variant cluster** — every approved MASTER of *one* product, together, under
**one** name card. Six products have more than one master: Crazy Shake (4),
Gelatina (3), and Aguas Explosivas, Esquites Hot Cheetos, Licuado and Pastel
Tres Leche (2 each).

**Hero** — one master alone, sized to its own aspect ratio instead of a product
box, with the name in a type column. One frame uses it: **Paletas**.

The flavour is carried entirely by the photograph. **No flavour word appears
anywhere on screen, and none is invented.** The catalog's parenthetical notes —
`(bombón)`, `(cookie)`, `(pastel)`, `(mango)`, `(second flavour)` — are internal
bookkeeping and never reach the frame. Neither do the old menu-board lines
"Crazy Shake Oreo / Marshmallows / Cookies", which the client already collapsed
into a single item.

Consequence: **a product name appears in exactly one scene, ever.**
`build-scene-plan.py` asserts this and refuses to emit a plan that breaks it.

The cluster is also spaced tighter than a mixed scene, and the four-master Crazy
Shake cluster goes further: its shot boxes **overlap by 56px** and each cut-out
tilts a few degrees into a fan. Tight spacing reads as one set; wide spacing
reads as separate products. That spacing difference is doing the work the words
are no longer allowed to do. Overlap occludes but never crops, and each shake is
identified by a topping that sits top-centre, clear of the seam.

### Paletas hero, and the Helado Chino exclusion (client, 2026-08-16)

**Paletas** is carried by `LS_Paletas_MASTER_v03.png` alone — a wide arrangement
of the whole paleta range. It is already the "here is everything" shot, so it
gets the frame to itself rather than sitting in a cluster.

`Helado Chino` is not a customer-facing product. It was first folded into a
Paletas cluster; now that Paletas is a solo hero, its two masters have **no scene
left**, and they are **excluded from the reel**.

That exclusion is explicit, not incidental. `build-scene-plan.py` →
`EXCLUDED_MASTERS` lists each absent file with its reason, and the generator
asserts that **every catalog entry is either placed exactly once or listed
there**. A master can never go missing silently, and a stale exclusion naming a
file that is no longer in the catalog also fails the build.

45 of 47 masters are placed. Both excluded files are **untouched on disk** and
`products.json` is unmodified — nothing here deletes, renames, moves or
regenerates anything.

The card reads **Paletas**, the approved plural from the `menu_data.py` taxonomy
(`products.json` calls the master "Paleta"). Nothing invented.

### Hero frame geometry

`LS_Paletas_MASTER_v03.png` is 1536×1024 — a **3:2 image in a 16:9 frame**. It
cannot fill the width uncropped: at 1920 wide it would need 1280px of height and
only 1080 exist. So it is height-limited, and ~480px of width is left over no
matter what you do.

Centring it would leave two symmetric dead margins. Instead the image is pushed
right to the action-safe edge and the leftover strip becomes a **type column**
holding the logo and the name card:

```
┌──────────────────────────────────────────────────────────┐  1920×1080
│  ╭─logo─╮   ╭────────────────────────────────────────╮   │
│  │ 250px│   │                                        │   │  hero 1380×920
│  ╰──────╯   │        LS_Paletas_MASTER_v03           │   │  x 486–1866
│             │            1380 × 920                  │   │  y 80–1000
│  ╭────────╮ │         exactly 3:2, no crop           │   │
│  │Paletas │ │                                        │   │  104% of useful
│  ╰────────╯ │                                        │   │  height
│             ╰────────────────────────────────────────╯   │
└──────────────────────────────────────────────────────────┘
   type column          the artwork's own aspect ratio
```

1380/920 is exactly 3:2, so the artwork lands pixel-exact — **no crop, no
letterbox, no distortion.** The column is also the tell: it is the only frame
without a centred name card, and that difference is what reads as *hero* rather
than *another product row*.

## Product scale — sized for a room, not a monitor

Every master is a 2000×2000 transparent PNG, but the **food inside fills anywhere
from 17% to 88% of that canvas**. `object-fit: contain` fits the canvas, so
fitting the canvas made some products render nearly 5× smaller than others — the
Crazy Shakes in particular were disappearing.

`scripts/measure-masters.py` measures the true alpha bounding box of all 47
(read-only, nothing written back to the assets). `build-frames.py` then scales
and offsets each cut-out so its **food** — not its canvas — fills the shot box,
and stands it on the box floor:

```
k    = min(boxW / foodW, boxH / foodH)     # contain, against the food
left = (boxW - foodW·k) / 2 - x0·canvasW·k # centre the food
top  = (boxH - foodH·k)   - y0·canvasH·k   # stand it on the floor
```

The full master is still drawn — it simply overflows the shot box as transparent
padding. **Nothing is ever cropped.**

| Scene shape | Shot box | Food height | % of useful height |
|---|---|---|---|
| Mixed ×3 | 540×600 | 600px | 68% |
| Mixed ×2 | 760×600 | 600px | 68%, and ~40% wider each |
| Cluster ×2 | 700×620 | 620px | 70% |
| Cluster ×3 | 520×620 | 620px | 70% |
| Cluster ×4 (fan) | 460×620, −56px overlap | 620px | 70% |
| **Hero ×1** | 1380×920 | 920px | **104%** (it uses action-safe, being artwork) |

Useful height is the title-safe box, 1080 − 2×96 = 888px.

`transform-origin` is emitted per image at the **bottom-centre of the food**, so
any scale or rotate in the build pass pivots on the product's base rather than on
the middle of a transparent square.

## Where each value comes from

| Layer | Value | Source |
|---|---|---|
| Field / background | pink→purple brand gradient | `brand.json` → `gradient` (from `hotPink`, to `deepPurple`) |
| Reading areas | cream panels behind every name | `brand.json` → `visualDirection.readabilityRule` |
| Product name | Title case, weight 700, deep purple | `brand.json` → `typography.hierarchy[menuItem]` |
| Category ribbon | ALL CAPS, weight 700 | `brand.json` → `typography.hierarchy[categoryTitle]` |
| Accents | electric blue, sunny yellow | `brand.json` → `color.palette`, role "bring energy" |
| Type family | Noto Sans 400 / 700 / 900 | `brand.json` → `typography.family` |
| Logo | primary lockup, whole, unaltered | `brand.json` → `logo` |
| Motifs | rounded panels, drips, waves, stars, cut-out food | `brand.json` → `visualDirection.motifs` |

## Deliberate deviations, and why

**1. Category ribbon is cream-on-pink, not pink-on-cream.**
`brand.json` assigns `categoryTitle` the colour `hotPink`. That assignment is
read off a page-13 example printed on cream — the guidelines never state it as a
rule (`_hierarchyProvenance` says as much). Hot pink type on the hot-pink
gradient field would be invisible. The ribbon therefore renders cream on the
pink field, which preserves the *intent* (category titles are the loudest thing
on the board) and satisfies the guidelines' own approved-background list, which
includes pink. Item names keep their specified deep purple, on cream.
Verified: `hyperframes check` reports every text check passing WCAG AA.

**1b. Ribbon is centred, not upper-left.**
`brand.json` → `logo.placement` reserves "top center or upper left" for the
logo. The logo takes upper-left, so the ribbon takes top-centre rather than
competing for the same corner.

**2. Noto Sans is used even though the HyperFrames house style bans it.**
`hyperframes-creative/references/typography.md` lists Noto Sans as a
monoculture default to avoid. That guidance is for pieces where the typeface is
a free choice. Here it is a client brand specification with a signed guidelines
PDF behind it, so the brand wins. To remove the two real risks the house style
warns about, the face is **self-hosted**: `scripts/build-brand-css.py` downloads
the Noto Sans latin/latin-ext woff2 subsets into `assets/fonts/` and emits local
`@font-face` rules. No build-time Google fetch, no fail-closed cloud render, no
`font_family_without_font_face` lint warning.

## Values the guidelines do not define

`brand.json` lists these under `notSpecifiedInSource`. The numbers below are
**project working values chosen to ship this video** — they are not brand rules
and must not be promoted into `brand.json` without the client answering.

| Thing | Working value | Why this one |
|---|---|---|
| Gradient angle | `155deg` | Runs pink top-left → purple bottom-right, so product cut-outs sit on the lighter half |
| Gradient stops | default two-stop | `exactStops` is null; nothing invented beyond a plain linear ramp |
| Corner radius | `44px` panels, `999px` pills | "rounded panels" is stated, no radius is |
| TV safe area | 54px action / 96px title | SMPTE convention; `notSpecifiedInSource` names safe-title margins as missing. All **text** (ribbon, name cards) sits in title-safe; the **logo** sits at action-safe, since it is artwork, not text |
| Food height | 68–70% of title-safe height | Read across a room; the food is the message |
| Motion timing | 2.80s / 3.20s scenes, `back.out` entrances | `notSpecifiedInSource` names motion timing, easing and transitions as missing |
| Type sizes | ribbon 96px / name 44px / kicker 28px | `typography.sizes` is null |

If the client answers any of these, the answer belongs in `brand.json`, not here.

## Frame anatomy (product scenes)

```
┌──────────────────────────────────────────────────────────┐  1920×1080
│  ▸ safe-title inset 96px                                 │
│  ╭─logo─╮        ╭─ category ribbon ─────╮               │  logo upper-left
│  │ 250px│        │  HELADOS & PALETAS    │               │  ribbon centred,
│  ╰──────╯        ╰───────────────────────╯               │  cream caps on pink
│   y 54–287                          y 120–212            │  first scene only
│                                                          │
│      ╭───────╮      ╭───────╮      ╭───────╮             │  cut-out MASTERs,
│      │  IMG  │      │  IMG  │      │  IMG  │             │  470px shot box,
│      ╰───────╯      ╰───────╯      ╰───────╯             │  contain, no crop
│    ╭──────────╮   ╭──────────╮   ╭──────────╮            │
│    │Crazy     │   │Helado    │   │Sandwich  │            │  cream pill,
│    │Shake     │   │Chino     │   │de Helado │            │  deep-purple 700
│    ╰──────────╯   ╰──────────╯   ╰──────────╯            │
│                             row y 300–900                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- **Focal:** the cut-outs, centre band, equal optical weight.
- **Edge anchors:** logo upper-left, ribbon top-centre, both inside safe title.
- **Supporting:** cream name pills, directly under each product.

The first sketch put the logo bottom-left, where it collided with the leftmost
name pill — the snapshot caught it. It now sits upper-left per
`brand.json` → `logo.placement`, at action-safe rather than title-safe, and the
product row starts at y 300, clear of it.

A **variant cluster** frame is the same anatomy with one substitution: the row
holds N masters of one product at 40px spacing, and instead of a pill under each
there is a single larger name card centred beneath the whole group at y 908.

```
│      ╭─────╮   ╭─────╮   ╭─────╮   ╭─────╮               │  4 masters,
│      │ IMG │   │ IMG │   │ IMG │   │ IMG │               │  40px gaps —
│      ╰─────╯   ╰─────╯   ╰─────╯   ╰─────╯               │  reads as a set
│                                                          │
│                ╭───────────────╮                         │  ONE card,
│                │  Crazy Shake  │                         │  52px, centred
│                ╰───────────────╯                         │
```
- **Background:** brand gradient + slow drifting wave/drip motifs, never busy
  enough to compete with a cut-out.

## Motion system

Every scene composes named rules from `hyperframes-animation` — no invented
move names. Four entrance treatments rotate across the 17 product scenes so a
56-second reel never reads as one repeated loop:

| Treatment | Used by | Blueprint | Rules |
|---|---|---|---|
| `cascade-slam` | mixed ×3 | `grid-card-assemble` | `waterfall-entry`, `spring-pop-entrance`, `motion-blur-streak`, `sine-wave-loop` |
| `depth-tumble` | mixed ×3 | `grid-card-assemble` | `depth-scatter-assemble`, `spring-pop-entrance`, `sine-wave-loop` |
| `side-swipe` | mixed ×3 | `grid-card-assemble` | `nudge-curve`, `reactive-displacement`, `spring-pop-entrance`, `sine-wave-loop` |
| `burst-pop` | mixed ×3 | `grid-card-assemble` | `center-outward-expansion`, `particle-burst`, `spring-pop-entrance`, `sine-wave-loop` |
| `pair-tilt` | mixed ×2 | `comparison-split` | `split-tilt-cards`, `spring-pop-entrance`, `sine-wave-loop` |
| `pair-rise` | mixed ×2 (alt) | `comparison-split` | `waterfall-entry`, `spring-pop-entrance`, `sine-wave-loop` |
| `hero-reveal` | **hero ×1** | `titlecard-reveal` | `spring-pop-entrance`, `ambient-glow-bloom`, `sine-wave-loop` |
| `variant-fan` | **cluster ×3–4** | `grid-card-assemble` | `center-outward-expansion`, `spring-pop-entrance`, `particle-burst`, `sine-wave-loop` |
| `variant-pair` | **cluster ×2** | `comparison-split` | `split-tilt-cards`, `spring-pop-entrance`, `sine-wave-loop` |
| `variant-swap` | **cluster ×2 (alt)** | `comparison-split` | `scale-swap-transition`, `spring-pop-entrance`, `sine-wave-loop` |

The two cluster treatments both say with motion what the words no longer say:
the flavours **bloom out of one point** (`variant-fan`) or **meet at one centre**
(`variant-pair`), so the group reads as one product rather than several.

The `-alt` rows exist so two adjacent scenes of the same shape never arrive
identically. The plan generator asserts that no two consecutive scenes share a
treatment.

Constant across every product scene: cut-outs hold with a `sine-wave-loop`
breathe so no frame is ever fully static, and name pills land with a
`kinetic-beat-slam` beat a fraction after their product.

## Hard constraints

- The 47 MASTERs are read-only. Never regenerate, recompress, crop, or
  colour-correct one. Scale and position only.
- The logo is never stretched, recoloured, rotated, cropped, or given effects
  (`brand.json` → `logo.misuse`). It may only be scaled and moved.
- No `Math.random()`, no `Date.now()`, no render-time fetch.
- Transforms and paint only — no `width`/`height`/`top`/`left` tweens.
- One paused timeline per composition, registered on `window.__timelines`.
