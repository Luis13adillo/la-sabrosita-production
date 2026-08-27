/**
 * The product card.
 *
 * Page 17 of the guidelines prints the approved card: a cream reading panel with
 * the item name in deep purple above a regular-weight line. What page 17 does not
 * say out loud is that the cream panel is sitting on a *coloured slide* — cream is
 * the reading area, not the field. Our page background is already cream, so a
 * cream-on-cream card has no field at all and disappears. The card therefore
 * brings its own: a solid tile in the category's own accent, with the page-17
 * cream panel across the bottom of it. The colour is not chosen here — menu.json
 * gives every category an `accent` name and tokens.css owns what that name means.
 *
 * The cut-out stands on the tile rather than sitting inside a frame, which is what
 * brand.json's "clean cut-out food imagery" asks for and what both benchmark sites
 * do with a single product.
 */
// `srcset` is imported rather than written here, so it lists the widths that
// actually exist on disk. It used to be a literal [400, 800, 1400]; a 600 step
// was added later because the real slots land between 400 and 800 — a 2-across
// phone card is about 170 CSS px, which is 510 device px at 3x — and a card
// holding its own list could not see it, so every phone fetched an 800 for a
// 510px slot. Adding or removing a step is now one line in build-images.mjs.
import { line, t, categoryById, geometry, srcset } from './data.js';

/* Measured against the real grid rather than guessed: a plain card is 14-17vw
   above 1100, 21-29vw between 640 and 1100, and ~44vw on a phone. The 2x2 tile is
   a little over twice that, which is a whole candidate wider — so a card that
   knows it is the wide one asks for the right file instead of upscaling an 800.
   grid.js does not pass `wide` today; the default is the 41 ordinary cards, and
   nothing breaks if it never does. */
const SIZES = {
  card: '(max-width: 640px) 45vw, (max-width: 1100px) 30vw, 18vw',
  wide: '(max-width: 640px) 92vw, (max-width: 1100px) 60vw, 36vw',
};

/* menu.json names each category's accent; tokens.css owns the value behind the
   name. Nothing here is a colour — these are token names, looked up by data. */
const ACCENT_RGB = {
  hotPink: '--c-hot-pink-rgb',
  electricBlue: '--c-electric-blue-rgb',
  deepPurple: '--c-deep-purple-rgb',
  sunnyYellow: '--c-sunny-yellow-rgb',
};

/**
 * HOW BIG THE FOOD IS — the one thing a product grid is actually judged on.
 *
 * Every derivative is trimmed to the product's alpha box and then re-padded to a
 * square with a constant 6% margin, so `geometry.canvasFill` (0.8929) is the most
 * of that square any product can span, and `fillW` / `fillH` are how much of it
 * *this* product spans on each axis — 0.170 to 0.893 across the 62 photographs.
 * Both numbers are published by build-images.mjs; nothing is measured here.
 *
 * Round 1 got this wrong twice over, and it cost the blind ranking. It sized the
 * frame to the SQUARE and then divided that square by the largest ink-
 * normalisation multiplier in the catalogue, so all 62 photographs were shrunk to
 * leave headroom for the single thinnest paleta, and then each one was shrunk
 * again by however much of its own square it did not fill. Measured off
 * .shots/card-r1/desktop.png the Sandwich de Helado cut-out came out 134px wide
 * inside a 438px card — 31%. Michoacana's packshot is 87% of its tile's width.
 *
 * So the frame is sized to the FOOD. Two targets, both expressed as a fraction of
 * the card's own width, and whichever binds first decides the frame:
 *   - a product may be at most FOOD_MAX_W of the card wide;
 *   - a product may be at most FOOD_MAX_H tall, which is the coloured field's
 *     height (STAGE_H) less the scallop at top and bottom.
 * The other axis then comes out smaller on its own, which is correct — a banana
 * on a stick should be tall and narrow, not scaled up until it is as wide as a
 * tray of nachos.
 *
 * Modelled over all 62 photographs the median cut-out goes from 37.7% of the
 * card's width to 76%, and from 56% of the card's width in height to 125%.
 */
