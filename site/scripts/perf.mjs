#!/usr/bin/env node
/**
 * Weight and timing. Nobody's design piece owns this either.
 *
 * 45 products and 62 photographs is a lot of picture for one page, and the whole
 * value of the site is that a customer standing outside the shop on a phone can
 * see all of it. So: what does the first screen actually cost, what does the
 * whole page cost, and how long until the biggest thing on screen has painted.
 *
 * Run: node scripts/perf.mjs
 */
import { spawn, execFileSync } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
execFileSync('node', [path.join(HERE, 'build-site.mjs')], { stdio: 'pipe' });
const port = await new Promise((res) => {
  const s = net.createServer();
  s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); });
});
const server = spawn('node', [path.join(HERE, 'serve.mjs')], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));

const browser = await chromium.launch();
const kb = (n) => `${(n / 1024).toFixed(0)} kB`;

// Localhost is not a connection. A customer standing outside the shop is on
// mobile data, and the whole promise of this site is that they can see the menu
// before they walk in — so the number that matters is how long the first screen
// takes on a real network, not on a loopback.
//
// The profile is a conservative 4G: 3 Mbit down, 40ms round trip. Chrome's own
// "Slow 4G" preset is 1.6 Mbit / 150ms; this sits between that and good LTE.
const THROTTLE = { downloadThroughput: (3 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8, latency: 40 };

for (const [label, vp, mobile, slow] of [['desktop 1440', { width: 1440, height: 900 }, false, false],
                                          ['mobile  390', { width: 390, height: 844 }, true, false],
                                          ['mobile  390 on 4G', { width: 390, height: 844 }, true, true]]) {
  const ctx = await browser.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 3 : 2 });
  const page = await ctx.newPage();
  if (slow) {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, ...THROTTLE });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });   // a mid-range phone
  }
  const seen = new Map();
  page.on('response', async (r) => {
    try {
      const h = await r.allHeaders();
      // Never read the body just to size it. Reading bodies serialises the load
      // and distorts the very timings this script exists to measure.
      const len = Number(h['content-length'] || 0);
      seen.set(r.url(), { len, type: (h['content-type'] || '').split(';')[0] });
    } catch {}
  });

  const t0 = Date.now();
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'load' });
  const loadMs = Date.now() - t0;
  await page.waitForTimeout(slow ? 3500 : 1500);

  const firstScreen = [...seen.values()].reduce((n, v) => n + v.len, 0);
  // Layout shift. A menu built from lazy images and a webfont is exactly the
  // shape of page that shifts under the reader's thumb: a card grows when its
  // photograph decodes, a name reflows when the font swaps, and the thing they
  // were about to tap moves. Chrome's "good" threshold is 0.1.
  const cls = await page.evaluate(() => new Promise((res) => {
    let total = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) total += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => res(Math.round(total * 1000) / 1000), 400);
  }));

  const lcp = await page.evaluate(() => new Promise((res) => {
    let v = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) v = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    setTimeout(() => res(Math.round(v)), 400);
  }));
  const imgsFirst = [...seen.values()].filter((v) => v.type.startsWith('image')).length;

  // Now walk the whole page so every lazy image loads.
  await page.evaluate(async () => {
    const step = innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 110)); }
  });
  await page.waitForTimeout(1200);
  const total = [...seen.values()].reduce((n, v) => n + v.len, 0);
  const imgs = [...seen.values()].filter((v) => v.type.startsWith('image'));

  console.log(`${label}`);
  console.log(`  first screen      ${kb(firstScreen).padStart(9)}   (${imgsFirst} images)`);
  console.log(`  whole page        ${kb(total).padStart(9)}   (${imgs.length} images, ${kb(imgs.reduce((n, v) => n + v.len, 0))} of it picture)`);
  console.log(`  LCP               ${String(lcp).padStart(6)} ms${slow ? '   (3 Mbit, 40ms RTT, 4x CPU)' : ''}`);
  console.log(`  load event        ${String(loadMs).padStart(6)} ms`);
  console.log(`  layout shift      ${String(cls).padStart(6)}      ${cls <= 0.1 ? 'good' : cls <= 0.25 ? 'needs work' : 'poor'}  (Chrome: good is <= 0.1)`);
  const biggest = [...seen.entries()].sort((a, b) => b[1].len - a[1].len).slice(0, 3);
  console.log(`  heaviest          ${biggest.map(([u, v]) => `${u.split('/').pop().slice(0, 34)} ${kb(v.len)}`).join('\n                    ')}`);
  await ctx.close();
}
await browser.close();
server.kill();
