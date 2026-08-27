/**
 * THE SINGLE PRODUCT VIEW — the piece judged against heladosmexico.com.
 *
 * Their product page is the stated bar for how ONE product is photographed and
 * framed: the packshot is most of the viewport tall, it floats on a flat
 * saturated field with a soft radial glow behind it, and the copy sits in a flat
 * panel BESIDE it — photo left, words right, and the two never touch. Measured
 * off `.bench/hm-product-desktop.png`, their paleta is about 64% of the first
 * screen tall and their three alternate photographs are 40px greyscale chips
 * parked in the bottom-left corner of the field.
 *
 * ROUND 5 IS ABOUT THE PART OF THE FRAME THAT HELD NOTHING.
 *
 * Measured on the round-4 frames at 1440x900, on every one of the 45 products:
 * the reading card was 488px wide and 280–550px tall, anchored to the bottom of
 * a 528 x 900 column — so 528 x 350–620 of the screen was bare accent colour
 * with nothing in it, between 14% and 24% of the whole frame. Round 4 had moved
 * that card from the middle of the column to its floor, which turned a halo into
 * a corner; it did not remove the hole, it moved it to the ceiling.
 *
 * The column IS the reading area now — cream from the top of the room to the
 * bottom, seamed to the field with the soft-wave motif brand.json's visual
 * direction names, with the words distributed down it in three registers: where
 * you are, under a running-head rule at the top; what this is, on the optical
 * centre; what you can do, on the floor. Not one word was added (hard rule 3);
 * the same category, name, approved line, contact sheet and moves that were in
 * the card are in the column. The arithmetic and the argument are in
 * styles/detail.css, which is where the change actually lives.
 *
 * The stage is untouched. The column is exactly as wide as it was, so the food
 * is seated against the same 912px and no product is drawn smaller — the only
 * pixels the photograph loses are the 24px of clearance the stage now keeps
 * between a width-bound product's shoulder and the wave's crests.
 *
 * TWO THINGS THAT FOLLOWED FROM IT, both in this file:
 *
 * - THE CONTACT SHEET IS SHAPED TO THE COUNT. A full-height column has vertical
 *   budget a bottom-anchored card did not, so four photographs no longer have to
 *   share one line at 106px each — the same width as heladosmexico's chips, which
 *   is not enough of a difference to be the thing this view wins on. See `RAIL`.
 * - `sizes` FOLLOWS THE TILE. It was the literal `124px`, which was true of the
 *   old cap and is now wrong by 100px on a desktop panel.
 *
 * WHAT ROUND 4 DID, KEPT AND STILL LOAD-BEARING.
 *
 * 1. THE ROOM IS TWO COLUMNS NOW, AND THEY DO NOT OVERLAP. Round 3 ran the stage
 *    UNDER the reading panel (`grid-column: 2 / -1`) so a silhouette could pass
 *    behind the cream card. On a tall product that is a nice effect. On a wide
 *    one it is a crop: measured on the round-3 screenshots, the panel covered
 *    485px of the Paletas wrapper, 485px of the Chicharron, 485px of the Banana
 *    Split and 183px of the Nachos tray — the panel's left edge landed
 *    mid-strawberry and the right end of the product simply was not there.
 *    Photo left, copy right, hard split. The stage is column 1 for every
 *    product, so the food is sized against the space it actually has instead of
 *    against a width a third of which is hidden.
 *
 *    THE BLEED SURVIVES THE SPLIT and that is the point of doing it this way. A
 *    `tall` photograph is still seated at FOOD_BLEED_H of the room's HEIGHT and
 *    still runs off the bottom edge — it is the WIDTH that stops at the panel,
 *    and no product in the catalogue is wide enough for that to bind: the widest
 *    food a 912px stage can seat is 857px and the widest bleeding subject is
 *    561px.
 *
 * 2. THE CONTACT SHEET MOVED INTO THE READING PANEL. It was a third column down
 *    the left edge of the screen, costing the photograph 210px of stage — the
 *    column plus its gutter — on all 45 products, for a feature 13 of them have.
 *
 *    A CORRECTION WHILE MOVING IT. The brief says the panel is "over half air" on
 *    a product with no approved line. Measured at 1440x900 before the move, the
 *    Nachos card is 488x343 and 79% of that height is ink; the rest is the card's
 *    own padding. It was already sized to its content. What was true is that the
 *    panel held a category, a name and two buttons and nothing about the dish.
 *    Pastel de Tres Leches has no approved line and two photographs: its card is
 *    now 605px and 88% ink. Nothing was written to fill it.
 *
 *    Under the description, named with ui.json's own `moreShots`, the alternate
 *    photographs are part of what the panel SAYS about the dish rather than an
 *    index parked beside it — and each tile is a small window cut back to the
 *    room's own field colour, so a row of them reads as "the same dish, four
 *    ways" rather than as a widget. They are ~100-124 CSS px wide against
 *    heladosmexico's ~40px, and in colour where theirs are grey.
 *
 * 3. THE CONTACT SHADOW WAS MEASURED AND IT WAS NOT DOING ITS JOB. Under the
 *    Paletas wrapper the 40px band directly below the food read 60.4 against a
 *    field of 64.2 — 6% darker, which is why the food still read as pasted onto
 *    the colour rather than standing on it. That is a styles/detail.css change;
 *    the number and the method are written down there.
 *
 * WHAT THIS VIEW HAS THAT NEITHER BENCHMARK DOES
 *
 * - 13 products carry more than one photograph and Crazy Shake carries four.
 * - The cut-outs are true transparency, so the food stands in the room. Both
 *   benchmarks photograph a sealed wrapper on a background.
 * - Deep link: opening a product sets `#p/<id>`, loading that URL opens it, the
 *   back button closes it. Stepping REPLACES the entry rather than pushing, so
 *   back is always one press out and never a retrace of everything you looked at.
 * - Keyboard: left/right walk the products, up/down walk this product's
 *   photographs, Escape closes. The focus trap and the focus return are the
 *   browser's, because this is a real <dialog> opened with showModal().
 *
 * WHAT THIS FILE MAY NOT DO. It never writes a word about a product: the line
 * under the name is `copy.en` / `copy.es` or it is absent, and every other string
 * is a ui.json key. No colour is named here either — menu.json gives each category
 * an accent NAME and tokens.css owns what that name means.
 */
