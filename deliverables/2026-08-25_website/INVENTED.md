# INVENTED.md

Values this website chose because `brand/brand.json` says `null`.

**These are not brand rules.** `brand/brand.json` is the official global brand
source of truth, and where it says `null` it says so on purpose — the guidelines
PDF genuinely does not publish that value. Everything on this page is a decision
made to ship a website, recorded so nobody later mistakes it for something the
client approved. If the client answers one of these, the answer belongs in
`brand/brand.json`, not here.

Generated from `site/data/invented.json` by `site/scripts/build-tokens.mjs`.
Editing this file by hand will be overwritten; edit the JSON.

Brand version read: **v01** — transcribed from `guidelines/LS_Brand-Guidelines_v01.pdf`.

## Corner radius

**Why this had to be decided.** brand.json visualDirection.cornerRadius is null. The PDF says 'rounded panels' six times and never publishes a number.

**How it was decided.** Measured off the approved menu card printed on page 17 of the guidelines, rendered at 300 dpi. The card is 1406x704 px there and its corner arc has a 32 px radius — 2.3% of the card's width. Every panel radius below is that same 2.3% ratio applied at that panel's own width. The pill and the squircle are separate measured shapes from the same PDF.

| Token | Value | Note |
| --- | --- | --- |
| `--r-card` | `10px` | 2.3% of a ~430px product card. Matches page 17 exactly. |
| `--r-panel` | `24px` | 2.3% of a ~1040px reading panel. |
| `--r-tile` | `16px` | 2.3% of a ~700px tile; used for mid-size panels. |
| `--r-pill` | `999px` | Observed, not invented: the 'Page 17' badge in the guidelines is a full pill. |
| `--r-motif` | `23%` | Observed: the four rounded colour squares on page 19 measure 96px radius on a 418px side. |

## Two text greys that page 17 shows but that fail AA

**Why this had to be decided.** The approved card on page 17 sets its description in a warm grey that samples around #716C68–#787276, and its supporting note in a lighter grey around #948F8B. On the cream reading area those measure roughly 8:1 and 3.0:1. The lighter one fails WCAG AA at any size.

**How it was decided.** The description grey is used as measured. The supporting grey is darkened along the same hue until it is the lightest value that passes AA on cream — no further. brand.json does not name either colour, so neither is a brand value; the PDF only demonstrates them in a rendered example.

| Token | Value | Note |
| --- | --- | --- |
| `--c-body` | `#4a4448` | Card and paragraph text. 9.0:1 on cream. Within the range sampled off page 17. |
| `--c-muted` | `#6f686b` | Supporting detail. Page 17's own value is about 3.0:1 and fails AA; this is 5.15:1, the lightest value on the same hue that passes. |

## Type sizes and line heights

**Why this had to be decided.** brand.json typography.sizes and typography.lineHeights are null. Page 17 publishes relative hierarchy only.

**How it was decided.** The three text levels on the page-17 card measure 26.1 / 18.7 / 13.0 px at a 1280px-wide slide — a ratio of 1 : 0.72 : 0.50, with the description set at 1.35 line height. The site's card scale reproduces that ratio. Display sizes above the card are a 1.25 minor-third scale continued upward, and fluid via clamp().

| Token | Value | Note |
| --- | --- | --- |
| `--fs-item` | `clamp(1.125rem, 0.9rem + 0.6vw, 1.375rem)` | Menu item name — the '1' of the measured ratio. |
| `--fs-desc` | `clamp(0.875rem, 0.8rem + 0.25vw, 1rem)` | 0.72 of the item name, per page 17. |
| `--fs-note` | `0.6875rem` | 0.50 of the item name, per page 17. |
| `--lh-desc` | `1.35` | Measured: 76px baseline-to-baseline on an 18.7px face. |
| `--lh-tight` | `1.05` | Display headings. Not in the PDF. |
| `--fs-display` | `clamp(2.75rem, 1.2rem + 6.4vw, 7rem)` | Hero. Not in the PDF. |
| `--fs-section` | `clamp(1.75rem, 1.1rem + 2.4vw, 3.25rem)` | Category titles. Not in the PDF. |
| `--tracking-caps` | `0.06em` | Letter-spacing for the ALL-CAPS category titles page 17 calls for. The PDF does not publish tracking. |

## Spacing scale

