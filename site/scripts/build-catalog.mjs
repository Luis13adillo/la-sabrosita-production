#!/usr/bin/env node
/**
 * Build site/data/menu.json — the one catalog the website reads.
 *
 * Nothing here is invented copy. Every field is either
 *   (a) a filename fact about assets/products/masters,
 *   (b) the client-approved bilingual line from
 *       tv-menu/motion/hyperframes/data/descriptions.json, or
 *   (c) a reviewed statement in the PRODUCTS table below — a human looked at
 *       the picture and said which menu item it is and which category it sits in.
 *
 * Products with no approved line render NAME ONLY. That is deliberate: the brief
 * says invent nothing, and a missing description is better than a made-up one.
 * See INVENTED.md for the short list of things this project did have to choose.
 *
 * Run: node scripts/build-catalog.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const REPO = path.resolve(SITE, '..');
const MASTERS = path.join(REPO, 'assets/products/masters');
const DESCRIPTIONS = path.join(REPO, 'tv-menu/motion/hyperframes/data/descriptions.json');
const OUT = path.join(SITE, 'data/menu.json');

/* Products where a human chose which photograph leads. Keyed by the product name
   as it appears in PRODUCTS below; the value is the master's filename stem. */
const LEAD = JSON.parse(fs.readFileSync(path.join(SITE, 'data/lead-photo.json'), 'utf8')).lead;

// Menu-board order. The four categories are the client's own, in Spanish, exactly
// as the TV menu prints them. The English label is a translation for the EN view
// and is recorded in INVENTED.md.
const CATEGORIES = [
  { id: 'helados',   es: 'Helados',   en: 'Ice Cream',    accent: 'hotPink' },
  { id: 'antojitos', es: 'Antojitos', en: 'Savory Snacks', accent: 'electricBlue' },
  { id: 'postres',   es: 'Postres',   en: 'Desserts',      accent: 'deepPurple' },
  { id: 'bebidas',   es: 'Bebidas',   en: 'Drinks',        accent: 'sunnyYellow' },
];

