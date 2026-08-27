#!/usr/bin/env node
/**
 * The same page in three engines.
 *
 * motion.css drives its reveals with `animation-timeline: view()`, which Chrome
 * has and Firefox does not. That is the right technique — a scroll-driven reveal
 * has no "mid-flight" state to get caught in — but it has a cliff: if the rules
 * are not gated, a browser without scroll-driven animations shows a page of
 * invisible cards. This checks that the fallback is real, in the actual engines,
 * rather than trusting the @supports block to be written correctly.
 *
 * Run: node scripts/browsers.mjs
 */
import { spawn, execFileSync } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
execFileSync('node', [path.join(HERE, 'build-site.mjs')], { stdio: 'pipe' });
const port = await new Promise((res) => {
  const s = net.createServer();
  s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); });
});
const server = spawn('node', [path.join(HERE, 'serve.mjs')], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));

let fails = 0;
for (const [name, engine] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) {
  let browser;
  try { browser = await engine.launch(); }
  catch (e) { console.log(`  skip  ${name} — not installed (${String(e).slice(0, 60)})`); continue; }
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 90)));
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(async () => {
    const supports = CSS.supports('animation-timeline', 'view()');
    const h = document.body.scrollHeight;
    window.scrollTo({ top: Math.round((h - innerHeight) * 0.55), behavior: 'instant' });
    await new Promise((res) => setTimeout(res, 500));
    const vis = [...document.querySelectorAll('.card')].filter((c) => {
      const b = c.getBoundingClientRect(); return b.bottom > 0 && b.top < innerHeight;
    });
    return {
      supports,
      visible: vis.length,
      painted: vis.filter((c) => +getComputedStyle(c).opacity > 0.9).length,
      cards: document.querySelectorAll('.card').length,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  const ok = r.cards === 45 && r.visible > 0 && r.painted === r.visible && r.overflow <= 1 && !errors.length;
  if (!ok) fails++;
  console.log(`  ${ok ? 'pass' : 'FAIL'}  ${name.padEnd(9)} scroll-timeline ${r.supports ? 'yes' : 'no '} · ` +
              `${r.cards} cards · ${r.painted}/${r.visible} painted mid-page · overflow ${r.overflow}px` +
              (errors.length ? ` · errors: ${errors[0]}` : ''));
  await browser.close();
}
server.kill();
console.log(`\n${fails === 0 ? 'every engine renders the finished page' : fails + ' engine(s) failed'}`);
process.exit(fails ? 1 : 0);
