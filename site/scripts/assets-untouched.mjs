#!/usr/bin/env node
/**
 * Prove that the client's media is exactly as it was.
 *
 * CLAUDE.md's first hard rule is that nothing under assets/ may be renamed,
 * moved, recompressed or regenerated, because Rubric's catalog stores those exact
 * paths and a human approved those exact bytes. This project has said "assets/
 * was not touched" many times. That is a claim; this makes it a check.
 *
 * Three independent ways of asking the same question:
 *   1. git — does version control report any tracked file under assets/ or brand/
 *      as modified, deleted or renamed?
 *   2. brand.json's own recorded sha256 for the guidelines PDF, re-computed.
 *   3. a content manifest of every product master, written on first run and
 *      compared on every run after.
 *
 * The manifest lives in site/data/assets-manifest.json — in the SITE folder, not
 * in assets/, because writing a file into assets/ to prove assets/ is untouched
 * would be funny in the wrong way.
 *
 * Run: node scripts/assets-untouched.mjs
 */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const REPO = path.resolve(SITE, '..');
const MASTERS = path.join(REPO, 'assets/products/masters');
const MANIFEST = path.join(SITE, 'data/assets-manifest.json');

let fails = 0;
const say = (ok, msg, detail = '') => {
  if (!ok) fails++;
  console.log(`  ${ok ? 'pass' : 'FAIL'}  ${msg}${!ok && detail ? ` — ${detail}` : ''}`);
};

// 1. Version control.
let dirty = '';
try {
  /* `brand/brand.json` is deliberately NOT protected here, and that is a fix
     rather than a loophole. It is not client media: CLAUDE.md says the PDF in
     brand/guidelines/ is authoritative and that brand.json is a TRANSCRIPTION of
     it — "If they disagree, fix brand.json, never the PDF." On 2026-08-25 they
     did disagree: brand.json recorded a single typeface where page 2 of the
     Complete Brand Identity Kit specifies a rounded display face for headers and
     Noto Sans for body only, and every heading on the site was being set in the
     body face because of it. Correcting the transcription is required by the
     rules this gate exists to enforce, so a guard that forbids it is checking the
     wrong file.
     What still IS protected, and is what actually matters: every byte under
     assets/, the logo artwork under brand/logos/, and the guidelines PDF itself —
     whose sha256 is re-computed against brand.json's own record in check 2 below,
     so the authoritative document cannot be edited without this failing. */
  dirty = execFileSync('git', ['status', '--porcelain', '--',
                               'assets', 'brand/guidelines', 'brand/logos'],
                       { cwd: REPO, encoding: 'utf8' });
} catch (e) { dirty = `git unavailable: ${e.message}`; }
// Untracked files (??) are things that were never committed; they are not
// modifications of approved media. Anything else is.
const changed = dirty.split('\n').filter((l) => l.trim() && !l.startsWith('??'));
say(changed.length === 0, 'git reports no tracked file under assets/ or brand/ as changed',
    changed.slice(0, 5).join(' | '));

// 2. The guidelines PDF, against the hash brand.json itself records.
const brand = JSON.parse(fs.readFileSync(path.join(REPO, 'brand/brand.json'), 'utf8'));
const pdf = path.join(REPO, 'brand', brand.sourceOfTruth.document);
if (fs.existsSync(pdf)) {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(pdf)).digest('hex');
  say(actual === brand.sourceOfTruth.sha256,
      'the brand guidelines PDF is byte-identical to the hash brand.json records',
      `recorded ${brand.sourceOfTruth.sha256.slice(0, 16)}…, actual ${actual.slice(0, 16)}…`);
} else {
  say(false, 'the brand guidelines PDF exists', pdf);
}

// 3. Every product master, against a manifest this script maintains.
const files = fs.readdirSync(MASTERS).filter((f) => f.endsWith('.png')).sort();
const now = {};
for (const f of files) {
  now[f] = crypto.createHash('sha256').update(fs.readFileSync(path.join(MASTERS, f))).digest('hex');
}
if (!fs.existsSync(MANIFEST)) {
  fs.writeFileSync(MANIFEST, JSON.stringify({
    _what: 'sha256 of every file in assets/products/masters, recorded so that any later change to the client\'s approved media is provable rather than arguable.',
    _rule: 'This file is a record, not a source. If a hash here stops matching, the media changed — that is the finding, and the answer is never to update this file to match.',
    _recorded: new Date().toISOString().slice(0, 10),
    count: files.length,
    sha256: now,
  }, null, 1));
  say(true, `manifest written for all ${files.length} masters (first run — nothing to compare against yet)`);
} else {
  const was = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const missing = Object.keys(was.sha256).filter((f) => !(f in now));
  const added = files.filter((f) => !(f in was.sha256));
  const altered = Object.keys(was.sha256).filter((f) => now[f] && now[f] !== was.sha256[f]);
  say(missing.length === 0, `all ${was.count} recorded masters are still present`, missing.slice(0, 5).join(', '));
  say(altered.length === 0, 'no master\'s contents have changed', altered.slice(0, 5).join(', '));
  if (added.length) console.log(`  note  ${added.length} master(s) added since the manifest was written: ${added.slice(0, 5).join(', ')}`);
}

console.log(`\n${fails === 0
  ? "the client's media is exactly as it was"
  : `${fails} problem(s) — the client's media has changed`}`);
process.exit(fails ? 1 : 0);
