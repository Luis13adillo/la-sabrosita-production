#!/usr/bin/env node
/**
 * Generate the social share card (1200x630) into site/public/social.png.
 *
 * Brand rules that shape this file: the logo is placed whole on an approved
 * field (brand.json logo.approvedBackgrounds includes pink), never recoloured,
 * cropped, stretched or given effects, and it keeps clear space around it. The
 * pink comes from brand.json, like everywhere else.
 *
 * Run: node scripts/build-social.mjs
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const REPO = path.resolve(SITE, '..');
const brand = JSON.parse(fs.readFileSync(path.join(REPO, 'brand/brand.json'), 'utf8'));
const menu = JSON.parse(fs.readFileSync(path.join(SITE, 'data/menu.json'), 'utf8'));

const W = 1200, H = 630;
const pink = brand.color.palette.hotPink.hex;

// A row of cut-outs along the bottom, tall products first so the silhouette
// reads. Nothing here is a claim about the menu — it is a picture of the food.
const picks = ['crazy-shake', 'churros', 'mango-en-flor', 'fresas-con-crema', 'raspado', 'elote']
  .map((id) => menu.items.find((i) => i.id === id))
  .filter(Boolean);

const comps = [];
const slot = Math.round(W / picks.length);
for (let i = 0; i < picks.length; i++) {
  const stem = picks[i].images[0].stem;
  const size = Math.round(slot * 1.06);
  const buf = await sharp(path.join(SITE, `public/img/${stem}-800.webp`))
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toBuffer();
  comps.push({ input: buf, left: Math.round(i * slot - (size - slot) / 2), top: H - Math.round(size * 0.80) });
}

// Logo, whole, with clear space, upper left.
const logoW = 250;   // brand.json logo.minimumSize.digitalMinWidthPx is 250
const logo = await sharp(path.join(REPO, brand.logo.primary.file.replace(/^/, 'brand/')))
  .resize({ width: logoW }).png().toBuffer();
comps.push({ input: logo, left: 64, top: 48 });

const line1 = 'Todo el menú, en una sola página.';
const line2 = `${menu.counts.products} productos · Swedesboro, New Jersey`;
const text = Buffer.from(`<svg width="${W}" height="${H}">
  <style>
    .a { font-family: 'Noto Sans', Helvetica, Arial, sans-serif; font-weight: 800; font-size: 62px; fill: #fff; letter-spacing: -2px; }
    .b { font-family: 'Noto Sans', Helvetica, Arial, sans-serif; font-weight: 700; font-size: 24px; fill: #fff; opacity: .88; letter-spacing: 1.4px; }
  </style>
  <text class="a" x="64" y="330">${line1.split(', ')[0]},</text>
  <text class="a" x="64" y="400">${line1.split(', ')[1]}</text>
  <text class="b" x="64" y="452">${line2.toUpperCase()}</text>
</svg>`);
comps.push({ input: text, left: 0, top: 0 });

await sharp({ create: { width: W, height: H, channels: 4, background: pink } })
  .composite(comps).png().toFile(path.join(SITE, 'public/social.png'));
console.log('public/social.png written');
