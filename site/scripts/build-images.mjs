#!/usr/bin/env node
/**
 * Build web-ready derivatives of the product masters into site/public/img/.
 *
 * IMPORTANT — assets/ is never touched. CLAUDE.md forbids renaming, moving,
 * recompressing or regenerating anything under assets/, because Rubric's catalog
 * stores those exact paths and a human approved those exact bytes. This script
 * only READS them and writes NEW files somewhere else.
 *
 * What it does per master:
 *   1. Trim the transparent margin down to the actual product (alpha bbox).
 *      The masters are 2000x2000 with a lot of empty space; trimming is what
 *      lets a card frame the food large and consistently, the way
 *      heladosmexico.com frames a single paleta.
 *   2. Re-pad to a square with one constant margin so every product occupies the
 *      same share of its frame — no product looks arbitrarily bigger than another.
 *   3. Export webp at three widths plus a tiny inline placeholder.
 *
 * Run: node scripts/build-images.mjs [--force]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const REPO = path.resolve(SITE, '..');
const OUTDIR = path.join(SITE, 'public/img');
const FORCE = process.argv.includes('--force');

// 600 exists because the real slots land between 400 and 800: a 2-across phone
// card is ~170 CSS px, which is 510 device px at 3x, and a 5-across desktop card
// is ~230 CSS px, which is 460 at 2x. Without it the browser fetches 800 for both.
const WIDTHS = [400, 600, 800, 1400];
const MARGIN = 0.06;      // share of the square left empty on the tightest side
const QUALITY = 82;

const menu = JSON.parse(fs.readFileSync(path.join(SITE, 'data/menu.json'), 'utf8'));
/* Masters whose pixels are stored rotated. See data/orientation.json for why the
   correction lives here and not in the file: assets/ is the client's approved
   media and CLAUDE.md forbids touching it, so the rotation is applied on the way
   out instead. Applied BEFORE the alpha box is measured — otherwise the trim,
   the square, productAspect and ink would all be computed off the sideways
   version and every one of them would be wrong. */
const ORIENT = JSON.parse(fs.readFileSync(path.join(SITE, 'data/orientation.json'), 'utf8')).rotate;
const turnOf = (stem) => (ORIENT[stem] ? ORIENT[stem].degrees : 0);

fs.mkdirSync(OUTDIR, { recursive: true });

/** Tight bounding box of everything with alpha above `threshold`. */
async function alphaBox(file, threshold = 12, turn = 0) {
  const img = sharp(file).rotate(turn).ensureAlpha();
  const { width, height } = await img.metadata();
  const alpha = await img.extractChannel('alpha').raw().toBuffer();
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      if (alpha[row + x] > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { left: 0, top: 0, width, height, opaque: true, ink: 1 };
  // `ink` is the share of the trimmed box the product actually fills. A paleta on
  // a stick fills far less of its box than a tray of nachos does, so two products
  // sized to the same box look wildly different in weight. The site scales by ink
  // instead, which is what makes a 45-item grid read as one set of photographs.
  let opaquePx = 0;
  for (let y = minY; y <= maxY; y++) {
    const row = y * width;
    for (let x = minX; x <= maxX; x++) if (alpha[row + x] > threshold) opaquePx++;
  }
  const boxArea = (maxX - minX + 1) * (maxY - minY + 1);
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1,
           opaque: false, ink: opaquePx / boxArea };
}

const manifest = {};
let built = 0, skipped = 0;

