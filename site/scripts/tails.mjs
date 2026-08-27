#!/usr/bin/env node
/**
 * Where the grid leaves a hole.
 *
 * A blind judge deducted against our motion filmstrip for "three empty cream
 * holes" in a row. They are not a paint stall — they are the tail of a category
 * that does not divide by the column count. That is arithmetic, so here it is as
 * arithmetic, for every category at every plausible layout.
 *
 * A 2x2 feature tile is ONE product occupying FOUR slots, so it makes the tail
 * worse, not better: it adds three slots' worth of area without adding products.
 *
 * Run: node scripts/tails.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const menu = JSON.parse(fs.readFileSync(path.join(HERE, '../data/menu.json'), 'utf8'));

const COLS = [2, 3, 4, 5, 6];
const rows = [];
for (const c of menu.categories) {
  const n = menu.items.filter((i) => i.category === c.id).length;
  rows.push({ name: c.es, n });
}

const empty = (n, cols, features) => {
  // Each feature is 1 product taking a 2x2 block = 4 slots.
  const slots = (n - features) + features * 4;
  const rowsUsed = Math.ceil(slots / cols);
  return rowsUsed * cols - slots;
};

for (const features of [0, 1]) {
  console.log(`\n${features === 0 ? 'no feature tile' : 'one 2x2 feature tile per category'}`);
  console.log('  category      n   ' + COLS.map((c) => `${c}col`.padStart(6)).join(''));
  for (const r of rows) {
    console.log(`  ${r.name.padEnd(12)} ${String(r.n).padStart(2)}   ` +
      COLS.map((c) => {
        const e = empty(r.n, c, features);
        return (e === 0 ? '  —' : `  ${e}`).padStart(6);
      }).join(''));
  }
}
console.log('\n  — means the category tiles exactly: no hole at the end of the section.');
console.log('  Numbers are empty slots left in the final row.\n');

// The combinations that leave every category whole.
const clean = [];
for (const features of [0, 1]) {
  for (const c of COLS) {
    if (rows.every((r) => empty(r.n, c, features) === 0)) clean.push(`${c} columns, ${features} feature`);
  }
}
console.log(clean.length
  ? `  Whole for every category: ${clean.join(' · ')}`
  : '  No single column count tiles all four categories cleanly.');

// If the column count is allowed to differ per section — which is a design
// decision, not a constraint — there may be a combination with no hole anywhere.
console.log('\n  Per-section column counts that leave no hole at all:');
let found = 0;
for (const features of [0, 1]) {
  const pick = rows.map((r) => {
    const ok = COLS.filter((c) => empty(r.n, c, features) === 0);
    return { name: r.name, n: r.n, ok };
  });
  if (pick.every((p) => p.ok.length)) {
    found++;
    console.log(`    with ${features} feature tile: ` +
      pick.map((p) => `${p.name} ${p.ok.join('/')}`).join(' · '));
  }
}
if (!found) console.log('    none — the tail has to be absorbed by the layout.');
console.log('\n  Absorbing it in the layout is the other route: let the last item of a section\n' +
            '  span the remaining columns, or end each section with something that is not a\n' +
            '  product. Either is better than a row of holes.\n');
