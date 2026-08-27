#!/usr/bin/env node
/**
 * Check the rendered page against brand.json's own logo rules.
 *
 * These are not style opinions — they are the six misuses the guidelines list by
 * name, plus the minimum size and the background rule. They are easy to break by
 * accident (a header shrinks the mark to 44px; a hover adds a shadow; a rounded
 * container clips a corner) and impossible to catch by reading CSS, because what
 * matters is what the browser actually painted.
 *
 * The rules, read straight out of brand.json:
 *   - minimumSize.digitalMinWidthPx: 250 — "avoid reducing the full logo below
 *     250 px wide" — with the guidelines' own escape hatch: "When the logo must
 *     appear small, use the official complete logo on a clean cream or white
 *     area rather than removing its elements."
 *   - approvedBackgrounds: cream, white, pink, purple, black — "Always select a
 *     background that provides enough contrast for the complete mark."
 *   - misuse: do not stretch, recolor, rotate, add effects, crop, or place on
 *     clutter.
 *
 * Run: node scripts/brand-check.mjs
 */
import { spawn, execFileSync } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const REPO = path.resolve(SITE, '..');
const brand = JSON.parse(fs.readFileSync(path.join(REPO, 'brand/brand.json'), 'utf8'));
const MIN = brand.logo.minimumSize.digitalMinWidthPx;
const NATIVE = brand.logo.primary.width / brand.logo.primary.height;

execFileSync('node', [path.join(HERE, 'build-site.mjs')], { stdio: 'pipe' });
const port = await new Promise((res) => {
  const s = net.createServer();
  s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); });
});
const server = spawn('node', [path.join(HERE, 'serve.mjs')], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));

// Cream and white are the two "clean" fields the small-logo escape hatch names.
const cream = brand.color.palette.baseCream.rgb;
const isClean = ([r, g, b]) =>
  (Math.abs(r - cream[0]) + Math.abs(g - cream[1]) + Math.abs(b - cream[2]) < 40) ||
  (r > 244 && g > 244 && b > 244);

const browser = await chromium.launch();
let fails = 0;
const say = (ok, msg, detail = '') => {
  if (!ok) fails++;
  // Detail explains a failure. Printing it next to a pass makes a clean report
  // read as if everything is broken.
  console.log(`  ${ok ? 'pass' : 'FAIL'}  ${msg}${!ok && detail ? ` — ${detail}` : ''}`);
};

