#!/usr/bin/env node
/**
 * How much of its own tile does the food fill — measured across every card,
 * automatically, and compared against the two benchmarks.
 *
 * Every critique of the grid circled this without a number on it. The method is
 * the same for all three sites: take the rectangle of one product tile, find the
 * tile's flat background colour (the modal pixel), and count the pixels that
 * differ from it. That fraction is the product's share of its tile.
 *
 * Measured on the benchmarks, at 1440x900, three tiles each:
 *
 *     michoacana.com      43.8%  50.0%  44.4%     median 44.4%
 *     heladosmexico.com   36.9%  36.8%  31.0%     median 36.8%
 *
 * Those are the numbers to beat. A cut-out that fills 16% of its card is a
 * sticker in a box, however nicely the box is drawn.
 *
 * Run: node scripts/fill-check.mjs
 */
import { spawn, execFileSync } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import fs from 'node:fs';
import sharp from 'sharp';

// The benchmark numbers are pixel-measured on flat, single-colour tiles, where
// separating product from field is reliable. Ours is computed exactly from the
// alpha channel of the master — opaque product pixels only.
//
// That asymmetry is worth naming: their figure includes the drop shadow and any
// glow around the packshot, ours does not. So the comparison is CONSERVATIVE in
// their favour, and a tie on these numbers means ours is actually ahead.
const BENCH = { michoacana: 44.4, heladosmexico: 36.8 };
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
execFileSync('node', [path.join(HERE, 'build-site.mjs')], { stdio: 'pipe' });
const port = await new Promise((res) => {
  const s = net.createServer();
  s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); });
});
const server = spawn('node', [path.join(HERE, 'serve.mjs')], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));

