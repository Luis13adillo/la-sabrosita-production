/**
 * THE PRODUCT CARD.
 *
 * A cream tile on the chapter's colour field, with the food standing on a wash of
 * that colour and the client's own name and line underneath. This is the card in
 * the design the client approved (site/.site/b.html), and its arithmetic is
 * reproduced here exactly rather than re-derived — every one of the 45 cards
 * comes out within 0.06cqw of the page he looked at.
 *
 * ===========================================================================
 * HOW BIG THE FOOD IS — the one thing a product grid is judged on.
 * ===========================================================================
 *
 * Every derivative in public/img is a SQUARE canvas. build-images.mjs trims each
 * master to its alpha bounding box and re-pads it to a square with a constant 6%
 * margin, so `geometry.canvasFill` (0.8929) is the most of that square any
 * product can span on its long axis, and `fillW` / `fillH` are how much of it
 * THIS product spans on each axis — 0.170 to 0.893 across the 62 photographs.
 * Both numbers are published by build-images.mjs; nothing is measured here.
 *
 * SIZE THE SQUARE, NOT THE FOOD. Sizing the <img> box to the food's own aspect
 * ratio makes `object-fit: contain` fit the whole square — transparent padding
 * included — into that box, and everything renders small. Measured, the first
 * time this was got wrong: a 147x321 slot rendered the Crazy Shake at 147x147.
 *
 *     k    = clamp(sqrt(medianInk / ink), 0.88, 1.55)
 *     side = min(TARGET_W / fillW, TARGET_H / fillH) * k,  capped at SIDE_MAX
 *     food width = side * fillW
 *
 * TARGET_W is one card width and TARGET_H is 1.30 card widths, against a
 * coloured field that is 1.16 card widths tall — so a tall product is allowed to
 * stand taller than its field and be cropped by it, which is what makes a cone
 * read as a cone rather than as a thumbnail. SIDE_MAX stops a very thin product
 * — the Choco Banana's food is 17% of its own square — from bursting the tile
 * while chasing the height target.
 *
 * `k` NORMALISES INK COVERAGE so a paleta and a tray of nachos carry the same
 * visual weight. It is a modulation about the CATALOGUE'S OWN MEDIAN rather than
 * a raw multiplier: used raw, a single photograph with a high value forces a
 * global divisor and makes every other card smaller. The median is published by
 * the build (`medianInk` in the page payload) rather than recomputed here, so
 * the card, the hero's display case and the build agree by construction.
 */
import { line, t, categoryById, geometry, srcset, medianInk } from './data.js';

/* Measured against the real grid rather than guessed: a card is about 44vw on a
   two-up phone, 30vw on a three-up tablet, and a flat 330px in the four-column
   desktop grid, whose measure is capped at --maxw. */
const SIZES = '(max-width: 699px) 44vw, (max-width: 1023px) 30vw, 330px';

/* menu.json names each category's accent; tokens.css owns the value behind the
   name. Nothing here is a colour — these are token names, looked up by data. */
const ACCENT_RGB = {
  hotPink: '--c-hot-pink-rgb',
  electricBlue: '--c-electric-blue-rgb',
  deepPurple: '--c-deep-purple-rgb',
  sunnyYellow: '--c-sunny-yellow-rgb',
};

const TARGET_W = 1.0;
const TARGET_H = 1.30;
const SIDE_MAX = 1.42;
const NORM_FLOOR = 0.88;
const NORM_CEIL = 1.55;

const num = (v, fallback) => (Number(v) > 0 ? Number(v) : fallback);

/** The fraction of its square canvas this product occupies, per axis. */
const fillW = (shot) =>
  num(shot.fillW, geometry.canvasFill * Math.min(num(shot.aspect, 1), 1));
const fillH = (shot) =>
  num(shot.fillH, geometry.canvasFill / Math.max(num(shot.aspect, 1), 1));

const inkNorm = (shot) => {
  const ink = num(shot.ink, medianInk);
  return Math.min(NORM_CEIL, Math.max(NORM_FLOOR, Math.sqrt(medianInk / ink)));
};

/** Everything the CSS needs, in card widths, so the card is one shape from a
 *  165px phone tile to a 330px desktop one. */
function seat(shot) {
  const w = fillW(shot);
  const h = fillH(shot);
  const side = Math.min(Math.min(TARGET_W / w, TARGET_H / h) * inkNorm(shot), SIDE_MAX);
  return { side, food: side * w };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Two stacked frames. Marks a card as carrying more than one photograph without
   spending a word on it, in either language. */
const STACK = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"
  stroke-linejoin="round" aria-hidden="true" focusable="false">
  <rect x="1" y="4" width="9" height="9" rx="2"/><path d="M5 4V3.2A2.2 2.2 0 0 1 7.2 1h5.6A2.2 2.2 0 0 1 15 3.2v5.6A2.2 2.2 0 0 1 12.8 11H12"/>
</svg>`;

const cqw = (n) => `${(n * 100).toFixed(3)}cqw`;

export function card(item, index) {
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
  el.style.setProperty('--s', cqw(seated.side));
  el.style.setProperty('--fw', cqw(seated.food));

  const accent = ACCENT_RGB[categoryById(item.category)?.accent];
  if (accent) el.style.setProperty('--field-rgb', `var(${accent})`);

  /* The accessible name is the product plus, when there are more, the
     interface's own words for it. No sentence about the product is ever
     composed here. */
  const label = shots > 1 ? `${item.name} — ${t('moreShots')}: ${shots}` : item.name;

  /* `data-fillh` is not styling. scripts/fill-check.mjs measures how much of a
     product is lost off the edge of its tile, and to do that it has to know how
     much of the square canvas is product rather than transparent padding —
     otherwise a wide, flat package reads as cropped when what has run past the
     edge is empty canvas. */
  el.innerHTML = `
    <button class="card__hit" type="button" aria-label="${esc(label)}">
      <span class="card__stage">
        <img class="card__img"
             src="/img/${shot.stem}-800.webp"
             srcset="${srcset(shot.stem)}"
             sizes="${SIZES}"
             alt="${esc(t('photoOf', { name: item.name }))}"
             width="800" height="800" loading="lazy" decoding="async"
             data-fillh="${fillH(shot).toFixed(4)}"
             style="background-image:url('${shot.lqip}')">
        ${shots > 1 ? `<span class="card__count" aria-hidden="true">${STACK}${shots}</span>` : ''}
      </span>
      <span class="card__panel">
        <span class="card__name">${esc(item.name)}</span>
        ${desc ? `<span class="card__desc">${esc(desc)}</span>` : ''}
      </span>
    </button>`;

  /* The low-quality placeholder has to leave when the real file lands. It is a
     blurred rectangle and the photograph on top of it is a true cut-out, so
     every transparent pixel keeps showing it — that is a grey halo around the
     corn, and it is also what the drop-shadow would be shadowing. The contact
     shadow waits for the same signal, for the same reason: an ellipse under a
     blurred rectangle is an ellipse under nothing. */
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
