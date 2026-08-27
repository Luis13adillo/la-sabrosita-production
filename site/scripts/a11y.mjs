#!/usr/bin/env node
/**
 * Accessibility audit against what is actually PAINTED.
 *
 * The palette makes this necessary rather than optional: white on hot pink is
 * 4.06:1 and hot pink on cream is 3.85:1, so several perfectly reasonable-looking
 * choices are illegal at body size, and no one can eyeball that.
 *
 * Resolving "what colour is behind this text" by walking the DOM does not work
 * here — the hero's field is a sibling element, the card photo sits on a colour
 * panel, and half the surfaces are semi-transparent. So instead: hide the text,
 * photograph the rectangle it occupied, and average the pixels. That is the real
 * background, whatever produced it.
 *
 * WCAG AA: 4.5:1 for body text; 3:1 once text is 24px, or 18.66px and bold.
 *
 * Run: node scripts/a11y.mjs
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

const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };

const browser = await chromium.launch();
let total = 0;

for (const [label, url, vp] of [['es desktop', `http://localhost:${port}/`, { width: 1440, height: 900 }],
                                ['en desktop', `http://localhost:${port}/en/`, { width: 1440, height: 900 }],
                                ['es mobile', `http://localhost:${port}/`, { width: 390, height: 844 }]]) {
  // Animations OFF. This audit measures the settled page: with entrance and
  // scroll-driven animation running, an element can be sampled while it is still
  // moving, and the rectangle photographed is then partly the surface behind it.
  // That produced a false "white on hot pink" for a pill that is white on deep
  // purple at 13.6:1 — the average of the pill and the field it was still
  // crossing. A page's contrast is a property of where things come to rest.
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(async () => {
    const step = innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(700);
  console.log(`\n${label}`);

  // One representative per distinct (class, size, weight) — the same rule applied
  // 45 times over is one finding, not 45.
  const reps = await page.evaluate(() => {
    const out = [];
    const seen = new Set();
    let i = 0;
    for (const el of document.querySelectorAll('body *')) {
      const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
      if (!own) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      // Skip-links and other off-canvas affordances park themselves outside the
      // document until focused. Auditing them where they park measures whatever
      // they are parked behind, which is not a real state.
      if (r.y + scrollY + r.height < 0 || r.x + scrollX + r.width < 0) continue;
      // `opacity` is the quiet way a legal colour becomes an illegal one. White
      // on hot pink is 4.06 — legal for large text. Set opacity .88 on the same
      // element and the painted result is well under 3, and nothing in the
      // computed `color` says so, because opacity applies to the element after
      // it is painted. Multiply it through the whole ancestor chain.
      let groupAlpha = 1;
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        groupAlpha *= +getComputedStyle(n).opacity;
      }
      const cls = (el.className || el.tagName).toString().split(' ')[0];
      const key = `${cls}|${cs.fontSize}|${cs.fontWeight}`;
      if (seen.has(key)) continue;
      seen.add(key);
      el.setAttribute('data-a11y', String(i));
      out.push({ i, cls, key, text: own.slice(0, 38), color: cs.color, groupAlpha,
                 px: parseFloat(cs.fontSize), weight: +cs.fontWeight,
                 rect: { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height } });
      i++;
    }
    return out;
  });

  const findings = [];
  for (const rep of reps) {
    // Photograph the rectangle with only the GLYPHS removed — the element keeps
    // its own background, its border and its box. visibility:hidden would remove
    // the background too, and then a white label on a pink pill reads as white
    // on whatever is behind the pill, which is the wrong question.
    await page.evaluate((i) => {
      const el = document.querySelector(`[data-a11y="${i}"]`);
      el.style.setProperty('color', 'transparent', 'important');
      el.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
      el.style.setProperty('text-shadow', 'none', 'important');
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
    }, rep.i);
    // Settle before measuring. 40ms was not enough: the page has scroll-driven
    // animations, so an element keeps moving for a beat after scrollIntoView, and
    // a rect read too early samples whatever is passing through that rectangle —
    // which produced a run of false "white on hot pink" findings for text that
    // actually sits on cream.
    await page.waitForTimeout(280);
    const box = await page.evaluate((i) => {
      const r = document.querySelector(`[data-a11y="${i}"]`).getBoundingClientRect();
      return { x: Math.max(0, r.x), y: Math.max(0, r.y),
               width: Math.min(innerWidth - Math.max(0, r.x), r.width),
               height: Math.min(innerHeight - Math.max(0, r.y), r.height) };
    }, rep.i);
    let bg = null;
    if (box.width >= 2 && box.height >= 2) {
      const buf = await page.screenshot({ clip: { x: Math.round(box.x), y: Math.round(box.y),
                                                  width: Math.max(2, Math.round(box.width)),
                                                  height: Math.max(2, Math.round(box.height)) } });
      const st = await sharp(buf).stats();
      bg = [st.channels[0].mean, st.channels[1].mean, st.channels[2].mean];
    }
    await page.evaluate((i) => {
      const el = document.querySelector(`[data-a11y="${i}"]`);
      for (const p of ['color', '-webkit-text-fill-color', 'text-shadow']) el.style.removeProperty(p);
    }, rep.i);
    if (!bg) continue;

    const m = rep.color.match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/);
    if (!m) continue;
    // The colour's own alpha AND the element's opacity chain both dilute the ink
    // toward whatever is behind it. Either alone understates the problem.
    const a = (m[4] === undefined ? 1 : +m[4]) * (rep.groupAlpha ?? 1);
    const fg = [0, 1, 2].map((k) => +m[k + 1] * a + bg[k] * (1 - a));

    const large = rep.px >= 24 || (rep.weight >= 700 && rep.px >= 18.66);
    const need = large ? 3 : 4.5;
    const cr = ratio(fg, bg);
    if (cr + 0.01 < need) {
      findings.push({ ...rep, cr, need, bg });
      total++;
    }
  }

  if (!findings.length) console.log('  pass  contrast: every distinct text style meets AA');
  for (const f of findings) {
    console.log(`  FAIL  ${f.cr.toFixed(2)} (needs ${f.need})  .${f.cls}  ${f.px.toFixed(0)}px` +
                `${f.weight >= 700 ? ' bold' : ''}` +
                `${f.groupAlpha < 0.999 ? `  at opacity ${f.groupAlpha.toFixed(2)}` : ''}` +
                `  on rgb(${f.bg.map((v) => Math.round(v)).join(',')})  "${f.text}"`);
  }

  const struct = await page.evaluate(() => {
    const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => +h.tagName[1]);
    const jumps = [];
    for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1] + 1) jumps.push(`h${hs[i - 1]} -> h${hs[i]}`);
    const unnamed = [...document.querySelectorAll('button, a, input, [role="tab"]')].filter((e) => {
      const r = e.getBoundingClientRect();
      if (r.width < 2) return false;
      return !(e.textContent.trim() || e.getAttribute('aria-label') || e.getAttribute('title') ||
               (e.labels && e.labels.length) || e.querySelector('img[alt]:not([alt=""])'));
    }).map((e) => (e.className || e.tagName).toString().split(' ')[0]);
    return { jumps, h1s: document.querySelectorAll('h1').length, unnamed: [...new Set(unnamed)],
             landmarks: ['header', 'nav', 'main', 'footer'].filter((t) => !document.querySelector(t)) };
  });
  if (struct.h1s !== 1) { console.log(`  FAIL  ${struct.h1s} <h1>, expected exactly 1`); total++; }
  else console.log('  pass  exactly one <h1>');
  if (struct.jumps.length) { console.log(`  FAIL  heading level skipped: ${struct.jumps.join(', ')}`); total++; }
  else console.log('  pass  heading levels do not skip');
  if (struct.unnamed.length) { console.log(`  FAIL  controls with no accessible name: ${struct.unnamed.join(', ')}`); total++; }
  else console.log('  pass  every control has an accessible name');
  if (struct.landmarks.length) { console.log(`  FAIL  missing landmark: ${struct.landmarks.join(', ')}`); total++; }
  else console.log('  pass  header / nav / main / footer all present');

  await ctx.close();
}
await browser.close();
server.kill();
console.log(`\n${total === 0 ? 'clean' : total + ' finding(s)'}`);
process.exit(total ? 1 : 0);