// master filename slug -> { name (as the menu board prints it), category, alt }
// One row per PRODUCT. Several masters can share a row; they become that
// product's alternate photographs, shown as a gallery.
const PRODUCTS = [
  // ------------------------------------------------------------- HELADOS ---
  ['Banana-Split',        'Banana Split',        'helados',   'banana split in a boat dish with three scoops, syrup and cherries'],
  ['Choco-Banana',        'Choco Banana',        'helados',   'chocolate-dipped banana on a stick with a nut sprinkle'],
  ['Crazy-Shakes',        'Crazy Shake',         'helados',   'loaded milkshake with whipped cream and toppings around the rim'],
  ['Helado-Chico',        'Helado en Cono',      'helados',   'two scoops on a waffle cone'],
  ['Helado-Chino',        'Helado Viral',        'helados',   'moulded packaged ice cream in its printed box'],
  ['Vaso-La-Sabrosita',   'La Sabrosita',        'helados',   'the house cup — layered ice cream, strawberries, cake and wafer'],
  ['Paletas',             'Paletas',             'helados',   'Mexican popsicle'],
  ['Paleta-Loca',         'Paletas Locas',       'helados',   'chamoy cup loaded with fruit and a paleta standing in it'],
  ['Sandwich-de-Helado',  'Sandwich de Helado',  'helados',   'vanilla ice cream between two chocolate wafers'],
  // ----------------------------------------------------------- ANTOJITOS ---
  ['Chicharron-Preparado','Chicharron Preparado','antojitos', 'chicharron sheet dressed with cabbage, cream, tomato and lime'],
  ['Chicharron-en-Rueda', 'Chicharron en Rueda', 'antojitos', 'wheel-shaped chicharrones'],
  ['Diablitos',           'Diablitos',           'antojitos', 'dark chamoy cup with a tamarind straw'],
  ['Elote-Regular',       'Elote',               'antojitos', 'corn on a stick with mayo, cheese and chile'],
  ['Elote-con-Hot-Cheetos','Elote Hot Cheetos',  'antojitos', 'corn on a stick coated in crushed Hot Cheetos'],
  ['Esquimales',          'Esquimal',            'antojitos', 'chocolate-coated bar on a stick under rainbow sprinkles'],
  ['Esquites',            'Esquite',             'antojitos', 'cup of corn with cheese, chile powder and lime'],
  ['Esquites-Hot-Cheetos','Esquite Hot Cheetos', 'antojitos', 'cup of corn under a tall Hot Cheetos mound'],
  ['Marucha-Loca',        'Marucha Loca',        'antojitos', 'instant-noodle cup buried in Hot Cheetos, cream and cheese'],
  ['Nachos',              'Nachos',              'antojitos', 'nachos with cheese'],
  ['Platano-Frito',       'Platano Frito',       'antojitos', 'fried plantain rounds with cream and strawberry drizzle'],
  ['Tostilocos',          'Tostilocos',          'antojitos', 'open Tostitos bag loaded with cucumber, jicama, peanuts and chamoy'],
  // ------------------------------------------------------------- POSTRES ---
  ['Bionico-con-Nieve',   'Bionico con Nieve',   'postres',   'tray of fruit and cream topped with strawberries and a cherry'],
  ['Bionicos',            'Bionicos',            'postres',   'fruit and cream bowl with granola'],
  ['Churros',             'Churros',             'postres',   'carton of sugared churros'],
  ['Coktel-de-Fruta',     'Coctel de Fruta',     'postres',   'clear cup of layered fruit with chile and a mango spear'],
  ['Crepa',               'Crepa',               'postres',   'folded crepe with strawberries, cream and icing sugar'],
  ['Crepa-Dubai',         'Crepa Dubai',         'postres',   'crepe under green kataifi, pistachio and chocolate'],
  ['Croissant-con-Helado','Croissant',           'postres',   'split croissant with ice cream, fruit and chocolate'],
  ['Fresas-con-Crema',    'Fresas con Crema',    'postres',   'cup of strawberries in cream under a whipped-cream crown'],
  ['Fresas-Dubai',        'Fresas Dubai',        'postres',   'cup of chocolate-shelled strawberries with pistachio crumb'],
  ['Fresas-en-Cajita',    'Fresas en Cajita',    'postres',   'printed strawberry carton topped with cream and sprinkles'],
  ['Gelatina',            'Gelatina',            'postres',   'lidded cup of layered gelatin'],
  ['Mango-en-Palo',       'Mango en Flor',       'postres',   'mango carved into a flower on a stick, dusted with chile'],
  ['Mini-Pancakes',       'Mini Pancakes',       'postres',   'tray of mini pancakes with chocolate drizzle and strawberries'],
  ['Mini-Pancakes-Dubai', 'Mini Pancakes Dubai', 'postres',   'mini pancakes under green kataifi and pistachio'],
  ['Pastel-Tres-Leche',   'Pastel de Tres Leches','postres',  'slice of tres leches cake'],
  ['Waffle',              'Waffle',              'postres',   'waffle bowl with cream, strawberries, chocolate and wafer sticks'],
  // ------------------------------------------------------------- BEBIDAS ---
  ['Agua-Fresca',         'Aguas Frescas',       'bebidas',   'agua fresca in a jar with fruit'],
  ['Aguas-Explosivas',    'Aguas Explosivas',    'bebidas',   'chamoy-rimmed cup loaded with fruit and a tamarind stick'],
  ['Chamoyada',           'Chamoyada',           'bebidas',   'mango chamoyada with chamoy swirl and a tamarind straw'],
  ['Frappe_20oz',         'Frappe',              'bebidas',   'frappe with whipped cream and a straw'],
  ['Licuado',             'Licuado',             'bebidas',   'strawberry licuado under a dome lid with whipped cream'],
  ['Mangonada_16oz',      'Mangonada',           'bebidas',   'mangonada cup with chamoy, chile and a tamarind straw'],
  ['Michelaguas',         'Michelaguas',         'bebidas',   'branded Micheláguas jar of mango with a chile rim'],
  ['Raspados',            'Raspado',             'bebidas',   'cup of shaved ice piled above the rim'],
];

const slugify = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '')
   .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const descriptions = JSON.parse(fs.readFileSync(DESCRIPTIONS, 'utf8'));
// The two client-named corn pairs carry ONE approved line covering both items
// ("Mexican Street Corn, Cob or Cup"). Attaching that line to each member is a
// use of approved copy, not a re-wording of it.
const PAIR_MEMBERS = {
  'Elote + Esquite': ['Elote', 'Esquite'],
  'Elote Hot Cheetos + Esquite Hot Cheetos': ['Elote Hot Cheetos', 'Esquite Hot Cheetos'],
};
/* A PAIR LINE IS NOT A PRODUCT LINE, AND ONE OF THEM WAS FACTUALLY WRONG.
   The client approved "Mexican Street Corn, Cob or Cup" for the PAIR
   "Elote y Esquite", where cob-or-cup is exactly right — the pair covers both
   serving formats. Handing that same sentence to each member separately made
   each card offer the format the other one is: the Elote card, which is corn on
   the cob, told an English reader they might get a cup, and the Esquite card,
   which is corn in a cup, offered a cob.

   So the pair line is RESOLVED per member rather than copied. The client's own
   words are kept and only the half that does not apply is dropped, which is the
   smallest edit that makes each card true. Spanish is untouched: "Con mayonesa,
   queso y chile" describes the toppings rather than the format and is correct
   for both, and a Spanish reader knows an elote from an esquite by the name.
   Corrected 2026-08-26 at the client's instruction. */
