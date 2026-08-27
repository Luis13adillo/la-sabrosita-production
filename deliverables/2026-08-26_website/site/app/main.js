/**
 * The page's wiring, and nothing else.
 *
 * Four jobs: build the header's category buttons, connect the search field to
 * the grid, keep the URL in step with what is on screen, and open a product.
 * Everything about how the page LOOKS is in styles/ — this file used to carry
 * about 400 lines of hero composition, and the hero it composed is the one the
 * client rejected. The approved hero is static HTML from src/partials/hero.html
 * and CSS from styles/hero.css, with no JavaScript at all, which is also why it
 * is on the screen before any module has run.
 */
import { grid } from './grid.js';
import { detail } from './detail.js';
import { reveal } from './motion.js';
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
  // Every route into a filter ends here — the header's words, the chips in the
  // bar, the search field, the reset button — so this is the one place that
  // records it.
  if (restored) writeState({ cat: list.category, q: searchValue() });
  syncNav();
});

const searchValue = () => {
  const el = root.querySelector('[data-search]');
  return el ? el.value.trim() : '';
};

/* THE HEADER'S CHAPTER WORDS.
   b.html's header links to `#helados`. This site filters, so the same word has
   to set the category, put it in the URL and survive the language switch — and
   that is a button, not an anchor. The labels are read out of menu.json rather
   than written in the partial, so there is one copy of "Antojitos" on this site
   and the language switch carries it without any help. */
const catnav = root.querySelector('[data-catnav]');
if (catnav) {
  for (const c of categories) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'nav__cat';
    b.dataset.cat = c.id;
    b.textContent = categoryLabel(c);
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => list.setCategory(c.id));
    catnav.append(b);
  }
}
/* The header mirrors the filter rather than keeping its own answer: two controls
   that both remember which category is chosen are two answers to one question,
   and they drift. */
function syncNav() {
  if (!catnav) return;
  for (const b of catnav.children) {
    b.setAttribute('aria-pressed', String(b.dataset.cat === list.category));
  }
}

const search = root.querySelector('[data-search]');
if (search) {
  search.addEventListener('input', () => list.setQuery(search.value.trim()));
  /* Escape empties the field, which is what puts all 45 products back. A
     `type=search` field does the first half on its own in some browsers and not
     in others, so it is done here for all of them. */
  search.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !search.value) return;
    search.value = '';
    list.setQuery('');
  });
}

// Restore whatever the URL is carrying, and keep it up to date. This is what
// makes a category linkable and what carries your place across the language
// switch — see src/app/url-state.js.
const startState = readState();
if (startState.q && search) { search.value = startState.q; list.setQuery(startState.q); }
if (startState.cat !== 'all') list.setCategory(startState.cat);
restored = true;
writeState({ cat: list.category, q: searchValue() });
syncNav();

reveal(root);
