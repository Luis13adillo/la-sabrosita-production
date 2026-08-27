#!/usr/bin/env node
/**
 * Build the site, serve it on a free port, screenshot it, shut down.
 *
 * This is how every builder and every critic looks at the site. It exists so that
 * two people working at the same time cannot fight over a port or over a
 * half-written public/ directory, and so that every screenshot in this project is
 * taken at exactly the same viewport as every other one.
 *
 *   node scripts/verify.mjs --out .shots/hero-v3
 *   node scripts/verify.mjs --out .shots/x --only desktop
 *   node scripts/verify.mjs --out .shots/x --scroll 1400        (both viewports)
 *   node scripts/verify.mjs --out .shots/x --lang en
 *   node scripts/verify.mjs --out .shots/x --open churros    (the DETAIL view)
 *
 * Writes <out>/desktop.png, <out>/mobile.png, and <out>/full-desktop.png.
 *
 * `--open <slug>` makes desktop.png and mobile.png pictures of that product's
 * detail view instead of the home page. It matters which FILE carries them:
 * every critic in this project is handed `<out>/desktop.png`, so a detail round
 * whose dialog frames were written beside that name under some other name was
 * judged on the home page — twice — and placed last both times on a photograph
 * of the wrong thing. If a piece can be captured, it must be captured by the
 * name the harness reads.
 */
import { spawn, execFileSync } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i === -1 ? d : process.argv[i + 1]; };
const has = (n) => process.argv.includes('--' + n);

const out = path.resolve(SITE, arg('out', '.shots/latest'));
const only = arg('only', 'both');
const lang = arg('lang', 'es');
const scroll = arg('scroll', null);
const openSlug = arg('open', null);
// Every screenshot in this project is taken with animations OFF by default, so
// that two shots of the same page are comparable. Pass --motion when the thing
// you are judging IS the motion.
const motion = has('motion') || has('strip') ? ['--motion'] : [];
const LOCK = path.join(SITE, '.build.lock');

// --- build, one at a time -------------------------------------------------
for (let i = 0; i < 200; i++) {
  try { fs.writeFileSync(LOCK, String(process.pid), { flag: 'wx' }); break; }
  catch { await new Promise((r) => setTimeout(r, 250)); }
  if (i === 199) { try { fs.unlinkSync(LOCK); } catch {} }
}
// Build, then take a private copy of the result. Everything after this point
// reads the snapshot, so another worker rebuilding public/ mid-run cannot change
// what this screenshot shows.
const snap = path.join(SITE, '.snap', path.basename(out));
try {
  execFileSync('node', [path.join(HERE, 'build-tokens.mjs')], { stdio: 'pipe' });
  execFileSync('node', [path.join(HERE, 'build-site.mjs')], { stdio: 'inherit' });
  fs.rmSync(snap, { recursive: true, force: true });
  fs.cpSync(path.join(SITE, 'public'), snap, { recursive: true });
} finally {
  try { fs.unlinkSync(LOCK); } catch {}
}

const port = await new Promise((res) => {
  const s = net.createServer();
  s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); });
});
const server = spawn('node', [path.join(HERE, 'serve.mjs')], {
  env: { ...process.env, PORT: String(port), SERVE_ROOT: snap }, stdio: 'ignore', detached: false,
});
await new Promise((r) => setTimeout(r, 700));

fs.mkdirSync(out, { recursive: true });
const url = `http://localhost:${port}${lang === 'en' ? '/en/' : '/'}`;
const shot = (file, flags) =>
  execFileSync('node', [path.join(HERE, 'shot.mjs'), url, path.join(out, file), ...flags],
               { stdio: 'inherit' });

try {
  // --strip writes a six-frame filmstrip photographed 120ms after each scroll
  // jump, with animations on. It is the only way to see what a customer sees
  // while flicking, and it lives here so nobody has to spawn their own server.
  if (has('strip')) {
    const strip = (file, flags) =>
      execFileSync('node', [path.join(HERE, 'filmstrip.mjs'), url, path.join(out, file),
                            '--frames', '6', '--settle', '120', '--motion', ...flags],
                   { stdio: 'inherit' });
    if (only !== 'mobile') strip('strip-desktop.png', ['--desktop']);
    if (only !== 'desktop') strip('strip-mobile.png', ['--mobile']);
  }
  const extra = [...(scroll ? ['--scroll', scroll] : []),
                 ...(openSlug ? ['--open', openSlug] : []), ...motion];
  // A full-page shot of an open dialog is a picture of the page scrolling behind
  // a fixed overlay, which is nothing anybody wants to look at.
  const wholePage = !scroll && !openSlug;
  if (only !== 'mobile') {
    shot('desktop.png', ['--desktop', '--wait', '1600', ...extra]);
    if (wholePage) shot('full-desktop.png', ['--desktop', '--full', '--wait', '1600']);
  }
  if (only !== 'desktop') {
    shot('mobile.png', ['--mobile', '--wait', '1600', ...extra]);
    if (wholePage) shot('full-mobile.png', ['--mobile', '--full', '--wait', '1600']);
  }
} finally {
  server.kill();
  fs.rmSync(snap, { recursive: true, force: true });
}
console.log(`\nscreenshots in ${out}`);