const browser = await chromium.launch();
for (const [label, vp] of [['desktop 1440', { width: 1440, height: 900 }], ['mobile 390', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'load' });
  await page.evaluate(async () => {
    const step = innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 70)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);

  // The coloured field of each card — whatever element actually holds the photo.
  const rects = await page.evaluate(() => {
    const out = [];
    for (const card of document.querySelectorAll('.card')) {
      const img = card.querySelector('img');
      if (!img) continue;
      // The tile the photo sits on. Ask for it by name first: the card names the
      // element deliberately, and guessing is what broke this measurement once
      // already — the colour moved from a `background-color` to a gradient in
      // `background-image`, the walk-up below stopped finding anything opaque,
      // and five products silently reported 1% ink because the whole card
      // including its cream panel was being measured instead of its field.
      let el = card.querySelector('.card__stage');
      if (!el) {
        let field = img.parentElement;
        while (field && field !== card) {
          const cs = getComputedStyle(field);
          const m = cs.backgroundColor.match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/);
          const opaqueColour = m && (m[4] === undefined || +m[4] > 0.5);
          const paintedImage = cs.backgroundImage && cs.backgroundImage !== 'none';
          if (opaqueColour || paintedImage) break;
          field = field.parentElement;
        }
        el = field && field !== card ? field : (card.querySelector('.card__photo, .card__frame') || card);
      }
      const r = el.getBoundingClientRect();
      if (r.width < 20 || r.height < 20) continue;
      // How much of the photograph is outside the tile it sits on. Filling more
      // of the tile and cropping the food are the same lever pulled too far, so
      // the two numbers have to be read together.
      const ir = img.getBoundingClientRect();
      const over = {
        top: Math.max(0, r.y - ir.y), bottom: Math.max(0, ir.bottom - r.bottom),
        left: Math.max(0, r.x - ir.x), right: Math.max(0, ir.right - r.right),
      };
      // The photo is a square canvas with the product inside it, so only the part
      // of the overflow that contains actual product counts as a crop.
      const pad = (1 - (+img.dataset.fillh || 0.8929)) / 2;
      const inkTop = ir.height * pad, inkBottom = ir.height * pad;
      const cropTop = Math.max(0, over.top - inkTop);
      const cropBottom = Math.max(0, over.bottom - inkBottom);
      const productH = ir.height * (+img.dataset.fillh || 0.8929);
      out.push({ name: (card.querySelector('.card__name') || {}).textContent || '',
                 stem: (img.currentSrc || img.src).split('/').pop().replace(/-\d+\.webp$/, ''),
                 imgW: ir.width, imgH: ir.height,
                 imgX: ir.x + scrollX, imgY: ir.y + scrollY,
                 cropPct: productH > 0 ? ((cropTop + cropBottom) / productH) * 100 : 0,
                 x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height });
    }
    return out;
  });

  // Ours is computed, not segmented.
  //
  // Estimating "how much of this tile is product" from a rendered screenshot means
  // separating food from field, and this tile's field is a GRADIENT. Two estimators
  // were tried and both broke at the ends that matter: the most-common-colour
  // version reported the single biggest photograph on the page as 1% food, because
  // once a product fills its tile the product IS the most common colour; the
  // four-corner version reported 100% for tiles whose corner colours differ from
  // each other, which on a gradient is all of them.
  //
  // The alpha channel of every master was already measured when the derivatives
  // were built — `ink` in data/images.json is the true opaque fraction of each
  // square canvas. Multiplied by the rendered area of the image and divided by the
  // rendered area of the tile, that is the same quantity, exactly, with nothing to
  // segment. The benchmark numbers stay pixel-measured because their tiles are flat
  // colour, where segmenting is reliable — and because their images are not ours to
  // measure any other way.
  const imgs = JSON.parse(fs.readFileSync(path.join(SITE, 'data/images.json'), 'utf8')).images;
  const results = rects.map((r) => {
    const ink = imgs[r.stem] ? imgs[r.stem].ink : null;
    if (ink === null) return null;
    // Food that bleeds outside the tile is not filling the tile — several cards
    // let the photograph overflow on purpose, the 2x2 feature running 866px wide
    // in a 604px tile. But clipping against the whole IMAGE is wrong: a cut-out
    // sits in the middle of a square canvas with transparent margin around it, so
    // the part hanging outside is mostly empty. Clip against the PRODUCT's own
    // box instead, which data/images.json gives as fillW / fillH.
    //
    // The remaining assumption — ink spread evenly inside that box — is the last
    // approximation in this measurement, and it is a small one.
    const g = imgs[r.stem];
    const pw = (g.fillW ?? 0.8929) * r.imgW;
    const ph = (g.fillH ?? 0.8929) * r.imgH;
    const px = r.imgX + (r.imgW - pw) / 2;
    const py = r.imgY + (r.imgH - ph) / 2;
    const ox = Math.max(0, Math.min(px + pw, r.x + r.w) - Math.max(px, r.x));
    const oy = Math.max(0, Math.min(py + ph, r.y + r.h) - Math.max(py, r.y));
    const density = (ink * r.imgW * r.imgH) / (pw * ph);
    const productArea = density * ox * oy;
    return { name: r.name.trim(), pct: (productArea / (r.w * r.h)) * 100, cropPct: r.cropPct };
  }).filter(Boolean);

  results.sort((a, b) => a.pct - b.pct);
  const median = results[Math.floor(results.length / 2)];
  console.log(`\n${label} — ${results.length} cards measured`);
  console.log(`  median             ${median.pct.toFixed(1)}%`);
  console.log(`  worst five         ${results.slice(0, 5).map((r) => `${r.name} ${r.pct.toFixed(0)}%`).join(', ')}`);
  console.log(`  best three         ${results.slice(-3).reverse().map((r) => `${r.name} ${r.pct.toFixed(0)}%`).join(', ')}`);
  // The median says how appetising the grid is on average. The SPREAD says
  // whether it reads as one set of photographs — a row where one tile is four
  // times fuller than its neighbour looks like a mistake, however good the
  // median is. This is the number `visualScale` exists to hold down.
  const lo = results[0].pct, hi = results[results.length - 1].pct;
  const ratio = hi / lo;
  console.log(`  spread             ${lo.toFixed(0)}% to ${hi.toFixed(0)}% — ${ratio.toFixed(1)}x` +
    (ratio > 2.5 ? '  ← a row can hold two tiles this far apart' : ''));
  console.log(`  michoacana         ${BENCH.michoacana}%   ${median.pct >= BENCH.michoacana ? 'we beat it' : `we are ${(BENCH.michoacana - median.pct).toFixed(1)} points behind`}`);
  console.log(`  heladosmexico      ${BENCH.heladosmexico}%   ${median.pct >= BENCH.heladosmexico ? 'we beat it' : `we are ${(BENCH.heladosmexico - median.pct).toFixed(1)} points behind`}`);
  // The counterweight. Filling the tile and cropping the food are the same lever.
  const cropped = results.filter((r) => r.cropPct > 2).sort((a, b) => b.cropPct - a.cropPct);
  if (!cropped.length) console.log('  cropped            none — no product loses any of itself to the tile edge');
  else console.log(`  cropped            ${cropped.length} of ${results.length} products lose part of themselves` +
    `\n                     ${cropped.slice(0, 6).map((r) => `${r.name} ${r.cropPct.toFixed(0)}%`).join(', ')}`);
  await ctx.close();
}
await browser.close();
server.kill();
