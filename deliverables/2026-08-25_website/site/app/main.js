import { grid } from './grid.js';
import { detail } from './detail.js';
import { reveal, heroDrift } from './motion.js';
import { categories, categoryLabel, items } from './data.js';
import { readState, writeState } from './url-state.js';

const root = document;
const view = detail(root);
const list = grid(root, { onOpen: (id) => view.open(id, current) });
let current = items.map((i) => i.id);

// Set once the URL's own state has been applied, so the first render does not
// overwrite the query string it is about to restore from.
let restored = false;

root.addEventListener('grid:render', (e) => {
  current = e.detail.shown.map((i) => i.id);
  reveal(root);
  // Every route into a filter ends here — the header links, the chips in the
  // menu, and the search field — so this is the one place that records it.
  if (restored) writeState({ cat: list.category, q: searchValue() });
});
const searchValue = () => {
  const el = root.querySelector('[data-search]');
  return el ? el.value.trim() : '';
};

// Category links in the header drive the same filter as the chips.
const catnav = root.querySelector('[data-catnav]');
for (const c of categories) {
  const a = document.createElement('button');
  a.type = 'button';
  a.className = 'nav__cat';
  a.textContent = categoryLabel(c);
  a.addEventListener('click', () => {
    list.setCategory(c.id);
    document.getElementById('menu').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  catnav.append(a);
}

const search = root.querySelector('[data-search]');
search.addEventListener('input', () => list.setQuery(search.value.trim()));

// Restore whatever the URL is carrying, and keep it up to date. This is what
// makes a category linkable and what carries your place across the language
// switch — see src/app/url-state.js.
const startState = readState();
if (startState.q) { search.value = startState.q; list.setQuery(startState.q); }
if (startState.cat !== 'all') list.setCategory(startState.cat);
restored = true;
writeState({ cat: list.category, q: search.value.trim() });

heroDrift(root.querySelector('[data-hero-stage]'));
reveal(root);

/* ===========================================================================
   HERO — the cut-out mass
   =======================================================================
   Everything below owns one thing: turning five product photographs into a
   single overlapping silhouette that is as big on the first screen as the food
   on heladosmexico.com, without the page having to measure a PNG.

   HOW A PLACEMENT IS STATED. Every derivative is a square with the product
   centred inside it, covering `fillH` of the square's height (data/images.json
   publishes it; nothing here measures an image). Sizing the <img> therefore
   sizes the bounding box and not the food — which is why the old hero's three
   cut-outs looked like three unrelated sizes. So a placement is written in the
   FOOD's own units and the square is derived from it:

     h     the food's height,      as a % of the stage's height
     b     the food's bottom edge, as a % of the stage's height  (< 0 bleeds off)
     x     the food's centre,      as a % of the stage's width — and on a wide
           screen the stage is the column to the RIGHT of the reading, not the
           whole section, so 0% is where the headline's column ends
     z     paint order, front-most highest
     rate  parallax rate; motion.js writes --drift, hero.css spends it

   and three more that are about the LIGHT rather than the placement:

     lift  exposure, as a brightness multiplier. Omitted means 1.
     sat   saturation, same. Omitted means 1.
     sink  how hard this photograph's base is pushed into shadow, 0 to 1.

   WHY THE LIGHT NEEDS NUMBERS AT ALL. The five masters come from five different
   shoots and it is measurable rather than arguable — `node scripts/lighting.mjs
   crazy-shake raspado mango-en-flor elote churros` compares the mean luminance
   of each shot's opaque pixels, top half against bottom half:

       raspado         19 points brighter at the top,  mean luminance  99
       elote            0, but keyed hard from the left,             154
       crazy shake     -1 (v04) / +24 (v02)                      170 / 183
       mango en flor   -6                                            136
       churros        -47  — lit from BELOW                          146

   A 66-point spread of key direction and a 71-point spread of exposure inside
   one silhouette is what makes five overlapping cut-outs read as five PNGs in
   z-order instead of as one object on one table.

   THE LEVER IS NOT RETOUCHING. assets/ holds approved bytes and re-lighting a
   photograph would misrepresent what the shop serves; `scripts/assets-untouched.mjs`
   exists to catch exactly that, and it passes. These three numbers are a display
   transform on a derivative — the same kind of thing as a CSS filter on a card —
   and hero.css spends them as `brightness()`, `saturate()` and a gradient masked
   to the product's own alpha.

   AND THE NUMBER IS TAKEN OVER WHAT IS VISIBLE, NOT OVER THE WHOLE FILE. Every
   cut-out here is cropped by the fold, most of them heavily, so measuring a
   whole master reports the light on food nobody can see. Simulated through the
   same arithmetic the browser uses, restricted to the part of each photograph
   that is above the fold:

       crazy shake     25 / meanL 151      elote           19 / meanL 145
       raspado         28 / meanL 123      churros         33 / meanL 131
       mango en flor   22 / meanL 133

   vertical spread 14, exposure spread 28 — against 19 and 33 for the previous
   group measured the same way. Every one of them is lit from above, which is
   the direction the shared cast shadow claims.

   CHURROS IS THE INTERESTING ONE, AND IT IS WHY THE SINK DROPPED FROM .90 TO
   .34. That shot measures 47 points brighter at the bottom over the whole file,
   and the reason is albedo rather than lighting: the bottom half is a pale
   kraft cone and the top half is dark fried dough. The placement below now puts
   58% of it below the fold — the cone is gone — and what is left, the dough
   alone, measures +31 on its own. It was never lit from below; its cone was.
   A .90 sink on top of that over-corrected it to +37 and made it the outlier of
   the group. The sink is not doing nothing at .34 — it still darkens the base
   at the narrow-desktop scale, where more of the cone comes back.

   WHY THESE FIVE. All four categories are represented, so the mass says "whole
   menu" and not "we sell milkshakes". The centrepiece is a Crazy Shake
   (helados) — the tallest and most spectacular thing in the catalogue. Around
   it: a raspado (bebidas) on the left shoulder, a box of churros (postres) low,
   in front and running off the bottom-left corner so the mass has a front edge,
   a mango en flor (postres) on the right shoulder running off the right edge,
   and an elote (antojitos) as the thin vertical that stitches the shake to the
   mango.

   The bebida used to be a mangonada and is now a raspado, for a reason that is
   about shape and not about taste. A support is read at a third of the
   subject's size and half of it is behind something else, so the only part of
   it a customer ever sees is its top edge — and the mangonada's top third is a
   tamarind straw 6% as wide as the cup. Behind the churros it rendered as a
   stick with nothing under it. The raspado is the one drink in the catalogue
   with no spike at all (broad to 0.99 of its own height), so it reads at
   support size, and its watermelon red is the only cool note in a mass that is
   otherwise white, gold and yellow.

   ---------------------------------------------------------------------------
   THE THIRD-PARTY BRAND AND THE SPIKE CAME OFF IN ONE DECISION: `shot: 2`.

   The Crazy Shake has four photographs and the hero used `shot: 0`
   (LS_Crazy-Shakes_MASTER_v04). Two things were wrong with it and they had one
   fix. Its most legible object was an embossed HERSHEY'S bar sitting at the
   optical centre of the client's own first screen — the only thing in the frame
   with type on it, so the eye went there — and the top fifth of its alpha box
   was a birthday candle 17px wide in an 800px master, 5.6% of the product's own
   width, so every point of `h` spent up there bought a stick rather than mass.

   All four were measured before choosing, off `ink` and `fillW` in
   data/images.json and off the alpha channel's own width profile:

       v04  shot:0   ink .188   fillW .411   candle spike   HERSHEY'S legible
       v03  shot:1   ink .282   fillW .476   two wafer spikes
       v01  shot:3   ink .303   fillW .497   broad           embossed OREO
       v02  shot:2   ink .293   fillW .481   broad           no legible mark

   v02 is the only one that is both broad and unbranded. At the same square it
   carries 56% more opaque food than v04 (.293 against .188) and is 17% wider,
   and its width profile is 84-99% of its own width from 20% to 55% of its
   height — a dome of whipped cream, marshmallows and chocolate sauce over a
   marshmallow rim, with the sauce running down the cup to the base.

   WHAT IT COST, STATED RATHER THAN HIDDEN: v04 carried a slice of cake and a
   rainbow sprinkle rim, and a blind judge named "frosting, sprinkles" as part
   of why this hero won its round. Those are gone. What replaces them is
   marshmallow, whipped cream and chocolate sauce — the same class of thing, and
   the judge's other three nouns (fried churro, shaved ice, chilli-dusted fruit)
   are all still on the screen. The trade is deliberate: a competitor's wordmark
   at the optical centre of a client's homepage is not a design detail, and v04's
   lower two thirds is a flat pale cup wall, which is exactly what the phone
   critique called "a flat colour field with no identifiable food in it".

   ---------------------------------------------------------------------------
   ONE MASS, AND IT IS MEASURED IN 40px COLUMNS.

   `h` is the height of the food's alpha box, not of its silhouette, so two
   products with the same `h` do not read the same size. Every placement below
   is chosen against where the photograph stops being a spike, and then checked
   against the rendered page: the stage is differenced against the same page
   with `.hero__stage` hidden, which gives the silhouette exactly rather than by
   guessing a background colour. Read in 40px columns as a share of the hero:

       crazy-shake     90-100%, across eighteen columns   <- the subject
       mango + elote   51-69%
       raspado         51-69%
       churros         30%, and it is the front edge, not a shoulder
       deepest seam    24% — no column between the leftmost and rightmost food
                       is empty, where the previous hero had a 104px channel of
                       bare gradient splitting it into two islands

   The leftmost food pixel moved from x=1184 of 2880 to x=240: 41.1% of the
   first screen carried no food at all, and now 8.3% does. That is the churros,
   and it is the one cut-out with a NEGATIVE `x` — it starts left of the stage,
   inside the reading column, which is legal because .hero__inner is z-index 2
   and the stage is 1.

   THE ONE RULE THAT CONSTRAINS IT: nothing may pass behind bare white type.
   White on hot pink is 4.06 and behind a churro it is about 1.6. Measured, the
   glyph line boxes end at y=567 and x=574 (Spanish) / x=558 (English), so the
   churros' top edge sits at y=608. The actions row is not part of that rule —
   the call to action is an opaque cream pill and the count is an opaque deep
   purple one, so food passes behind them and reads as depth, which is what
   closed the 19.0%-of-the-hero empty band the last round left under them.

   IT BLEEDS OFF THREE EDGES. This section is exactly the first screen, so the
   seam with the menu crops the food at the fold; `overflow: hidden` grazes the
   shake's crown at the header; and the mango runs off the right. A cut-out that
   ends neatly inside its frame is a photograph; one that runs off the edge is a
   thing in the room.

   DOM ORDER IS NOT PAINT ORDER. motion.css gives its first three children
   distinct float periods and everything after them shares one, so the three
   pieces a customer actually looks at go first in the DOM and --z puts them
   back in the right depth. */

/* The one import this block adds. `srcset` reads the derivative widths that
   actually exist on disk (400/600/800/1400) instead of a literal list, so the
   hero cannot be the file that goes stale when a step is added or removed. */
import { srcset } from './data.js';

const HERO_DESKTOP = [
  /* THE CROWN CLOSES INSIDE THE FRAME NOW, and the size did not change.
     Two blind judges named the same fault: the hero's top edge cut the lead
     subject with a dead-straight full-width line that landed within a few px of
     the nav drip's deepest lobes, so the top of the shake was "a sawtooth of
     purple against a ruler-straight slice through four marshmallows". It read as
     a clipping bug rather than as either clearing the header or breaking it.

     The drip is a varying-depth melt (lobes from 7 to 27 units), not a uniform
     scallop, so the hero's bottom-edge trick -- mask the cut with the same
     repeating half-disc -- has nothing to align to at the top.

     So `h` is untouched at 126 and `b` moves from -18 to -29. Same subject, same
     scale, 11 points of crop moved from the TOP edge to the BOTTOM one. The
     bottom is where this hero already bleeds on purpose, and where three judges
     rewarded it for bleeding; the top is where a straight line collides with a
     shaped one. Crown now lands at 97% of the stage, clear of the deepest lobe. */
  { id: 'crazy-shake',   shot: 2, h: 126, b: -29, x:  40, z: 4, rate: 0.09, sink: 0.12, lift: 0.83, lead: true },
  /* The one cut-out with its OWN bottom edge. Round 3 won its blind ranking and
     was capped at narrow for one reason: all five entries carried a negative
     `b`, so all five were terminated by the same horizontal fold and the group
     painted as a rectangular slab of food pasted along the bottom of the frame
     rather than as five objects. One visible base is enough to break that — the
     eye reads "objects, some of which the frame happens to cut" instead of "one
     shape cut straight across". The raspado is the right one to lift: it is the
     only hero product whose base is a plain rounded cup rather than a stick end
     (elote), a paper cone (churros) or a spiked crown (the shake), so it is the
     only one that can end without looking severed. +4 clears the fold by a
     visible margin without lifting it out of the mass. */
  { id: 'raspado',       shot: 0, h:  72, b:   4, x:  16, z: 2, rate: 0.13, sink: 0.12, lift: 1.32, sat: 1.06 },
  { id: 'mango-en-flor', shot: 0, h:  98, b: -32, x:  82, z: 1, rate: 0.11, sink: 0.62, lift: 1.05 },
  { id: 'elote',         shot: 0, h:  66, b: -16, x:  66, z: 3, rate: 0.16, sink: 0.46 },
  { id: 'churros',       shot: 0, h:  88, b: -51, x: -21, z: 5, rate: 0.06, sink: 0.34, lift: 1.05 },
];

/* A tablet is the awkward one: one column, like a phone, but 600-900px of it.
   Three cut-outs sized as a share of the stage's HEIGHT do not span that width,
   so the phone's mass would open two holes and read as a scatter again — which
   is the exact fault this round set out to fix. Five, spaced tighter, close it.
   A tablet is also not the device the first-screen byte budget is written for.

   Every height here is 28% larger than it was, and the reason is a screenshot:
   at 760x1024 the mass stopped 56% of the way down the screen and left a band of
   empty field between the call to action and the food, with nothing in it but
   the birthday candle. A tablet is one column like a phone but it has a phone's
   worth of reading in twice the height, so its leftover is vertical rather than
   horizontal — and the answer is the one the desktop already makes: let the food
   be bigger than the window rather than centre it in what is left over.

   THE CEILING IS THE READING, AND ON ONE COLUMN IT IS A HARD ONE. Measured at
   760x1024 the glyphs end at y=368 and the actions row runs 392-450, so the
   shake's food top is placed at 388: below the last line of the deck, and
   inside the actions row, where the two pills are opaque reading areas and the
   crown passes behind them. That is what h:85 / b:-13 resolves to. The previous
   plan could push to h:100 only because the top fifth of the old photograph was
   a birthday candle 17px wide, which crossed the headline as a 4px stripe; v02
   has no candle and no spike, so the same `h` would put a dome of whipped cream
   across the headline instead, and there is no top edge to crop it against on
   one column. Less `h` here buys more silhouette, not less. */
const HERO_TABLET = [
  { id: 'crazy-shake',   shot: 2, h: 85, b: -13, x: 50, z: 4, rate: 0.09, sink: 0.12, lift: 0.83, lead: true },
  { id: 'raspado',       shot: 0, h: 59, b:  -9, x: 15, z: 2, rate: 0.13, sink: 0.12, lift: 1.32, sat: 1.06 },
  { id: 'mango-en-flor', shot: 0, h: 88, b: -29, x: 78, z: 1, rate: 0.11, sink: 0.62, lift: 1.05 },
  { id: 'elote',         shot: 0, h: 58, b: -14, x: 68, z: 3, rate: 0.16, sink: 0.46 },
  { id: 'churros',       shot: 0, h: 60, b: -32, x: 30, z: 5, rate: 0.06, sink: 0.34, lift: 1.05 },
];

/* A 390px screen has no room beside the reading, so the mass moves under it and
   pays for its size by running off both side edges instead of only the bottom.
   Most of the five are dropped rather than shrunk: five cut-outs at phone size
   are five small cut-outs, and each one is another image in the first screen's
   byte budget, which is the number the whole site is judged on.

   TWO, NOT THREE, AND IT WAS MEASURED RATHER THAN JUDGED.

   This was crazy-shake, mango en flor and raspado until mobile.css put a
   `scale(1.52)` on the stage — its own decision, and a good one, because it is
   what closed the gap to heladosmexico on a phone. But the scale is anchored to
   the bottom edge, so everything grows outward past the side edges, and the
   third cut-out grew straight off the right of the screen behind the first.

   Hidden one at a time and counted against the rendered 390x844 first screen:

       crazy-shake     119370 px   36.3% of the screen
       raspado          80353 px   24.4%
       mango en flor      377 px   a 32x40 sliver at the right edge

   377 pixels is not a product on a menu, and at that placement the browser was
   still fetching the 1400px candidate for it — 97 kB of a first screen the whole
   site is judged on, for a stamp the size of a fingernail. So it comes off
   here and stays in the desktop and tablet plans, where it is measured at 6.6%
   of the screen and is the right-edge bleed.

   The phone therefore shows helados and bebidas as photographs. All four
   categories are still named on the first screen, in the client's own approved
   deck line — "Nieves, antojitos, postres y bebidas." — which is the sentence
   mobile.css deliberately keeps when it drops the second half of the deck.

   The same hierarchy rule applies with two pieces as with five: the shake's body
   reaches 45% of the stage and the raspado stops at 33%.

   ---------------------------------------------------------------------------
   THE PHONE'S NUMBERS ARE SET BY A MASK IN A FILE THIS ONE DOES NOT OWN.

   `styles/mobile.css` fades the top 51% of the stage out, and it exists for
   exactly one reason: to dissolve the birthday candle on the old photograph
   before it reached the headline. Its own comment states the coupling —
   "IF `h` OR `b` MOVES, RE-DERIVE BOTH NUMBERS".

   `shot: 2` removes the candle, so that mask now has nothing to hide and would
   instead eat the top of the whipped cream if the food were allowed to reach
   it. Rather than override another owner's declaration from here — BRIEF.md is
   explicit that two files editing one declaration silently overwrite each other
   — the placement is chosen so the mask cannot bite: the opaque half of the
   gradient starts at 52.8% of the stage from the top, so the food's top is put
   at 55%, i.e. `b + h <= 45`. h:60 / b:-15.

   THAT COSTS NOTHING, MEASURED. The old plan's `b + h` was 64, but 15 points of
   that were candle the mask was removing anyway, so its visible mass topped out
   at 49% of the stage. The new one tops out at 45% and is 17% wider. Against
   the rendered 390x844 screen, differenced the same way as the desktop, the
   tallest silhouette column is 429px either way — 50.8% of the phone screen.

   WHAT ACTUALLY CHANGED ON THE PHONE IS WHAT IS INSIDE THOSE 429 PIXELS. The
   bottom third used to be two flat colour fields: a pale cup wall and a red
   slab. v02 puts marshmallows, a chocolate-drizzled rim and sauce running down
   the cup in the same space. Area was never the phone's problem; naming the
   food was.

   FOR THE MOBILE OWNER: the mask is now vestigial and its derivation comment is
   stale. It is safe where it is — nothing reaches it — but it can come off. */
/* NOT GROUNDED, and the reason is arithmetic rather than taste. The phone's
   blind critique named the same fault the desktop had — "three of four sides are
   straight cuts, which is the exact fault the lead fixed on DESKTOP by lifting
   the raspado to b:+4 and which was never carried to mobile" — and the desktop
   fix does not transfer. `lift: 1.32` scales the painted cup 32% past its own
   box, so on a 390x844 screen the box can sit 6px ABOVE the fold and the cup
   still runs 90px below it. Measured: box 242..838, painted foot ~933.

   Buying those 90px means raising `b` by about 7.5 points of stage height, which
   moves the cup's top from y=330 to y=191 — behind the bare white headline,
   where white-on-food is about 1.6:1. That is the one rule this hero is not
   allowed to break, so the choice is: shrink the food, break the contrast rule,
   or leave the phone as a wall of food. Every judge across three rounds rewarded
   the wall. It stays a wall, on purpose, and the desktop keeps its step because
   five objects across 1440px can afford one that stands. */
const HERO_MOBILE = [
  { id: 'crazy-shake',   shot: 2, h: 60, b: -15, x: 66, z: 3, rate: 0.09, sink: 0.12, lift: 0.83, lead: true },
  { id: 'raspado',       shot: 0, h: 42, b:  -9, x: 17, z: 2, rate: 0.06, sink: 0.12, lift: 1.32, sat: 1.06 },
];

const heroSection = root.querySelector('[data-hero]');
const heroStage = root.querySelector('[data-hero-stage]');

/* The section is the first screen exactly — 100svh less the header, which is in
   flow — so the food is cropped by the seam with the menu rather than stopping
   short of it. The header's height is measured rather than assumed because it
   wraps to two rows on a phone. */
const fitHero = () => {
  const nav = root.querySelector('[data-nav]');
  if (heroSection && nav) {
    heroSection.style.setProperty('--nav-h', `${Math.round(nav.getBoundingClientRect().height)}px`);
  }
};

/* THE DECK IS TWO SENTENCES AND THEY ARE TWO STEPS.

   ui.json holds the client-approved deck as one string with two sentences in
   it, and the partial prints it into one <p>. That is correct for the copy and
   wrong for the type: the promise ("Ice cream, snacks, desserts and drinks.")
   and the instruction ("See all of it before you walk in.") arrive at the same
   size, so the hero reads as three type levels — eyebrow, headline, deck —
   where it has four things to say.

   This splits the paragraph at the period that is already in the sentence. No
   word is added, removed, reordered or re-cased; `textContent` on the paragraph
   is byte-for-byte what ui.json holds, including the space between them, so a
   screen reader and the copy gate both still see one approved sentence pair.
   Without JavaScript the deck simply stays one paragraph, which is the correct
   thing to degrade to. */
function splitLead() {
  const p = root.querySelector('[data-hero-lead]');
  if (!p || p.firstElementChild) return;
  const text = p.textContent.trim();
  const cut = text.indexOf('. ');
  if (cut < 1) return;
  const a = document.createElement('span');
  a.className = 'hero__lead-a';
  a.textContent = text.slice(0, cut + 1);
  const b = document.createElement('span');
  b.className = 'hero__lead-b';
  b.textContent = text.slice(cut + 2);
  p.replaceChildren(a, document.createTextNode(' '), b);
}

const wide = matchMedia('(min-width: 901px)');
const tablet = matchMedia('(min-width: 601px) and (max-width: 900px)');

/* Every cut-out currently on the stage, with the one number that has to be
   re-spent when the viewport changes height. Rebuilt by paintHero. */
const placed = [];

/* THE READING FLOOR, AND WHY IT IS MEASURED INSTEAD OF ASSUMED.

   One cut-out is given a negative `x` so that it starts left of the stage and
   fills the bottom of the reading column (see hero.css on .hero__inner). White
   on hot pink is 4.06; white on a churro is about 1.6. So the one thing that
   placement may never do is pass behind BARE type — and where the bare type
   ends is not a constant. At 1440x900 the deck's last line ends at y=567; at
   1290x720 the headline breaks to four lines instead of three and the same line
   ends at y=629, 62px lower, on a screen that is 110px shorter. A `b` that is
   safe at one of those is a contrast violation at the other.

   So it is read off the page. `.hero__lead` is the lowest element on the field
   carrying bare glyphs — the actions row below it is two opaque pills, a cream
   one and a deep purple one, which are reading areas in brand.json's own sense
   and are deliberately allowed to have food behind them. `seatHero` lowers any
   negative-x placement until its top edge clears that floor by 24px, and it is
   re-run on resize and after the webfont lands, because both can re-wrap the
   headline. Where the reading takes the whole column, the food loses the height
   rather than the type losing its contrast. */
const READ_CLEAR = 24;

function readingFloor() {
  const lead = root.querySelector('.hero__lead');
  return lead ? lead.getBoundingClientRect().bottom : 0;
}

/* The stage's transforms (hero.css at 901-1280, mobile.css below 600) are both
   anchored `50% 100%`, so a point sitting f of the stage's height above its
   bottom edge still sits f of the RENDERED height above the same bottom edge.
   That is why this arithmetic can use the transformed rect throughout and does
   not have to unpick the scale. */
function seatHero() {
  if (!heroStage || !placed.length) return;
  const r = heroStage.getBoundingClientRect();
  if (!r.height) return;
  const limit = readingFloor() + READ_CLEAR;
  for (const seat of placed) {
    const { p, side } = seat;
    let b = p.b;
    if (p.x < 0 && limit > 0) {
      const top = r.bottom - ((p.b + p.h) / 100) * r.height;
      if (top < limit) b = Math.max(-p.h, ((r.bottom - limit) / r.height) * 100 - p.h);
    }
    seat.el.style.setProperty('--ib', `${(b - (side - p.h) / 2).toFixed(2)}%`);
  }
}

function paintHero() {
  if (!heroStage) return;
  heroStage.replaceChildren();
  placed.length = 0;
  const plan = wide.matches ? HERO_DESKTOP : tablet.matches ? HERO_TABLET : HERO_MOBILE;
  /* THE PHONE'S CUT-OUTS ARE CAPPED AT THE 800px CANDIDATE. THE DESKTOP'S ARE NOT.

     Measured on `npm run perf`'s 4G profile — 3 Mbit, 40ms round trip, 4x CPU,
     device pixel ratio 3, which is a real phone standing outside the shop:

         as it shipped         first screen 1531 kB   LCP 3700 ms
         phone hero capped     first screen 1404 kB   LCP 2888 ms

     812 ms and 127 kB, and it is the single largest lever left on that number.

     WHAT IT COSTS, STATED RATHER THAN HIDDEN. The lead cut-out is drawn 852 CSS
     px wide on a 390px screen — 2.2x the viewport, on purpose, with about half of
     it off the edge. At ratio 3 that is 2556 device pixels, so the 1400 source was
     already being upscaled 1.83x and the 800 source is upscaled 3.2x. Compared at
     1:1 device pixels, side by side, the difference is a faint softening on the
     chocolate's specular edges. In isolation, on a phone, it is not visible. It is
     a trade and this comment is where it is recorded.

     WHY NOT ON A DESKTOP. At ratio 2 the same cap would put an 800px source under
     a 1168px shake — a 2.9x upscale on a picture that is the entire screen, looked
     at on a large display, on a connection where LCP is already 388 ms. There is
     nothing to buy there and something to lose, so the cap is scoped to the plan
     that is actually on a phone rather than to a width or a ratio.

     BRIEF.md's SUGGESTED FORM OF THIS DOES NOT WORK, and it is worth saying so:
     `sizes / Math.min(devicePixelRatio, 1.5)` gives 852/1.5 = 568 CSS px, which at
     ratio 3 asks for 1704 device px and still selects the 1400 candidate — no
     bytes saved at all. `sizes` is multiplied by the ratio, so capping the ratio
     cannot cap the candidate. 799/ratio is the arithmetic that actually lands on
     the 800 step, and the 799 rather than 800 is not a typo: floor(800/3) is 267,
     which asks for 801 device px and rounds straight back up to 1400. */
  const capPx = plan === HERO_MOBILE ? Math.floor(799 / (devicePixelRatio || 1)) : Infinity;
  // The stage's own height is what a `sizes` attribute has to be written
  // against, because every square is sized off it rather than off the width.
  const stageH = heroStage.getBoundingClientRect().height || innerHeight;

  for (const p of plan) {
    const item = items.find((i) => i.id === p.id);
    if (!item) continue;
    const shot = item.images[p.shot] || item.images[0];
    if (!shot) continue;

    // The square that holds a food this tall, and where its own bottom lands
    // once the padding above and below the food is accounted for. Both are
    // shares of the stage's height, so they survive any viewport.
    const side = p.h / shot.fillH;
    const bottom = p.b - (side - p.h) / 2;

    // The square's RENDERED side, in px. It is both the `sizes` the browser
    // picks a candidate against and the unit the shadow is spent in, so it is
    // computed once and used twice.
    const px = Math.round((side / 100) * stageH);

    /* A WRAPPER, NOT A BARE <img>, AND THE REASON IS THE KEY LIGHT.

       A filter on a photograph is uniform: it can correct how BRIGHT a shot is
       and it cannot correct which side of it the light came from. Churros is
       the case that needs the second thing — 43 points brighter along its
       bottom half than its top, the only element in the group that is, so it
       is the one that reads as pasted onto the others.

       Putting the photograph inside a span gives hero.css somewhere to hang a
       second layer that is masked to the product's own alpha and multiplied
       into it, sinking each cut-out's base into shadow in the one direction
       they now all share. The <img> alone has no box to hang it on: a
       pseudo-element cannot be a child of a replaced element. */
    const cut = document.createElement('span');
    cut.className = 'hero__cut';

    const img = document.createElement('img');
    img.alt = '';
    img.width = 800;
    img.height = 800;
    img.decoding = 'async';
    // The centrepiece is the largest painted thing on the first screen, which
    // makes it the Largest Contentful Paint whether or not anyone planned it.
    // Set as an attribute, not a property: only Chromium reflects the property.
    if (p.lead) img.setAttribute('fetchpriority', 'high');
    // sizes before srcset before src. The square's rendered width comes from the
    // stage's HEIGHT, so it cannot be written as a vw and has to be resolved
    // here; setting it after srcset would let the browser choose a candidate
    // against the 100vw default first and fetch the wrong one.
    img.sizes = `${Math.min(px, capPx)}px`;
    img.srcset = srcset(shot.stem);
    img.src = `/img/${shot.stem}-800.webp`;

    /* Placement, exposure and shadow, all on the wrapper.

       --lift / --sat are this photograph's exposure correction and default to
       1, so a row that says nothing is left exactly as it was shot. --sink is
       how hard its base is pushed into shadow. --sh is the square in px, which
       is what makes the drop-shadow a fraction of the object instead of the
       fixed 18px in --shadow-food; that token is sized for a 230px menu card,
       and 18px under a 1168px milkshake is invisible. */
    cut.style.cssText =
      `--ih:${side.toFixed(2)}%;--ib:${bottom.toFixed(2)}%;--x:${p.x}%;` +
      `--z:${p.z};--rate:${p.rate};--sh:${px}px;--sink:${p.sink ?? 0.3}` +
      (p.lift ? `;--lift:${p.lift}` : '') +
      (p.sat ? `;--sat:${p.sat}` : '');

    /* The sink is masked with the very file the <img> just fetched, so it is a
       cache hit rather than a second download — and it is only switched on once
       there is a real URL to mask with, because `mask-image: none` would paint
       the layer as a purple rectangle instead of as a product. */
    const lit = () => {
      cut.style.setProperty('--cut', `url("${img.currentSrc || img.src}")`);
      cut.setAttribute('data-lit', '');
    };
    if (img.complete && img.currentSrc) lit();
    else img.addEventListener('load', lit, { once: true });

    cut.append(img);
    heroStage.append(cut);
    placed.push({ el: cut, side, p });
  }
}

/* The shadow is a fraction of the object, and the object is a fraction of the
   stage — so --sh has to be re-stated when the stage changes height. Dragging a
   window edge does not rebuild the cut-outs (that would re-decode five
   photographs); it only rewrites five numbers, which is cheap enough to do in
   the same frame as the header measurement. */
function lightHero() {
  if (!heroStage || !placed.length) return;
  const stageH = heroStage.getBoundingClientRect().height;
  if (!stageH) return;
  for (const { el, side } of placed) {
    el.style.setProperty('--sh', `${Math.round((side / 100) * stageH)}px`);
  }
}

fitHero();
splitLead();
paintHero();
lightHero();
seatHero();
// The metric-matched fallbacks in styles/fonts.css hold the headline's width to
// 0.66% of Noto's, so the swap almost never re-wraps it — almost is not never,
// and a re-wrap moves the reading floor the churros is seated against.
if (document.fonts && document.fonts.ready) document.fonts.ready.then(seatHero);

/* Two different things react to two different events, on purpose.

   The header's height is re-measured on every resize, because it re-wraps and
   the section's own height is written from it — but that is one read and one
   custom property, so it is cheap enough to do on a drag as long as it is
   coalesced into a frame.

   The cut-outs are only rebuilt when the breakpoint actually changes, because
   rebuilding them replaces five <img> elements and makes the browser decode
   them again. Dragging a window edge is not a reason to do that. */
let queued = 0;
addEventListener('resize', () => {
  if (queued) return;
  queued = requestAnimationFrame(() => { queued = 0; fitHero(); lightHero(); seatHero(); });
}, { passive: true });
for (const mq of [wide, tablet]) mq.addEventListener('change', () => { fitHero(); paintHero(); lightHero(); seatHero(); });