**Why this had to be decided.** brand.json notSpecifiedInSource lists 'Spacing / layout scale'.

**How it was decided.** A plain 4px base scale. Nothing in the guidelines suggests a different rhythm, and 4px divides the measured card padding (28px left, 30px top) cleanly.

| Token | Value | Note |
| --- | --- | --- |
| `--s-1 … --s-12` | `4 8 12 16 24 32 40 48 64 80 96 128 px` | — |
| `--pad-card` | `clamp(16px, 6cqw, 28px)` | Page 17's card padding is 6.0% of card width; expressed as a container query unit so it holds at any card size. |

## Gradient

**Why this had to be decided.** brand.json gradient.exactStops and gradient.angleDeg are null, with an explicit warning not to fill them in and call the result approved.

**How it was decided.** Used only where the PDF permits — as a large supporting visual, never inside the logo, always with high-contrast type over it. Stops and angle below are this project's choice and are NOT brand-approved.

| Token | Value | Note |
| --- | --- | --- |
| `--grad-brand` | `linear-gradient(160deg, hotPink 0%, deepPurple 100%)` | UNAPPROVED. Ask the client before this appears in print. |

## Elevation

**Why this had to be decided.** The guidelines forbid effects on the logo and publish no shadow spec for anything else.

**How it was decided.** Shadows are tinted with deepPurple rather than black so they sit inside the palette instead of greying it.

| Token | Value | Note |
| --- | --- | --- |
| `--shadow-card` | `0 1px 2px rgba(75,21,87,.06), 0 8px 24px -8px rgba(75,21,87,.14)` | — |
| `--shadow-lift` | `0 2px 6px rgba(75,21,87,.10), 0 24px 48px -16px rgba(75,21,87,.26)` | Hover / focus state. |
| `--shadow-food` | `drop-shadow(0 18px 22px rgba(75,21,87,.22))` | Contact shadow under a cut-out so the food sits on the page instead of floating. |

## Motion

**Why this had to be decided.** brand.json notSpecifiedInSource lists 'Motion timing, easing, or transition rules for animated surfaces'. The PDF gives a character — 'vibrant, playful, appetizing', 'rounded animated shapes' — and no numbers at all. Everything below is this project's choice.

**How it was decided.** Two eases and three durations, and then one governing rule that decides where each is allowed to be used: a reveal is a function of SCROLL POSITION, never of elapsed time. A time-based reveal has a mid-flight state that depends on when the customer arrived, which is what made the previous build look half-loaded 120ms after a scroll jump; a scroll-linked one is always in the state its position implies. So the durations below apply only to hover, to the product-view transition, and to the two things at the top of the page that have no scroll position to read. Everything else is expressed as a range of scroll, in the browser's own `entry` / `cover` units, and has no duration at all. Nothing a customer reads is ever animated: card tiles, names and descriptions are painted at full opacity in the first frame and never move. Every animated property is opacity, translate, rotate or scale. All of it is disabled under prefers-reduced-motion, and motion.css ends with a global switch that also zeroes the transitions declared in the six stylesheets it does not own.

