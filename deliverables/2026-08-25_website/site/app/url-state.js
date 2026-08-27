/**
 * Keep what you are looking at in the URL, and carry it across the language
 * switch.
 *
 * Two things were being thrown away. Switching from Spanish to English reloaded
 * the page and dropped the category you had chosen and the word you had typed —
 * which on a bilingual menu is the single most likely moment for someone to
 * switch, because they just failed to read something. And a category could not be
 * linked to at all, so "here are their drinks" was not a shareable thing.
 *
 * The state is small and it is not private: a category id and a search term.
 * It goes in the query string, which survives the language switch because the
 * switch is an ordinary link and this rewrites its href.
 */
const KEYS = { cat: 'c', q: 'q' };

/** Read the state a URL is carrying. */
export function readState() {
  const p = new URLSearchParams(location.search);
  return { cat: p.get(KEYS.cat) || 'all', q: p.get(KEYS.q) || '' };
}

/** Write it back without adding a history entry for every keystroke. */
export function writeState({ cat, q }) {
  const p = new URLSearchParams(location.search);
  if (cat && cat !== 'all') p.set(KEYS.cat, cat); else p.delete(KEYS.cat);
  if (q) p.set(KEYS.q, q); else p.delete(KEYS.q);
  const qs = p.toString();
  history.replaceState(null, '', qs ? `?${qs}${location.hash}` : location.pathname + location.hash);
  carry({ cat, q });
}

/** Point the language link at the same view in the other language. */
export function carry({ cat, q }) {
  const link = document.querySelector('[data-lang-link], .nav__lang');
  if (!link) return;
  const base = link.getAttribute('href').split('?')[0].split('#')[0];
  const p = new URLSearchParams();
  if (cat && cat !== 'all') p.set(KEYS.cat, cat);
  if (q) p.set(KEYS.q, q);
  const qs = p.toString();
  link.setAttribute('href', qs ? `${base}?${qs}` : base);
}
