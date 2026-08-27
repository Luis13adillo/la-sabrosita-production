#!/usr/bin/env node
/**
 * Assemble site/public from site/src.
 *
 * Deliberately boring: no framework, no bundler, no hydration. The whole site is
 * one shell per language plus a handful of ES modules the browser loads directly.
 * That matters here for two reasons — the client's own machine has to be able to
 * serve it, and every piece of this build is owned by a different author, so the
 * pieces are separate files that get concatenated rather than one file everyone
 * edits at once.
 *
 *   src/shell.html          the page skeleton, with <!--@name--> slots
 *   src/partials/*.html     one file per slot
 *   src/app/*.js            ES modules, copied through untouched
 *   styles/*.css            one file per piece, linked in a fixed order
 *
 * WHAT THIS FILE GREW WHEN THE APPROVED DESIGN LANDED. The design the client
 * signed off (site/.site/b.html) is one static page with eight sections and a
 * few hundred hand-placed elements in it — bulbs, drips, sparkles, a display
 * case, four category panels, three story beats. None of that is content, so
 * none of it is typed into a partial: the placements live in data/scenery.json,
 * the words live in data/ui.json (approved) and data/copy-draft.json (not), and
 * this file is the one place that turns the three into HTML. A partial that
 * carried its own copy of a product name would be a second answer to a question
 * data/menu.json already answers.
 *
 * Run: node scripts/build-site.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const SRC = path.join(SITE, 'src');
const OUT = path.join(SITE, 'public');

// Cascade order is load-bearing: tokens first, then the reset, then each piece,
// then the responsive overrides last so a mobile rule always wins.
const CSS_ORDER = [
  'tokens.css', 'fonts.css', 'base.css', 'type.css',
  'nav.css', 'hero.css', 'sections.css', 'grid.css', 'card.css', 'detail.css',
  'foot.css', 'motion.css', 'mobile.css',
];

const menu = JSON.parse(fs.readFileSync(path.join(SITE, 'data/menu.json'), 'utf8'));
const images = JSON.parse(fs.readFileSync(path.join(SITE, 'data/images.json'), 'utf8'));
const ui = JSON.parse(fs.readFileSync(path.join(SITE, 'data/ui.json'), 'utf8'));
const draft = JSON.parse(fs.readFileSync(path.join(SITE, 'data/copy-draft.json'), 'utf8'));
const scene = JSON.parse(fs.readFileSync(path.join(SITE, 'data/scenery.json'), 'utf8'));
// The one brand value the shell needs directly. Read, never typed.
const brand = JSON.parse(fs.readFileSync(path.resolve(SITE, '../brand/brand.json'), 'utf8'));
/* The shop's own facts — address, phone, hours. Deliberately NOT in brand.json:
   that file is a transcription of the guidelines PDF and none of this is in the
   PDF. See CLAUDE.md and brand/README.md. Exposed to partials as {{biz:key}}. */
const biz = JSON.parse(fs.readFileSync(path.resolve(SITE, '../brand/business.json'), 'utf8'));
/* Photographs of the shop itself, built by scripts/build-shop.mjs. Empty until
   the client supplies them, and every use below is guarded, so the page renders
   with or without them. */
const shopFile = path.join(SITE, 'data/shop.json');
const shop = fs.existsSync(shopFile) ? JSON.parse(fs.readFileSync(shopFile, 'utf8')).photos : {};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Fold the image metadata into the catalog so the browser fetches one payload.
const items = menu.items.map((it) => ({
  ...it,
  images: it.images.map((s) => {
    const m = images.images[s.stem];
    if (!m) throw new Error(`no derivative for ${s.stem} — run: npm run images`);
    // A missing visualScale silently disables the whole ink-normalisation pass:
    // the card gets `--scale: undefined`, the transform is invalid, and every
    // product renders at bounding-box size. Fail here instead.
    if (typeof m.visualScale !== 'number') {
      throw new Error(`${s.stem} has no visualScale — data/images.json is stale; run: npm run images -- --force`);
    }
    // `ink` is new in the payload and it is not decoration: the approved card
    // sizes every square by how much of it is actually food, normalised against
    // the catalogue's own median. Without it card.js cannot reproduce the
    // approved sizes — see the arithmetic in src/app/card.js.
    if (typeof m.ink !== 'number') {
      throw new Error(`${s.stem} has no ink — data/images.json is stale; run: npm run images -- --force`);
    }
    return { stem: s.stem, aspect: m.productAspect, tall: m.tall, wide: m.wide,
             scale: m.visualScale, ink: m.ink, fillW: m.fillW, fillH: m.fillH, lqip: m.lqip };
  }),
}));