| Token | Value | Note |
| --- | --- | --- |
| `--ease` | `cubic-bezier(.22,1,.36,1)` | The default. Front-loaded, so a scroll-linked reveal is most of the way there almost as soon as the element appears. |
| `--ease-spring` | `cubic-bezier(.34,1.56,.64,1)` | Overshoot, for the 'playful' attribute on page 4. Used on the page-19 motif squares, the chapter count and hover. |
| `--dur-fast` | `160ms` | Chip states, the dialog backdrop. |
| `--dur` | `280ms` | Hover, and the product-view panel. |
| `--dur-slow` | `560ms` | The hero lines settling in on load. |
| `Cut-out reveal (scroll range)` | `entry 0%–80% geometry, entry 0%–34% opacity` | As a card enters the window its photograph rises 18px and grows from 0.92, and comes up from 0.5 opacity. The opacity finishes first and deliberately early: measured across 24 scroll positions at both viewports, the only cut-outs ever below full strength are on cards showing 22px or less of themselves at the very bottom edge. |
| `Cut-out parallax (scroll range)` | `cover 0%–100%, ±9px (±18px on the 2x2 tile)` | The photograph drifts against its own tile as the card crosses the window, so rows sit on different planes. Every card in a row shares a viewport position, so a row’s baseline stays level. The 2x2 feature tile is twice the size and gets twice the travel, which is the same drift, not a louder one. |
| `Chapter header (scroll ranges)` | `title rise cover 0%–26%, rule draw cover 2%–40%, motif squares cover 4/7/10%–26/29/32%, count cover 8%–30%` | The category title only rises — it is never faded, because a heading at partial opacity in a still frame is indistinguishable from a page that failed to load. The three page-19 motif squares scale from 0 with a -35° twist on the overshoot ease; they are decoration and carry no text. The stagger between them is three different scroll ranges, not three delays. |
| `Hero float` | `6.4s / 7.9s / 5.3s, -7px→8px, -1.1°→1.4°` | The only infinite animation on the site. Three periods that do not divide into each other, so the three cut-outs never fall into step. Paused whenever the hero is off screen. An 8px bob cannot hide anything, which is why it is allowed to be time-based. |
| `Hero lines on load` | `--dur-slow, 22px rise, 0/60/120/180ms` | The only stagger anywhere on the site, and the only clock-driven reveal. Allowed because it is translate-only: every line is fully opaque in the first frame, so nothing is waited for and Largest Contentful Paint is untouched. |
| `Hover on a cut-out` | `rotate -2.6°; badge scale 1.09 / rotate 4°; chip dot scale 1.55` | card.css already lifts the tile and grows the photograph; the tilt is what makes it read as picking something up rather than inflating it. Gated on a real pointer so it cannot latch after a tap on a phone. |
| `Card → product view` | `panel --dur from scale 0.97; photograph 420ms after a 60ms lag` | The big photograph starts life in the exact rectangle the card’s cut-out occupied and flies from there, so the dialog reads as the same food enlarged rather than as a new screen. The 60ms lag lets the reading panel arrive first. |
| `prefers-reduced-motion` | `every rule above is absent, not shortened` | Verified rather than promised: document.getAnimations() comes back empty on a loaded and fully scrolled page, hovering a cut-out and opening the product view start nothing, and two screenshots a second apart are byte-identical. |

## English category labels

**Why this had to be decided.** The client's four menu categories are Spanish. The English view needs an English word for each. brand.json does not translate them.

**How it was decided.** Direct translation of the category, not of any product. No product name is ever translated — those are the client's menu-board wording.

| Token | Value | Note |
| --- | --- | --- |
| `Helados` | `Ice Cream` | — |
| `Antojitos` | `Savory Snacks` | 'Antojitos' has no single English word; 'Savory Snacks' describes what is in the category. |
| `Postres` | `Desserts` | — |
| `Bebidas` | `Drinks` | — |

## Interface copy

**Why this had to be decided.** The brief supplies product copy only. Buttons, nav labels and section headings still need words.

**How it was decided.** Kept to plain nouns and verbs in both languages. No marketing claim is made about the shop, no ingredient is described, and nothing is said that the client has not already said on their own menu.

| Token | Value | Note |
| --- | --- | --- |
| `nav / sections / buttons` | `see site/data/ui.json` | Every UI string in both languages lives in one file so the client can correct any of it in one place. |

## Things this site deliberately does NOT say

**Why this had to be decided.** Inventing these would put false information in front of customers.

**How it was decided.** Left out entirely. They are questions for the client.

| Token | Value | Note |
| --- | --- | --- |
| `Prices` | `omitted` | The brief says there are none anywhere. None appear. |
| `Street address` | `omitted` | Only 'Swedesboro, New Jersey' is stated, which is brand.json brand.location. |
| `Opening hours` | `omitted` | Not known. |
| `Phone / email / social handles` | `omitted` | Not known. |
| `Ingredient and allergen detail` | `omitted` | Beyond the client-approved line, nothing is added. |

## Logo clear space in the footer

**Why this had to be decided.** brand.json logo.clearSpace measures the minimum in mascot-bow heights — a feature of the artwork, not a pixel value. Nobody has measured the bow.

**How it was decided.** Rather than measure it badly, the footer uses a deliberate over-estimate: clear space equal to 20% of the logo's rendered width on every side. That is larger than the bow appears to be at any size the footer renders, so the rule is satisfied by exceeding it. If the client or the designer gives a real bow measurement, this can come down.

