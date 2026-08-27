#!/usr/bin/env node
/**
 * Compose N screenshots into one labelled A / B / C … strip in a random order,
 * with every identifying label removed, and write the answer key to a SEPARATE
 * file that the judge is not allowed to open until it has committed a verdict.
 *
 *   node scripts/blind.mjs --in ours.png,.bench/mich-grid-desktop.png,.bench/hm-grid-desktop.png \
 *                          --out .shots/grid/blind-desktop
 *
 * Writes <out>.png and <out>.key.json.
 *
 * The whole point is that ours cannot win by being recognised as ours. If you are
 * the judge: pick from the picture, write the verdict down, then read the key.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i === -1 ? d : process.argv[i + 1]; };
const files = String(arg('in', '')).split(',').filter(Boolean).map((f) => path.resolve(f));
const out = path.resolve(arg('out', '.shots/blind'));
const H = Number(arg('h', 1500));
if (files.length < 2) { console.error('need at least two --in files'); process.exit(1); }

// Fisher-Yates with real randomness, so re-running reshuffles.
const order = files.map((f, i) => i);
for (let i = order.length - 1; i > 0; i--) {
  const j = crypto.randomInt(i + 1);
  [order[i], order[j]] = [order[j], order[i]];
}
const LETTERS = 'ABCDEFGH';
const GAP = 28;
const BAR = 60;

const panels = [];
for (const idx of order) {
  const img = sharp(files[idx]);
  const m = await img.metadata();
  const w = Math.max(200, Math.round((m.width / m.height) * H));
  panels.push({ file: files[idx], w, buf: await img.resize(w, H, { fit: 'cover', position: 'top' }).png().toBuffer() });
}
const totalW = panels.reduce((n, p) => n + p.w, 0) + GAP * (panels.length - 1);
const label = (text, w) => Buffer.from(
  `<svg width="${w}" height="${BAR}"><rect width="${w}" height="${BAR}" fill="#101014"/>
   <text x="${w / 2}" y="${BAR * 0.68}" font-family="monospace" font-size="34" fill="#fff" text-anchor="middle">${text}</text></svg>`);

const comps = [];
let x = 0;
const key = {};
panels.forEach((p, i) => {
  comps.push({ input: label(LETTERS[i], p.w), left: x, top: 0 });
  comps.push({ input: p.buf, left: x, top: BAR });
  key[LETTERS[i]] = p.file;
  x += p.w + GAP;
});

fs.mkdirSync(path.dirname(out), { recursive: true });
await sharp({ create: { width: totalW, height: H + BAR, channels: 4, background: '#101014' } })
  .composite(comps).png().toFile(`${out}.png`);
fs.writeFileSync(`${out}.key.json`, JSON.stringify(key, null, 1));
console.log(`${out}.png  (${panels.length} panels)  — do NOT open ${out}.key.json until your verdict is written.`);
