#!/usr/bin/env node
/**
 * Capture a page as a filmstrip: N frames taken while scrolling, tiled into one
 * image.
 *
 * A single screenshot cannot show motion, and it cannot show pacing either — how
 * a page hands you the next thing as you come down it. A filmstrip can. It is
 * also the only fair way to compare our scroll behaviour against a benchmark's,
 * because both get sampled at the same fractions of their own page height.
 *
 *   node scripts/filmstrip.mjs <url> <out.png> [--desktop|--mobile] [--frames 6]
 *                              [--motion]  (animations ON — the default is off)
 *                              [--settle 260]  ms to wait after each scroll
 *
 * --settle is the interesting knob. At 0 you photograph the page mid-animation,
 * which is exactly what a customer sees while flicking. At 800 everything has
 * landed. Run both and compare: a page whose mid-flight state looks broken has a
 * motion problem no still will ever show you.
 */
import { chromium, devices } from 'playwright';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';

const argv = process.argv.slice(2);
const url = argv[0];
const out = path.resolve(argv[1]);
const flag = (n, d) => { const i = argv.indexOf('--' + n); return i === -1 ? d : argv[i + 1]; };
const has = (n) => argv.includes('--' + n);

const mobile = has('mobile');
const W = Number(flag('w', mobile ? 390 : 1440));
const H = Number(flag('h', mobile ? 844 : 900));
const FRAMES = Number(flag('frames', 6));
const SETTLE = Number(flag('settle', 260));

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  isMobile: mobile, hasTouch: mobile,
  userAgent: mobile ? devices['iPhone 13'].userAgent : undefined,
  reducedMotion: has('motion') ? 'no-preference' : 'reduce',
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'load', timeout: 45000 });
await page.waitForTimeout(1800);
// One Shopify storefront on the benchmark list throws a newsletter takeover part
// way down the page, which lands in the middle of a filmstrip and blanks half of
// it. Dismiss before the run AND after every scroll.
async function dismiss() {
  try { await page.keyboard.press('Escape'); } catch {}
  for (const l of ['close', 'dismiss', 'no thanks', 'decline']) {
    try {
      const b = page.locator(`[aria-label*="${l}" i], button:has-text("${l}")`).first();
      if (await b.isVisible({ timeout: 200 })) await b.click({ timeout: 500 });
    } catch {}
  }
  await page.evaluate(() => {
    document.querySelectorAll('dialog[open]').forEach((d) => { try { d.close(); } catch {} d.remove(); });
    document.querySelectorAll('body *').forEach((el) => {
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      const covering = (s.position === 'fixed' || s.position === 'absolute') &&
        r.width > innerWidth * 0.5 && r.height > innerHeight * 0.4;
      if (covering && parseInt(s.zIndex, 10) > 900) el.remove();
      if (s.position === 'fixed' && /win free|enter to win|sign up and save|cookie|consent/i.test(el.textContent || '')
          && r.height > 40) el.remove();
    });
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  });
}
await dismiss();
await page.waitForTimeout(600);

const height = await page.evaluate(() => document.body.scrollHeight);
const span = Math.max(0, height - H);
const frames = [];
for (let i = 0; i < FRAMES; i++) {
  const y = Math.round((span * i) / Math.max(1, FRAMES - 1));
  await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
  await dismiss();
  await page.waitForTimeout(SETTLE);
  frames.push(await page.screenshot());
}
await browser.close();

// Tile them across, with the scroll fraction printed under each.
const GAP = 8, BAR = 26;
const strip = await sharp({ create: { width: (W + GAP) * FRAMES - GAP, height: H + BAR, channels: 4, background: '#101014' } })
  .composite(frames.flatMap((buf, i) => ([
    { input: buf, left: i * (W + GAP), top: 0 },
    { input: Buffer.from(`<svg width="${W}" height="${BAR}"><rect width="${W}" height="${BAR}" fill="#101014"/>` +
        `<text x="${W / 2}" y="${BAR - 8}" font-family="monospace" font-size="14" fill="#8a9299" text-anchor="middle">` +
        `${Math.round((i / Math.max(1, FRAMES - 1)) * 100)}%</text></svg>`), left: i * (W + GAP), top: H },
  ]))).png().toBuffer();

fs.mkdirSync(path.dirname(out), { recursive: true });
await sharp(strip).resize({ width: Math.min(4200, (W + GAP) * FRAMES) }).png().toFile(out);
console.log(`${out}  ${FRAMES} frames  ${W}x${H}  settle ${SETTLE}ms  motion ${has('motion') ? 'on' : 'off'}`);