| Token | Value | Note |
| --- | --- | --- |
| `--foot-clear` | `calc(clamp(250px, 22vw, 300px) * 0.20)` | Over-estimate of one mascot-bow height. Not a measurement. The clamp mirrors the footer logo's own rendered width so the two cannot drift; the whole-site pass took that logo from 340px to 300px when the footer became a two-column lockup, and this followed it. |

## Product card geometry

**Why this had to be decided.** brand.json publishes one approved card (page 17) and no layout system around it. Everything about how a photograph is seated inside a card — how much room the food gets, where it rests, how the cream panel meets the colour above it — had to be decided.

**How it was decided.** Round 1 sized the photo frame to the square canvas the derivative is exported on, then divided that square by the largest ink-normalisation multiplier in the catalogue so the single thinnest paleta could not crop. Measured across all 62 photographs that left the median cut-out at 37.7% of the card's width. Round 2 sizes the frame to the FOOD instead, using the `fillW` / `fillH` that data/images.json publishes for each photograph, and the two targets below are what a cut-out is allowed to grow to. They were chosen by modelling all 62 photographs against them and then shooting the result (.shots/card-r2): the median cut-out is 69% of the card's width and 113% of it in height, against 87% and ~51% for michoacana's packshot and ~46% for heladosmexico's. Everything is in container-query units so one shape holds from a 169px phone tile to the ~475px feature tile.