for (const [label, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'load' });
  await page.evaluate(async () => {
    const step = innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);
  console.log(`\n${label}`);

  const marks = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('img').forEach((img, i) => {
      const src = img.currentSrc || img.src;
      if (!/\/brand\/logo/.test(src)) return;
      const cs = getComputedStyle(img);
      const r = img.getBoundingClientRect();
      img.dataset.brandMark = String(i);
      // Anything on the way up that clips is a crop risk.
      let clipper = null;
      let n = img.parentElement;
      while (n && n !== document.body) {
        const s = getComputedStyle(n);
        if (s.overflow !== 'visible' && s.overflowX !== 'visible') { clipper = n.className || n.tagName; break; }
        n = n.parentElement;
      }
      out.push({
        i, where: (img.className || img.parentElement.className || 'img').toString().split(' ')[0],
        w: r.width, h: r.height, x: r.x, y: r.y,
        filter: cs.filter, transform: cs.transform, rotate: cs.rotate, mixBlend: cs.mixBlendMode,
        clipper,
      });
    });
    return out;
  });

  say(marks.length > 0, `the logo appears on the page`, `${marks.length} placement(s)`);

  for (const m of marks) {
    // Bring the mark into view before judging it. A logo in the footer is not
    // "cropped" because it happens to be below the fold — that is the difference
    // between a real crop and a scroll position, and conflating the two turns a
    // perfectly correct footer into a brand violation.
    await page.evaluate((i) => {
      document.querySelector(`[data-brand-mark="${i}"]`)
        .scrollIntoView({ block: 'center', behavior: 'instant' });
    }, m.i);
    await page.waitForTimeout(220);
    const live = await page.evaluate((i) => {
      const r = document.querySelector(`[data-brand-mark="${i}"]`).getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }, m.i);
    Object.assign(m, live);

    const tag = `${m.where} ${Math.round(m.w)}x${Math.round(m.h)}px`;

    // Not stretched.
    const aspect = m.w / m.h;
    say(Math.abs(aspect - NATIVE) / NATIVE < 0.02, `${tag}: proportions preserved`,
        `rendered ${aspect.toFixed(3)} vs native ${NATIVE.toFixed(3)}`);

    // No effects, no rotation.
    say(m.filter === 'none', `${tag}: no filter effects`, m.filter);
    const rotated = m.rotate && m.rotate !== 'none' ||
      (m.transform !== 'none' && !/^matrix\(1, 0, 0, 1/.test(m.transform));
    say(!rotated, `${tag}: not rotated or skewed`, `${m.transform} ${m.rotate}`);
    say(m.mixBlend === 'normal', `${tag}: not recoloured by a blend mode`, m.mixBlend);

    // Not cropped: photograph the box the mark occupies and check its edges are
    // background rather than ink running off.
    const clip = {
      x: Math.max(0, Math.round(m.x)), y: Math.max(0, Math.round(m.y)),
      width: Math.max(2, Math.round(Math.min(m.w, vp.width - Math.max(0, m.x)))),
      height: Math.max(2, Math.round(Math.min(m.h, vp.height - Math.max(0, m.y)))),
    };
    const visible = clip.width >= m.w - 1 && clip.height >= m.h - 1;
    say(visible && !m.clipper, `${tag}: not cropped`,
        m.clipper
          ? `clipped by .${m.clipper}`
          : `only ${Math.round(clip.width)}x${Math.round(clip.height)} of ` +
            `${Math.round(m.w)}x${Math.round(m.h)} is on screen`);

    // Size, or the guidelines' own escape hatch for a small mark.
    if (m.w >= MIN) {
      say(true, `${tag}: at or above the ${MIN}px digital minimum`);
    } else {
      // The field the mark actually SITS ON, which is not the same as the field
      // around it. A small mark placed on a cream pill is compliant even though
      // the bar behind the pill is hot pink — so sampling a ring outside the mark
      // reports the bar and fails a correct header.
      //
      // The logo is a badge with transparent corners, so the corners of its own
      // bounding box show whatever is directly behind it. Sample those.
      const box = {
        x: Math.max(0, Math.round(m.x)), y: Math.max(0, Math.round(m.y)),
        width: Math.max(2, Math.round(Math.min(m.w, vp.width - Math.max(0, m.x)))),
        height: Math.max(2, Math.round(Math.min(m.h, vp.height - Math.max(0, m.y)))),
      };
      const buf = await page.screenshot({ clip: box });
      const sharp = (await import('sharp')).default;
      const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
      const ch = info.channels;
      const cw = Math.max(2, Math.round(info.width * 0.14));
      const chh = Math.max(2, Math.round(info.height * 0.14));
      // Each corner separately, so the report can say WHICH edge of the mark has
      // slipped off its clean field rather than averaging the answer away.
      const corners = [
        ['top-left', 0, 0], ['top-right', info.width - cw, 0],
        ['bottom-left', 0, info.height - chh], ['bottom-right', info.width - cw, info.height - chh],
      ].map(([name, ox, oy]) => {
        let r = 0, g = 0, b = 0, n = 0;
        for (let y = oy; y < oy + chh; y++) {
          for (let x = ox; x < ox + cw; x++) {
            const i = (y * info.width + x) * ch;
            r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
          }
        }
        return { name, rgb: [r / n, g / n, b / n].map(Math.round) };
      });
      const off = corners.filter((c) => !isClean(c.rgb));
      // Build the explanation only when there is something to explain. `say`
      // decides whether to PRINT the detail, but the argument is evaluated either
      // way — so referencing off[0] unconditionally crashed the check at the exact
      // moment it was about to report a pass.
      const why = off.length === 0 ? ''
        : off.length === 4
          ? `it is on rgb(${off[0].rgb.join(',')}) — brand.json logo.minimumSize.whenSmaller`
          : `${off.map((c) => c.name).join(' and ')} of the mark ${off.length > 1 ? 'hang' : 'hangs'} off ` +
            `its clean field onto rgb(${off[0].rgb.join(',')}) — the field does not cover the whole mark`;
      /* THE CLIENT MAY WAIVE THIS, AND HAS — for the header only.
         brand.json records the waiver under logo.minimumSize._clientException,
         with who decided it and when. Honouring the record here rather than
         deleting the check keeps the rule live everywhere else: the footer mark
         is still held to it, and so is any small mark added later. A gate that
         is switched off protects nothing; a gate that reads the client's own
         recorded decision still does. */
      const waiver = brand.logo.minimumSize._clientException;
      const waived = waiver && /header/i.test(waiver.scope || '') && /^hdr__/.test(m.where);
      if (waived) {
        say(true, `${tag}: below ${MIN}px on ${label} — waived by the client 2026-08-26 (header only), see brand.json logo.minimumSize._clientException`);
      } else {
        say(off.length === 0, `${tag}: below ${MIN}px, so it must sit on a clean cream or white area`, why);
      }
    }
  }
  await ctx.close();
}
await browser.close();
server.kill();
console.log(`\n${fails === 0 ? 'the logo is used the way brand.json says it must be' : fails + ' brand rule violation(s)'}`);
process.exit(fails ? 1 : 0);
