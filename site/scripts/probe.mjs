#!/usr/bin/env node
/**
 * Run an arbitrary measuring expression against the built page.
 *
 * Every other script here answers one fixed question. This one exists because
 * the whole-site pass asks a different question every ten minutes — how tall is
 * the gap above the footer, what radius is each control drawing, which rows
 * share a baseline — and hand-rolling a server for each of them is how two
 * workers end up fighting over a port.
 *
 *   node scripts/probe.mjs <file.js> [--lang en] [--w 1440] [--h 900] [--scroll N]
 *
 * <file.js> is evaluated in the page and whatever it returns is printed as JSON.
 */
import { spawn, execFileSync } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i === -1 ? d : process.argv[i + 1]; };

const file = process.argv[2];
const lang = arg('lang', 'es');
const W = Number(arg('w', 1440)), H = Number(arg('h', 900));
const scroll = Number(arg('scroll', 0));
const openSlug = arg('open', null);
const build = !process.argv.includes('--no-build');

if (build) execFileSync('node', [path.join(HERE, 'build-site.mjs')], { stdio: 'pipe' });

const port = await new Promise((res) => {
  const s = net.createServer();
  s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); });
});
const server = spawn('node', [path.join(HERE, 'serve.mjs')], {
  env: { ...process.env, PORT: String(port), SERVE_ROOT: path.join(SITE, 'public') }, stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 600));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto(`http://localhost:${port}${lang === 'en' ? '/en/' : '/'}`, { waitUntil: 'networkidle' });
await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
if (openSlug) {
  const hit = page.locator(`.card[data-id="${openSlug}"] .card__hit`).first();
  await hit.scrollIntoViewIfNeeded({ timeout: 8000 });
  await hit.click({ timeout: 8000 });
  await page.waitForSelector('dialog[open]', { timeout: 8000 });
  await page.waitForTimeout(500);
}
if (scroll) { await page.evaluate((y) => window.scrollTo(0, y), scroll); await page.waitForTimeout(200); }
const src = fs.readFileSync(path.resolve(file), 'utf8');
// The file is an expression — an IIFE — so it is wrapped once and evaluated as
// one. Playwright treats a bare string as either a function body or an
// expression depending on how it parses, and wrapping removes the ambiguity.
const out = await page.evaluate(`(${src.trim()})`);
console.log(JSON.stringify(out, null, 2));
await browser.close();
server.kill();
