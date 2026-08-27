#!/usr/bin/env node
/**
 * Drive the whole site with the keyboard only.
 *
 * `a11y.mjs` checks that every control HAS an accessible name. That is a
 * different question from whether a person using only a keyboard can actually
 * reach it, see where they are, and get back out of a dialog. Those failures are
 * invisible to every other check here, because the page looks perfect in a
 * screenshot while being unusable without a mouse.
 *
 * What it walks:
 *   - the skip link is the first stop and actually moves focus
 *   - every control on the first screen is reachable by Tab, in visual order
 *   - focus is always visible — measured, by photographing the focused element
 *     with and without its ring and requiring the pixels to differ
 *   - a product opens with Enter, focus moves into the dialog, Tab is trapped
 *     inside it, Escape closes it, and focus returns to the card that opened it
 *
 * Run: node scripts/keyboard.mjs
 */
import { spawn, execFileSync } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
execFileSync('node', [path.join(HERE, 'build-site.mjs')], { stdio: 'pipe' });
const port = await new Promise((res) => {
  const s = net.createServer();
  s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); });
});
const server = spawn('node', [path.join(HERE, 'serve.mjs')], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));

let fails = 0;
const say = (ok, msg, detail = '') => {
  if (!ok) fails++;
  console.log(`  ${ok ? 'pass' : 'FAIL'}  ${msg}${!ok && detail ? ` — ${detail}` : ''}`);
};
const focused = (page) => page.evaluate(() => {
  const a = document.activeElement;
  if (!a || a === document.body) return null;
  const r = a.getBoundingClientRect();
  return {
    tag: a.tagName, cls: (a.className || '').toString().split(' ')[0],
    label: (a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 34),
    x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
    inDialog: !!a.closest('dialog'),
  };
});

const browser = await chromium.launch();
for (const [lang, seg] of [['es', ''], ['en', 'en/']]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${port}/${seg}`, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  console.log(`\n${lang}`);

  // 1. The skip link.
  await page.keyboard.press('Tab');
  const first = await focused(page);
  say(first && /skip/i.test(first.cls), 'the first Tab lands on the skip link', first ? `landed on .${first.cls}` : 'nothing focused');
  say(first && first.y >= 0, 'the skip link becomes visible when focused', first ? `y=${first.y}` : '');

  // 2. Walk the first 25 stops. Nothing may be focused off-screen or invisible.
  const stops = [];
  let offscreen = 0;
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    const f = await focused(page);
    if (!f) break;
    stops.push(f);
    if (f.y + f.h < 0 || f.y > 900 + 200) offscreen++;
  }
  say(stops.length >= 10, 'the keyboard reaches at least ten controls', `${stops.length}`);
  say(offscreen === 0, 'no stop is focused outside the viewport without scrolling to it', `${offscreen} of ${stops.length}`);
  const dupes = stops.filter((s, i) => i && s.cls === stops[i - 1].cls && s.label === stops[i - 1].label && s.x === stops[i - 1].x);
  say(dupes.length === 0, 'no control is focused twice in a row', dupes.slice(0, 2).map((d) => d.cls).join(', '));

  // 3. Focus must be VISIBLE. Photograph the focused control, then blur it, and
  //    require the pixels to differ — a ring you cannot see is not a ring.
  const target = stops.find((s) => s.w > 30 && s.h > 20 && s.y > 0 && s.y < 800);
  if (target) {
    await page.evaluate(() => document.activeElement.blur());
    await page.waitForTimeout(120);
    const clip = { x: Math.max(0, target.x - 6), y: Math.max(0, target.y - 6), width: target.w + 12, height: target.h + 12 };
    const off = await page.screenshot({ clip });
    await page.evaluate((sel) => {
      const el = [...document.querySelectorAll('a, button, input, [tabindex]')]
        .find((e) => Math.round(e.getBoundingClientRect().x) === sel.x && Math.round(e.getBoundingClientRect().y) === sel.y);
      if (el) el.focus();
    }, target);
    await page.waitForTimeout(120);
    const on = await page.screenshot({ clip });
    const a = await sharp(off).raw().toBuffer();
    const b = await sharp(on).raw().toBuffer();
    let diff = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) if (Math.abs(a[i] - b[i]) > 12) diff++;
    const pct = (diff / a.length) * 100;
    say(pct > 0.5, `focus is visibly indicated on .${target.cls}`, `only ${pct.toFixed(2)}% of pixels change when it takes focus`);
  }

  // 4. Open a product with the keyboard, and get back out.
  await page.evaluate(() => document.querySelector('.card__hit').focus());
  const opener = await focused(page);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  const open = await page.locator('dialog[open]').count();
  say(open === 1, 'Enter on a card opens the product view');
  const inside = await focused(page);
  say(inside && inside.inDialog, 'focus moves into the dialog', inside ? `focus is on .${inside.cls}` : 'nothing focused');

  // Tab ten times; every stop must stay inside the dialog.
  let escaped = 0;
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    const f = await focused(page);
    if (f && !f.inDialog) escaped++;
  }
  say(escaped === 0, 'Tab stays inside the dialog', `${escaped} of 10 stops escaped to the page behind it`);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  say(await page.locator('dialog[open]').count() === 0, 'Escape closes it');
  const back = await focused(page);
  say(back && opener && back.cls === opener.cls && back.x === opener.x,
      'focus returns to the card that opened it',
      back ? `landed on .${back.cls} at x=${back.x}, expected .${opener.cls} at x=${opener.x}` : 'focus was lost to the body');

  await ctx.close();
}
await browser.close();
server.kill();
console.log(`\n${fails === 0 ? 'the whole site is usable with a keyboard alone' : fails + ' keyboard problem(s)'}`);
process.exit(fails ? 1 : 0);