const FOOD_MAX_W = 0.94;
/* The field is taller than it is wide, and that is a correction rather than a
   taste. 38 of the 62 photographs are taller than they are wide once they are
   fitted to the food, so a square field left the tall half of the catalogue
   nothing to grow into. This is a CEILING, not a height: grid.js shrinks each
   row's field to the tallest photograph actually in that row, so raising it costs
   a row of flat things nothing and only ever gives a row of cones and elotes more
   to stand in. Built and measured with scripts/fill-check.mjs, product's share of
   its own tile, desktop / mobile:
       1.18 -> 35.3 / 35.7      1.26 -> 41.9 / 47.2
       1.22 -> 35.3 / 36.6      1.34 -> 42.4 / 47.1
                                1.40 -> 43.7 / 46.6
   Desktop keeps climbing and mobile turns over, because a two-up phone row pairs
   a tall product with a flat one more often and then the flat one pays. 1.34 is
   the top of both curves. */
const STAGE_H = 1.34;
/* The clearance is not "breathing room" — round 1 spent 17cqw on that and it was
   most of why the food was small. It is what the scallop needs: the cream bumps
   where the panel meets the colour rise min(5.6cqw, 16px) / 2.48 = up to 2.3cqw
   into the field, and a product whose base stops short of that gets nibbled by a
   wavy cream edge. Shot at 0.012 first and the Helado Viral box lost its bottom
   edge to it. card.css also lifts the frame half a scallop above centre, so this
   number is the other half plus a visible margin of field under the food. */
const EDGE_CLEAR = 0.03;
const FOOD_MAX_H = STAGE_H - 2 * EDGE_CLEAR;   /* 1.280 card widths */

/* `visualScale` normalises ink coverage so a paleta and a tray of nachos carry
   the same weight. Used as a raw multiplier it is exactly what forced the global
   divisor to exist — a value of 1.45 on one photograph made every other card
   smaller. It is applied instead as a modulation about the catalogue's own median
   and clamped DOWNWARD only: it can quieten a product that is carrying too much
   ink, and it can never push one past the edge of the field. Most of the ink
   discipline survives, and the worst it costs any single card is 12%. */
const NORM_MID = 1.005;
const NORM_FLOOR = 0.88;

/* GROUND is how much of a photograph's own vertical slack is spent dropping it
   toward the panel, and it is the one number here that is a judgement rather than
   a measurement. A wide product like the banana split only fills 56% of its
   canvas height, so centring the canvas leaves it hovering; bottom-aligning it
   leaves it hovering by a different amount than a paleta does, and cards in a row
   drift. At 1 (fully planted) a flat wrapped paleta is marooned along the bottom
   edge. At 0 nothing looks like it is resting on anything. Half reads as grounded
   without stranding — see .shots/card-r4 and card-r5. */
const GROUND = 0.5;

const num = (v, fallback) => (Number(v) > 0 ? Number(v) : fallback);

/** The fraction of its square canvas this product occupies, per axis. */
const fillH = (shot) =>
  num(shot.fillH, geometry.canvasFill / Math.max(num(shot.aspect, 1), 1));
const fillW = (shot) =>
  num(shot.fillW, geometry.canvasFill * Math.min(num(shot.aspect, 1), 1));

const normOf = (shot) =>
  Math.min(1, Math.max(NORM_FLOOR, num(shot.scale, NORM_MID) / NORM_MID));

/**
 * Everything the CSS needs, in one place, all of it in card widths so the card is
 * one shape from a 165px phone tile to the ~475px feature tile.
 */
