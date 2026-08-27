#!/usr/bin/env node
/**
 * How much of its own tile does the food actually fill?
 *
 * Every critique of the grid so far has circled the same thing without a number
 * attached. This puts one on it, for us and for both benchmarks, measured the
 * same way: take a rectangle that is one product tile, find the tile's flat
 * background colour (the modal pixel), and count how many pixels differ from it.
 * That fraction is the product's share of its tile.
 *
 *   node scripts/fill-ratio.mjs <image.png> <x,y,w,h> [more rects...]
 *
 * Rectangles are in the image's own pixels.
 */
import sharp from 'sharp';

const [file, ...rects] = process.argv.slice(2);
if (!file || !rects.length) { console.error('usage: fill-ratio.mjs <img> <x,y,w,h> ...'); process.exit(1); }

for (const spec of rects) {
  const [x, y, w, h] = spec.split(',').map(Number);
  const { data, info } = await sharp(file)
    .extract({ left: x, top: y, width: w, height: h })
    .raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  // Modal colour, quantised to 8 levels per channel — the flat field.
  const bins = new Map();
  for (let i = 0; i < data.length; i += ch) {
    const k = ((data[i] >> 5) << 6) | ((data[i + 1] >> 5) << 3) | (data[i + 2] >> 5);
    bins.set(k, (bins.get(k) || 0) + 1);
  }
  const top = [...bins.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const bg = [((top >> 6) & 7) * 32 + 16, ((top >> 3) & 7) * 32 + 16, (top & 7) * 32 + 16];
  let differ = 0, total = 0;
  for (let i = 0; i < data.length; i += ch) {
    total++;
    const d = Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]);
    if (d > 60) differ++;
  }
  console.log(`${file.split('/').pop().padEnd(30)} ${spec.padEnd(22)} field rgb(${bg.join(',')})  product fills ${(differ / total * 100).toFixed(1)}%`);
}
