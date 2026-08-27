#!/usr/bin/env node
/**
 * Which way is each photograph lit?
 *
 * A hero that overlaps five cut-outs into one mass only reads as one object if
 * the light agrees. Ours did not: measured, the spread of key direction across
 * the five was 62 points — churros lit from below, raspado from above, elote hard
 * from the left. Nothing in a screenshot names that; it just looks subtly wrong.
 *
 * The client's masters come from different shoots and cannot be re-lit — they are
 * approved bytes, and changing how the food looks would misrepresent the product.
 * So the lever is SELECTION, not correction, and selection needs a number.
 *
 * Method: over the opaque pixels only, compare mean luminance of the top half to
 * the bottom half, and the left half to the right half.
 *   verticalKey  positive = lit from above,  negative = lit from below
 *   horizontalKey positive = lit from the left, negative = from the right
 * A set of photographs whose keys sit close together will composite as one mass.
 *
 *   node scripts/lighting.mjs                    all 62, sorted by vertical key
 *   node scripts/lighting.mjs crazy-shake churros mango
 *
 * With arguments it reports the spread of just those, which is the number that
 * matters when choosing a hero group.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const menu = JSON.parse(fs.readFileSync(path.join(SITE, 'data/menu.json'), 'utf8'));
const picks = process.argv.slice(2).map((s) => s.toLowerCase());

const rows = [];
for (const item of menu.items) {
  const stem = item.images[0].stem;
  const file = path.join(SITE, `public/img/${stem}-400.webp`);
  if (!fs.existsSync(file)) continue;
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const half = { top: [0, 0], bottom: [0, 0], left: [0, 0], right: [0, 0] };
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * ch;
      if (data[i + 3] < 200) continue;            // opaque product pixels only
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      const v = y < info.height / 2 ? 'top' : 'bottom';
      const h = x < info.width / 2 ? 'left' : 'right';
      half[v][0] += lum; half[v][1]++;
      half[h][0] += lum; half[h][1]++;
    }
  }
  const mean = (k) => (half[k][1] ? half[k][0] / half[k][1] : 0);
  rows.push({
    name: item.name, id: item.id,
    vertical: Math.round(mean('top') - mean('bottom')),
    horizontal: Math.round(mean('left') - mean('right')),
  });
}

// Exact id first, then a prefix, and only then a loose substring — otherwise
// "bionico" matches both "Bionico con Nieve" and "Bionicos" and quietly measures
// a group of six when you asked for five.
const chosen = picks.length
  ? picks.map((p) => rows.find((r) => r.id === p)
        || rows.find((r) => r.id.startsWith(p))
        || rows.find((r) => r.id.includes(p) || r.name.toLowerCase().includes(p)))
      .filter(Boolean)
      .filter((r, i, a) => a.indexOf(r) === i)
  : rows;
if (picks.length && chosen.length !== picks.length) {
  const missing = picks.filter((p) => !chosen.some((r) => r.id.includes(p)));
  if (missing.length) console.log(`\n  no product matched: ${missing.join(', ')}`);
}
chosen.sort((a, b) => b.vertical - a.vertical);

console.log('\n  vertical  horizontal  product');
console.log('  (+ = lit from above)  (+ = lit from the left)\n');
for (const r of chosen) {
  console.log(`  ${String(r.vertical).padStart(5)}     ${String(r.horizontal).padStart(5)}      ${r.name}`);
}
const v = chosen.map((r) => r.vertical), h = chosen.map((r) => r.horizontal);
const spread = (a) => Math.max(...a) - Math.min(...a);
console.log(`\n  ${chosen.length} photographs · vertical spread ${spread(v)} · horizontal spread ${spread(h)}`);
if (picks.length) {
  console.log(spread(v) <= 20 && spread(h) <= 20
    ? '  these will composite as one mass'
    : '  these are lit from different directions and will not read as one object');
} else {
  console.log('  Pass product names or ids to measure the spread of a specific group,');
  console.log('  e.g. node scripts/lighting.mjs crazy-shake churros mango elote raspado\n');
}
