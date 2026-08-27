#!/usr/bin/env node
/**
 * Icons and the web manifest.
 *
 * A menu is the thing a customer wants one tap away while they are standing
 * outside the shop, so "add to home screen" is worth supporting properly. That
 * needs square icons, and the logo is 1915x1788 — not square.
 *
 * brand.json logo.misuse forbids cropping, so the mark is never cut to fit. It is
 * placed whole, at its own proportions, on a cream field with clear space around
 * it — which is also exactly what logo.minimumSize.whenSmaller asks for when the
 * mark has to appear small: "use the official complete logo on a clean cream or
 * white area rather than removing its elements."
 *
 * Maskable icons get more padding, because the platform is allowed to crop a
 * maskable icon to a circle — so everything outside the safe area has to be field,
 * never mark.
 *
 * Run: node scripts/build-icons.mjs
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const REPO = path.resolve(SITE, '..');
const brand = JSON.parse(fs.readFileSync(path.join(REPO, 'brand/brand.json'), 'utf8'));
const ui = JSON.parse(fs.readFileSync(path.join(SITE, 'data/ui.json'), 'utf8'));
const LOGO = path.join(REPO, 'brand/logos/LS_Logo_Primary_v01.png');
const OUT = path.join(SITE, 'public/icons');
fs.mkdirSync(OUT, { recursive: true });

const cream = brand.color.palette.baseCream;
const field = { r: cream.rgb[0], g: cream.rgb[1], b: cream.rgb[2], alpha: 1 };

// The source PNG carries transparent margin, and it is not symmetrical — there is
// more empty space below the mark than above it. Centring the FILE therefore
// centres the wrong thing, and on a maskable icon, which the platform may crop to
// a circle, an off-centre mark is immediately visible. So trim to the ink first
// and centre that. Trimming transparent margin is not one of brand.json's six
// misuses: nothing of the mark is removed.
const inkBox = await (async () => {
  const img = sharp(LOGO).ensureAlpha();
  const { width, height } = await img.metadata();
  const a = await img.extractChannel('alpha').raw().toBuffer();
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      if (a[row + x] > 8) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
})();

/** The whole mark, uncropped, centred on its own ink, on a cream square. */
async function icon(size, inset) {
  const inner = Math.round(size * (1 - inset * 2));
  const mark = await sharp(LOGO).extract(inkBox).resize(inner, inner, { fit: 'inside' }).png().toBuffer();
  const m = await sharp(mark).metadata();
  return sharp({ create: { width: size, height: size, channels: 4, background: field } })
    .composite([{ input: mark, left: Math.round((size - m.width) / 2), top: Math.round((size - m.height) / 2) }])
    .png({ compressionLevel: 9 });
}

// Ordinary icons: a comfortable margin. Maskable: the safe area of a maskable
// icon is the middle 80%, and platforms may crop to a circle, so the mark sits
// well inside it.
const PLAIN = [32, 180, 192, 512];
const MASKABLE = [192, 512];
for (const s of PLAIN) await (await icon(s, 0.10)).toFile(path.join(OUT, `icon-${s}.png`));
for (const s of MASKABLE) await (await icon(s, 0.22)).toFile(path.join(OUT, `maskable-${s}.png`));
// A 32px favicon as .ico for browsers and bookmark bars that still want one.
await (await icon(32, 0.06)).toFile(path.join(OUT, 'favicon-32.png'));

for (const lang of ['es', 'en']) {
  const t = ui[lang];
  fs.writeFileSync(path.join(SITE, `public/manifest-${lang}.webmanifest`), JSON.stringify({
    name: brand.brand.name,
    short_name: brand.brand.wordmark,
    description: t.heroLead,
    lang,
    start_url: lang === 'es' ? '/' : '/en/',
    scope: '/',
    display: 'standalone',
    background_color: cream.hex,
    theme_color: brand.color.palette.hotPink.hex,
    icons: [
      ...PLAIN.filter((s) => s >= 180).map((s) => ({ src: `/icons/icon-${s}.png`, sizes: `${s}x${s}`, type: 'image/png', purpose: 'any' })),
      ...MASKABLE.map((s) => ({ src: `/icons/maskable-${s}.png`, sizes: `${s}x${s}`, type: 'image/png', purpose: 'maskable' })),
    ],
  }, null, 1));
}

const sizes = fs.readdirSync(OUT).map((f) => `${f} ${(fs.statSync(path.join(OUT, f)).size / 1024).toFixed(0)}kB`);
console.log(`icons: ${sizes.join(', ')}`);
console.log('manifests: public/manifest-es.webmanifest, public/manifest-en.webmanifest');
