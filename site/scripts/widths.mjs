#!/usr/bin/env node
/**
 * The page at every width somebody might actually use it at, plus 200% zoom.
 *
 * Everything so far has been judged at 1440 and 390. Those are the two the
 * benchmarks were captured at, so they are the fair comparison — but they are not
 * the only two a customer has. A layout built on container queries and clamps can
 * be perfect at both and broken at 820.
 *
 * 200% zoom is not an extra: WCAG 1.4.4 requires text to scale to 200% without
 * loss of content or function, and the usual way a site fails it is horizontal
 * scrolling. Emulated here as a 640px viewport at 2x, which is what a 1280px
 * screen zoomed to 200% actually is.
 *
 * Run: node scripts/widths.mjs
 */
import { spawn, execFileSync } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
execFileSync('node', [path.join(HERE, 'build-site.mjs')], { stdio: 'pipe' });
const port = await new Promise((res) => {
  const s = net.createServer();
  s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); });
});
const server = spawn('node', [path.join(HERE, 'serve.mjs')], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));

const CASES = [
  { label: '320  smallest phone still in use', w: 320, h: 720 },
  { label: '390  iPhone', w: 390, h: 844 },
  { label: '430  large phone', w: 430, h: 932 },
  { label: '640  = 1280 at 200% zoom (WCAG 1.4.4)', w: 640, h: 800 },
  { label: '768  tablet portrait', w: 768, h: 1024 },
  { label: '820  the awkward one', w: 820, h: 1180 },
  { label: '1024 tablet landscape', w: 1024, h: 768 },
  { label: '1280 small laptop', w: 1280, h: 800 },
  { label: '1440 the comparison width', w: 1440, h: 900 },
  { label: '1920 desktop', w: 1920, h: 1080 },
  { label: '2560 wide desktop', w: 2560, h: 1440 },
];

const browser = await chromium.launch();
let fails = 0;
const thumbs = [];

// Both languages. English is not a translation of the same length — "Savory
// Snacks" is 14 characters where "Antojitos" is 9, and a header that fits one
// can clip the other. Testing only Spanish tests half the site.
const LANGS = [['es', ''], ['en', 'en/']];

for (const c of CASES) for (const [lang, seg] of LANGS) {
  const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 70)));
  await page.goto(`http://localhost:${port}/${seg}`, { waitUntil: 'load' });
  await page.evaluate(async () => {
    const step = innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const doc = document.documentElement;
    // Anything sticking out past the right edge, named.
    const spill = [...document.querySelectorAll('body *')].filter((el) => {
      const b = el.getBoundingClientRect();
      return b.width > 0 && b.right > doc.clientWidth + 1 && getComputedStyle(el).position !== 'fixed';
    }).map((el) => `${(el.className || el.tagName).toString().split(' ')[0]} +${Math.round(el.getBoundingClientRect().right - doc.clientWidth)}px`);
    // Text that has been squeezed until it overflows its own box.
    const squeezed = [...document.querySelectorAll('.card__name, .card__desc, .nav__cat, .filter, .hero__title')]
      .filter((el) => el.scrollWidth > el.clientWidth + 2)
      .map((el) => (el.className || '').toString().split(' ')[0]);
    return {
      overflow: doc.scrollWidth - doc.clientWidth,
      cards: document.querySelectorAll('.card').length,
      spill: [...new Set(spill)].slice(0, 4),
      squeezed: [...new Set(squeezed)].slice(0, 4),
      cols: getComputedStyle(document.querySelector('.grid') || document.body).gridTemplateColumns.split(' ').length,
    };
  });

  const ok = r.overflow <= 1 && r.cards === 45 && !r.squeezed.length && !errors.length;
  if (!ok) fails++;
  const tag = `${c.label} [${lang}]`;
  // An element reaching past the right edge is only a fault if it actually
  // scrolls the document. A hero cut-out bleeding off the frame and a filter row
  // that scrolls horizontally are both supposed to do that, and are clipped by an
  // ancestor. Naming them on a passing run makes a clean report look broken.
  console.log(`  ${ok ? 'pass' : 'FAIL'}  ${tag.padEnd(43)} ${r.cards} cards, ${r.cols} col, overflow ${r.overflow}px` +
    (r.overflow > 1 && r.spill.length ? `\n            what is pushing it wide: ${r.spill.join(', ')}` : '') +
    (r.squeezed.length ? `\n            text overflowing its box: ${r.squeezed.join(', ')}` : '') +
    (errors.length ? `\n            errors: ${errors[0]}` : ''));

  // One thumbnail per width, from the Spanish pass, so the sheet stays readable.
  if (lang === 'es') {
    const shot = await page.screenshot();
    thumbs.push({ buf: await sharp(shot).resize({ width: 300, height: 420, fit: 'cover', position: 'top' }).png().toBuffer(), label: c.label.split(' ')[0] });
  }
  await ctx.close();
}
await browser.close();
server.kill();

// A contact sheet, so the widths can be looked at as well as asserted about.
const CW = 300, CH = 420, BAR = 26, GAP = 8;
const out = path.join(SITE, '.shots/lead-widths/sheet.png');
fs.mkdirSync(path.dirname(out), { recursive: true });
await sharp({ create: { width: (CW + GAP) * thumbs.length - GAP, height: CH + BAR, channels: 4, background: '#101014' } })
  .composite(thumbs.flatMap((t, i) => ([
    { input: t.buf, left: i * (CW + GAP), top: BAR },
    { input: Buffer.from(`<svg width="${CW}" height="${BAR}"><rect width="${CW}" height="${BAR}" fill="#101014"/>` +
      `<text x="${CW / 2}" y="${BAR - 8}" font-family="monospace" font-size="14" fill="#9aa4ab" text-anchor="middle">${t.label}</text></svg>`),
      left: i * (CW + GAP), top: 0 },
  ]))).png().toFile(out);

console.log(`\n  contact sheet: ${out}`);
console.log(`${fails === 0 ? `\nholds at every width, in both languages (${CASES.length * LANGS.length} combinations)` : `\n${fails} failing`}`);
process.exit(fails ? 1 : 0);
