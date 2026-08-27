# La Sabrosita — website

A bilingual, single-page menu site for La Sabrosita Ice Cream & Snacks in
Swedesboro, New Jersey. It shows the whole menu — 45 products across four
categories — with the client's own cut-out food photography.

There is no framework and no bundler. The site is two HTML shells (one per
language), a handful of ES modules the browser loads directly, and a folder of
webp. It can be served by anything that can serve files.

## Run it

```bash
cd site
npm install          # playwright + sharp, both build-time only
npm run tokens       # brand.json  -> styles/tokens.css and ../INVENTED.md
npm run catalog      # masters + approved copy -> data/menu.json
npm run images       # masters -> public/img (trimmed, ink-normalised webp)
node scripts/build-social.mjs
node scripts/build-site.mjs
npm run serve        # http://localhost:4321
```

`npm run images` is the slow one (about 90 seconds for 62 masters × 3 widths).
It skips anything already built unless you pass `--force`.

## The rules this site is built under

Three of them are not preferences, and breaking any one of them breaks something
outside this folder:

1. **`assets/` is never touched.** Rubric's product catalog stores those exact
   paths and a human approved those exact bytes. `build-images.mjs` reads them
   and writes derivatives to `public/img`. It never writes to `assets/`.
2. **No hex code and no font name is typed into the site source.** Brand values
   come from `../brand/brand.json` through the generated `styles/tokens.css`. If
   the client revises the palette, `npm run tokens` is the whole update.
3. **No product copy is invented.** `data/menu.json` carries the client-approved
   bilingual lines. Where a line is `null`, the card renders name-only. Four
   products render name-only today, and `scripts/smoke.mjs` fails the build if a
   card ever shows a line the client did not approve.

Everything `brand.json` marks `null` and this site had to choose is listed in
[../INVENTED.md](../INVENTED.md), which is generated from `data/invented.json`
so the disclosure cannot drift from the stylesheet.

## What is generated and what is authored

| Generated — do not edit | From |
| --- | --- |
| `styles/tokens.css` | `../brand/brand.json` + `data/invented.json` |
| `../INVENTED.md` | `data/invented.json` |
| `data/menu.json` | `assets/products/masters` + the client's `descriptions.json` |
| `data/images.json`, `public/img/*` | `assets/products/masters` |
| `public/*` | `src/*` + `styles/*` + `data/*` |
| `styles/fonts.css`, `public/fonts/*` | Google Fonts, fetched once |

Everything under `src/`, `styles/` (except `tokens.css`) and `data/ui.json` is
authored by hand.

## Checking it

```bash
npm run check     # seven gates, in parallel, about 40 seconds
```

| gate | what it actually measures |
| --- | --- |
| `functional` | 47 checks: every image decodes and has alt text, no card shows unapproved copy, nothing looks like a price, search ignores accents, the dialog opens centred and closes, the language switch keeps your place, the menu still renders with JavaScript off, cards have painted after a scroll jump, tap targets ≥ 44px |
| `accessibility` | contrast against the **painted pixels** — glyphs hidden, rectangle photographed, opacity composited — plus heading order, landmarks and accessible names, in both languages at two viewports |
| `disclosure` | every custom property in every stylesheet appears in `INVENTED.md`; no hardcoded colour or font anywhere |
| `widths` | 11 widths from 320 to 2560 × 2 languages: 45 cards, no horizontal scroll, no text overflowing its box. 640 is 1280 at 200% zoom, which WCAG 1.4.4 requires |
| `brand` | the **rendered** logo against `brand.json`'s six named misuses, its 250px digital minimum, and its background rule |
| `engines` | the real page in Chromium, Firefox and WebKit — Firefox has no scroll-driven animations, so the fallback has to be real |
| `media` | the client's approved media is byte-identical: git, the guidelines PDF's own recorded hash, and a manifest of all 62 masters |

Design measurements are deliberately separate, because they are targets rather
than pass/fail:

```bash
npm run fill      # the product's share of its tile, vs both benchmark sites
npm run perf      # first-screen and whole-page bytes, LCP, at both viewports
node scripts/tails.mjs        # where the grid leaves a hole, as arithmetic
node scripts/hero-scale.mjs   # the hero subject's share of the first screen
```

And for looking rather than asserting:

```bash
node scripts/verify.mjs --out .shots/x            # build, serve, screenshot, shut down
node scripts/verify.mjs --out .shots/x --strip    # + a six-frame scroll filmstrip
node scripts/blind.mjs --in a.png,b.png,c.png --out .shots/x/blind
```

## Handing it to the client

```bash
npm run handoff   # writes deliverables/<date>_website/
```

The built site, `INVENTED.md`, the questions document, and `CHECKS.txt` — the
gate output captured at the moment the package was built. A package that says
"it passed" without the output is a claim; that file is the receipt.

## What the site deliberately does not say

No prices — there are none. No street address, no opening hours, no phone
number, no social handles, no ingredient or allergen detail beyond the client's
own approved line. Those are questions for the client, and inventing any of them
would put false information in front of a customer. `Swedesboro, New Jersey` is
the only location fact stated anywhere, and it comes from `brand.json`.