const shell = fs.readFileSync(path.join(SRC, 'shell.html'), 'utf8');
const partial = (name) => fs.readFileSync(path.join(SRC, 'partials', `${name}.html`), 'utf8');

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, 'app'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'styles'), { recursive: true });

for (const f of fs.readdirSync(path.join(SRC, 'app'))) {
  fs.copyFileSync(path.join(SRC, 'app', f), path.join(OUT, 'app', f));
}
for (const f of CSS_ORDER) {
  const from = path.join(SITE, 'styles', f);
  if (!fs.existsSync(from)) throw new Error(`styles/${f} is in CSS_ORDER but does not exist`);
  fs.copyFileSync(from, path.join(OUT, 'styles', f));
}
// Logo derivatives. The master is a 1915px PNG and weighs 3 MB — nearly half the
// page — and it is drawn at 70px in the header. Resizing proportionally and
// re-encoding is not one of brand.json's six misuses (stretch, recolour, rotate,
// effects, crop, clutter); the master itself is untouched, and these are new
// files under the generated public/ tree.
//
// /brand/logo.png stays a PNG at 512px so anything expecting a PNG — the
// favicon, the social card — still gets one.
fs.mkdirSync(path.join(OUT, 'brand'), { recursive: true });
const LOGO_SRC = path.resolve(SITE, '../brand/logos/LS_Logo_Primary_v01.png');
const LOGO_WIDTHS = [96, 240, 480, 720];
await sharp(LOGO_SRC).resize({ width: 512 }).png({ compressionLevel: 9, palette: true })
  .toFile(path.join(OUT, 'brand/logo.png'));
for (const w of LOGO_WIDTHS) {
  await sharp(LOGO_SRC).resize({ width: w })
    .webp({ quality: 88, alphaQuality: 92, effort: 5 })
    .toFile(path.join(OUT, `brand/logo-${w}.webp`));
}
// The srcset any partial can use: <img src="/brand/logo.png" srcset="{{logoSrcset}}">
const logoSrcset = LOGO_WIDTHS.map((w) => `/brand/logo-${w}.webp ${w}w`).join(', ');

const cssLinks = CSS_ORDER.map((f) => `<link rel="stylesheet" href="/styles/${f}">`).join('\n  ');

/* MODULE PRELOAD, AND IT IS A REAL SECOND ON A REAL CONNECTION.
   The grid is built client-side, so nothing a customer came for exists until
   main.js has run — and main.js imports grid.js, which imports card.js, which
   imports data.js. A browser discovers each level only after the one above it
   has arrived, so on the 4G profile (40ms round trip) the page pays three extra
   round trips plus three transfers before the first card can be drawn.
   Listing them here starts all of them at parse time, in parallel with the CSS.
   The list is READ FROM THE DIRECTORY rather than typed, so a module added or
   renamed later cannot silently drop out of it. */
const modulePreload = fs.readdirSync(path.join(SRC, 'app'))
  .filter((f) => f.endsWith('.js')).sort()
  .map((f) => `<link rel="modulepreload" href="/app/${f}">`).join('\n  ');

/* ===========================================================================
   THE SCENERY
   ===========================================================================
   Everything below builds one fragment of the approved design out of
   data/scenery.json, data/menu.json and data/images.json. None of it invents a
   value; the numbers are the ones the client looked at.
   ======================================================================== */

const IMG_WIDTHS = images.widths;
const srcset = (stem) => IMG_WIDTHS
  .filter((w) => (images.images[stem].widths || IMG_WIDTHS).includes(w))
  .map((w) => `/img/${stem}-${w}.webp ${w}w`).join(', ');

