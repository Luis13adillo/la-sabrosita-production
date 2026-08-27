/** The one place the page reads its data from. Injected by scripts/build-site.mjs. */
const el = document.getElementById('site-data');
export const SITE = JSON.parse(el.textContent);
export const { ui, uiOther, categories, items, counts, lang, geometry, widths, medianInk } = SITE;

/** The srcset for one photograph, built from the widths that actually exist. */
export const srcset = (stem) => widths.map((w) => `/img/${stem}-${w}.webp ${w}w`).join(', ');

/** ui.json strings carry {n}-style slots. */
export const t = (key, vars = {}) => {
  let s = ui[key] ?? key;
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
};

/** The line under a product name, in the current language. Null means name-only. */
export const line = (item) => (lang === 'es' ? item.copy.es : item.copy.en) || null;

export const categoryLabel = (cat) => (lang === 'es' ? cat.es : cat.en);
export const categoryById = (id) => categories.find((c) => c.id === id);

/** Search that ignores accents, so "bionico" finds "Biónico". */
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const matches = (item, q) => {
  if (!q) return true;
  const needle = fold(q);
  const hay = [item.name, item.copy.en, item.copy.es, categoryById(item.category)?.es,
               categoryById(item.category)?.en].filter(Boolean).join(' ');
  return fold(hay).includes(needle);
};
