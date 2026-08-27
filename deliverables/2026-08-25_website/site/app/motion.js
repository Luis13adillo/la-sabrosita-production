/**
 * MOTION — the JavaScript half.
 *
 * styles/motion.css carries the argument in full; the short version is that
 * every reveal on this page is a function of SCROLL POSITION rather than of
 * elapsed time, so there is no such thing as a mid-flight state that depends on
 * when you arrived. That is done in CSS with `animation-timeline: view()`, which
 * means the thing this file used to do — watch for cards entering the viewport
 * and start a staggered transition on each one — is gone, along with the defect
 * it caused. `reveal()` is kept as an export because main.js calls it on every
 * grid render, and it no longer reveals anything.
 *
 * What is left is the five things CSS cannot express:
 *
 *   1. the chapter rail's segment widths — how long each of the four chapters
 *      is, measured once per render, never per frame;
 *   2. the rail's fill length in the two cases the browser cannot drive it —
 *      under `prefers-reduced-motion: reduce`, where motion.css declares no
 *      animation, and in Firefox, which has no scroll-driven animations;
 *   3. the hero parallax, which needs a scroll position written into a custom
 *      property because the three cut-outs travel at three different rates;
 *   4. pausing the hero's idle float when the hero is off screen;
 *   5. the FLIP from a card into the product view — measuring where the cut-out
 *      was standing and flying the big photograph out of that exact rectangle.
 *
 * Every MOTION here is inert under prefers-reduced-motion — the hero parallax
 * never starts, the FLIP never runs — and the check is live rather than read
 * once, so a customer who turns the setting on mid-session gets a still page
 * from the next event onwards.
 *
 * The rail is the deliberate exception, because it is not motion. It is a map of
 * a 6,800px menu with the reader's place marked on it, and last round it was
 * being measured and then discarded under `reduce`: the attribute went on, the
 * gradient was written, and the stylesheet had no rule to spend it on. A
 * reduced-motion customer got zero orientation on a 45-item scroll. It now draws
 * under every setting, and what `reduce` changes is that its head SNAPS to the
 * start of the chapter you are in rather than following the scroll continuously.
 */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => REDUCED.matches;

/* Disclosed in INVENTED.md under "Motion". brand.json publishes no timing. */
const FLIP_MS = 420;   /* the flight from card to product view */
const FLIP_LAG = 60;   /* the panel arrives first, then the food lands into it */

/* ==========================================================================
   THE CHAPTER RAIL — the only measuring this file does
   ==========================================================================
   motion.css draws a 5px line inside the sticky chip strip: one segment per
   chapter, each in that chapter's accent, each as wide as that chapter is long,
   with the part you have read at full strength and the part ahead behind a
   cream curtain. The curtain's length is a scroll timeline and needs no help. The
   segment widths are the one thing CSS cannot know, so they are measured here.

   This is deliberately NOT a scroll spy. It reads layout once per render, not
   once per frame, and it decides nothing about "where the reader is" — the
   browser decides that, from the same `--menuband` view timeline that drives the
   curtain. All this does is put the boundaries at the fractions that timeline
   will actually pass through.

   The arithmetic is in motion.css next to the rule that spends it. The short
   version: over `contain 0% -> contain 100%` on a subject taller than the
   window, progress p puts the window's top edge p x (menuHeight - windowHeight)
   into the menu, so a chapter's boundary belongs at that fraction of the rail —
   offset by the spy line below so the colour changes when the new chapter has
   taken the screen rather than when its first pixel clears the sticky bar.
*/

/* Disclosed in INVENTED.md under "Motion". A chapter becomes the current one
   when its heading crosses a line 35% of the window BELOW the sticky chrome —
   not 35% down the window, and not the bottom edge of the sticky bar.

   The sticky header and the chip strip together own the top ~154px of a 900px
   desktop window and rather more of a phone, and a heading that has only just
   cleared them is at the top of the reading area, not behind the reader. A rail
   that turned over there would be early; one that waits for the heading to climb
   to the top of the WINDOW is the half-screen lag that makes an indicator worse
   than no indicator at all. `sticky + 0.35 x window` is the same line the grid
   owner has been asked to move the chip's scroll spy to, so when that lands the
   chip and the rail will change on the same pixel rather than disagreeing. */