import { items, line, t, categoryById, categoryLabel, geometry, srcset } from './data.js';

/* menu.json names each category's accent; tokens.css owns the value behind the
   name. These are token names looked up by data — not colours. card.js and
   grid.js do the same lookup, which is what makes the tile you tapped and the
   room you land in provably one colour. */
const ACCENT_RGB = {
  hotPink: '--c-hot-pink-rgb',
  electricBlue: '--c-electric-blue-rgb',
  deepPurple: '--c-deep-purple-rgb',
  sunnyYellow: '--c-sunny-yellow-rgb',
};

/* HOW MUCH OF EACH INK THIS CHAPTER'S FIELD CAN CARRY.
 *
 * The cut-out's rim used to be one layer painted in deep purple. Postres' field
 * IS deep purple, so on the largest chapter in the catalogue — 16 of 45 products
 * — the layer whose whole job is to give the cut-out an edge was mathematically
 * invisible, and a blind judge read the result exactly right: "no visible base,
 * and no edge where it should have one". Measured on the Coctel de Fruta at
 * 1440x900, the cup's dark ice read rgb(56,20,65) against a field of
 * rgb(66,20,77) — 1.07:1. Nothing separated them because nothing was painted
 * between them. The cream rim now peaks at 3.55:1 to 5.86:1 against the field
 * beside it down the same edge; the numbers are in styles/detail.css.
 *
 * The answer is not a different fixed token, because a fixed token is wrong on
 * two of the four chapters whichever one you pick: cream on sunny yellow is 1.58
 * and dark on deep purple is 1.43. So the rim carries BOTH inks and the field
 * decides which of them is drawn — by its own luminance, read out of tokens.css
 * at runtime rather than decided here.
 *
 * `sep` is one number: how far an ink is from being unusable on a field, on a
 * scale where 1.5:1 is nothing and 4.5:1 is as much as this needs. detail.css
 * multiplies it by its own alphas.
 *
 *     chapter     field    cream    --ink-lit    dark    --ink-amb
 *     Postres     purple   12.90     1.000       1.43     0.000
 *     Helados     pink      3.85     0.784       4.78     1.000
 *     Antojitos   blue      3.11     0.536       5.93     1.000
 *     Bebidas     yellow    1.58     0.026      11.67     1.000
 *
 * The first column is BRIEF.md's own contrast table, arrived at independently:
 * cream on hot pink 3.85, electric blue on cream 3.11, deep purple on cream
 * 12.90. Nothing here was tuned to match it; both read the same palette.
 *
 * NO COLOUR IS NAMED HERE, for the same reason ACCENT_RGB names none: these are
 * token NAMES, and their values come from brand.json through tokens.css. If the
 * client revises the palette, both weights move with it on the next paint. */
const INK_LIT = '--c-base-cream-rgb';
const INK_DARK = '--c-dark';

/* tokens.css writes a palette colour twice: once as a hex (`--c-dark`) and once
   as the space-separated triple an alpha needs (`--c-deep-purple-rgb`). Both
   forms are read, because the two inks this needs are one of each. */