/* A decorative cut-out. Empty alt and aria-hidden, always: every product used as
   scenery is in the menu below with its own approved name and line, and reading
   it out twice is worse than not reading it out at all. */
const scenic = (stem, cls, style, sizes) => {
  if (!images.images[stem]) throw new Error(`scenery names ${stem}, which has no derivative`);
  return `<img class="${cls}" src="/img/${stem}-800.webp" srcset="${srcset(stem)}" sizes="${sizes}"` +
         ` alt="" aria-hidden="true" width="800" height="800" loading="lazy" decoding="async"` +
         ` style="${style}">`;
};

const dia = '<i class="dia" aria-hidden="true"></i>';
const arrow = '<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
              '<path d="M4 12h15M13 6l6 6-6 6"/></svg>';

const drips = scene.drips
  .map((d) => `<i style="left:${d.l}%;--w:${d.w};--h:${d.h}"></i>`).join('');

/* One melt edge. `token` is a brand palette token name, so the colour is still
   read through tokens.css and never typed. */
const dripstrip = (token) =>
  `<div class="dripstrip" style="--drip:var(--c-${token})" aria-hidden="true">${drips}</div>`;

const sparkles = (n) => scene.sparkles.slice(0, n)
  .map((s) => `<i class="sp" style="left:${s.x}%;top:${s.y}%;--z:${s.z}px;animation-delay:${s.d}s"></i>`)
  .join('');

const bulbRow = (cls, n) => `<span class="edge edge--${cls}">` +
  Array.from({ length: n }, (_, i) => `<i class="b" style="--i:${i}"></i>`).join('') + '</span>';
const signBulbs = bulbRow('t', 22) + bulbRow('r', 8) + bulbRow('b', 22) + bulbRow('l', 8);
const visitBulbs = Array.from({ length: 26 }, (_, i) => `<i class="b" style="--i:${i % 10}"></i>`).join('');

/* THE DISPLAY CASE.

   Each bay is one slot wide and two tall, and the photograph inside it is a
   SQUARE — sized the way every other photograph on this page is sized, because
   the derivative is a square with the food centred in transparent padding and
   sizing the box to the food's aspect renders everything small. See
   src/app/card.js for the long version of that mistake.

       k    = clamp(sqrt(medianInk / ink), 0.88, 1.55)   ink normalisation
       side = min(CASE_W / fillW, CASE_H / fillH) * k, capped at CASE_CAP

   CASE_W is 1.72 bay widths and CASE_H is 1.56 against a bay that is 2 tall.
   Both are above 1 on purpose: the case is a shop window, so its products are
   cropped by their neighbours and by both ends of the frame. These three
   numbers reproduce all sixteen of the approved page's bays exactly. */
const CASE_W = 1.72, CASE_H = 1.56, CASE_CAP = 1.92;
const inkOf = (stem) => images.images[stem].ink;
const medianInk = (() => {
  const v = items.map((i) => inkOf(i.images[0].stem)).sort((a, b) => a - b);
  return v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
})();
const inkNorm = (stem) => Math.min(1.55, Math.max(0.88, Math.sqrt(medianInk / inkOf(stem))));

/* Which product a scenery stem belongs to, so the case can print the client's
   own approved name rather than a caption written here. */
const byStem = new Map();
for (const it of items) for (const s of it.images) if (!byStem.has(s.stem)) byStem.set(s.stem, it);
const nameOf = (stem) => {
  const it = byStem.get(stem);
  if (!it) throw new Error(`scenery names ${stem}, which is not in data/menu.json`);
  return it.name;
};

const caseBays = (() => {
  const one = scene.case.map((stem) => {
    const m = images.images[stem];
    const side = Math.min(Math.min(CASE_W / m.fillW, CASE_H / m.fillH) * inkNorm(stem), CASE_CAP);
    const house = nameOf(stem) === brand.brand.wordmark;
    return `<div class="bay">` +
      `<span class="bay__rib"></span>` +
      `<span class="bay__tag${house ? ' bay__tag--house' : ''}">${esc(nameOf(stem))}</span>` +
      scenic(stem, 'bay__img', `--s:${side.toFixed(3)}`, '24vw') +
      `</div>`;
  }).join('');
  // Twice, because the track translates -50% forever. One copy would snap.
  return one + one;
})();