function seat(shot) {
  const w = fillW(shot);
  const h = fillH(shot);
  const frame = Math.min(FOOD_MAX_W / w, FOOD_MAX_H / h) * normOf(shot);
  const foodH = frame * h;
  /* How far down to nudge it, as a fraction of the frame — then capped so the
     base can never arrive under the cream panel, whatever the slack says. */
  const room = Math.max(0, STAGE_H / 2 - EDGE_CLEAR - foodH / 2);
  const wanted = Math.max(0, (1 - h) / 2) * GROUND * frame;
  return { frame, foodW: frame * w, foodH, sink: Math.min(wanted, room) };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Two stacked frames. Marks the card as carrying more than one photograph without
   spending a word on it, in either language. */
const STACK = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"
  stroke-linejoin="round" aria-hidden="true" focusable="false">
  <rect x="1" y="4" width="9" height="9" rx="2"/><path d="M5 4V3.2A2.2 2.2 0 0 1 7.2 1h5.6A2.2 2.2 0 0 1 15 3.2v5.6A2.2 2.2 0 0 1 12.8 11H12"/>
</svg>`;

const cqw = (n) => `${(n * 100).toFixed(3)}cqw`;

export function card(item, index, { wide = false } = {}) {
  const shot = item.images[0];
  const shots = item.images.length;
  const desc = line(item);
  const seated = seat(shot);

  const el = document.createElement('article');
  el.className = desc ? 'card' : 'card card--solo';
  el.dataset.id = item.id;
  el.dataset.cat = item.category;
  el.style.setProperty('--i', index);
  /* Lengths, not ratios, so card.css never has to redo this arithmetic and the
     contact shadow can be drawn exactly under the food it belongs to. */
  el.style.setProperty('--frame', cqw(seated.frame));
  el.style.setProperty('--food-w', cqw(seated.foodW));
  el.style.setProperty('--food-h', cqw(seated.foodH));
  el.style.setProperty('--sink', cqw(seated.sink));

  const accent = ACCENT_RGB[categoryById(item.category)?.accent];
  if (accent) el.style.setProperty('--field-rgb', `var(${accent})`);

  /* The accessible name is the product plus, when there are more, the interface's
     own words for it. No sentence about the product is ever composed here. */
  const label = shots > 1 ? `${item.name} — ${t('moreShots')}: ${shots}` : item.name;

  /* `data-fillh` is not styling. scripts/fill-check.mjs measures how much of a
     product is lost off the edge of its tile, and to do that it has to know how
     much of the square canvas is product rather than transparent padding —
     otherwise a wide, flat package reads as cropped when what has actually run
     past the edge is empty canvas. Without it the script falls back to
     geometry.canvasFill and over-reports every wide product. */
  el.innerHTML = `
    <button class="card__hit" type="button" aria-label="${esc(label)}">
      <span class="card__stage">
        <span class="card__frame"><img class="card__img"
             src="/img/${shot.stem}-800.webp"
             srcset="${srcset(shot.stem)}"
             sizes="${wide ? SIZES.wide : SIZES.card}"
             alt="${esc(t('photoOf', { name: item.name }))}"
             width="800" height="800" loading="lazy" decoding="async"
             data-fillh="${fillH(shot).toFixed(4)}"
             style="background-image:url('${shot.lqip}')"></span>
        ${shots > 1 ? `<span class="card__count" aria-hidden="true">${STACK}${shots}</span>` : ''}
      </span>
      <span class="card__panel">
        <span class="card__name">${esc(item.name)}</span>
        ${desc ? `<span class="card__desc">${esc(desc)}</span>` : ''}
      </span>
    </button>`;

  /* The low-quality placeholder has to leave when the real file lands. It is a
     blurred rectangle, and the photograph on top of it is a true cut-out, so every
     transparent pixel keeps showing it — that is the grey halo around the corn in
     the round-0 screenshot, and it is also what the drop-shadow was shadowing.
     The contact shadow on the stage waits for the same signal, for the same
     reason: an ellipse under a blurred rectangle is an ellipse under nothing. */
  const img = el.querySelector('.card__img');
  const ready = () => {
    img.style.backgroundImage = 'none';
    img.classList.add('is-ready');
    el.classList.add('is-lit');
  };
  if (img.complete && img.naturalWidth) ready();
  else img.addEventListener('load', ready, { once: true });

  return el;
}