const SPY = 0.35;

/* How much of the top of the window the header and the chip strip are holding.
   Read off the strip itself — `top` resolves to the measured `--nav-h` grid.js
   writes — so nothing here has to know how tall the header is. */
function stickyPx(bar) {
  const top = parseFloat(getComputedStyle(bar).top);
  return (Number.isFinite(top) ? top : 0) + bar.offsetHeight;
}

let railPending = 0;

/* What the scroll listener needs so it never reads layout while scrolling: the
   menu's top in document coordinates, the scrollable span the rail is drawn
   against, and the four chapter boundaries as fractions of that span. Written
   once per render and once per resize, never per frame. */
let railGeom = null;
let railBar = null;
let lastRead = -1;

function drawRail() {
  railPending = 0;
  const bar = document.querySelector('[data-bar]');
  const menu = document.querySelector('.menu');
  if (!bar || !menu) return;
  railBar = bar;

  const secs = [...menu.querySelectorAll('.sec')];
  const span = menu.offsetHeight - window.innerHeight;
  /* A progress bar for a page that barely scrolls is a lie, and near span 0 the
     `contain` range it is driven by is degenerate — the fill would snap from
     empty to full across a few pixels of scroll. So the rail is only drawn once
     the menu is at least twice the window tall, which is also the point at which
     a reader can genuinely lose their place. Search down to one product and it
     comes off; the whole catalogue is 7.5 windows and it stays.

     THE `reduce` TEST THAT USED TO BE ON THIS LINE IS GONE, AND THAT WAS A BUG,
     NOT A KILL SWITCH. motion.css used to declare the rail inside
     `prefers-reduced-motion: no-preference`, so under `reduce` this measured the
     four chapters, wrote the gradient, set the attribute — and the stylesheet
     threw all of it away, leaving a customer who asked for a still page with no
     orientation at all on a 45-item scroll. A map of the menu is not an
     animation. It is now unconditional in both files, and what `reduce` changes
     is only how the fill moves: see readNow(). */
  if (!secs.length || span < window.innerHeight) {
    bar.removeAttribute('data-rail');
    bar.style.removeProperty('--rail');
    bar.style.removeProperty('--read');
    railGeom = null;
    lastRead = -1;
    return;
  }

  const menuTop = menu.getBoundingClientRect().top + window.scrollY;
  /* Capped, so a phone in landscape with a tall header cannot push the line off
     the bottom of its own window and turn every chapter over at once. */
  const line = Math.min(window.innerHeight * 0.8, stickyPx(bar) + SPY * window.innerHeight);
  const stop = (el) =>
    Math.min(1, Math.max(0,
      (el.getBoundingClientRect().top + window.scrollY - menuTop - line) / span));

  const at = secs.map(stop);
  at[0] = 0;                       /* the first chapter owns the left edge */

  /* The colour is read back off the section rather than named here. grid.js
     wrote `--field-rgb: var(--c-…-rgb)` on it from the category's own accent, so
     this carries a TOKEN NAME across, never a colour: there is one answer to
     "what colour is Postres" and this file is not a second one. */
  const seg = secs.map((s, i) => {
    const rgb = s.style.getPropertyValue('--field-rgb') || 'var(--c-deep-purple-rgb)';
    const a = (at[i] * 100).toFixed(2);
    const b = ((i + 1 < at.length ? at[i + 1] : 1) * 100).toFixed(2);
    return `rgb(${rgb}) ${a}% ${b}%`;
  });

  bar.style.setProperty('--rail', `linear-gradient(90deg, ${seg.join(', ')})`);
  bar.setAttribute('data-rail', '');

  railGeom = { menuTop, span, at };
  lastRead = -1;
  writeRead();
}