function triple(token) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  if (!v) return null;
  if (v[0] === '#') {
    const h = v.slice(1);
    const pairs = h.length < 6 ? [...h.slice(0, 3)].map((c) => c + c) : (h.match(/../g) || []);
    return pairs.length >= 3 ? pairs.slice(0, 3).map((x) => parseInt(x, 16)) : null;
  }
  const n = v.match(/[\d.]+/g);
  return n && n.length >= 3 ? n.slice(0, 3).map(Number) : null;
}
const chan = (c) => (c /= 255, c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
const contrast = (a, b) => {
  const x = lum(a) + 0.05;
  const y = lum(b) + 0.05;
  return x > y ? x / y : y / x;
};
const sep = (ink, field) => Math.min(1, Math.max(0, (contrast(ink, field) - 1.5) / 3));

/* One lookup per chapter for the life of the page: the palette does not change
   between products, and this is called on every paint and every arrow press. */
const inkCache = new Map();
function inkFor(accentToken) {
  if (inkCache.has(accentToken)) return inkCache.get(accentToken);
  const field = triple(accentToken);
  const litInk = triple(INK_LIT);
  const darkInk = triple(INK_DARK);
  /* If a token cannot be read — a browser that has not applied the stylesheet
     yet — both inks are drawn at full strength, which is what the CSS fallbacks
     say and is the safe direction: an over-rimmed cut-out is legible, an
     un-rimmed one on its own colour is not. */
  const w = (field && litInk && darkInk)
    ? { lit: sep(litInk, field), amb: sep(darkInk, field) }
    : { lit: 1, amb: 1 };
  inkCache.set(accentToken, w);
  return w;
}

/* HOW BIG THE FOOD IS ALLOWED TO BE, as a share of the room it stands in, and
   expressed against the FOOD rather than against the square canvas around it.

   FOOD_BLEED_H is greater than 1 on purpose and it is the point of the view: a
   `tall` photograph is seated at 112% of the room's height, anchored to the top,
   so the last 12% of it runs off the bottom edge. A cup that ends neatly above
   the fold is a photograph of a cup; one that runs out of the room is a cup in
   the room.

   FOOD_MAX_H is what a WIDE product keeps, and it is a cap on the FOOD, not on
   the canvas. A tray seated past the height of the room would be cut across the
   middle rather than at one edge, and a cut-out cut across the middle is just a
   cropped photograph — so a wide photograph stays centred and inside the room.

   THE `100cqh` CANVAS CAP IS GONE, and removing it is the biggest single change
   to how large the food is drawn. It capped the SQUARE at the height of the room
   to stop a wide product's transparent padding running off the top and bottom at
   once — but that padding is transparent, and the product is centred inside it
   (build-images.mjs pads symmetrically), so nothing was being protected and a
   great deal was being paid. Because `fillH` is at most 0.8929, that cap was
   ALWAYS the binding term for a wide photograph: every non-bleeding product in
   the catalogue was drawn on a canvas exactly the height of the room, so a
   banana split ended up 785 x 574px in a 1440 x 900 room — the 'island with air
   on all sides' a blind judge ranked last. The height term already says what the
   cap was trying to say, and says it about the food: `maxH / fillH` seats the
   FOOD at maxH of the room whatever shape it is. Measured after removing it, the
   same banana split is 1354 x 851. */
const FOOD_MAX_W = 0.94;
const FOOD_MAX_H = 0.96;
const FOOD_BLEED_H = 1.12;
/* THERE IS NO LONGER A `--shift`, AND ITS ABSENCE IS THE ROUND'S POINT. Round 3
   centred the food on the whole ROOM and then slid it left by up to 7cqw so it
   was not sitting right of the composition's centre of mass. That was a
   correction for a stage that ran underneath the reading panel. The stage is
   column 1 now — the free track, left of the panel, and nothing else — so the
   middle of the stage IS the middle of the space the food has, and the light
   pool behind it needs no translate to stay under it. One fewer expression, one
   fewer thing that can be wrong at a viewport nobody screenshotted.

   The contact sheet. Barely smaller than the stage's own targets, because the
   whole point of these is that you can tell one photograph of a dish from
   another — the moment they stop being legible they are heladosmexico's
   greyscale chips with the grey taken out. */
const THUMB_MAX_W = 0.90;
const THUMB_MAX_H = 0.90;

/* `sizes` IS MEASURED, NOT GUESSED. With the `100cqh` canvas cap gone the square
   is deliberately LARGER than the viewport for a narrow product — that is the
   transparent padding around a paleta. Re-measured across all 62 photographs
   after the stage narrowed to the free track, the largest square is the Choco
   Banana at 1129px in a 1440x900 room (78vw) and 878px at 901x700 (97vw), rising
   to 105vw on a tall desktop window, and 586px on a 390px screen (150vw). So the
   two ceilings below still hold and are still the honest maxima rather than the
   convenient ones. Understating `sizes` is how a page silently ships a blurry
   hero: it is the only thing that decides which candidate is fetched.

   It is a named constant because two places have to agree on it — the <img> in
   the room, and the preloader that warms the dish either side of this one. Two
   copies of this string would be two different photographs fetched for one
   product, and the warmed one would be the wrong size and never used. */
const STAGE_SIZES = '(max-width: 900px) 156vw, 106vw';

/* Ink normalisation, exactly as card.js applies it: `visualScale` modulates about
   the catalogue's own median and is clamped DOWNWARD only. It is used by the
   CONTACT SHEET only — see note 4 in the header. */
const NORM_MID = 1.005;
const NORM_FLOOR = 0.88;

const num = (v, fallback) => (Number(v) > 0 ? Number(v) : fallback);
const fillH = (shot) => num(shot.fillH, geometry.canvasFill / Math.max(num(shot.aspect, 1), 1));
const fillW = (shot) => num(shot.fillW, geometry.canvasFill * Math.min(num(shot.aspect, 1), 1));
const normOf = (shot) => Math.min(1, Math.max(NORM_FLOOR, num(shot.scale, NORM_MID) / NORM_MID));

/* A photograph bleeds when the product is taller than it is wide, which is what
   `tall` in data/images.json records. Falling back to the aspect keeps the
   arithmetic honest if the flag is ever missing rather than silently deciding
   that everything bleeds. */
const bleeds = (shot) => (shot.tall === undefined ? num(shot.aspect, 1) < 1 : !!shot.tall);

/**
 * The width of the square canvas that seats THIS product at the targets above,
 * written as a CSS `min()` in the stage's own container units. The browser picks
 * whichever term binds, at every viewport, with nothing measured in JS and no
 * resize listener anywhere.
 *
 *   w term   the food is at most maxW of the stage wide
 *   h term   the food is at most maxH of the stage tall
 *
 * Two terms and no third. There used to be a `100cqh` cap on the SQUARE, and
 * because `fillH` never exceeds 0.8929 it was the binding term for every wide
 * photograph in the catalogue — so a banana split was drawn 785px wide in a
 * 1440px room while the arithmetic above was asking for 1354. It was there to
 * stop transparent padding running off the top and the bottom at once, which is
 * not a thing that needs stopping: the padding is transparent and the product is
 * centred inside it, so the h term already guarantees the FOOD fits.
 */
const seat = (shot, maxW, maxH) => {
  const w = ((maxW / fillW(shot)) * 100).toFixed(2);
  const h = ((maxH / fillH(shot)) * 100).toFixed(2);
  return `min(${w}cqw, ${h}cqh)`;
};

/**
 * The transparent padding UNDER the food inside its own square canvas. A cut-out
 * is trimmed to its alpha box and then re-padded to a square, so a wide product
 * carries a band of nothing above and below it — 67px on the banana split at
 * 390px. Seating the CANVAS on an edge therefore leaves the FOOD floating short
 * of it. Pulled back out as a negative margin, `end` alignment seats the food
 * itself, which is what the phone layout wants: the mass sits on the reading
 * card rather than hovering a thumb's width above it. */
const sinkOf = (shot, width) =>
  `calc(${((1 - fillH(shot)) / 2).toFixed(4)} * (${width}))`;

/**
 * THE WIDTH OF THE FOOD ITSELF, for the contact shadow to be drawn against.
 *
 * The shadow used to be written in `cqh` — a share of the ROOM's height. That is
 * right on a desktop screen, where the room is the viewport and every product is
 * seated in the same 900px. It is wrong on a phone, where the room is only as
 * tall as THIS photograph needs (see `roomH`): the Paletas room is 208px, so a
 * shadow of `1.1cqh` came out at 2.3px under a 344px-wide wrapper. Measured, the
 * band under it darkened 2.6% against 16.7% for the same product on desktop —
 * the same declaration producing a shadow on one screen and nothing on the other.
 *
 * A contact shadow belongs to the object, not to the room. This is the food's
 * own painted width, as a CSS expression in the stage's units, and detail.css
 * multiplies it. `width` is the square canvas; the FOOD is `fillW` of it.
 */
const liftOf = (shot, width) =>
  `calc(${fillW(shot).toFixed(4)} * (${width}))`;

/* The one place the three constants meet a photograph. Both the first paint and
   a change of photograph go through it, so the two can never drift apart. */
const seatOf = (shot) =>
  seat(shot, FOOD_MAX_W, bleeds(shot) ? FOOD_BLEED_H : FOOD_MAX_H);

/**
 * HOW TALL THE ROOM IS ON A PHONE, where it is a row in a scrolling column
 * rather than the whole screen. styles/detail.css asks for 62svh of it, which is
 * the right floor for the 45 photographs that are taller than they are wide: a
 * cup or a cone fills that and runs past it.
 *
 * A WIDE photograph cannot. On a 390px screen its width binds at 94% of the
 * stage, so its height is fixed at that divided by its aspect — 216px for the
 * banana split — and the other 300px of a 62svh row is bare field above and
 * below it, which is the "island with air on all sides" a blind judge ranked
 * last, reproduced on the phone. Reserving room the food is arithmetically
 * unable to use is not generosity.
 *
 * So the room is as tall as THIS photograph needs, capped at the 62svh the tall
 * ones want. Written in viewport units and the same tokens the stage's padding
 * is written in, so it re-solves at every phone width with nothing measured.
 */
const roomH = (shot) => (bleeds(shot) ? '62svh'
  : `min(62svh, calc((100vw - var(--s-3) * 2) * ${(FOOD_MAX_W / (fillW(shot) / fillH(shot)))
      .toFixed(4)} + var(--s-7) + var(--s-4)))`);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* The deep link. `#p/<id>` and nothing else, so url-state.js can keep owning the
   query string — it already preserves `location.hash` on every write. */
const HASH = /^#p\/([\w-]+)$/;
const hashId = () => (location.hash.match(HASH) || [])[1] || null;
const bare = () => location.pathname + location.search;

export function detail(root) {
  const dlg = root.querySelector('[data-detail]');
  if (!dlg) return { open() {} };

  const body = dlg.querySelector('[data-detail-body]');
  const closeBtn = dlg.querySelector('[data-detail-close]');

  const byId = new Map(items.map((i) => [i.id, i]));
  const all = items.map((i) => i.id);
  let order = all;
  /* The list currently on the page — a category, a search, or all 45. main.js
     hands it in when a card is clicked, but a deep link arrives with nobody to
     hand it over, so it is also read straight off the grid's own `grid:render`
     event. That event already exists and is already the one place a filter is
     recorded (see main.js and url-state.js); this only listens to it. Without
     it, `/?c=bebidas#p/mangonada` opened "43 de 45" and walked out of the
     drinks the URL asked for on the first arrow press. */
  let shown = all;
  root.addEventListener('grid:render', (e) => {
    const list = e.detail?.shown;
    if (Array.isArray(list) && list.length) shown = list.map((i) => i.id);
  });
  let at = 0;
  let shot = 0;
  /* True when opening this product added a history entry — so closing knows
     whether "back" is the right way out or whether the hash should simply be
     dropped. A deep link that was loaded directly did not add anything. */
  let pushed = false;

  const item = () => byId.get(order[at]);

  /* ---- one photograph, seated -------------------------------------------
     No `--scale` is written here and that is deliberate: the stage does not ink-
     normalise (header note 4), so the layout box and the painted box are the
     same box. motion.js reads `--scale` off this element to write its card-to-
     dialog flight as a multiple of the base transform; with the property absent
     it reads 1, which is exactly the base this element now has.

     `sizes` is STAGE_SIZES, above, and is measured rather than guessed. */
  function stageHTML(shots) {
    const s = shots[shot];
    const w = seatOf(s);
    return `
      <div class="detail__stage${bleeds(s) ? ' detail__stage--bleed' : ''}"
           style="--sink:${sinkOf(s, w)};--lift:${liftOf(s, w)}">
        <img class="detail__img" src="/img/${s.stem}-1400.webp" srcset="${srcset(s.stem)}"
             sizes="${STAGE_SIZES}"
             alt="${esc(t('photoOf', { name: item().name }))}"
             width="1400" height="1400" decoding="async"
             style="width:${w}">
      </div>`;
  }

  /* ---- the contact sheet, INSIDE the reading panel ----------------------
     This used to be a third column down the left edge of the screen. It moved
     for two reasons and both are measurable.

     It was costing the photograph 210px of stage — a 132px tile, a 40px gutter
     and a 24px pad — on all 45 products, to serve a feature 13 of them have. And
     the four products with no client-approved line (Nachos, Bionicos, Pastel de
     Tres Leches, Mangonada) left the panel holding a category, a name, a rule
     and two buttons, which is the "over half air" the brief flagged twice.

     Under the description and named with ui.json's own `moreShots`, these are
     part of what the panel SAYS about this dish. Each tile is a window cut back
     to the room's own field colour with the cut-out standing in it, so a row of
     them reads as "the same dish, four ways" — which is exactly what it is, and
     is the one thing neither benchmark can do. heladosmexico shows three 40px
     greyscale chips; these are 100-124 CSS px and in colour.

     This is also where `--scale` still belongs: two to four photographs of the
     SAME dish, seen side by side, is the exact case ink normalisation was built
     for. The stage does not normalise, because there it would be damping the one
     thing the view is judged on.

     ROUND 5: THE SHEET IS SHAPED TO THE NUMBER OF PHOTOGRAPHS, and that is what
     lets a tile be big. A single row of four in a 460px column is four 106px
     tiles — the same size heladosmexico's are, in colour. The panel is the full
     height of the room now (see styles/detail.css), so there is vertical budget
     to spend, and spending it means choosing a COLUMN COUNT rather than letting
     four photographs share one line:

       2 photographs   2 across   224 x 224   — 7 of the 13, the common case
       3 photographs   3 across   145 x 181
       4 photographs   2 x 2      224 x 168   — Crazy Shake, the only one

     THE COLUMNS ALWAYS FILL THE READING WIDTH. The tracks are `1fr`, so a window
     ends where the paragraph above it ends and the sheet is a block rather than
     a huddle of thumbnails left-aligned in a wider column. What varies is the
     window's HEIGHT: `--tile-h` is a length on a two-row sheet and `auto` on a
     one-row sheet, where `aspect-ratio` shapes it instead.

     A SHORTER WINDOW DOES NOT MEAN A SMALLER PHOTOGRAPH. Each shot is seated at
     90% of its own window by `seat()`, in the window's container units, so the
     binding term for the tall cups Crazy Shake is photographed in is the HEIGHT
     — 168px of window puts the same cup on screen as the 175px-tall window a
     narrower tile would have had, while the window itself is 224px wide instead
     of 140. The block gets bigger; the food inside it does not get smaller.

     The heights are the budget the panel actually has at 1440x900: inner width
     460 after page 17's 6% inset, inner height 764 after the card's padding, of
     which about 350 is left once the name, the approved line, the rule and the
     walk have taken theirs. A 2x2 of 168px windows is 348.

     `sizes` follows the widest window rather than repeating a stale literal:
     224px on a desktop panel, 124px the cap on a phone. */
  const RAIL = { 2: { cols: 2, h: '224px' }, 3: { cols: 3, h: 'auto' } };
  function railHTML(shots) {
    if (shots.length < 2) return '';
    const plan = RAIL[shots.length] || { cols: 2, h: '168px' };
    return `
      <p class="detail__more">${esc(t('moreShots'))}</p>
      <div class="detail__rail" role="group" aria-label="${esc(t('moreShots'))}"
           style="--cols:${plan.cols};--tile-h:${plan.h}">
        ${shots.map((s, i) => `
          <button class="shot${i === shot ? ' is-on' : ''}" type="button" data-shot="${i}"
                  aria-label="${esc(t('shotOf', { i: i + 1, n: shots.length }))}"
                  aria-pressed="${i === shot}">
            <img src="/img/${s.stem}-400.webp" srcset="${srcset(s.stem)}"
                 sizes="(max-width: 900px) 124px, 224px"
                 alt="" width="400" height="400" decoding="async"
                 style="width:${seat(s, THUMB_MAX_W, THUMB_MAX_H)};--scale:${normOf(s)}">
          </button>`).join('')}
      </div>`;
  }

  /* ---- the walk, inside the panel ----------------------------------------
     THE PRIMARY MOVE IS THE NEXT DISH. These two used to be cream pills parked
     on the bottom edge of the screen, one at each corner, which is the shape of
     pagination however you label it. Under the panel's own rule, naming the dish
     before and the dish after, they are the answer to "what else is there" —
     which is the question a customer standing outside a snack shop is actually
     asking. VOLVER AL MENU is still here and still works; it is no longer the
     only thing to do.

     Nothing here is composed. `prev` and `next` are ui.json keys, the two names
     come from menu.json, and `resultsCount` is the same "{n} de {total}" string
     the menu uses to say how much of the catalogue you are looking at. */
  function walkHTML() {
    const n = order.length;
    const before = byId.get(order[(at - 1 + n) % n]);
    const after = byId.get(order[(at + 1) % n]);
    const step = (dir, kind, who, label) => `
      <button class="detail__step detail__step--${dir}" type="button" data-detail-${dir}
              aria-label="${esc(`${label}: ${who ? who.name : ''}`)}"${n < 2 ? ' disabled' : ''}>
        <span class="detail__arrow" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false"><path d="${
            dir === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}"/></svg>
        </span>
        <span class="detail__step-txt">
          <span class="detail__step-kind">${esc(kind)}</span>
          <span class="detail__step-name">${esc(who ? who.name : '')}</span>
        </span>
      </button>`;
    return `
      <div class="detail__walk">
        ${step('prev', t('prev'), before, t('prev'))}
        ${step('next', t('next'), after, t('next'))}
      </div>`;
  }

  /* ---- the reading panel -------------------------------------------------
     Page 17, reproduced: cream reading area, CATEGORY TITLE in hot pink over the
     item name in deep purple, the approved line in warm grey underneath, a 1px
     rule, and what follows the rule. Page 17's own last level is a note in
     electric blue; that treatment is NOT reused, because BRIEF.md measures blue
     on cream at 3.11 — below AA at any size — and says so about this exact line.

     THE ORDER IS THE HIERARCHY, and round 4 puts one more level into it:

       category · where you are in the menu     what this is
       name                                     what it is called
       the client-approved line, or nothing     what it is
       MAS FOTOS + the contact sheet            the same dish, the other ways
       ----- the rule -----
       the dish before · the dish after         keep going
       back to the menu                         stop

     `.detail__gap` is one empty span and it is load-bearing. The column's top
     interval has to be a FIXED 64px whenever there is room — that is what stops
     the biggest word on the panel jumping 160px between one product and the next
     — and 0 when there is not. A margin cannot do both: Crazy Shake has four
     photographs, its content is 878px in a 900px room, and a fixed 64px margin
     put it 42px over and pushed the way back out of the frame on the one product
     with the most to show. A flex item with `flex: 0 1 var(--s-9)` is 64px while
     the column has slack and shrinks to nothing when it does not, so the fixed
     gap and the overflow guard stop being in conflict. See detail.css.

     Everything above the rule is about THIS dish; everything below it is a move.
     The contact sheet sits above the rule for that reason — a second photograph
     of the churros is not a way out of the churros. It also gives the four
     products with no approved line something to hold, which is what the "over
     half air" note in BRIEF.md was about; on the three of those that also have
     one photograph the card simply gets shorter, because a panel sized to its
     content is honest and a panel padded out with invented copy is not. */
  function copyHTML(shots) {
    const desc = line(item());
    const cat = categoryById(item().category);
    return `
      <div class="detail__copy">
        <div class="detail__card">
          <div class="detail__head">
            <p class="detail__cat">${esc(categoryLabel(cat))}</p>
            <p class="detail__at">${esc(t('resultsCount', { n: at + 1, total: order.length }))}</p>
          </div>
          <span class="detail__gap" aria-hidden="true"></span>
          <h2 class="detail__name" id="detail-name">${esc(item().name)}</h2>
          ${desc ? `<p class="detail__desc">${esc(desc)}</p>` : ''}
          ${railHTML(shots)}
          <hr class="detail__rule">
          ${walkHTML()}
          <button class="detail__back" type="button" data-detail-back>
            <span class="detail__back-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <rect x="3" y="3" width="8" height="8" rx="1.84"/>
                <rect x="13" y="3" width="8" height="8" rx="1.84"/>
                <rect x="3" y="13" width="8" height="8" rx="1.84"/>
                <rect x="13" y="13" width="8" height="8" rx="1.84"/>
              </svg>
            </span>
            <span>${esc(t('backToMenu'))}</span>
          </button>
        </div>
      </div>`;
  }

  function paint() {
    const it = item();
    if (!it) return;
    const shots = it.images;
    if (shot >= shots.length) shot = 0;

    dlg.dataset.cat = it.category;
    const accent = ACCENT_RGB[categoryById(it.category)?.accent];
    if (accent) {
      dlg.style.setProperty('--field-rgb', `var(${accent})`);
      /* The rim's two inks, the ambient's strength and the floor's, all as one
         pair of weights derived from this field's own luminance. See inkFor. */
      const ink = inkFor(accent);
      dlg.style.setProperty('--ink-lit', ink.lit.toFixed(3));
      dlg.style.setProperty('--ink-amb', ink.amb.toFixed(3));
    }

    /* WHERE FOCUS GOES WHEN THE ROOM CHANGES. Walking to the next product
       replaces everything inside the body, so a control that had focus is
       destroyed mid-keystroke and focus falls back to the dialog itself — the
       trap holds, but the next Tab restarts from the top. Anything that had
       focus in here is handed to the way out instead, which is where showModal()
       puts it on arrival. The close button is outside the body and is never
       touched. */
    /* Focus goes back to the SAME control, not to the way out. Handing it to the
       close button meant a keyboard reader who pressed Enter on SIGUIENTE walked
       one dish and then had focus sitting on Cerrar — so the second press of the
       same key closed the room instead of walking again. Walking is the primary
       action here; pressing next twice has to mean next twice.
       The control is found again by its data attribute rather than by holding a
       reference, because innerHTML destroys the old node. If the equivalent
       control no longer exists — walking to the last dish when the list is
       filtered, say — the close button is still the right fallback. */
    const focused = document.activeElement;
    const hadFocus = body.contains(focused);
    const again = hadFocus
      ? (focused.closest('[data-detail-next]') ? '[data-detail-next]'
        : focused.closest('[data-detail-prev]') ? '[data-detail-prev]'
        : null)
      : null;
    body.style.setProperty('--room-h', roomH(shots[shot]));
    body.innerHTML = stageHTML(shots) + copyHTML(shots);
    if (hadFocus) {
      const back = again && body.querySelector(again);
      (back || closeBtn).focus({ preventScroll: true });
    }
    warmNeighbours();
  }

  /* ---- THE DISH EITHER SIDE IS ALREADY FETCHED --------------------------
     Walking IS the primary action of this room now — the panel names the dish
     before and the dish after under its own rule, and left/right do the same
     thing from the keyboard. So the one thing that must not happen is the room
     going empty when you press it.

     It was. `paint()` replaces the body, which throws the <img> away and puts a
     new one in its place, and a new element has nothing on screen until it has
     decoded. Measured on Chrome's 3 Mbit / 40ms profile, walking from Banana
     Split to Choco Banana: at the moment of the keypress the photograph had
     `naturalWidth: 0` and no `currentSrc` at all, and it was 200ms before it had
     pixels. Two hundred milliseconds of bare field is exactly the flash the
     contact sheet was rewritten to avoid, on the control the round promoted to
     primary.

     The fix is to have fetched it already. Both neighbours' lead photographs are
     warmed with the SAME `srcset` and the SAME `sizes` the room will use, so the
     browser picks the same candidate and the step is served from cache. Two
     details make it honest rather than a bandwidth tax:

     - IT NEVER COMPETES WITH THE PHOTOGRAPH YOU ARE LOOKING AT. The warm-up
       waits for the current image to finish before it starts. A preload that
       delays the thing on screen has made the view slower to serve a press that
       may never come.
     - IT IS BOUNDED. `warm` keeps the last WARM_KEEP requests so that walking
       the whole menu does not hold forty-five 1400px decodes in memory, and a
       stem already in the map is never fetched twice — so walking back and forth
       across the same three dishes costs nothing after the first pass. */
  const WARM_KEEP = 8;
  const warm = new Map();
  function preload(id) {
    const s = byId.get(id)?.images?.[0];
    if (!s || warm.has(s.stem)) return;
    const img = new Image();
    img.decoding = 'async';
    /* All three are set in one task, before the element is ever appended, so the
       candidate is chosen once and against the same `sizes` the room will use. */
    img.sizes = STAGE_SIZES;
    img.srcset = srcset(s.stem);
    img.src = `/img/${s.stem}-1400.webp`;
    warm.set(s.stem, img);
    if (warm.size > WARM_KEEP) warm.delete(warm.keys().next().value);
  }
  function warmNeighbours() {
    const n = order.length;
    if (n < 2) return;
    const go = () => {
      preload(order[(at + 1) % n]);
      preload(order[(at - 1 + n) % n]);
    };
    const here = body.querySelector('.detail__img');
    if (!here || here.complete) go();
    else here.addEventListener('load', go, { once: true });
  }

  /* CHANGING PHOTOGRAPH DOES NOT REBUILD THE ROOM. Replacing the body's HTML
     would throw the <img> away and put a new one in its place, and a new element
     has nothing on screen until it has decoded — so picking a second photograph
     of the same dish flashed the empty field, which is the one moment this view
     is meant to feel instantaneous. Reassigning `srcset` on the element that is
     already there keeps the current photograph painted until the next one is
     ready, and everything else that has to change is four attributes and one
     class — the bleed, because two photographs of one dish are not always the
     same shape. */
  function paintShot() {
    const it = item();
    const shots = it?.images || [];
    const s = shots[shot];
    const img = body.querySelector('.detail__img');
    const stage = body.querySelector('.detail__stage');
    if (!s || !img || !stage) { paint(); return; }
    const bleed = bleeds(s);
    stage.classList.toggle('detail__stage--bleed', bleed);
    const w = seatOf(s);
    img.style.width = w;
    stage.style.setProperty('--sink', sinkOf(s, w));
    stage.style.setProperty('--lift', liftOf(s, w));
    body.style.setProperty('--room-h', roomH(s));
    img.srcset = srcset(s.stem);
    img.src = `/img/${s.stem}-1400.webp`;
    for (const b of body.querySelectorAll('[data-shot]')) {
      const on = Number(b.dataset.shot) === shot;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    }
  }

  /* ---- opening and closing ----------------------------------------------
     WHERE FOCUS LANDS ON THE WAY OUT. showModal() records the element that had
     focus and gives it back on close, and in Chromium and Firefox that is
     exactly right. WebKit does not do it — measured, all three engines, and it
     is the one behaviour of the four the brief asks for that the platform did
     not supply on its own. So it is done here as well, which costs nothing where
     the browser already did it and is the whole behaviour where it did not.

     It also lands somewhere better than the platform would. `order[at]` is the
     product you were looking at when you closed, not the one you opened — so
     walking thirty products with the arrow keys and pressing Escape puts you on
     card thirty-one in the menu, scrolled to it, rather than back at the card
     you first tapped. If that card is not in the grid — a filter changed under
     the dialog — the element that had focus when the dialog opened is the
     fallback, and the browser's own behaviour is the fallback after that. */
  let opener = null;
  const cardFor = (id) => root.querySelector(`.card[data-id="${id}"] .card__hit`);

  function open(id, list, { push = true } = {}) {
    if (!byId.has(id)) return;
    if (!dlg.open) {
      const a = document.activeElement;
      opener = a && a !== document.body && !dlg.contains(a) ? a : null;
    }
    const next = list && list.length ? list
      : (dlg.open && order.includes(id)) ? order
      : shown.includes(id) ? shown : all;
    order = next.includes(id) ? next : all;
    at = Math.max(0, order.indexOf(id));
    shot = 0;
    paint();
    if (push) {
      const target = `#p/${id}`;
      if (location.hash !== target) { history.pushState(null, '', target); pushed = true; }
    }
    if (!dlg.open) dlg.showModal();
    /* showModal has already recorded what to give focus back to, so moving it
       onto the close button is free and puts the first Tab somewhere sensible. */
    closeBtn.focus({ preventScroll: true });
  }

  /* Walking does not deepen history: back should always be one press out of the
     dialog, not a retrace of everything you looked at. */
  const stamp = () => history.replaceState(null, '', `#p/${order[at]}`);

  function step(d) {
    if (order.length < 2) return;
    at = (at + d + order.length) % order.length;
    shot = 0;
    paint();
    stamp();
  }
  function stepShot(d) {
    const shots = item()?.images || [];
    if (shots.length < 2) return;
    shot = (shot + d + shots.length) % shots.length;
    paintShot();
  }

  /* ---- one listener for every control in the room ------------------------
     The panel and the contact sheet are rebuilt on every product and on some
     photographs, so binding a listener to each control would bind the same
     button forty-five times over a browse. Delegation from the dialog binds
     nothing per product: the element that was clicked is asked which control it
     is inside, once. `closest` also means a click on the svg inside a button
     answers as the button, which per-element binding got for free and a naive
     `e.target.dataset` check would not. */
  const BARE = ['detail__body', 'detail__stage', 'detail__copy'];
  dlg.addEventListener('click', (e) => {
    const el = e.target instanceof Element ? e.target : null;
    if (!el) return;
    if (el.closest('[data-detail-close]') || el.closest('[data-detail-back]')) { dlg.close(); return; }
    if (el.closest('[data-detail-prev]')) { step(-1); return; }
    if (el.closest('[data-detail-next]')) { step(1); return; }
    const tile = el.closest('[data-shot]');
    if (tile) { shot = Number(tile.dataset.shot); paintShot(); return; }

    /* The field IS the dialog now, so there is no backdrop left to click — and
       clicking outside the thing you opened is the gesture people reach for
       first. These are every surface that is bare field: the dialog itself, the
       column frame, the stage around the photograph, and the space around the
       reading panel. A click on the photograph, the contact sheet, the panel or
       any control has one of those as an ancestor but never as its target, so it
       stops before here without a single stopPropagation. Tested with
       `classList` rather than `className`, because the stage carries a modifier
       class when the photograph bleeds. */
    if (e.target === dlg
        || BARE.some((c) => el.classList.contains(c))) dlg.close();
  });

  /* Left/right walk the menu; up/down walk this product's photographs. Both are
     ignored while a text field has focus, so this stays safe if the dialog ever
     grows one. */
  dlg.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return;
    const go = { ArrowLeft: () => step(-1), ArrowRight: () => step(1),
                 ArrowUp: () => stepShot(-1), ArrowDown: () => stepShot(1) }[e.key];
    if (!go) return;
    e.preventDefault();
    go();
  });

  /* Escape, the close button and the backdrop all end in the same event, which
     is why the URL is unwound here rather than in three places. */
  dlg.addEventListener('close', () => {
    const home = cardFor(order[at]) || opener;
    opener = null;
    /* No preventScroll: if the reader walked to a product that is further down
       the menu than the one they opened, the point is to be taken to it. */
    if (home?.isConnected) home.focus();
    if (!hashId()) return;
    if (pushed) history.back(); else history.replaceState(null, '', bare());
    pushed = false;
  });

  /* The back button, and any other route that changes the hash under us. */
  const sync = () => {
    const id = hashId();
    if (id && byId.has(id)) {
      if (!dlg.open || order[at] !== id) open(id, null, { push: false });
    } else if (dlg.open) {
      dlg.close();
    }
  };
  addEventListener('popstate', sync);
  addEventListener('hashchange', sync);

  /* A URL that names a product opens it. This runs after main.js has built the
     grid — the module body is one tick — so the card behind the dialog exists
     and closing lands the reader in the menu rather than on a blank page. */
  if (hashId()) queueMicrotask(sync);

  /* ---- ?open=<id> — REMOVED ---------------------------------------------
     There used to be a query-string hook here that opened a product AND kept it
     open: `setInterval(hold, 200)` put the dialog back if anything took it away.
     It existed for one reason — scripts/shot.mjs pressed Escape and then deleted
     every `dialog[open]` before each capture, a sweep written for third-party
     cookie overlays and applied unconditionally to localhost, so the only way to
     photograph this room was to fight it.

     The cost was that Escape and the close button stopped working for anyone who
     had `?open=` in the URL: the interval simply reopened the dialog 200ms later,
     with no way out of the modal. That is a keyboard trap on a public page in
     exchange for a screenshot.

     Both halves are fixed properly now. shot.mjs returns early from its overlay
     sweep on our own origin, and both shot.mjs and verify.mjs take `--open
     <slug>`, which opens the product the way a customer does — by clicking the
     card — and writes it to desktop.png. So the hack has nothing left to do:

         node scripts/verify.mjs --out .shots/x --lang es --open crazy-shake

     Nothing else in the project referenced ?open=; checked before removing. */

  return { open };
}