| Token | Value | Note |
| --- | --- | --- |
| `FOOD_MAX_W (card.js)` | `0.94` | The most of the card's width a cut-out may occupy. 3% of clear field is left on each side. michoacana runs its packshot to 87% of its tile and heladosmexico bleeds off the tile entirely, so this is deliberately at the generous end. |
| `--stage-h` | `1.34` | The ceiling on the coloured field's height, in card widths. Not square: 38 of the 62 photographs are taller than wide once fitted to the food. It is a ceiling rather than a height — grid.js shrinks each row's field to the tallest photograph actually in that row — so raising it costs a row of flat products nothing. Five values were built and measured with scripts/fill-check.mjs (the product's share of its own tile, desktop / mobile): 1.18 -> 35.3 / 35.7, 1.22 -> 35.3 / 36.6, 1.26 -> 41.9 / 47.2, 1.34 -> 42.4 / 47.1, 1.40 -> 43.7 / 46.6. Desktop keeps climbing and mobile turns over, because a two-up phone row pairs a tall product with a flat one more often; 1.34 is the top of both curves. |
| `FOOD_MAX_H (card.js)` | `--stage-h less EDGE_CLEAR top and bottom = 1.280 card widths` | The most of the field a cut-out may occupy vertically. Round 1 spent 17cqw here on "clearance"; this leaves only what the scallop needs. |
| `EDGE_CLEAR (card.js)` | `0.03` | Not breathing room. The cream scallop where the panel meets the colour rises min(5.6cqw, 16px) / 2.48 = up to 2.3cqw into the field, and a product whose base stops short of that is nibbled by a wavy cream edge — shot at 0.012 and the Helado Viral box lost its bottom edge to it. card.css also lifts the frame half a scallop above centre, spending clearance the top of the field is not using on the one edge that has something in it, so this number is the other half plus a visible margin of field under the food. The sink is capped against it too. |
| `NORM_MID / NORM_FLOOR (card.js)` | `1.005 / 0.88` | data/images.json's visualScale normalises ink coverage. Applied as a raw multiplier it forced every card to shrink so the one photograph at 1.45 would fit. It is applied instead as a modulation about the catalogue's median (1.005) and clamped downward only, so it can quieten a heavy product and can never push one past the field. Worst case it costs a single card 12%. |
| `GROUND (card.js)` | `0.5` | How much of a photograph's own vertical slack is used to drop it toward the panel. The one number here that is a judgement rather than a measurement: at 1 a flat wrapped package is marooned on the bottom edge, at 0 nothing looks like it rests on anything. See .shots/card-r4 and card-r5. |
| `frame, food-w, food-h, sink (set by card.js)` | `derived, in cqw` | Not choices. --frame is min(FOOD_MAX_W / fillW, FOOD_MAX_H / fillH) modulated by the ink normalisation; the other three fall out of it. They are published as container-query lengths so card.css never repeats the arithmetic, the contact shadow can be drawn to the size of the food it belongs to, and grid.js can read --food-h and --sink back to size each row. |
| `--contact-w` | `0.8 x --food-w, 0.14 aspect` | The contact shadow directly under the cut-out, --c-dark at 18% alpha. Sized from the food rather than the card, so a tray of nachos and a paleta each get their own. No new colour: --c-dark is a brand.json contrast field and the tight drop shadow already uses it. |
| `food drop shadow` | `0 5cqw 6cqw of --c-deep-purple at .22, plus 0 1cqw 1.6cqw of --c-dark at .20` | tokens.css's --shadow-food is 0 18px 22px, a fixed geometry that is a smudge under a 70px cut-out and a hairline under a 550px one. The colours are the token's; only the offsets are re-expressed in container units so they hold at both. The dark second layer exists because a deep-purple shadow on the deep-purple chapter is that tile's own colour over itself. |
| `--field` | `the category accent, .90 to 1 alpha, top to bottom, over cream` | A slight vertical fall so a flat field does not read as a swatch. The accent is looked up by the name menu.json already carries. |
| `spotlight (--c-base-cream at .28)` | `radial 74% x 62% at 50% / 58%` | A pool of light behind the cut-out so a white styrofoam cup or a clear tray separates from a saturated field. Cream over the brand colour — no new colour. At the round-1 values (.17 over 58% x 44%) it was invisible in the screenshot and did none of that work. |
| `--desc-size` | `var(--t-desc, --fs-item x 0.72)` | Page 17's measured name-to-description ratio, taken from type.css where type.css publishes it. |
| `--panel-reserve` | `calc(2.3 x --fs-item + --s-2 + 2.7 x --desc-size + 2 x --pad-card)` | Room for the tallest thing the panel ever holds, so names line up across a row. It is the wrong shape — it is the tallest panel in the CATALOGUE applied to every card — but only the grid knows which cards share a row. `--row-panel` overrides it if grid.js ever publishes a per-row measurement. |
| `--bump-w` | `min(5.6cqw, 16px), 2.48:1, with --scallop as its height` | The wave where the cream panel meets the colour. brand.json asks for "rounded panels, subtle drips, soft waves" and publishes no radius or amplitude. Declared on the card rather than on the panel that draws it, because the photo frame has to stay clear of it and both need to read the same number. Capped as well as proportional: on a doubled tile a purely proportional bump arrives at 34px and reads as bunting. |
| `--scallop` | `calc(var(--bump-w) / 2.48)` | Derived, not a choice. The frame is lifted by half of it and the food is kept clear of the other half. |
| `badge inset` | `5cqw` | Multi-photo marker. It sits on the stage above the food, because a cut-out that fills its field passes under it. |
| `hover lift` | `6px tile, 1.025 on the food` | Gated on (hover: hover) so it cannot latch after a tap. Much smaller than round 1's 1.055: the tallest cut-out now stands 128cqw, and growing that 5.5% puts its base through the scallop. |

## The type scale's own tokens

**Why this had to be decided.** brand.json typography.sizes and typography.lineHeights are null. Page 17 publishes relative hierarchy only.

**How it was decided.** Page 17 is the origin: its three card levels measure 1 : 0.72 : 0.50, so --fs-item is the '1' and the card's second level is derived from it with calc() rather than carrying its own clamp — which keeps the measured 0.72 true at every viewport width instead of only at the top of a clamp. The levels above the card continue the same 1.389 step upward. Two of the sizes below are forced by the contrast table rather than chosen: white on hot pink is 4.06 and hot pink on cream is 3.85, both legal as large text only, and WCAG's large-text floor is 14pt bold = 18.67px.

| Token | Value | Note |
| --- | --- | --- |
| `--t-display` | `clamp(2.75rem, 1.915rem + 3.43vw, 5rem)` | Hero. 44px at 390, 80px at 1440. One step above the section size. |
| `--t-deck` | `clamp(1.5rem, 1.407rem + 0.38vw, 1.75rem)` | The hero's second line. Never below 24px, because it is regular-weight white on hot pink and 24px is where the 3:1 floor applies. |
| `--t-lead` | `clamp(1.125rem, 1.05rem + 0.3vw, 1.3125rem)` | Standfirst and dialog description. |
| `--t-eyebrow` | `1.1875rem` | 19px. The smallest size at which bold white-on-pink and bold pink-on-cream are legal — not a taste decision. |
| `--t-desc` | `calc(var(--fs-item) * 0.72)` | Exactly 0.72 of the item name at every width, which is what page 17 measures. |

## Page frame

**Why this had to be decided.** brand.json notSpecifiedInSource lists 'Spacing / layout scale'. Nothing in the guidelines suggests a page width or a gutter.

**How it was decided.** The width is set so that five product cards sit at a size where the food still reads, and the gutter is fluid so a phone loses margin before it loses card.

| Token | Value | Note |
| --- | --- | --- |
| `--maxw` | `1320px` | Content width. Five cards plus gutters at 1440. |
| `--gutter` | `clamp(16px, 4vw, 48px)` | Page margin. |

## What goes in the URL

**Why this had to be decided.** Not a brand question — a decision about what the site remembers, which nothing in the guidelines speaks to.

**How it was decided.** Only two things, both of which the customer typed or tapped and neither of which is private: which category they are looking at, and what they searched for. They live in the query string rather than the hash so they survive the language switch, which is an ordinary link. Nothing is stored on the device, and no identifier of any kind is created.

| Token | Value | Note |
| --- | --- | --- |
| `?c=` | `category id` | Omitted when the category is 'all'. |
| `?q=` | `search term` | Omitted when empty. |
| `history` | `replaceState` | So typing a search does not put one history entry per keystroke between the customer and the back button. |

## Grid layout

**Why this had to be decided.** brand.json says nothing about how many products sit in a row, how a section ends, or how a sticky bar behaves. The guidelines describe one card, not a catalogue of 45.

**How it was decided.** The column counts step down at widths where the food stops reading rather than at conventional device breakpoints, and were chosen by measuring the product's share of its tile at each step (scripts/fill-check.mjs). The sticky offsets are measured from the rendered header at runtime rather than typed, so a change in the header cannot silently push the sticky bar out of place. The sparse-section width exists because no column count divides all four categories evenly — see scripts/tails.mjs.

| Token | Value | Note |
| --- | --- | --- |
| `--cols` | `5 / 4 / 3 / 2` | Steps down at 1180, 900 and 640. Two across is the floor: one across turns 45 products into 45 scrolls. |
| `--nav-h` | `64px, then measured` | A fallback only. grid.js replaces it with the header's real rendered height, so the sticky category bar cannot drift when the header changes. |
| `--bar-h` | `60px` | Height of the sticky category bar, which the section headings offset against. |
| `--fade` | `linear-gradient(90deg, black 0, black calc(100% - 28px), transparent 100%)` | A mask, not a colour — black here means opaque. It is how a chip half off the edge reads as 'there is more this way' instead of as a chip cut in half. |
| `--sparse-w` | `calc(var(--n) * 300px + (var(--n) - 1) * var(--s-5))` | Width a section falls back to when it has too few products to fill a full row, so a short category ends deliberately instead of leaving holes. |

## Type sizes and tracking typed as literals

**Why this had to be decided.** brand.json typography.sizes, typography.lineHeights and letter-spacing are ALL null, so every type size and every piece of tracking on this site is a choice. Most of them live in tokens; these six were typed straight into a rule, and a literal is the easiest kind of invented value to introduce without noticing. scripts/check-invented.mjs now fails until each one appears here.

**How it was decided.** Each is recorded with what it is and why it is not a token. Two of them are not really design decisions at all — one is the deck's own floor reused, and one is a browser behaviour — and saying so is more honest than promoting them to tokens to make a checker quiet.

| Token | Value | Note |
| --- | --- | --- |
| `hero.css .hero__lead-b` | `1.5rem` | 24px — exactly the floor of --t-deck, which type.css declares and this file already documents. There is no token for 'the deck's floor on its own', so it is written as the number it is. |
| `nav.css .nav__word` | `1.375rem` | 22px. The wordmark beside the mark in the header. Sized to hold its own against the search field rather than to a step of the scale. |
| `nav.css .search__input` | `1rem` | 16px, and NOT a taste decision: iOS Safari zooms the whole page when a field smaller than 16px takes focus, and a zoomed page under a sticky header is a trap. |
| `grid.css .filter` | `0.9375rem` | 15px. Filter chips — a control, deliberately a step below the card's item name so a chip never competes with a product. |
| `type.css display tracking` | `-0.02em` | Headings. The PDF publishes no tracking at all; large bold type needs negative tracking to avoid reading as loose. |
| `type.css item-name tracking` | `-0.01em` | Card names. Half the display value, because the size is half. |
| `nav.css .nav__cat` | `1.3125rem` | 21px. The category links, deliberately the biggest type in the header — bigger than the 16px wordmark and the 16px search placeholder — because the four words naming what the shop sells are the most valuable thing in that bar. Narrows back toward 19px where the row is genuinely tight. |

## Metric-matched fallback fonts

**Why this had to be decided.** brand.json publishes one family, Noto Sans, with a fallback stack of Helvetica Neue, Arial, sans-serif. It does not say what should happen in the moment before the webfont arrives — and that moment is when a page reflows under the reader's thumb.

**How it was decided.** Two extra @font-face families are declared, each pointing at a font the brand's own stack already names, stretched to occupy exactly the space Noto Sans will. No new typeface is introduced and the visible font is unchanged. The numbers were measured in a browser, same string at 100px: Noto Sans 3375.3 wide with ascent 107 and descent 29; Helvetica Neue 3245.2 (Noto is 1.0401x wider); Arial 3224.4 (1.0468x). The ascent and descent overrides are Noto's own metrics divided by that factor, because the overrides are relative to the adjusted em. Measured after: the fallback now matches Noto's width to within 0.66%, from 3.9% before.

| Token | Value | Note |
| --- | --- | --- |
| `'Noto Sans metric Helvetica'` | `size-adjust 104.01%, ascent 102.87%, descent 27.88%` | local('Helvetica Neue'). macOS. |
| `'Noto Sans metric Arial'` | `size-adjust 104.68%, ascent 102.22%, descent 27.70%` | local('Arial'). Windows and most others. |
| `font stack order` | `'Noto Sans', metric Helvetica, metric Arial, then brand.json's own stack` | The real face still wins whenever it is available; these only stand in before it arrives. |

## The seam between two brand fields

**Why this had to be decided.** brand.json's visual direction names "subtle drips" and "soft waves" as motifs but publishes no depth, no period and no shape for either. Every place a brand field meets another field on this site — the header over the hero, the hero over the menu, each card's colour over its cream panel, the menu over the footer — is therefore an invented edge.

**How it was decided.** The page uses two depths, not four. A seam a customer SCROLLS PAST is shallow: the header's drip and the hero's bottom edge both run clamp(10px, 1.15vw, 17px). The one seam a customer STOPS at — the footer — is clamp(30px, 4.4vw, 62px), about 3.6x deeper, because it is read at rest. The period is 65.45px at both, which is 22 lobes across a 1440px screen; it was set on the footer first and the other two follow it. The hero's shape is the CARD's half-disc rather than the header's irregular lobe, because the hero's seam is the one that carries food across it and the card's scallop is the site's only other seam that does. The values live in hero.css beside the rule that uses them; there is no shared token because two of the three edges are drawn as SVG paths, where a length cannot reach.

| Token | Value | Note |
| --- | --- | --- |
| `--seam` | `clamp(10px, 1.15vw, 17px)` | Depth of the hero's shaped bottom edge. The same clamp .nav__drip uses; if that changes, this changes with it. The hero's own min-height carries the same value so the teeth sit below the fold. |
| `--seam-w` | `65.45px` | One lobe's width. The footer drip's period, so 22 lobes across 1440px — the same rhythm at all three page-scale seams. |

## What was measured rather than invented

Three of the numbers above came out of the guidelines PDF itself rather than out
of taste. They are recorded here so the measurement can be re-checked:

| Measurement | Source | Value |
| --- | --- | --- |
| Menu card corner radius | page 17, the approved card, rendered at 300 dpi | 32 px arc on a 1406 px wide card = **2.3% of width** |
| Menu card text ratio | page 17, three text levels | **1 : 0.72 : 0.50** (item : description : note) |
| Menu card description line height | page 17, baseline to baseline | **1.35** |
| Menu card padding | page 17, left inset of all three text levels | **6.0% of card width** |
| Motif square corner radius | page 19, the four colour squares | 96 px arc on a 418 px side = **23% of the side** |
| Menu item name colour | page 17, sampled | `#4E115E` — the deep purple brand.json already records |
| Supporting note colour | page 17, sampled | `#1896D7` — the electric blue brand.json already records |
