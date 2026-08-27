#!/usr/bin/env node
/**
 * How big is the hero's subject, as a share of the first screen?
 *
 * Both benchmarks open the same way: one product, very large, on a flat field.
 * "Large" is the whole move, so it needs a number rather than an adjective.
 *
 * Method, identical for all three: take the first screen, find its modal colour
 * (the flat field), and find the vertical extent of the largest connected run of
 * non-field pixels in the half of the screen the product occupies. Report that
 * height as a fraction of the viewport.
 *
 *   node scripts/hero-scale.mjs <image.png> <x,w>   (column to search, in image px)
 */
import sharp from 'sharp';

const [file, col] = process.argv.slice(2);
const [cx, cw] = col.split(',').map(Number);
const img = sharp(file);
const meta = await img.metadata();
const H = Math.min(meta.height, Math.round(meta.width * (900 / 1440)));   // first screen
const { data, info } = await img.extract({ left: cx, top: 0, width: cw, height: H })
  .raw().toBuffer({ resolveWithObject: true });
const ch = info.channels;

// The field is sampled PER ROW from the far left of the search column, because a
// gradient has no single modal colour and a global mode would pick the nav bar.
// The column must therefore be chosen so its left edge is empty field.
const EDGE = Math.max(4, Math.round(info.width * 0.03));
const rows = [];
for (let y = 0; y < info.height; y++) {
  let r = 0, g = 0, b = 0;
  for (let x = 0; x < EDGE; x++) {
    const i = (y * info.width + x) * ch;
    r += data[i]; g += data[i + 1]; b += data[i + 2];
  }
  r /= EDGE; g /= EDGE; b /= EDGE;
  let n = 0;
  for (let x = EDGE; x < info.width; x++) {
    const i = (y * info.width + x) * ch;
    if (Math.abs(data[i] - r) + Math.abs(data[i + 1] - g) + Math.abs(data[i + 2] - b) > 70) n++;
  }
  rows.push(n / (info.width - EDGE) > 0.04);
}
const bg = ['per-row'];
// Longest run of such rows.
let best = 0, cur = 0, bestEnd = 0;
for (let y = 0; y < rows.length; y++) {
  if (rows[y]) { cur++; if (cur > best) { best = cur; bestEnd = y; } } else cur = 0;
}
console.log(`${file.split('/').pop().padEnd(28)} subject ${best}px of ${H}px first screen = ` +
            `${(best / H * 100).toFixed(1)}% of viewport height  (rows ${bestEnd - best + 1}-${bestEnd})`);
