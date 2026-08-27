#!/usr/bin/env node
/**
 * Photographs of the shop itself -> public/shop derivatives.
 *
 * Separate from build-images.mjs because these are nothing like the products.
 * A product is a cut-out on transparency, trimmed to its alpha box and re-padded
 * to a square; these are ordinary rectangular photographs of a room. They need
 * cropping and quality, not geometry.
 *
 * TWO THINGS THAT WOULD GO WRONG WITHOUT CARE:
 *
 *   1. EXIF ORIENTATION. All three originals are `orientation=6` — portrait
 *      photographs stored landscape with a rotation flag. A browser honours the
 *      flag; sharp does not unless told. `.rotate()` with no argument bakes the
 *      EXIF rotation in, which is exactly what is wanted: the derivative is then
 *      upright for everything, flag or no flag.
 *
 *   2. SIZE. The originals are 4000x3000 and ~4 MB each. Shipping those would
 *      undo the whole performance result — the site's LCP is 1672ms on 4G and
 *      three 4MB photographs would end that. They go out as webp at three widths.
 *
 * NOTHING UNDER assets/ IS WRITTEN, READ ONLY. New derivatives land in
 * site/public/shop, which is build output and disposable.
 *
 * Run: node scripts/build-shop.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const REPO = path.resolve(SITE, '..');
const SRC = path.join(REPO, 'assets/shop');
const OUT = path.join(SITE, 'public/shop');
const DATA = path.join(SITE, 'data/shop.json');

const WIDTHS = [700, 1200, 1800];

if (!fs.existsSync(SRC)) {
  console.log('no assets/shop — nothing to build');
  process.exit(0);
}

fs.mkdirSync(OUT, { recursive: true });

const originals = fs.readdirSync(SRC).filter((f) => /_ORIGINAL_v\d+\.(jpe?g|png)$/i.test(f));
if (!originals.length) {
  console.log('assets/shop has no _ORIGINAL_ photographs yet');
  fs.writeFileSync(DATA, JSON.stringify({ _generated: 'scripts/build-shop.mjs', photos: {} }, null, 2));
  process.exit(0);
}

const photos = {};

for (const file of originals) {
  const stem = file.replace(/\.(jpe?g|png)$/i, '');
  const key = stem.replace(/^LS_/, '').replace(/_ORIGINAL_v\d+$/, '');
  const input = path.join(SRC, file);

  // .rotate() with no argument applies the EXIF orientation and then strips it.
  const base = sharp(input).rotate();
  const meta = await base.metadata();
  // metadata() reports the STORED size, so swap when the flag says the upright
  // image is portrait. 5,6,7,8 are the four orientations that transpose axes.
  const turned = [5, 6, 7, 8].includes(meta.orientation || 1);
  const w = turned ? meta.height : meta.width;
  const h = turned ? meta.width : meta.height;

  const widths = WIDTHS.filter((x) => x <= w);
  if (!widths.length) widths.push(w);

  for (const width of widths) {
    await sharp(input).rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(OUT, `${stem}-${width}.webp`));
  }

  // A tiny blurred placeholder so the space is coloured before the photo lands,
  // the same trick the product cards use.
  const lqip = await sharp(input).rotate().resize({ width: 20 }).webp({ quality: 30 }).toBuffer();

  photos[key] = {
    stem,
    width: w,
    height: h,
    aspect: +(w / h).toFixed(4),
    widths,
    srcset: widths.map((x) => `/shop/${stem}-${x}.webp ${x}w`).join(', '),
    lqip: `data:image/webp;base64,${lqip.toString('base64')}`,
  };
  console.log(`  ${key.padEnd(14)} ${w}x${h}  ${widths.join('/')}`);
}

fs.writeFileSync(DATA, JSON.stringify({
  _generated: 'scripts/build-shop.mjs — do not hand-edit',
  _what: 'Photographs of the shop itself. Rectangular room photographs, not product cut-outs.',
  photos,
}, null, 2));

console.log(`\n${Object.keys(photos).length} shop photographs -> public/shop`);
