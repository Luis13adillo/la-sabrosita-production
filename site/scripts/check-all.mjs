#!/usr/bin/env node
/**
 * Run every gate and report all of them, rather than stopping at the first.
 *
 * `npm run smoke && npm run a11y && ...` hides the a11y result the moment smoke
 * fails, which is exactly backwards: when something is broken you want the whole
 * picture, not the first line of it.
 *
 * Run: node scripts/check-all.mjs   (npm run check)
 */
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GATES = [
  ['functional', 'smoke.mjs', 'images decode, copy is approved, no prices, search, dialog, tap targets, scroll reveal'],
  ['accessibility', 'a11y.mjs', 'contrast against painted pixels, heading order, landmarks, accessible names'],
  ['disclosure', 'check-invented.mjs', 'every invented value appears in INVENTED.md; no hardcoded colour or font'],
  ['keyboard', 'keyboard.mjs', 'the whole site driven by keyboard alone: skip link, tab order, a visible focus ring, dialog trap and focus return'],
  ['widths', 'widths.mjs', 'eleven viewport widths from 320 to 2560, including 200% zoom'],
  ['brand', 'brand-check.mjs', "the rendered logo against brand.json's own six misuses, minimum size and background rule"],
  ['engines', 'browsers.mjs', 'the real page in Chromium, Firefox and WebKit'],
  ['media', 'assets-untouched.mjs', "the client's approved media is byte-identical: git, the PDF's recorded hash, and a manifest of all 62 masters"],
];

// Build once, here, so the gates do not each rebuild public/ and race each other.
execFileSync('node', [path.join(HERE, 'build-tokens.mjs')], { stdio: 'pipe' });
execFileSync('node', [path.join(HERE, 'build-site.mjs')], { stdio: 'pipe' });

// The gates are independent — each spawns its own server on its own free port —
// so run them at once. Serially this suite takes about three and a half minutes,
// which is long enough that people stop running it.
const started = Date.now();
const results = await Promise.all(GATES.map(async ([name, script, what]) => {
  try {
    const { stdout, stderr } = await run('node', [path.join(HERE, script)], { maxBuffer: 1 << 24 });
    return { name, what, ok: true, fails: [], out: stdout + stderr };
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '');
    return { name, what, ok: false, out, fails: out.split('\n').filter((l) => /^\s*FAIL/.test(l)) };
  }
}));

console.log('');
for (const r of results) {
  console.log(`${r.ok ? '  pass' : '  FAIL'}  ${r.name.padEnd(15)} ${r.what}`);
  for (const f of r.fails) console.log(`        ${f.trim()}`);
}
const bad = results.filter((r) => !r.ok);
console.log(`\n${bad.length === 0 ? 'all gates clean' : bad.length + ' gate(s) failing: ' + bad.map((r) => r.name).join(', ')}` +
            `  (${((Date.now() - started) / 1000).toFixed(0)}s)`);
console.log('(design measurements are separate: npm run fill, npm run perf)\n');
process.exit(bad.length ? 1 : 0);
