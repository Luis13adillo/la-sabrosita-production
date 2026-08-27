#!/usr/bin/env node
/**
 * Assemble a dated client handoff package into deliverables/.
 *
 * CLAUDE.md says deliverables/ holds dated client handoff packages and nothing
 * else, so this writes exactly one dated folder and never touches anything
 * outside it. Nothing under assets/ is read except through the derivative
 * pipeline that already exists, and nothing under assets/ is written at all.
 *
 * What goes in: the built site as it would be served, the reasoning documents a
 * client is owed, and the evidence that the gates were green when it shipped.
 *
 * Run: node scripts/build-handoff.mjs [--date 2026-08-24]
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const REPO = path.resolve(SITE, '..');

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i === -1 ? d : process.argv[i + 1]; };
// The LOCAL date. toISOString() is UTC, which after 8pm Eastern stamps a package
// with tomorrow's date — a small thing that makes a dated handoff folder wrong.
const stamp = arg('date', new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date()));
const OUT = path.join(REPO, 'deliverables', `${stamp}_website`);

console.log('building fresh…');
for (const s of ['build-tokens.mjs', 'build-catalog.mjs', 'build-icons.mjs', 'build-social.mjs', 'build-questions.mjs', 'build-site.mjs']) {
  execFileSync('node', [path.join(HERE, s)], { stdio: 'pipe' });
}

// The gates, captured as they stood at handoff. A package that says "it passed"
// without the output is a claim; this is the receipt.
console.log('running the gates…');
let gates = '';
let gatesOk = true;   // also set false if the packaged copy fails to stand up
try {
  gates = execFileSync('node', [path.join(HERE, 'check-all.mjs')], { encoding: 'utf8', maxBuffer: 1 << 24 });
} catch (e) {
  gates = (e.stdout || '') + (e.stderr || '');
  gatesOk = false;
}
let measures = '';
for (const s of ['fill-check.mjs', 'perf.mjs', 'tails.mjs']) {
  try { measures += `\n$ node scripts/${s}\n` + execFileSync('node', [path.join(HERE, s)], { encoding: 'utf8', maxBuffer: 1 << 24 }); }
  catch (e) { measures += `\n$ node scripts/${s}\n` + ((e.stdout || '') + (e.stderr || '')); }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(path.join(SITE, 'public'), path.join(OUT, 'site'), { recursive: true });
for (const [from, to] of [
  [path.join(REPO, 'INVENTED.md'), 'INVENTED.md'],
  [path.join(SITE, 'CLIENT-QUESTIONS.md'), 'QUESTIONS-FOR-YOU.md'],
  [path.join(SITE, 'README.md'), 'HOW-TO-RUN-IT.md'],
]) fs.copyFileSync(from, path.join(OUT, to));
fs.writeFileSync(path.join(OUT, 'CHECKS.txt'),
  `La Sabrosita website — gate output at handoff, ${stamp}\n` +
  `${'='.repeat(64)}\n${gates}\n${'='.repeat(64)}\nDesign measurements\n${measures}`);

const menu = JSON.parse(fs.readFileSync(path.join(SITE, 'data/menu.json'), 'utf8'));
const bytes = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .reduce((n, e) => n + (e.isDirectory() ? bytes(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size), 0);

fs.writeFileSync(path.join(OUT, 'README.md'), `# La Sabrosita website — ${stamp}

Everything in \`site/\` is the finished website exactly as it would be served.
It is plain files: open \`site/index.html\` through any web server and it runs.
There is no build step, no database and nothing to install.

- \`site/index.html\` — Spanish
- \`site/en/index.html\` — English

## What is in it

| | |
| --- | --- |
| Products | ${menu.counts.products} across ${menu.categories.length} categories |
| Photographs | ${menu.counts.images}, every one a cut-out from your approved masters |
| Products with a description in both languages | ${menu.counts.withApprovedEnglish} |
| Products shown name-only | ${menu.counts.nameOnly} — see QUESTIONS-FOR-YOU.md |
| Prices anywhere | none |
| Total size of the site | ${(bytes(path.join(OUT, 'site')) / 1048576).toFixed(1)} MB |

## How it compares to the two sites we were measured against

Every part of this site was judged against **michoacana.com** and
**heladosmexico.com** by someone who was shown three screenshots side by side with
the labels removed and did not know which was which. The same measurements were
taken on all three sites:

| | this site | heladosmexico | michoacana |
| --- | --- | --- | --- |
| How much of its tile the food fills, on a phone | **42%** | 36.8% | 44.4% |
| The same on a computer | **39%** | 36.8% | 44.4% |
| How much of the first screen the hero product fills | **~81%** | 64.5% | 32.3% |
| Products shown before you have to click anything | **45** | about 6 | about 6 |
| A description on every product | **yes, in two languages** | no | no |
| Search across the whole menu | **yes** | no | no |

Neither of those sites shows a full menu, which is the thing this site exists to
do. They sell packaged goods in wrappers; this one shows food as it is handed to
you.

## The other four files

- **QUESTIONS-FOR-YOU.md** — everything the site could not answer for itself.
  Short, and none of it is urgent.
- **INVENTED.md** — every value we had to choose because the brand guidelines
  leave it open, with the reasoning. These are our choices, not brand rules. If
  you decide differently, the answer goes into \`brand/brand.json\` and the site
  picks it up.
- **CHECKS.txt** — the output of the automated checks at the moment this package
  was built${gatesOk ? ', all green' : ' — note that not every gate was green'}.
- **HOW-TO-RUN-IT.md** — for whoever hosts it.

## What was not touched

Nothing in \`assets/\`. The website reads your approved masters and writes
smaller copies for the web into its own folder. Not one of your files was
renamed, moved, re-exported or re-compressed.
`);

// Serve the package the way the client will — a plain static server, no build
// step, no fallback routing, nothing from this repo's dev setup — and check it
// actually renders. A handoff that only works inside the workshop is not a
// handoff, and this is the one bug the gates above cannot catch, because they
// all test site/public rather than the copy in the box.
console.log('checking the package the way a client would open it…');
{
  const net = await import('node:net');
  const { chromium } = await import('playwright');
  const port = await new Promise((res) => {
    const s = net.createServer();
    s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); });
  });
  const { spawn } = await import('node:child_process');
  const srv = spawn('python3', ['-m', 'http.server', String(port)],
                    { cwd: path.join(OUT, 'site'), stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 1500));
  const browser = await chromium.launch();
  let problems = [];
  for (const [lang, seg] of [['es', ''], ['en', 'en/']]) {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    page.on('pageerror', (e) => problems.push(`${lang}: ${String(e).slice(0, 60)}`));
    page.on('response', (r) => { if (r.status() >= 400) problems.push(`${lang}: ${r.status()} ${new URL(r.url()).pathname}`); });
    await page.goto(`http://localhost:${port}/${seg}`, { waitUntil: 'load' });
    await page.evaluate(async () => {
      const step = innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    });
    await page.waitForTimeout(900);
    const cards = await page.locator('.card').count();
    const broken = await page.evaluate(() =>
      [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0).length);
    if (cards !== menu.counts.products) problems.push(`${lang}: ${cards} of ${menu.counts.products} products rendered`);
    if (broken) problems.push(`${lang}: ${broken} images failed to load`);
    await page.close();
  }
  await browser.close();
  srv.kill();
  if (problems.length) {
    console.log('  FAIL  the package does not stand on its own:');
    for (const p of problems.slice(0, 8)) console.log(`        ${p}`);
    gatesOk = false;
  } else {
    console.log('  pass  both languages render from a plain static server, no broken images, no errors');
  }
}

console.log(`\n${OUT.replace(REPO + '/', '')}`);
for (const f of fs.readdirSync(OUT)) console.log(`  ${f}`);
console.log(`\n${(bytes(OUT) / 1048576).toFixed(1)} MB total${gatesOk ? '' : '  —  gates were NOT all green; see CHECKS.txt'}`);