/* ---- the fill's length, for every browser and every setting --------------
   motion.css drives the fill with `animation-timeline: --menuband` where the
   browser has scroll-driven animations AND the customer has not asked for
   stillness. That covers Chromium and WebKit at the default setting and costs no
   main-thread work at all. It leaves two real cases uncovered, and both of them
   are people:

     · `prefers-reduced-motion: reduce`, where motion.css declares no animation;
     · Firefox, which has no scroll-driven animations, where the `@supports`
       block does not match.

   Both now get the same rail from this function. It is the SAME arithmetic the
   view timeline uses, written out: over `contain 0% → contain 100%` on a subject
   taller than the window, progress is (scrollY - menuTop) / (menuHeight -
   windowHeight). Where the CSS animation is running it wins over this
   declaration anyway, so the two can never disagree on screen.

   Under `reduce` the value is SNAPPED to one of four positions, one per chapter.
   That is deliberate: a reduced-motion reader gets a bar that changes four times
   in the whole page and is otherwise perfectly still, with the colour under its
   head naming the chapter they are in. No interpolation of any kind, and still
   an answer to "where am I".

   No layout is read here. Everything it needs was measured in drawRail. */
function readNow() {
  if (!railGeom) return 0;
  const p = Math.min(1, Math.max(0, (window.scrollY - railGeom.menuTop) / railGeom.span));
  if (!reduced()) return p;
  /* Four positions, one per chapter, and the head sits in the MIDDLE of the one
     you are in rather than on its leading edge. Two things that matters for. The
     head is never sitting ON a boundary, so the colour directly under it is
     always your chapter — which is the question the rail exists to answer. And
     neither end of the menu produces a lie: a head parked on Helados' left edge
     would read as an empty bar, and one parked on Bebidas' right edge would read
     as a menu you had finished. */
  const at = railGeom.at;
  let i = 0;
  for (let n = 0; n < at.length; n++) if (p >= at[n]) i = n;
  const end = i + 1 < at.length ? at[i + 1] : 1;
  return (at[i] + end) / 2;
}

let readPending = 0;
function writeRead() {
  readPending = 0;
  if (!railBar || !railGeom) return;
  const p = readNow();
  /* A fifth of a pixel on a 1440px rail. Below that there is nothing to repaint
     and the style invalidation is not worth spending. */
  if (Math.abs(p - lastRead) < 0.0015) return;
  lastRead = p;
  railBar.style.setProperty('--read', p.toFixed(4));
}

function scheduleRead() {
  if (readPending) return;
  readPending = requestAnimationFrame(writeRead);
}

addEventListener('scroll', scheduleRead, { passive: true });

/* One frame's delay so the measurement happens after the render that triggered
   it has been laid out, and so three calls in one tick cost one measurement. */
function scheduleRail() {
  if (railPending) return;
  railPending = requestAnimationFrame(drawRail);
}

/**
 * Called by main.js after every grid render.
 *
 * There is deliberately no reveal here. The card reveal is `animation-timeline:
 * view()` in motion.css, so a card knows how far into its own reveal it is from
 * where it sits, the moment it exists — including a card created by a category
 * filter while the page is scrolled half way down, which is precisely the case
 * an IntersectionObserver used to get wrong. A browser without scroll-driven
 * animations matches no `@supports` block and gets the finished layout with no
 * reveal at all, which is the correct direction to fail in: static, never empty.
 *
 * What it does do is re-measure the chapter rail, because filtering to one
 * category or typing in the search box changes both how many chapters there are
 * and how long each one is.
 */
export function reveal() {
  scheduleRail();
}

/* The rail's segments are fractions of (menu height - window height), so both
   terms move when the window is resized or the phone is turned. Passive, and
   coalesced to one measurement per frame. */
addEventListener('resize', scheduleRail, { passive: true });
addEventListener('load', scheduleRail);
REDUCED.addEventListener?.('change', scheduleRail);

/**
 * The hero's cut-outs drift up at three different rates as the page leaves.
 *
 * hero.css owns the transform and reads `--drift`; this only publishes the
 * number. rAF-throttled, passive, and it stops writing once the hero is gone —
 * there is no point recomputing a parallax for something 4000px above you.
 *
 * The same IntersectionObserver switches off the idle float in motion.css, so a
 * customer reading the menu is not paying for an animation on a hero they
 * scrolled past.
 */