/* ===========================================================================
   ONE LANGUAGE
   ======================================================================== */
for (const lang of ['es', 'en']) {
  const t = ui[lang];
  const other = lang === 'es' ? 'en' : 'es';
  const catLabel = (c) => (lang === 'es' ? c.es : c.en);
  const countOf = (id) => items.filter((i) => i.category === id).length;

  const payload = {
    lang, other,
    ui: t,
    uiOther: ui[other],
    categories: menu.categories,
    // Constant export geometry — see data/images.json. A card that needs to know
    // where the food sits inside its square reads this, rather than measuring the
    // PNGs and carrying the number in its own file.
    geometry: images.geometry,
    // The catalogue's own median ink coverage. Published rather than recomputed
    // in the browser so the card, the display case and this build agree by
    // construction instead of by coincidence.
    medianInk,
    widths: images.widths,
    items,
    counts: menu.counts,
  };

  // Structured data. Only facts we actually have: the shop's name, its city and
  // state, and its menu. No address, no hours, no phone, no price — inventing any
  // of those would put false information into a search result.
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'IceCreamShop',
    name: brand.brand.name,
    alternateName: brand.brand.wordmark,
    address: {
      '@type': 'PostalAddress',
      streetAddress: biz.address.street,
      addressLocality: biz.address.locality,
      addressRegion: biz.address.region,
      postalCode: biz.address.postalCode,
      addressCountry: biz.address.country,
    },
    telephone: biz.phone.e164,
    /* Seating, confirmed by the client. schema.org has no `seating` field, so it
       goes through amenityFeature, which is what Google reads for "outdoor
       seating" in a local result. */
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: 'Indoor seating', value: biz.amenities.seatingIndoor },
      { '@type': 'LocationFeatureSpecification', name: 'Outdoor seating', value: biz.amenities.seatingOutdoor },
    ],
    /* Real opening hours, so Google and Maps can show them. Worth having exactly
       once: schema.org wants 24-hour times and two-letter day prefixes. */
    openingHoursSpecification: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
      .filter((day) => biz.hours[day] && !biz.hours[day].closed)
      .map((day) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'https://schema.org/' + day[0].toUpperCase() + day.slice(1),
        opens: biz.hours[day].opens,
        closes: biz.hours[day].closes,
      })),
    image: '/social.png',
    hasMenu: {
      '@type': 'Menu',
      inLanguage: lang,
      hasMenuSection: menu.categories.map((c) => ({
        '@type': 'MenuSection',
        name: catLabel(c),
        hasMenuItem: items.filter((i) => i.category === c.id).map((i) => {
          const d = lang === 'es' ? i.copy.es : i.copy.en;
          return { '@type': 'MenuItem', name: i.name, ...(d ? { description: d } : {}) };
        }),
      })),
    },
  };

  // The whole menu, as plain HTML, for a browser that is not running our
  // JavaScript. The grid is built client-side, so without this the page is an
  // empty cream field — and a menu that renders nothing is worse than a menu
  // that renders plainly. It is the honest floor: if a script ever throws, the
  // customer still gets the menu.
  const noscript = `<noscript><div class="plain">
    <h2>${t.menuTitle}</h2>
    ${menu.categories.map((c) => `<section>
      <h3>${catLabel(c)}</h3>
      <ul>${items.filter((i) => i.category === c.id).map((i) => {
        const d = lang === 'es' ? i.copy.es : i.copy.en;
        const shot = i.images[0];
        return `<li>
          <img src="/img/${shot.stem}-400.webp" alt="${t.photoOf.replace('{name}', i.name)}" width="400" height="400" loading="lazy">
          <div><strong>${i.name}</strong>${d ? `<span>${d}</span>` : ''}</div>
        </li>`;
      }).join('')}</ul>
    </section>`).join('')}
    <p>${t.footerLocation} · ${t.footerNote}</p>
  </div></noscript>`;

  /* ---- the fragments that need a language ------------------------------- */

  /* THE DRAFT CHIP. Every line of prose on this page that the client has not
     approved carries one, in the reader's own language. It is not a comment in
     the source and it is not a note in a handoff document: it is on the page,
     next to the words, because that is the only place it cannot be missed. */
  /* APPROVED 2026-08-26. Luis read the drafted copy and approved all of it, so
     the chip is now empty rather than removed: the {{draft}} and {{draftEn}}
     hooks stay in the partials, and data/copy-draft.json keeps its name and its
     _approved block. That way the provenance survives — these lines were written
     here, not supplied by the shop — and turning the marker back on for a new
     line is one string, not a re-wiring. */
  const draftChip = '';

  const d = (key) => {
    const line = draft.lines[key];
    if (!line) throw new Error(`data/copy-draft.json has no line "${key}"`);
    return esc(line[lang].replace('{n}', menu.counts.products));
  };

  // The ticker: every product name the client approved, in catalogue order,
  // printed twice so the loop has something to run into.
  const tickerRun = items.map((i) => `<b>${esc(i.name)}</b><s></s>`).join('');
  const ticker = tickerRun + tickerRun;

  const eyebrowCats = menu.categories
    .map((c) => `<span>${esc(catLabel(c))}</span>`).join('<i aria-hidden="true"></i>');

  /* THE FOUR-WORD STATEMENT. The words are menu.json's own category labels — the
     same words the header, the chips and the chapter heads print — and `--m` is
     the measured advance-width ratio that makes the four lines one block.
     `data-w` is the cover coat that hides the inner half of the outline stroke. */
  const sayLines = scene.sayLines.map(({ cat, m }) => {
    const c = menu.categories.find((x) => x.id === cat);
    if (!c) throw new Error(`scenery sayLines names category "${cat}", which menu.json does not have`);
    const w = catLabel(c);
    return `<span class="say__l" data-w="${esc(w)}" style="--m:${m[lang]}">${esc(w)}</span>`;
  }).join('');

  const sayFloats = scene.say
    .map((f) => scenic(f.stem, `float ${f.cls}`, `${f.pos};--w:${f.w};--s:${f.s}`, '18vw')).join('');

  /* One shop photograph. Returns '' when the photo is not in the repo, so a
     section that wants one degrades to whatever it had before rather than
     rendering a broken <img>. */
  const shopPic = (key, cls, sizes, alt) => {
    const p = shop[key];
    if (!p) return '';
    return `<img class="${cls}" src="/shop/${p.stem}-1200.webp" srcset="${p.srcset}"`
      + ` sizes="${sizes}" width="${p.width}" height="${p.height}" alt="${esc(alt)}"`
      + ` loading="lazy" decoding="async" style="background-image:url('${p.lqip}')">`;
  };

  /* THE STORY BAND LEADS WITH THE SHOP, NOT WITH PRODUCT.
     It used to be a large cut-out with four smaller ones floating around it —
     the same photographs that appear forty-five more times further down the
     page, doing no work here. A photograph of the actual counter says what that
     band is for in a way a repeated cut-out cannot. The floats stay: they frame
     the photograph instead of orbiting a sixth copy of a milkshake. */
  const storyPhoto = shopPic('Counter', 'big__photo',
    '(max-width: 860px) 78vw, 38vw',
    lang === 'es' ? 'El mostrador de La Sabrosita en Swedesboro'
                  : 'The counter at La Sabrosita in Swedesboro');
  const storyArt =
    (storyPhoto || scenic(scene.story.hero.stem, 'big__img', `--s:${scene.story.hero.s}`,
                          '(max-width: 860px) 70vw, 34vw')) +
    scene.story.floats
      .map((f) => scenic(f.stem, `float ${f.cls}`, `${f.pos};--w:${f.w};--s:${f.s}`, '18vw')).join('');

  /* HOW FAR THE FOOD IS FROM THE EDGE OF ITS OWN FILE.
     Every derivative is a square canvas with the product centred in transparent
     padding, and how much padding depends entirely on the product's shape: a
     thin paleta is mostly padding, a wide tray is barely any. Positioning the
     back product by its BOX therefore says nothing about where its FOOD lands —
     which is why the first attempt at fixing this looked fixed and measured
     67-86% of the back product still buried behind the front one.
     This returns the horizontal padding as a fraction of the square, so the CSS
     can offset by it and put the FOOD where the box edge appears to be. */
  const padOf = (stem) => {
    const g = images.images[stem];
    if (!g) return 0;
    const a = g.productAspect || 1;
    const fillW = a >= 1 ? 0.8929 : 0.8929 * a;   // share of the square the food spans
    return (1 - fillW) / 2;                        // padding on each side
  };

  const panels = menu.categories.map((c, i) => {
    const p = scene.panels[c.id];
    if (!p) throw new Error(`data/scenery.json has no panel for category "${c.id}"`);
    return `<a class="pan pan--art pan--${c.id}" href="#cat-${c.id}">
      <span class="pan__stage"><span class="pan__art" aria-hidden="true"></span>${
        `<svg class="pan__star" style="top:11%;right:12%;width:26px;height:26px" viewBox="0 0 24 24"><path d="M12 0c.6 6.3 5.1 10.8 12 12-6.9 1.2-11.4 5.7-12 12-.6-6.3-5.1-10.8-12-12C6.9 10.8 11.4 6.3 12 0Z"/></svg>` +
        `<svg class="pan__star" style="bottom:16%;left:9%;width:17px;height:17px;opacity:.7" viewBox="0 0 24 24"><path d="M12 0c.6 6.3 5.1 10.8 12 12-6.9 1.2-11.4 5.7-12 12-.6-6.3-5.1-10.8-12-12C6.9 10.8 11.4 6.3 12 0Z"/></svg>`}${
        scenic(p.front.stem, 'pan__p pan__p--1', `--s:${p.front.s}`, '24vw')}${
        scenic(p.back.stem, 'pan__p pan__p--2',
               `--s:${p.back.s};--pad:${padOf(p.back.stem).toFixed(4)}`, '24vw')}</span>
      <span class="pan__body">
        <span class="pan__k">0${i + 1}</span>
        <span class="pan__name">${esc(catLabel(c))}</span>
        <span class="pan__n">${esc(t.itemsCount.replace('{n}', countOf(c.id)))}</span>
        <span class="pan__go">${esc(t.seeCategory.replace('{c}', catLabel(c)))}${arrow}</span>
      </span>
    </a>`;
  }).join('');

  const beats = scene.beats.map((b, i) => `<article class="beat beat--${b.side}">
      <div class="beat__art">
        <span class="beat__disc" aria-hidden="true"></span>
        ${scenic(b.hero.stem, 'big__img', `--s:${b.hero.s}`, '(max-width: 860px) 70vw, 34vw')}
        ${b.floats.map((f) => scenic(f.stem, `float ${f.cls}`, `${f.pos};--w:${f.w};--s:${f.s}`, '18vw')).join('')}
      </div>
      <div class="beat__copy">
        <span class="beat__k" aria-hidden="true">0${i + 1}</span>
        <h3 class="beat__h">${d(`${b.key}Title`)}${draftChip}</h3>
        <p class="beat__p">${d(`${b.key}P`)}</p>
      </div>
    </article>`).join('');

  /* The menu head's jump links and the footer's chapter list. Built here rather
     than in the app so that they are in the HTML the server sends — they are the
     no-JavaScript floor's only way around the page. Nothing is written: these
     are menu.json's own approved labels and the section ids the grid emits. */
  const jumpCats = menu.categories
    .map((c) => `<a href="#cat-${c.id}">${esc(catLabel(c))}</a>`).join('');
  const footCats = menu.categories
    .map((c) => `<li><a class="foot__cat" href="#cat-${c.id}">${esc(catLabel(c))}` +
                `<span class="foot__c">${countOf(c.id)}</span></a></li>`).join('');

  let html = shell;
  html = html.replace(/<!--@(\w+)-->/g, (_, name) => partial(name));

  // Fragments first, then the string tables, because a fragment can carry a
  // {{t:…}} of its own and nothing here is allowed to depend on the order two
  // authors happened to write their replacements in.
  const frag = {
    ticker, bulbs: signBulbs, drips, caseBays, eyebrowCats,
    sayLines, sayFloats, storyArt, panels, beats, visitBulbs,
    seatingPhoto: shopPic('Interior', 'visit__photo', '(max-width: 900px) 92vw, 46vw',
      lang === 'es' ? 'El interior de La Sabrosita, con las mesas al fondo'
                    : 'Inside La Sabrosita, with the seating at the back'),
    /* The town band takes the SIGN ITSELF, now that the photograph exists. It
       used to carry the display case, which was the nearest thing available and
       showed neither the neon nor the tables the paragraph beside it describes.
       A review pass flagged exactly that mismatch. */
    casePhoto: shopPic('Neon-Swedesboro', 'town__photo', '(max-width: 900px) 92vw, 46vw',
      lang === 'es' ? 'El letrero de neón I ♥ SWEDESBORO, NJ. sobre las mesas de La Sabrosita'
                    : 'The I ♥ SWEDESBORO, NJ. neon sign above the tables at La Sabrosita'),
    frontPhoto: shopPic('Storefront', 'visit__front', '(max-width: 900px) 92vw, 46vw',
      lang === 'es' ? 'La fachada de La Sabrosita en Kings Highway, con las mesas afuera'
                    : "La Sabrosita's storefront on Kings Highway, with the tables outside"),
    jumpCats, footCats, dia, arrow, draft: draftChip,
    logoSrcset, brandName: esc(brand.brand.name),
    lang, otherLang: other,
    css: cssLinks, modulepreload: modulePreload,
    brandPink: brand.color.palette.hotPink.hex,
    ogLocale: lang === 'es' ? 'es_US' : 'en_US',
    home: lang === 'es' ? '/' : '/en/',
    esHome: '/',
    enHome: '/en/',
    otherHome: other === 'es' ? '/' : '/en/',
    noscript,
    jsonld: JSON.stringify(jsonld).replace(/</g, '\\u003c'),
    data: JSON.stringify(payload).replace(/</g, '\\u003c'),
  };

  html = html.replace(/\{\{sparkles:(\d+)\}\}/g, (_, n) => sparkles(Number(n)));
  html = html.replace(/\{\{dripstrip:([\w-]+)\}\}/g, (_, tok) => dripstrip(tok));
  /* {{biz:key}} — the shop's facts, from brand/business.json, never inlined.
     `hours` is grouped rather than listed seven times: consecutive days that
     share an opening are collapsed into one line, so Monday to Thursday reads as
     a range instead of four identical rows. */
  const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  const DAY_NAMES = {
    es: ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'],
    en: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
  };
  const hhmm = (t) => {
    if (lang === 'es') return t.replace(':00', '') + ' h';
    const [H, M] = t.split(':').map(Number);
    const ampm = H >= 12 ? 'pm' : 'am';
    const h12 = H % 12 === 0 ? 12 : H % 12;
    return M ? `${h12}:${String(M).padStart(2,'0')}${ampm}` : `${h12}${ampm}`;
  };
  const hoursRows = () => {
    const rows = [];
    for (let i = 0; i < 7; i++) {
      const h = biz.hours[DAYS[i]];
      const key = h && !h.closed ? `${h.opens}-${h.closes}` : 'closed';
      const last = rows[rows.length - 1];
      if (last && last.key === key) last.to = i;
      else rows.push({ key, from: i, to: i, h });
    }
    return rows.map((r) => {
      const names = DAY_NAMES[lang] || DAY_NAMES.en;
      const label = r.from === r.to ? names[r.from]
        : `${names[r.from]}–${names[r.to]}`;
      const val = r.h && !r.h.closed
        ? `${hhmm(r.h.opens)}–${hhmm(r.h.closes)}`
        : (lang === 'es' ? 'Cerrado' : 'Closed');
      return `<div class="hrow"><dt>${label}</dt><dd>${val}</dd></div>`;
    }).join('');
  };
  /* {{draftEn}} — a chip that appears on the ENGLISH page only.
     The Spanish headline is the client's own: he saw it and said "keep the
     headline", so it carries no chip. Its English counterpart is a translation I
     wrote and he has not approved, so /en/ gets the chip and / does not. Without
     this the English hero would be the one line on the site claiming approval it
     does not have. */
  html = html.replace(/\{\{draftEn\}\}/g, () => (lang === 'en' ? draftChip : ''));

  html = html.replace(/\{\{biz:(\w+)\}\}/g, (_, k) => {
    if (k === 'hours') return hoursRows();
    /* One line, for the footer, where the seven-row table does not fit. Groups
       the same way and joins with a middot. */
    if (k === 'hoursShort') {
      const rows = [];
      for (let i = 0; i < 7; i++) {
        const h = biz.hours[DAYS[i]];
        const key = h && !h.closed ? `${h.opens}-${h.closes}` : 'closed';
        const last = rows[rows.length - 1];
        if (last && last.key === key) last.to = i; else rows.push({ key, from: i, to: i, h });
      }
      const names = DAY_NAMES[lang] || DAY_NAMES.en;
      const short = (n) => (lang === 'es' ? n.slice(0, 3) : n.slice(0, 3));
      return rows.map((r) => {
        const label = r.from === r.to ? short(names[r.from]) : `${short(names[r.from])}–${short(names[r.to])}`;
        const val = r.h && !r.h.closed ? `${hhmm(r.h.opens)}–${hhmm(r.h.closes)}`
                                      : (lang === 'es' ? 'Cerrado' : 'Closed');
        return `${label} ${val}`;
      }).join(' · ');
    }
    if (k === 'address') return biz.address.oneLine;
    if (k === 'street') return biz.address.street;
    if (k === 'cityline') return `${biz.address.locality}, ${biz.address.region} ${biz.address.postalCode}`;
    if (k === 'phone') return biz.phone.display;
    if (k === 'tel') return biz.phone.e164;
    if (k === 'maps') return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(biz.name + ' ' + biz.address.oneLine);
    throw new Error(`unknown {{biz:${k}}}`);
  });
  html = html.replace(/\{\{d:(\w+)\}\}/g, (_, k) => d(k));
  html = html.replace(/\{\{t:(\w+)\}\}/g, (_, k) => {
    if (!(k in t)) throw new Error(`ui.json ${lang} has no string "${k}"`);
    return t[k]
      .replace('{n}', menu.counts.products)
      .replace('{c}', menu.categories.length);
  });
  html = html.replace(/\{\{(\w+)\}\}/g, (all, k) => {
    if (!(k in frag)) throw new Error(`nothing fills the slot ${all}`);
    return frag[k];
  });

  const dir = lang === 'es' ? OUT : path.join(OUT, 'en');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

// robots + sitemap. SITE_ORIGIN is set at deploy time; without it the sitemap is
// written with relative paths, which is honest about not knowing the domain yet.
const origin = process.env.SITE_ORIGIN || '';
fs.writeFileSync(path.join(OUT, 'robots.txt'),
  `User-agent: *\nAllow: /\n${origin ? `Sitemap: ${origin}/sitemap.xml\n` : ''}`);
fs.writeFileSync(path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ` +
  `xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
  ['/', '/en/'].map((u) => `  <url>\n    <loc>${origin}${u}</loc>\n` +
    `    <xhtml:link rel="alternate" hreflang="es" href="${origin}/"/>\n` +
    `    <xhtml:link rel="alternate" hreflang="en" href="${origin}/en/"/>\n  </url>`).join('\n') +
  `\n</urlset>\n`);

console.log(`built public/index.html (es) and public/en/index.html — ` +
            `${items.length} products, ${items.reduce((n, i) => n + i.images.length, 0)} photos, ` +
            `median ink ${medianInk}`);