for (const item of menu.items) {
  for (const shot of item.images) {
    const src = path.join(REPO, shot.master);
    const stem = shot.stem;
    const done = path.join(OUTDIR, `${stem}-${WIDTHS[WIDTHS.length - 1]}.webp`);
    if (!FORCE && fs.existsSync(done) && fs.existsSync(path.join(OUTDIR, `${stem}.json`))) {
      manifest[stem] = JSON.parse(fs.readFileSync(path.join(OUTDIR, `${stem}.json`), 'utf8'));
      skipped++;
      continue;
    }
    const turn = turnOf(stem);
    const box = await alphaBox(src, 12, turn);
    // Square canvas that fits the trimmed product with a constant margin.
    const side = Math.round(Math.max(box.width, box.height) * (1 + MARGIN * 2));
    const padX = Math.round((side - box.width) / 2);
    const padY = Math.round((side - box.height) / 2);

    const trimmed = sharp(src).rotate(turn)
      .extract({ left: box.left, top: box.top, width: box.width, height: box.height })
      .extend({
        top: padY, bottom: side - box.height - padY,
        left: padX, right: side - box.width - padX,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });

    const buf = await trimmed.png().toBuffer();
    for (const w of WIDTHS) {
      await sharp(buf).resize(w, w, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: QUALITY, alphaQuality: 90, effort: 5 })
        .toFile(path.join(OUTDIR, `${stem}-${w}.webp`));
    }
    // 20px blurred placeholder, inlined by the page so a card never flashes empty.
    const lqip = await sharp(buf).resize(20, 20, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 40 }).toBuffer();

    const meta = {
      stem,
      // Aspect of the PRODUCT itself, before squaring. A layout can use this to
      // decide whether something is tall (a paleta) or wide (a tray of pancakes).
      productAspect: Number((box.width / box.height).toFixed(3)),
      tall: box.height > box.width * 1.15,
      wide: box.width > box.height * 1.15,
      opaque: box.opaque,
      // Fraction of the exported SQUARE that is actual product.
      ink: Number(((box.ink * box.width * box.height) / (side * side)).toFixed(4)),
      // How much of the square the product actually spans on each axis. The
      // export is NOT tight to the product: it is trimmed to the alpha box and
      // then re-padded to a square with a constant margin, so a card that wants
      // the food to touch a specific edge has to know this. Published here so
      // nobody has to measure the PNGs and carry the number in their own file.
      fillW: Number((box.width / side).toFixed(4)),
      fillH: Number((box.height / side).toFixed(4)),
      widths: WIDTHS,
      lqip: `data:image/webp;base64,${lqip.toString('base64')}`,
    };
    fs.writeFileSync(path.join(OUTDIR, `${stem}.json`), JSON.stringify(meta));
    manifest[stem] = meta;
    built++;
    process.stdout.write(`\r  built ${built}  skipped ${skipped}   ${stem.slice(0, 46).padEnd(48)}`);
  }
}
// One normalising pass: scale every product toward the median ink so the grid
// reads evenly. Clamped, so nothing is blown up past its own resolution.
const inks = Object.values(manifest).map((m) => m.ink).sort((a, b) => a - b);
const median = inks[Math.floor(inks.length / 2)];
for (const m of Object.values(manifest)) {
  const raw = Math.sqrt(median / m.ink);
  m.visualScale = Number(Math.min(1.45, Math.max(0.82, raw)).toFixed(3));
  fs.writeFileSync(path.join(OUTDIR, `${m.stem}.json`), JSON.stringify(m));
}
console.log(`median ink ${median.toFixed(3)}; visualScale range ` +
  `${Math.min(...Object.values(manifest).map(m=>m.visualScale))}–${Math.max(...Object.values(manifest).map(m=>m.visualScale))}`);

fs.writeFileSync(path.join(SITE, 'data/images.json'), JSON.stringify({
  _generated: 'scripts/build-images.mjs — do not hand-edit',
  _source: 'assets/products/masters (read only; never modified)',
  widths: WIDTHS,
  // Constant geometry of every export, so a consumer can reason about the frame
  // without opening an image.
  geometry: {
    square: true,
    margin: MARGIN,
    canvasFill: Number((1 / (1 + MARGIN * 2)).toFixed(4)),
    _note: 'Each photo is trimmed to its alpha bounding box, then re-padded to a ' +
           'square whose side is the long axis plus `margin` on each side. So the ' +
           'product spans at most `canvasFill` of the square, and exactly fillW ' +
           'by fillH of it. Nothing is stretched: the aspect is the product\'s own.',
  },
  images: manifest,
}, null, 1));

const opaque = Object.values(manifest).filter((m) => m.opaque).map((m) => m.stem);
console.log(`\n${built} built, ${skipped} reused, ${Object.keys(manifest).length} total`);
if (opaque.length) console.log(`WARNING — no transparency, will not read as a cut-out: ${opaque.join(', ')}`);