export function heroDrift(stage) {
  if (!stage) return;
  if (reduced()) return;

  let onScreen = true;
  let raf = 0;

  const write = () => {
    raf = 0;
    const y = Math.min(window.scrollY, window.innerHeight);
    stage.style.setProperty('--drift', String(y));
  };
  const onScroll = () => {
    if (raf || !onScreen) return;
    raf = requestAnimationFrame(write);
  };

  addEventListener('scroll', onScroll, { passive: true });
  write();

  if (typeof IntersectionObserver === 'function') {
    new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      stage.toggleAttribute('data-off', !onScreen);
      /* Settle on the way out so the hero is not frozen mid-parallax when you
         come back up to it. */
      if (onScreen) onScroll();
    }, { threshold: 0 }).observe(stage);
  }
}

/* ==========================================================================
   CARD -> PRODUCT VIEW
   ==========================================================================
   The brief names this as one of the four places motion earns its place, and a
   dialog that simply zooms out of the middle of the screen is not it: the point
   of the product view is that it is the SAME food, larger, and a transition is
   how a page says "same thing" instead of "new screen".

   So: remember which cut-out was clicked, and when the dialog opens, measure
   where the big photograph has landed and run it backwards to the small one.
   Transform only, one element, no layout read after the first frame.

   Three details that make it safe rather than clever:

   - It is driven by the dialog's own `open` attribute, watched with a
     MutationObserver, so detail.js does not have to know this exists and nothing
     breaks if it stops using `showModal()`.
   - `.detail__img` already carries `transform: scale(var(--scale))` from
     detail.css — the ink normalisation again — so the flight keyframes are
     written as multiples of that base rather than replacing it. Overwrite it and
     every product in the dialog silently loses its ink normalisation for the
     duration of the animation.
   - Everything is wrapped so that a missing element, a closed dialog or a
     browser without Web Animations leaves the page exactly as it was.
*/
function productTransition() {
  const dlg = document.querySelector('[data-detail]');
  if (!dlg || typeof MutationObserver !== 'function') return;

  let from = null;

  /* Capture phase: detail.js's own click handler runs in the same tick and
     opens the dialog, so the card's rectangle has to be taken before that. */
  document.addEventListener('click', (e) => {
    const hit = e.target.closest?.('.card__hit');
    from = hit ? hit.querySelector('.card__img') : null;
  }, true);

  const fly = () => {
    if (reduced() || !from) return;
    const img = dlg.querySelector('.detail__img');
    if (!img || typeof img.animate !== 'function') return;

    const a = from.getBoundingClientRect();
    const b = img.getBoundingClientRect();
    if (!a.width || !b.width) return;

    /* Both are square canvases of the same photograph, so one uniform scale maps
       the food onto itself exactly. getBoundingClientRect already includes the
       base scale, which is why the ratio is taken against the measured box and
       then multiplied back through it. */
    const base = Number(getComputedStyle(img).getPropertyValue('--scale')) || 1;
    const k = base * (a.width / b.width);
    const dx = (a.left + a.width / 2) - (b.left + b.width / 2);
    const dy = (a.top + a.height / 2) - (b.top + b.height / 2);

    /* A hair over a viewport of travel is a long way; below that it is not worth
       animating and a tiny nudge just looks like a glitch. */
    if (Math.abs(dx) < 4 && Math.abs(dy) < 4 && Math.abs(k - base) < 0.02) return;

    img.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${k})`, opacity: 0.45 },
        { transform: `scale(${base})`, opacity: 1 },
      ],
      {
        duration: FLIP_MS,
        delay: FLIP_LAG,
        fill: 'backwards',
        easing: getComputedStyle(document.documentElement)
          .getPropertyValue('--ease').trim() || 'ease-out',
      },
    );
  };

  new MutationObserver(() => { if (dlg.open) fly(); })
    .observe(dlg, { attributes: true, attributeFilter: ['open'] });
}

/* The dialog is in the shell's markup, and main.js is a module — so the document
   is parsed by the time this runs. Nothing here needs the grid to exist. */
productTransition();
