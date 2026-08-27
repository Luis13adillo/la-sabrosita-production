/**
 * MOTION — and how little of it is here.
 *
 * Everything that moves on this page is CSS. The looping pieces (the ticker, the
 * display case, the marquee bulbs, the floating cut-outs) are keyframes; the
 * reveal that settles each card into its tile as it enters the window is
 * `animation-timeline: view()`, which the browser drives off its own compositor.
 * There is no scroll listener anywhere on this site.
 *
 * That is a deliberate replacement of an IntersectionObserver, not an absence.
 * An observer has to decide when an element is "in", it fires on the main thread,
 * and it leaves elements at opacity 0 if it is still catching up when somebody
 * flicks a screen at a time — which is the failure scripts/smoke.mjs measures by
 * jumping to four scroll positions and counting painted cards. A view timeline
 * cannot be behind, because it is not a sequence of events: it is a function of
 * where the element is.
 *
 * A browser without scroll-driven animations matches no `@supports` block in
 * styles/motion.css and gets the finished layout with no reveal at all. Static,
 * never empty, which is the correct direction to fail in.
 *
 * WHAT IS LEFT FOR THIS FILE. One thing, and it is a re-measurement rather than
 * an animation: the sticky bar is positioned under the header, and the header's
 * height changes with the viewport, with the language and with the webfont
 * landing. `reveal()` is called after every grid render and re-publishes it.
 */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');

/** Re-publish the header's measured height for the sticky bar under it. */
function measure(root) {
  const nav = root.querySelector('[data-nav]');
  const menu = root.querySelector('.menu');
  if (!nav || !menu) return;
  menu.style.setProperty('--nav-h', `${Math.round(nav.getBoundingClientRect().height)}px`);
}

let queued = 0;
export function reveal(root = document) {
  if (queued) return;
  queued = requestAnimationFrame(() => { queued = 0; measure(root); });
}

addEventListener('resize', () => reveal(document), { passive: true });
addEventListener('load', () => reveal(document));
REDUCED.addEventListener?.('change', () => reveal(document));
/* The header is set in the display face, so its height can change when Fredoka
   lands and replaces the fallback. Waiting for that is one promise, not a poll. */
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => reveal(document)).catch(() => {});
}
