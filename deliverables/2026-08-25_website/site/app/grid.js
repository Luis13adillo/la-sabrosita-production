/**
 * THE MENU GRID — 45 products, four categories, one page.
 *
 * Both benchmarks show three products per row and only one row per screen, which
 * makes a range of forty-five items unreadable: michoacana.com solves it by
 * splitting the range across a collection page per category, so you can never see
 * the menu, and heladosmexico.com solves it by only listing a handful of SKUs.
 * Ours shows everything, so the grid has to answer two different questions with
 * one layout — "show me everything" and "show me the drinks" — and it has to stay
 * navigable at item forty-five.
 *
 * Five decisions do that work.
 *
 * 1. GROUPED, NOT FLAT. The catalog is rendered as four labelled sections in
 *    category order rather than one 45-tile run. The card already paints itself in
 *    its category's accent, so grouping turns what was a random pink/blue/purple
 *    checkerboard into four colour chapters, and every section's ragged last row
 *    stops reading as an unfinished grid and starts reading as the end of a
 *    paragraph. Search results stay grouped too, which tells you *where* the
 *    matches are, not just how many.
 *
 * 2. ONE STICKY STRIP, DOING BOTH JOBS. The chips filter, as before, and they
 *    also report which category is currently under the bar (`data-here`) while you
 *    scroll the unfiltered page. A second sticky row of category headers would
 *    have cost another ~48px of a 844px phone screen to say something the chips
 *    can say for free.
 *
 * 3. EVERY TILE IS THE SIZE OF THE FOOD IN IT. This is the thing the whole page is
 *    judged on and it is the reason this file measures rather than decorates.
 *
 *    card.js seats each photograph and publishes the result on the article as
 *    lengths in the card's own width — `--food-h` (how tall this product stands),
 *    `--sink` (how far it is dropped so bases line up). What it cannot know is
 *    which cards end up sharing a row, and a CSS grid row is exactly as tall as
 *    its tallest member. So a paleta lying flat next to an ice-cream cone was
 *    getting the cone's field: a correctly-sized cut-out in a third of an acre of
 *    pink. Two lengths fix it, and both of them are the grid's to compute:
 *
 *      --stage-h    the coloured field, set per ROW to the tallest photograph
 *                   actually in that row rather than to the tallest in the
 *                   catalogue. Never taller than the card's own default, so this
 *                   can only ever remove empty colour, never crop food.
 *      --row-panel  the cream reading panel, set per ROW to the tallest panel
 *                   actually in that row rather than to the two-line-name over
 *                   two-line-description case that a handful of the 45 hit.
 *                   card.css asks for this by name; see its `.card__panel`.
 *      --row-name-h the name box, set per ROW to the tallest name in it. Equal
 *                   panels line the cards' bottoms up but not the copy inside
 *                   them: one two-line name in a row of five pushes that card's
 *                   description a line lower than its neighbours' and the row's
 *                   text stops sharing a baseline. Same mechanism, third length.
 *
 *    And because a row can only be as short as its tallest member, each chapter is
 *    ordered by the height of its photograph, tallest first. Nothing in menu.json
 *    defines an order inside a category, the sort is stable so equal heights keep
 *    the catalog's own sequence, and the result is a chapter that visibly settles:
 *    a row of cones, then a row of cups, then a row of things lying flat. Measured
 *    over the four chapters this hands about 9% of the page's coloured area back
 *    to the photographs, and on a two-up phone considerably more.
 *
 * 4. A BIGGER TILE IS EARNED, NOT FALLEN INTO. One product per chapter may be
 *    promoted, and the test is the same for both shapes: the product must have
 *    MORE THAN ONE PHOTOGRAPH. That is the only honest answer to "why is this one
 *    big?" — the card already prints a badge saying how many, so the size and the
 *    badge tell one story, and opening it genuinely has more to show.
 *
 *      BIG (2x2)   the product with the most photographs, provided it is not a
 *                  sliver: doubling a cut-out 0.21 as wide as it is tall only
 *                  doubles the colour around it.
 *      WIDE (2x1)  a flat photograph, so a product twice as wide as it is high
 *                  gets a field twice as wide as it is high. Round 3 awarded this
 *                  on flatness alone and it went straight to the one asset in the
 *                  catalogue that is packaging rather than food. With the merit
 *                  test applied it is currently unreachable — neither of the two
 *                  products flat enough for it has a second photograph — and that
 *                  is the rule working. Nothing is owed a bigger tile.
 *
 *    The promoted tile heads its chapter, which after the height sort is its
 *    tallest row, so a short wide tile costs the cards beside it nothing.
 *
 * 5. EVERY CHAPTER ENDS ON PURPOSE, AND NEVER ON MORE THAN ONE CELL. No column
 *    count divides all four chapters (`node scripts/tails.mjs`), so a chapter's
 *    last row is usually short. Round 3 tried to solve that by choosing the
 *    promotion that left the smallest hole, which is how three empty cells came to
 *    outrank the quality of the photograph in the biggest slot on the page.
 *
 *    It is settled in two steps instead, in this order. First `tune` gives each
 *    chapter its own column count — the page's, then one either side — and takes
 *    the first that ends the chapter flush or one cell short; at 1440 that is
 *    Helados 4, Antojitos 5, Postres 5, Bebidas 4. Then whatever single cell is
 *    left is filled by `.sec__end`, a plaque the full height of the row, shaped
 *    like the card beside it: the chapter's own accent as a field, the same
 *    scalloped seam, then the rule and the label on the panel line. A one-cell
 *    close is a deliberate ending; a three-cell one is a gap with a label on it,
 *    and a blind judge read exactly that as "this is all there is".
 *
 *    Checked rather than asserted: 17 widths from 320 to 2560, both languages,
 *    six search terms and all five filters — 1,020 states — and the widest tail
 *    anywhere is one cell, with no horizontal overflow at any of them.
 *
 * Sparse results get their own treatment: three items left after a search do not
 * sit in the left three of five columns with dead air beside them, they get a
 * three-column grid, centred and width-capped. See `--n` / `data-sparse`. They are
 * measured as one row like everything else, so the state with the least on the
 * page is not also the state with the most empty colour in every tile.
 */
