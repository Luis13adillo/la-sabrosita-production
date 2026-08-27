/**
 * THE MENU GRID — four chapters, 45 products, one filter and one search.
 *
 * The design the client approved (site/.site/b.html) prints the menu as four
 * chapters, each on its own saturated field, each a plain four-column grid of
 * identical cream cards. That is the whole layout, and it is deliberately the
 * whole layout: the previous build spent about 500 lines here on feature tiles,
 * wide tiles, per-row field fitting and hole-filling, and the design that
 * machinery served is the one the client rejected. None of it survives, and
 * nothing that survives needs it — a chapter is a grid.
 *
 * WHAT THIS FILE STILL OWNS, because b.html never had to:
 *
 *   - the chips, which filter to one category
 *   - the search field's effect on what is rendered
 *   - the live count
 *   - the empty state
 *   - `grid:render`, which main.js listens to in order to write the URL
 *
 * A chapter with no matches is REMOVED rather than emptied. An empty coloured
 * band with a heading on it reads as a loading failure, and four of them stacked
 * reads as a broken page.
 */
import { items, categories, categoryLabel, matches, t } from './data.js';
import { card } from './card.js';

/* menu.json names each category's accent; tokens.css owns what the name means. */
const ACCENT_RGB = {
  hotPink: '--c-hot-pink-rgb',
  electricBlue: '--c-electric-blue-rgb',
  deepPurple: '--c-deep-purple-rgb',
  sunnyYellow: '--c-sunny-yellow-rgb',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function grid(root, { onOpen }) {
  const menu = root.querySelector('.menu');
  const host = root.querySelector('[data-grid]');
  const filters = root.querySelector('[data-filters]');
  const countEl = root.querySelector('[data-count]');
  const emptyEl = root.querySelector('[data-empty]');
  const resetEl = root.querySelector('[data-reset]');
  const bar = root.querySelector('[data-bar]');
  const nav = root.querySelector('[data-nav]');

  let cat = 'all';
  let q = '';

  /* ---- the bar sticks under the header, so it has to know its height ------
     Measured rather than typed: nav.css is a different file and the header's
     height changes with the viewport and with the language. */
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

  /* ---- the chips ---------------------------------------------------------
     Toggle buttons in a labelled group, not a tablist: there is no tab panel for
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
     can end up off the edge. Scrolled by hand rather than with scrollIntoView,
     which would also scroll the page. */
  function revealChip() {
    const on = filters.querySelector('[aria-pressed="true"]');
    if (!on) return;
    const a = on.getBoundingClientRect();
    const b = filters.getBoundingClientRect();
    if (a.right > b.right - 12) filters.scrollLeft += a.right - (b.right - 12);
    else if (a.left < b.left + 8) filters.scrollLeft -= (b.left + 8) - a.left;
  }

  /* ---- rendering ---------------------------------------------------------- */
  const visible = () =>
    items.filter((i) => (cat === 'all' || i.category === cat) && matches(i, q));

  function chapter(c, list) {
    const sec = document.createElement('section');
    sec.className = `ch ch--${c.id}`;
    sec.id = `cat-${c.id}`;
    sec.dataset.cat = c.id;
    const accent = ACCENT_RGB[c.accent];
    if (accent) sec.style.setProperty('--field-rgb', `var(${accent})`);

    const titleId = `ch-${c.id}-title`;
    sec.setAttribute('aria-labelledby', titleId);

    /* The kicker is two facts and no sentence: which chapter of how many, and how
       many products are in it. Both are counted, both come from ui.json's own
       approved strings, and neither needs translating twice. */
    const index = categories.indexOf(c) + 1;
    sec.innerHTML = `
      <div class="wrap">
        <header class="ch__head">
          <p><span class="kick">
            <span>0${index}</span><i class="dia" aria-hidden="true"></i>
            <span>${esc(t('chapterOf', { n: categories.length }))}</span><i class="dia" aria-hidden="true"></i>
            <span>${esc(t('itemsCount', { n: list.length }))}</span>
          </span></p>
          <h2 class="ch__title" id="${titleId}">${esc(categoryLabel(c))}</h2>
        </header>
        <div class="grid"></div>
      </div>`;

    const g = sec.querySelector('.grid');
    list.forEach((item, i) => {
      const el = card(item, i);
      el.querySelector('.card__hit').addEventListener('click', () => onOpen(item.id));
      g.append(el);
    });
    return sec;
  }

  function render() {
    const shown = visible();

    host.replaceChildren();
    for (const c of categories) {
      const list = shown.filter((i) => i.category === c.id);
      if (!list.length) continue;              // no empty coloured bands
      host.append(chapter(c, list));
    }

    countEl.textContent = t('resultsCount', { n: shown.length, total: items.length });
    emptyEl.hidden = shown.length > 0;
    host.hidden = shown.length === 0;

    for (const b of filters.children) b.setAttribute('aria-pressed', String(b.dataset.cat === cat));
    revealChip();

    root.dispatchEvent(new CustomEvent('grid:render', { detail: { shown, cat, q } }));
  }

  /* Choosing a category scrolls the menu head under the sticky bar, so what you
     see after tapping a chip is the chapter you asked for and not the middle of
     the one you were reading. Skipped when the menu is already above you. */
  function setCategory(id) {
    if (id === cat) return;
    cat = id;
    render();
    const top = menu.getBoundingClientRect().top;
    if (top < 0 || top > innerHeight * 0.6) {
      const y = menu.getBoundingClientRect().top + scrollY - stickyH();
      scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  }

  function setQuery(next) {
    const v = String(next || '').trim();
    if (v === q) return;
    q = v;
    render();
  }

  if (resetEl) {
    resetEl.addEventListener('click', () => {
      const field = root.querySelector('[data-search]');
      if (field) field.value = '';
      q = '';
      setCategory('all');
      if (cat === 'all') render();
    });
  }

  render();

  return {
    setCategory,
    setQuery,
    render,
    get category() { return cat; },
    get query() { return q; },
  };
}