const PAIR_SPLIT = {
  'Elote':               { desc: 'Mexican Street Corn, on the Cob' },
  'Esquite':             { desc: 'Mexican Street Corn, in a Cup' },
  'Elote Hot Cheetos':   { desc: 'Street Corn with Hot Cheetos, on the Cob' },
  'Esquite Hot Cheetos': { desc: 'Street Corn with Hot Cheetos, in a Cup' },
};

const fromPairs = {};
for (const [key, members] of Object.entries(PAIR_MEMBERS)) {
  const pair = descriptions.pairs?.[key];
  if (!pair) continue;
  for (const m of members) {
    const split = PAIR_SPLIT[m];
    fromPairs[m] = {
      desc: split ? split.desc : pair.desc,
      desc_es: pair.desc_es,
      source: pair.source + (split ? ' (pair line, resolved per product)' : ' (pair line)'),
    };
  }
}

const copyFor = (name) => {
  const hit = descriptions.items[name] || fromPairs[name];
  if (!hit) return { en: null, es: null, source: 'none' };
  // desc: '' is a deliberate blank (the product name is already English).
  return {
    en: hit.desc ? hit.desc : null,
    es: hit.desc_es ? hit.desc_es : null,
    source: hit.source || 'none',
  };
};

const files = fs.readdirSync(MASTERS).filter((f) => f.endsWith('.png'));
const byProduct = new Map();
for (const f of files) {
  const m = f.match(/^LS_(.+)_MASTER_v(\d+)\.png$/);
  if (!m) { console.warn('unparsed master filename:', f); continue; }
  const [, slug, version] = m;
  if (!byProduct.has(slug)) byProduct.set(slug, []);
  byProduct.get(slug).push({ file: f, version: Number(version) });
}

const items = [];
const unused = new Set(byProduct.keys());
for (const [slug, name, category, alt] of PRODUCTS) {
  const shots = byProduct.get(slug);
  if (!shots) throw new Error(`PRODUCTS names a master slug with no file: ${slug}`);
  unused.delete(slug);
  /* Newest master leads, UNLESS a human has picked a different one.
     Version order is a decent default — a later export is usually a better
     photograph — but it is not always true. The Crazy Shake has four masters and
     the newest, v04, is the weakest of them: the cake slice is sliding, the
     sprinkle rim is patchy and it is the palest. The client looked at all four
     and chose v01. That is a judgement a version number cannot carry, so it is
     recorded in data/lead-photo.json rather than being enforced by renaming a
     file — renaming anything under assets/ is forbidden, and would break the
     paths Rubric records. */
  const pick = LEAD[name];
  shots.sort((a, b) => {
    if (pick) {
      if (a.file.startsWith(pick)) return -1;
      if (b.file.startsWith(pick)) return 1;
    }
    return b.version - a.version;
  });
  const copy = copyFor(name);
  items.push({
    id: slugify(name),
    name,                       // the client's menu-board wording; never translated
    category,
    alt,
    copy,                       // { en, es, source } — null means render name-only
    nameOnly: !copy.en && !copy.es,
    images: shots.map((s) => ({
      master: `assets/products/masters/${s.file}`,
      stem: s.file.replace(/\.png$/, ''),
      version: s.version,
    })),
  });
}
if (unused.size) throw new Error(`masters not claimed by any product: ${[...unused].join(', ')}`);

const out = {
  _generated: 'scripts/build-catalog.mjs — do not hand-edit',
  _rule: 'No copy is invented. copy.en / copy.es are null when the client has not approved a line; the card then renders name-only.',
  categories: CATEGORIES,
  counts: {
    products: items.length,
    images: items.reduce((n, i) => n + i.images.length, 0),
    withApprovedEnglish: items.filter((i) => i.copy.en).length,
    nameOnly: items.filter((i) => i.nameOnly).length,
  },
  items,
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`menu.json: ${out.counts.products} products, ${out.counts.images} images, ` +
            `${out.counts.withApprovedEnglish} with approved English, ${out.counts.nameOnly} name-only`);
for (const c of CATEGORIES) console.log(`  ${c.es.padEnd(10)} ${items.filter((i) => i.category === c.id).length}`);