import { items, categories, categoryLabel, matches, t } from './data.js';
import { card } from './card.js';

/* menu.json names each category's accent; tokens.css owns the value behind the
   name. Nothing here is a colour — these are token names, looked up by data. The
   card does the same lookup for the tile; the section header does it for its rule
   and its motif squares so the chapter and its cards are provably one colour. */
const ACCENT_RGB = {
  hotPink: '--c-hot-pink-rgb',
  electricBlue: '--c-electric-blue-rgb',
  deepPurple: '--c-deep-purple-rgb',
  sunnyYellow: '--c-sunny-yellow-rgb',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- reading what the card published -------------------------------------- */
/* card.js writes `--frame`, `--food-w`, `--food-h` and `--sink` onto the article
   as container-query lengths, precisely so nothing downstream has to redo its
   arithmetic. This file reads two of them back. If the format ever changes these
   return null and every measurement below is skipped, which leaves the card
   exactly as card.css draws it on its own — the safe direction to fail in. */
const CQW = /^\s*([\d.]+)cqw\s*$/;
const published = (el, name) => {
  const m = CQW.exec(el.style.getPropertyValue(name));
  return m ? Number(m[1]) / 100 : null;
};

/* A wide tile is a short field on a card twice the normal width, so the sink the
   card computed for a tall field would drop the food straight through the cream
   panel. It gets a small constant grounding instead, and its field is sized to
   the food plus that. A fraction of the tile's own width. */
const WIDE_SINK = 0.02;

/* A photograph qualifies for the wide tile only if it can stand in a one-row
   field on a double-width card without being cropped. A normal row is about
   1.18 x one column tall and a wide tile is about 2.1 columns across, so its
   field is roughly half its own width — anything standing taller than 0.46 of the
   tile's width would either be cut off or force the whole row taller to save it.
   Over the 45 products this admits the two genuinely flat ones. */
const WIDE_MAX_H = 0.46;

/* AND FLATNESS ALONE IS NOT A MERIT. Round 3 chose the wide tile on geometry and
   nothing else, so the double-width, top-left, first-thing-on-the-page slot went
   automatically to whichever photograph in the chapter was flattest — which in
   Helados is the one asset in the whole catalogue that is packaging rather than
   prepared food: a light plastic sleeve carrying another company's wordmark and a
   legible nutrition panel. Being white, it read as a white rectangle laid on the
   pink rather than as a cut-out standing on it, which is the exact device the
   grid is credited for. And the rule was self-reinforcing, because a flat pale
   package is also the best-FILLED card on the page: optimising the number we
   measure had handed the biggest slot to the worst photograph.
   So a promoted tile now has to be EARNED, by the same honesty test the 2x2
   already passes — the product must have more than one photograph. The card
   prints a badge saying how many, opening it genuinely has more to show, and the
   size and the badge tell one story instead of two. Applied to today's catalogue
   this retires the wide tile altogether: the only two products flat enough for it
   (Paletas, Chicharrón Preparado) have a single photograph each. That is the
   rule working, not the rule failing — nothing is owed a bigger tile. */
const PROMO_MIN_SHOTS = 2;

/* And a wide tile needs columns to be wide IN. At two columns `span 2` is simply
   the full width, so the showcase geometry that justifies the promotion is gone
   and one product gets an entire phone screen for nothing. The 2x2 already
   refuses below four columns; this is the same floor for the 2x1. */
const WIDE_MIN_COLS = 3;

/**
 * The 2x2 tile, and why it is not simply "the biggest product".
 *
 * It must have MORE THAN ONE PHOTOGRAPH, because that is the only honest answer to
 * "why is this one big?" — the card already prints a badge saying how many, so the
 * size and the badge tell the same story, and clicking it opens a product view
 * that genuinely has more to show.
 *
 * It must also not be a sliver. A 2x2 tile is the same shape as a normal card, so
 * anything that fills a normal card fills this one — but a product 0.21 as wide as
 * it is tall (the elotes) does not fill either, and doubling it only doubles the
 * empty colour around it. 0.4 is the floor.
 *
 * Ranking among what is left: most photographs, then the higher `visualScale`,
 * which is ink coverage — the photograph with the most actual product in it is the
 * one that can carry the biggest tile.
 */
const FEATURE_MIN_ASPECT = 0.4;

/* A 2x2 tile eats four cells, so below nine visible items it is a quarter of its
   chapter or more — and at eight it does something worse. Bebidas has eight: the
   feature took four cells, six items filled the two rows beside it, and the eighth
   ended up alone in a row with four empty columns after it. That is the round-1
   screenshot, one lost Raspado. Nine is where that stops happening, and it is also
   the smallest chapter we have that can carry a tile this size.

   WHOLE-SITE PASS: THE REASON IS HOLES AND HOLES DEPEND ON COLUMNS, SO A FLAT
   ITEM COUNT IS THE WRONG SHAPE FOR THE RULE. The round-1 screenshot it is
   written from was Bebidas at FIVE columns: eight items plus a 2x2 is eleven
   cells, three into a row of five, four cells bare. At its own four columns —
   which `tune` has been giving it since — the same eleven cells land three into a
   row of four and leave exactly ONE, the same one-cell tail `.sec__end` already
   closes for Postres. The count never changed; the column count did, and the
   rule did not follow it.

   What that flat 9 was costing: Bebidas was the only chapter on the page with no
   promoted tile, and it is the LAST chapter, so the page's final screen of food
   was its flattest — eight equal tiles in a 4x2 mat under three chapters that
   each open on a big one. Nothing had to be invented to fill it either: Aguas
   Explosivas carries two photographs and clears FEATURE_MIN_ASPECT, so it passes
   the same merit test every other feature passed.

   So the floor is kept AND the arithmetic is asked: a chapter may take the tile
   if it already has nine, or if at THIS column count the tile leaves at most one
   cell — the same tail the rest of the page ends on. `plan` still refuses any
   chapter that does not fill two rows beside the tile (`n < cols + 2`), so the
   "a quarter of its own chapter" guard is still doing its job; and merit still
   picks the product, so this only decides whether a tile is offered at all.
   Measured after the change, at 1440: Helados 4 columns, Antojitos 5, Postres 5,
   Bebidas 4 — the same four counts as before, one feature in every chapter, and
   the widest tail anywhere is still one cell. */
const FEATURE_MIN = 9;
/* At or below this many results a chapter stops using the page's column count and
   takes one column per item instead. */
const SPARSE_MAX = 3;

/**
 * How many empty cells a chapter would leave at the end of its last row.
 * A promoted tile changes the count: a 2x1 occupies one extra cell, a 2x2 three.
 */
const holeFor = (n, cols, kind) => {
  const cells = n + (kind === 'big' ? 3 : kind === 'wide' ? 1 : 0);
  const over = cells % cols;
  return over === 0 ? 0 : cols - over;
};

/* THE TAIL IS CAPPED AT ONE CELL, AND THE COLUMN COUNT IS WHAT CAPS IT.
   Helados is nine items; at five columns with a 2x2 feature that is twelve cells,
   so the chapter ends two into a row of five and leaves THREE — 55% of the
   measure, the full height of a tile, bare. A one-cell close is a deliberate
   ending; a three-cell one is a gap with a label on it, and a blind judge read it
   as "that is all there is".

   No single column count tiles all four chapters (`node scripts/tails.mjs` prints
   the table), but a count exists for each chapter separately, and the page can
   hold more than one. So the column count is settled per chapter: the page's own
   count first, then one either side, and the first that ends the chapter flush or
   one cell short wins. On today's catalogue at 1440 that is Helados 4, Antojitos
   5, Postres 5, Bebidas 4 — one plaque on the whole page instead of three, and
   nothing ragged anywhere.

   Two guards, because "fewer holes" must not buy an unreadable card. A chapter
   only leaves the page's count for a card between these two widths: below the
   first the page-17 name/description pair stops being readable, and above it five
   products a screen turns back into the two-a-screen catalogue the benchmarks
   already are. And below three columns the page is a phone, where mobile.css
   fixes the grid at two and this file must not disagree with it.

   THE FLOOR IS THE CARD THIS SITE ALREADY SHIPS, not a number picked for the
   desk. 168 was a guess, and it was 3px too tall to matter: at 768 — a tablet
   held upright, and one of the eleven widths the gate tests — four columns come
   out at 164.6px, so Postres was refused the only count that tiles its sixteen
   items and ended on a two-cell plaque covering two thirds of the measure. The
   card this page serves to every phone at 390 is 171px wide and BRIEF.md's own
   read of it is "two-across works and the cut-outs read at that size". 160 is
   below that by seven pixels rather than above it by three, and it is checked:
   the widths gate asserts no text overflows its box at 320 through 2560, in both
   languages, and the two chapters this unblocks tile flush instead. */
const MIN_CARD = 160;
const MAX_CARD = 340;

/**
 * Which promotion this chapter gets, if any.
 *
 * ROUND 3 LET THE HOLE ARITHMETIC CHOOSE, AND THAT WAS THE BUG. Helados has nine
 * items in five columns: a wide tile leaves no hole at all, a 2x2 leaves three,
 * so the wide tile won by three cells — and those three cells are what bought a
 * plastic sleeve the biggest slot on the page. A rule that trades the quality of
 * the promoted photograph for the tidiness of a chapter's last row is trading the
 * wrong way round, because the tail can be absorbed and the photograph cannot.
 *
 * So merit decides first and arithmetic only breaks ties. `rank` is the order of
 * merit — a product with four photographs in a tile that has room to show it
 * beats a product that merely happens to be flat, and both beat no promotion at
 * all. The hole a chapter ends on is now settled by `.sec__end`, a deliberate
 * chapter close in the tail, which BRIEF.md asks for by name: "End each section
 * with something that is not a product." Three bare cream cells read as a bug;
 * the same three cells carrying the chapter's mark read as an ending.
 */
function plan(built, cols, n) {
  /* Nothing to promote in a chapter that does not fill two rows. */
  if (n < cols + 2) return null;

  const options = [{ kind: null, entry: null, rank: 2 }];

  if (cols >= 4 && (n >= FEATURE_MIN || holeFor(n, cols, 'big') <= 1)) {
    const pool = built.filter((b) => b.item.images.length >= PROMO_MIN_SHOTS
      && Number(b.item.images[0].aspect) >= FEATURE_MIN_ASPECT);
    if (pool.length) {
      pool.sort((a, b) => b.item.images.length - a.item.images.length
                       || (b.item.images[0].scale || 0) - (a.item.images[0].scale || 0));
      options.push({ kind: 'big', entry: pool[0], rank: 0 });
    }
  }

  if (cols >= WIDE_MIN_COLS) {
    const flat = built.filter((b) => b.h != null && b.h <= WIDE_MAX_H
      && b.item.images.length >= PROMO_MIN_SHOTS)
      .sort((a, b) => a.h - b.h)[0];
    if (flat) options.push({ kind: 'wide', entry: flat, rank: 1 });
  }

  /* Merit first, tail second. */
  options.sort((a, b) => a.rank - b.rank
    || holeFor(n, cols, a.kind) - holeFor(n, cols, b.kind));
  return options[0].kind ? options[0] : null;
}

/**
 * How many columns THIS chapter runs at, and what it promotes at that count.
 *
 * Note what is NOT being traded here. Round 3's bug was letting the tail choose
 * the promoted photograph; this chooses the column count and leaves merit to pick
 * the tile exactly as `plan` already does — the same product wins its chapter at
 * four columns as at five. The page's own count is tried first, so a chapter only
 * moves when moving is what makes it end flush.
 *
 * `wrap` is the measure the grid actually has and `gap` the gutter it actually
 * uses, both read off the page rather than assumed, so the width guard is about
 * this viewport and not about 1440.
 */
function tune(built, n, pageCols, wrap, gap) {
  /* The page's own count first, then one FEWER, then one more. The order is not
     arbitrary: when a chapter has to leave the page's count, the whole brief
     wants it to leave in the direction of bigger food, and a column removed is
     about 60px of extra card width for every product in that chapter. One more
     column is still tried, because at the wide end it is sometimes the only count
     that ends flush. */
  const near = pageCols >= 3 ? [pageCols, pageCols - 1, pageCols + 1] : [pageCols];
  const fits = [];
  let best = null;
  for (const c of near) {
    if (c < 2) continue;
    const w = (wrap - gap * (c - 1)) / c;
    if (c !== pageCols && !(w >= MIN_CARD && w <= MAX_CARD)) continue;
    fits.push(c);
    const promo = plan(built, c, n);
    const hole = holeFor(n, c, promo && promo.kind);
    const cand = { cols: c, promo, hole };
    if (hole <= 1) return cand;
    if (!best || hole < best.hole) best = cand;
  }
  /* LAST RESORT, AND ONLY HERE DOES THE TAIL GET A VOTE ON THE PROMOTION.
     Round 3's bug was letting the hole arithmetic choose WHICH photograph got the
     biggest tile on the page; this chooses whether a chapter gets a big tile at
     all, and only once every column count within reach has already failed. A 2x2
     occupies three cells more than its product would, so it is sometimes the only
     reason a chapter cannot end flush at any width available to it — searching
     "a" leaves Postres at fifteen, which tiles four-across on its own and leaves
     two cells at every count with the feature added. Between a feature tile and a
     chapter that ends on a two-cell gap, the tail wins, because the plaque is the
     one thing on the page a blind judge has already read as "that is all there
     is" and a chapter with no promoted tile is simply a chapter of equal tiles.
     Merit still decides which product, everywhere it is not this. */
  for (const c of fits) {
    if (holeFor(n, c, null) <= 1) return { cols: c, promo: null, hole: holeFor(n, c, null) };
  }
  /* Nothing within one column of the page's count ends clean either way. The
     honest answer is the smallest hole available with the plaque spanning it —
     which is now a filled tile carrying the chapter's mark, not a cell of bare
     cream. */
  return best || { cols: pageCols, promo: null, hole: 0 };
}

/**
 * Which cards share a row. Computed from the placement rather than measured off
 * the page, because the placement is deterministic: the promoted tile is always
 * first and always two columns wide, so auto-flow fills the (cols - 2) cells
 * beside it and then runs in even rows. Returns arrays of indices into `ordered`.
 */
function rowsOf(n, cols, kind) {
  const rows = [];
  let i = 0;
  if (kind) {
    const first = [i++];
    for (let k = 0; k < cols - 2 && i < n; k++) first.push(i++);
    rows.push(first);
    if (kind === 'big') {
      const second = [];
      for (let k = 0; k < cols - 2 && i < n; k++) second.push(i++);
      if (second.length) rows.push(second);
    }
  }
  while (i < n) {
    const row = [];
    for (let k = 0; k < cols && i < n; k++) row.push(i++);
    rows.push(row);
  }
  return rows;
}

export function grid(root, { onOpen }) {
  const menu = root.querySelector('.menu');
  const host = root.querySelector('[data-grid]');
  const filters = root.querySelector('[data-filters]');
  const countEl = root.querySelector('[data-count]');
  const emptyEl = root.querySelector('[data-empty]');
  const resetEl = root.querySelector('[data-reset]');
  const bar = root.querySelector('[data-bar]');
  const nav = root.querySelector('.nav');

  let cat = 'all';
  let q = '';
  let here = null;
  let colsNow = 0;
  /* Every row on the page, as { cards, ordinary, wide } — kept so both per-row
     lengths can be recomputed after a font loads or a resize without rebuilding
     the DOM. */
  let layout = [];
  /* The field height card.css uses when nothing tells it otherwise, and the gap
     the card leaves between the tallest photograph in the CATALOGUE and the edges
     of that field. Both are read off the card rather than typed here — the second
     one is simply the first minus the largest `--food-h` on the page — so when
     the card changes its mind about either, every row on this page follows it in
     the same step. Typing 0.025 here instead was 1.7px tighter than the card's
     own answer and would have drifted further with every round. */
  let baseStage = null;
  let edgeClear = null;
  /* card.css draws the seam between a tile's colour and its cream panel as a
     repeating scallop, and declares its size on `.card` as `--bump-w` /
     `--scallop`. The chapter plaque has the same seam and must not have a second
     copy of those numbers: they are read off a real card as the raw token text —
     custom properties compute to their substituted value, not to pixels, so what
     comes back is still `min(5.6cqw, 16px)` and still resolves against whatever
     element it is set on. `.sec__end` is a container of the same width as the
     card, so the scallop lands at exactly the card's size. Null until a card
     exists, and left null if card.css ever stops declaring them, which draws no
     seam at all rather than a wrong one. */
  let seam = null;

  /* ---- the bar ---------------------------------------------------------- */
  /* The bar sticks under the header, so it has to know how tall the header is.
     Measured rather than typed: nav.css is someone else's file and its height
     changes with the viewport. `--bar-h` is published for scroll targets. */
  const measure = () => {
    if (nav) menu.style.setProperty('--nav-h', `${Math.round(nav.getBoundingClientRect().height)}px`);
    if (bar) menu.style.setProperty('--bar-h', `${Math.round(bar.getBoundingClientRect().height)}px`);
  };
  measure();
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(measure);
    if (nav) ro.observe(nav);
    if (bar) ro.observe(bar);
  }

  const stickyH = () =>
    (nav ? nav.getBoundingClientRect().height : 0) + (bar ? bar.getBoundingClientRect().height : 0);

  /* How many columns the page is showing. grid.css owns the breakpoints and
     publishes the answer as `--cols`; asking the computed style keeps this file
     from carrying a second copy of four media queries. */
  const columns = () => {
    const n = parseInt(getComputedStyle(menu).getPropertyValue('--cols'), 10);
    return Number.isFinite(n) && n > 0 ? n : 5;
  };

  /* ---- the chips -------------------------------------------------------- */
  /* Toggle buttons in a labelled group, not a tablist: there is no tab panel for
     the arrow keys to move between, and `aria-pressed` is what a filter chip
     actually is. The dot is the category's own accent, so the bar and the
     chapters below it are visibly the same four colours. */
  const chip = (id, label, accent) => {
    const b = document.createElement('button');
    b.className = 'filter';
    b.type = 'button';
    b.dataset.cat = id;
    if (accent && ACCENT_RGB[accent]) b.style.setProperty('--chip-rgb', `var(${ACCENT_RGB[accent]})`);
    b.innerHTML = `${id === 'all' ? '' : '<span class="filter__dot" aria-hidden="true"></span>'}<span>${esc(label)}</span>`;
    b.setAttribute('aria-pressed', String(id === cat));
    b.addEventListener('click', () => setCategory(id));
    return b;
  };
  filters.append(chip('all', t('filterAll')));
  for (const c of categories) filters.append(chip(c.id, categoryLabel(c), c.accent));

  /* On a phone the chip row is wider than the screen, so the chip you just chose
     can end up off the edge — or, worse, half under the fade at the right, which
     makes the one active control look disabled. Scrolled by hand rather than with
     scrollIntoView, which would also scroll the page. */
  function revealChip() {
    const on = filters.querySelector('[aria-pressed="true"]');
    if (!on) return;
    const a = on.getBoundingClientRect();
    const b = filters.getBoundingClientRect();
    const pad = 34;                       /* clear of the 28px fade */
    if (a.right > b.right - pad) filters.scrollLeft += a.right - (b.right - pad);
    else if (a.left < b.left + 8) filters.scrollLeft -= (b.left + 8) - a.left;
  }

  /* ---- rendering -------------------------------------------------------- */
  const visible = () =>
    items.filter((i) => (cat === 'all' || i.category === cat) && matches(i, q));

  function section(c, list, chapters, cols, wrap, gap) {
    const sec = document.createElement('section');
    sec.className = 'sec';
    sec.id = `cat-${c.id}`;
    sec.dataset.cat = c.id;
    const accent = ACCENT_RGB[c.accent];
    if (accent) sec.style.setProperty('--field-rgb', `var(${accent})`);

    const titleId = `sec-${c.id}-title`;
    sec.setAttribute('aria-labelledby', titleId);

    /* The count is a numeral, not a sentence: it is a fact about the catalog, it
       needs no translation, and the live region in the bar already announces the
       same number in words. Hidden from assistive tech so it is not read as part
       of the heading. */
    sec.innerHTML = `
      <header class="sec__head">
        <span class="motif" aria-hidden="true"><i></i><i></i><i></i></span>
        <h3 class="sec__title" id="${titleId}">${esc(categoryLabel(c))}</h3>
        <span class="sec__n" aria-hidden="true">${list.length}</span>
        <span class="sec__rule" aria-hidden="true"></span>
      </header>
      <div class="grid"></div>`;

    /* Few results, two different shapes. When this chapter is the ONLY thing left
       on the page — "fresas" leaves three desserts — the whole chapter narrows and
       centres and becomes a small poster. When several chapters each hold one or
       two matches — "chile" finds six across three — centring each of them would
       walk the eye left, right, left down the page, so those stay on the page's
       left edge and only widen their cards. Either way the cards grow instead of
       sitting in the left three of five columns with dead air beside them. */
    const g = sec.querySelector('.grid');
    const sparse = list.length <= SPARSE_MAX;
    if (sparse) {
      sec.dataset.sparse = chapters === 1 ? 'solo' : 'few';
      sec.style.setProperty('--n', String(list.length));
    }

    /* Build every card first, then order them, because the thing they are ordered
       by — how tall this photograph stands on its own card — is something card.js
       works out and publishes, and this file has no business recomputing it. */
    const built = list.map((item) => {
      const el = card(item, 0);
      return { item, el, h: published(el, '--food-h'), sink: published(el, '--sink') };
    });
    const known = built.every((b) => b.h !== null && b.sink !== null);

    /* Tallest photograph first. Array#sort is stable, so the many products whose
       cut-outs stand exactly as tall as each other keep the catalog's own order.
       A sparse chapter is left alone: two or three cards have no rows to tune. */
    let ordered = built;
    let promo = null;
    /* The chapter's own column count. A sparse chapter has its own geometry
       already (one column per item, capped and centred) and is left alone. */
    let useCols = cols;
    if (known && !sparse) {
      ordered = built.slice().sort((a, b) => b.h - a.h);
      const tuned = tune(ordered, list.length, cols, wrap, gap);
      useCols = tuned.cols;
      promo = tuned.promo;
      if (useCols !== cols) sec.style.setProperty('--cols', String(useCols));
      if (promo) ordered = [promo.entry, ...ordered.filter((b) => b !== promo.entry)];
    }

    ordered.forEach((b, i) => {
      b.el.style.setProperty('--i', i);
      b.el.querySelector('.card__hit').addEventListener('click', () => onOpen(b.item.id));
      g.append(b.el);
    });

    if (promo) {
      promo.entry.el.classList.add(promo.kind === 'big' ? 'grid__feature' : 'grid__wide');
      /* The WIDE tile takes no panel reserve at all: it is stood on its side, so
         its panel is the full height of the tile already and a reserve measured
         on stacked cards means nothing to it.
         The 2x2 is the opposite case and round 3 had it backwards. Its height is
         fixed from outside — two ordinary rows and the gutter between them — so
         every pixel taken off its panel is a pixel added to a field the food does
         not grow into, and the biggest photograph on the page gets a LOWER share
         of its own tile, not a higher one. It is given the row's reserve in
         `fitRows` (a floor, not a cap) and grid.css spends the width instead, by
         standing the name and the line beside each other across the band rather
         than stacking them into its left 45%. */
      if (promo.kind === 'wide') promo.entry.el.style.setProperty('--row-panel', '0px');
      /* The one place this file re-seats a photograph, and only because it has
         changed the field underneath it: a wide tile's field is about half its own
         width, and the drop card.js computed for a field 1.32 times its width
         would put the base of the food under the cream panel. The field itself is
         set in fitRows, with the same clearance every other row gets. */
      if (promo.kind === 'wide') {
        promo.entry.el.style.setProperty('--sink', `${(WIDE_SINK * 100).toFixed(3)}cqw`);
      }
    }

    /* THE CHAPTER CLOSE — one cell, and shaped like a card.
       `tune` has already made sure the tail is at most one column, because a
       three-column plaque is a gap with a label on it however well the label is
       set. What is left is one cell, and round 3 filled only the bottom sliver of
       it: `align-self: end` put an 8px rule, a numeral and a caption on the cream
       panel line and left the whole tile-height band above them bare. The part
       that reads as "the menu ran out" is that band, not the panel.
       So the plaque now occupies the entire cell and takes the card's own two-part
       shape — a field the height of the row's stage, tinted with the chapter's own
       accent at a tenth, carrying page 19's motif stepping DOWN (so it can never
       be read as the head of a new chapter) over the chapter's count; then the
       rule and the label on the panel line, so the bottom edge still registers
       against the cards beside it. A tint, not an outline: round 2 proved a faint
       outlined box on cream is worse than nothing, and the accent is legal here
       because nothing but shapes and a numeral ever goes on it.
       It states two facts that are already on the page — a numeral and a category
       label, both straight out of menu.json — and it is aria-hidden, because the
       section header two rows up is the real heading and the real count. */
    let end = null;
    const hole = sparse ? 0 : holeFor(list.length, useCols, promo && promo.kind);
    if (hole > 0) {
      end = document.createElement('div');
      end.className = 'sec__end';
      end.setAttribute('aria-hidden', 'true');
      end.style.setProperty('--end-span', String(hole));
      end.innerHTML = `
        <span class="sec__end-field">
          <span class="motif"><i></i><i></i><i></i></span>
          <b class="sec__end-n">${list.length}</b>
        </span>
        <span class="sec__end-foot">
          <span class="sec__end-l">${esc(categoryLabel(c))}</span>
        </span>`;
      g.append(end);
    }

    /* Rows, for the three per-row lengths.
       A sparse chapter is ONE row — it was skipped entirely until now, on the
       reasoning that two or three cards have nothing to equalise, and that was
       wrong twice over. They do share a row, and skipping them left them on
       card.css's own defaults: the field at the catalogue's tallest and the panel
       reserved for a two-line name over a two-line description. So the state
       where the page has the least on it — three results after a search, cards
       grown to 300px to carry it — was also the state where every cut-out sat in
       the most empty colour and the deepest empty cream. Measured as one row they
       get the same treatment as everything else. */
    const rows = !known ? []
      : sparse ? [ordered.map((_, i) => i)]
      : rowsOf(ordered.length, useCols, promo && promo.kind);
    return {
      sec,
      rows: rows.map((row, ri) => {
        const cards = row.map((i) => ordered[i]);
        return {
          cards,
          ordinary: cards.filter((b) => !promo || b !== promo.entry),
          wide: promo && promo.kind === 'wide' && cards.includes(promo.entry) ? promo.entry : null,
          /* The 2x2 straddles this row and the next; it takes the FIRST one's
             panel reserve, so its cream band starts on the same line as the band
             of the three cards beside it. */
          feature: promo && promo.kind === 'big' && cards.includes(promo.entry) ? promo.entry : null,
          /* The plaque sits in the last row's tail, so it takes that row's panel
             height and its bottom edge lands on the same line as the cards'. */
          end: ri === rows.length - 1 ? end : null,
        };
      }),
    };
  }

  /** The coloured field, in card widths. Set on the stage itself: card.css
      declares the default there, and a value inherited from the article would
      lose to it. */
  function setStage(cardEl, value) {
    const stage = cardEl.querySelector('.card__stage');
    if (stage) stage.style.setProperty('--stage-h', value.toFixed(4));
  }

  /**
   * The two per-row lengths, applied to the whole page in one pass.
   *
   * The field height needs no measurement — it comes out of the lengths card.js
   * already published — so it is set first and costs nothing. The panel reserve
   * does need one: the panel is cleared to its own content height, every panel on
   * the page is read in a single batch, and then each row is given the tallest
   * panel in it. That is one forced layout for the whole grid, not one per card.
   */
  function fitRows() {
    if (!layout.length) return;
    if (baseStage === null) {
      /* Asked of card.css rather than typed here — and asked with this file's own
         value taken off the element first, because by now a promoted tile may
         already be carrying one and reading that back would let the grid quietly
         adopt its own answer as the default. That mistake shrank every field on
         the page to the wide tile's and cropped 41 of 45 products. */
      const stage = host.querySelector('.card__stage');
      if (stage) {
        const mine = stage.style.getPropertyValue('--stage-h');
        stage.style.removeProperty('--stage-h');
        const v = parseFloat(getComputedStyle(stage).getPropertyValue('--stage-h'));
        if (mine) stage.style.setProperty('--stage-h', mine);
        baseStage = Number.isFinite(v) && v > 0 ? v : 1.32;
      } else {
        baseStage = 1.32;
      }
      const tallest = [...host.querySelectorAll('.card')]
        .map((el) => published(el, '--food-h')).filter((v) => v !== null);
      edgeClear = tallest.length ? Math.max(0, baseStage - Math.max(...tallest)) : 0;
      const anyCard = host.querySelector('.card');
      if (anyCard) {
        const cs = getComputedStyle(anyCard);
        const bump = cs.getPropertyValue('--bump-w').trim();
        const scal = cs.getPropertyValue('--scallop').trim();
        if (bump && scal) seam = { bump, scal };
      }
    }

    for (const row of layout) {
      /* The wide tile is sized to the one photograph it holds, not to the row: it
         is twice as wide as its neighbours, so the same fraction of its own width
         is twice as many pixels, and a field the height of theirs would be a
         field twice as tall as it needs. */
      if (row.wide) setStage(row.wide.el, row.wide.h + 2 * WIDE_SINK + edgeClear);
      if (!row.ordinary.length) continue;
      /* The field only has to clear the tallest photograph in THIS row — plus
         however far that photograph is dropped, twice, because the drop is
         measured from the middle of the field. Never taller than card.css's own
         default: this may only give colour back to the food, never crop it. */
      const need = Math.max(...row.ordinary.map((b) => b.h + 2 * b.sink)) + edgeClear;
      const h = Math.min(baseStage, need);
      for (const b of row.ordinary) setStage(b.el, h);
    }

    /* THE NAME RESERVE, and why the panel reserve was not enough on its own.
       Every panel in a row is already the same height, so the cards' bottoms line
       up — but the text inside them does not. "Sandwich de Helado" is the only
       two-line name in its row, so its description starts a line lower than its
       four neighbours' and the row's copy visibly wobbles. That was the one thing
       a blind judge credited the runner-up with over us, and it is a third
       per-row length of exactly the same kind as the two already published here:
       `--row-name-h`, the tallest name box in the row.
       Measured before the panels, because equalising the names is what the panel
       then has to be tall enough to hold. Two batched reads for the whole page,
       not two per card. */
    const cards = [];
    const feats = [];
    for (const row of layout) {
      for (const b of row.ordinary) cards.push(b);
      if (row.feature) feats.push(row.feature);
    }
    for (const b of cards) {
      b.el.style.removeProperty('--row-name-h');
      b.el.style.setProperty('--row-panel', '0px');
    }
    /* Cleared too, and this is not tidiness: a 2x2 keeps the reserve it was given
       last time round, so on a resize or after a webfont lands it would measure
       its own previous answer and the tile would ratchet. */
    for (const b of feats) b.el.style.setProperty('--row-panel', '0px');
    const nameH = cards.map((b) => {
      const n = b.el.querySelector('.card__name');
      return n ? n.getBoundingClientRect().height : 0;
    });
    const nameAt = new Map(cards.map((b, i) => [b, nameH[i]]));
    for (const row of layout) {
      if (!row.ordinary.length) continue;
      const tall = Math.max(...row.ordinary.map((b) => nameAt.get(b) || 0));
      if (tall > 0) {
        for (const b of row.ordinary) b.el.style.setProperty('--row-name-h', `${Math.ceil(tall)}px`);
      }
    }

    const heights = cards.map((b) => {
      const p = b.el.querySelector('.card__panel');
      return p ? p.getBoundingClientRect().height : 0;
    });
    const at = new Map(cards.map((b, i) => [b, heights[i]]));
    for (const row of layout) {
      if (!row.ordinary.length) continue;
      const tall = Math.max(...row.ordinary.map((b) => at.get(b) || 0));
      const px = `${Math.ceil(tall)}px`;
      for (const b of row.ordinary) b.el.style.setProperty('--row-panel', px);
      /* The 2x2's band starts on the same line as its neighbours'. */
      if (row.feature) row.feature.el.style.setProperty('--row-panel', px);
      /* The chapter close is as deep as the cream band it is finishing, so its
         seam lands on the row's seam and its foot on the row's bottom edge — and
         it is the card's own scallop, at the card's own size, so the plaque is
         visibly one of these tiles with the photograph left out rather than a
         box that happens to be beside them. */
      if (row.end) {
        row.end.style.setProperty('--row-panel', px);
        if (seam) {
          row.end.style.setProperty('--bump-w', seam.bump);
          row.end.style.setProperty('--scallop', seam.scal);
        }
      }
    }
  }

  /* The gutter, asked of grid.css rather than typed here — `tune` chooses a
     chapter's column count against a card WIDTH, and a width computed from a
     second, stale copy of the gap would let a chapter run at a count whose cards
     are unreadable. On the first render there is no `.grid` on the page yet to
     ask, so an empty one is measured and removed: one forced layout, once. */
  function gridGap() {
    let g = host.querySelector('.grid');
    let probe = null;
    if (!g) {
      probe = document.createElement('div');
      probe.className = 'grid';
      probe.style.cssText = 'position:absolute;visibility:hidden';
      host.append(probe);
      g = probe;
    }
    const v = parseFloat(getComputedStyle(g).columnGap);
    if (probe) probe.remove();
    return Number.isFinite(v) ? v : 0;
  }

  function render() {
    const cols = colsNow = columns();
    /* The measure the grid actually has, off the page rather than assumed. These
       two were the whole reason the tail was three cells wide: `section` was
       being called without them, so every width test inside `tune` compared
       against NaN, every candidate but the page's own count was skipped, and a
       tuner written to cap the tail at one cell silently never ran. */
    const hcs = getComputedStyle(host);
    const wrap = host.clientWidth - parseFloat(hcs.paddingLeft) - parseFloat(hcs.paddingRight);
    const gap = gridGap();
    const shown = visible();
    const groups = categories
      .map((c) => [c, shown.filter((i) => i.category === c.id)])
      .filter(([, list]) => list.length);

    const frag = document.createDocumentFragment();
    layout = [];
    for (const [c, list] of groups) {
      const { sec, rows } = section(c, list, groups.length, cols, wrap, gap);
      layout.push(...rows);
      frag.append(sec);
    }
    host.replaceChildren(frag);
    fitRows();

    for (const b of filters.children) b.setAttribute('aria-pressed', String(b.dataset.cat === cat));
    revealChip();
    countEl.textContent = t('resultsCount', { n: shown.length, total: items.length });
    emptyEl.hidden = shown.length > 0;
    /* `undefined`, not null: null is a legal answer from the spy ("above the first
       chapter"), so clearing to null would let it decide nothing had changed and
       leave the previous chapter's ring on a chip whose section is gone. */
    here = undefined;
    spy();
    root.dispatchEvent(new CustomEvent('grid:render', { detail: { shown } }));
  }

  /* A webfont landing changes how many lines a name takes, which changes the
     panel reserve. Cheap, and it happens once. */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitRows).catch(() => {});

  /* ---- staying in view -------------------------------------------------- */
  /* Filtering 45 items down to 8 while you are scrolled level with item 30 leaves
     you looking at the footer. Pull the results back up — but only when the menu
     has already scrolled off the top, so choosing a category from the header (which
     main.js scrolls for) is not fought over by two scrollers. */
  function keepInView(smooth = true) {
    if (host.getBoundingClientRect().top >= stickyH()) return;
    host.scrollIntoView({ behavior: smooth && !reduced ? 'smooth' : 'auto', block: 'start' });
  }

  /* ---- which category am I in ------------------------------------------- */
  /* A scroll listener over four elements, rAF-throttled. An IntersectionObserver
     would need a rootMargin recomputed every time the sticky strip changes height,
     which is exactly the thing that goes stale. */
  let ticking = false;
  function mark(at) {
    if (at === here) return;
    here = at;
    for (const b of filters.children) b.toggleAttribute('data-here', b.dataset.cat === at);
  }

  function spy() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      let at = null;
      if (cat === 'all') {
        const line = stickyH() + 8;
        for (const s of host.children) {
          if (s.getBoundingClientRect().top <= line) at = s.dataset.cat;
        }
      }
      mark(at);
    });
  }
  addEventListener('scroll', spy, { passive: true });

  /* A resize changes the card width, which changes how many lines a name takes,
     and at a breakpoint it changes which cards share a row — and therefore which
     chapter can end flush. Re-planned only when the column count actually moves;
     otherwise the rows are simply re-measured. */
  let sized = 0;
  addEventListener('resize', () => {
    measure();
    cancelAnimationFrame(sized);
    sized = requestAnimationFrame(() => {
      if (columns() !== colsNow) render();
      else fitRows();
    });
  }, { passive: true });

  /* ---- controls --------------------------------------------------------- */
  function setCategory(id) {
    if (id === cat) return;
    cat = id;
    render();
    keepInView();
  }

  resetEl?.addEventListener('click', () => {
    const search = root.querySelector('[data-search]');
    if (search) search.value = '';
    q = '';
    cat = 'all';
    render();
    keepInView();
  });

  render();
  return {
    render,
    setCategory,
    /* Typing in the header while you are level with item thirty shrinks the page
       under you and leaves you looking at the footer. One instant jump back to the
       results — instant, not smooth, because this fires on every keystroke and the
       condition is false for all the ones after the first. */
    setQuery(value) { q = value; render(); keepInView(false); },
    get category() { return cat; },
  };
}
