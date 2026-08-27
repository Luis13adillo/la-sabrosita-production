#!/usr/bin/env node
/**
 * Functional smoke test. Nobody's design piece owns this, so the lead runs it.
 *
 * It answers the questions a screenshot cannot: does every image actually load,
 * does the console stay clean, does search filter, does the product dialog open,
 * does the English build exist and differ from the Spanish one, and is the copy
 * rule actually being honoured (no card shows a line the client did not approve).
 *
 * Run: node scripts/smoke.mjs
 */
import { spawn, execFileSync } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
execFileSync('node', [path.join(HERE, 'build-tokens.mjs')], { stdio: 'pipe' });
execFileSync('node', [path.join(HERE, 'build-site.mjs')], { stdio: 'pipe' });

const port = await new Promise((res) => {
  const s = net.createServer();
  s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); });
});
const server = spawn('node', [path.join(HERE, 'serve.mjs')],
  { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));

const menu = JSON.parse(fs.readFileSync(path.join(SITE, 'data/menu.json'), 'utf8'));
const fails = [];
const ok = [];
const check = (cond, label, detail = '') => (cond ? ok : fails).push(label + (detail ? ` — ${detail}` : ''));

// Every approved line, in both languages — used by the copy checks below and by
// the no-JavaScript check, which must be held to exactly the same rule.
const approved = new Set(menu.items.flatMap((i) => [i.copy.en, i.copy.es]).filter(Boolean));

const browser = await chromium.launch();
try {
  for (const [lang, url] of [['es', `http://localhost:${port}/`], ['en', `http://localhost:${port}/en/`]]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    const bad = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });

    await page.goto(url, { waitUntil: 'load' });
    await page.evaluate(async () => {
      const step = innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(900);

    check(errors.length === 0, `[${lang}] console clean`, errors.slice(0, 3).join(' | '));
    check(bad.length === 0, `[${lang}] no failed requests`, bad.slice(0, 3).join(' | '));

    const cards = await page.locator('.card').count();
    check(cards === menu.counts.products, `[${lang}] all ${menu.counts.products} products rendered`, `saw ${cards}`);

    const broken = await page.evaluate(() =>
      [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src));
    check(broken.length === 0, `[${lang}] every image decoded`, broken.slice(0, 3).join(' | '));

    const noAlt = await page.evaluate(() =>
      [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length);
    check(noAlt === 0, `[${lang}] every image has an alt attribute`, `${noAlt} without`);

    const htmlLang = await page.getAttribute('html', 'lang');
    check(htmlLang === lang, `[${lang}] <html lang> is correct`, `saw ${htmlLang}`);

    // The copy rule: no card may show a line the client did not approve.
    const shown = await page.evaluate(() => [...document.querySelectorAll('.card__desc')].map((e) => e.textContent.trim()));
    const invented = shown.filter((s) => !approved.has(s));
    check(invented.length === 0, `[${lang}] no card shows unapproved copy`, invented.slice(0, 3).join(' | '));

    const expectLines = menu.items.filter((i) => (lang === 'es' ? i.copy.es : i.copy.en)).length;
    check(shown.length === expectLines, `[${lang}] ${expectLines} cards carry a line, the rest are name-only`, `saw ${shown.length}`);

    // Nothing anywhere may look like a price.
    const text = await page.evaluate(() => document.body.innerText);
    check(!/\$\s?\d/.test(text), `[${lang}] no prices anywhere`);

    // Search.
    await page.fill('[data-search]', 'churro');
    await page.waitForTimeout(350);
    const afterSearch = await page.locator('.card').count();
    check(afterSearch > 0 && afterSearch < cards, `[${lang}] search filters`, `${afterSearch} results for "churro"`);
    await page.fill('[data-search]', '');
    await page.waitForTimeout(300);

    // Accent-insensitive search: "platano" must find "Platano Frito".
    await page.fill('[data-search]', 'platano');
    await page.waitForTimeout(350);
    check(await page.locator('.card').count() > 0, `[${lang}] search ignores accents`);
    await page.fill('[data-search]', '');
    await page.waitForTimeout(300);

    // Category filter.
    await page.locator('.filter[data-cat="bebidas"]').click();
    await page.waitForTimeout(350);
    const drinks = await page.locator('.card').count();
    const expectDrinks = menu.items.filter((i) => i.category === 'bebidas').length;
    check(drinks === expectDrinks, `[${lang}] category filter`, `${drinks} drinks, expected ${expectDrinks}`);
    await page.locator('.filter[data-cat="all"]').click();
    await page.waitForTimeout(300);

    // Product dialog.
    await page.locator('.card__hit').first().click();
    await page.waitForTimeout(500);
    check(await page.locator('[data-detail][open]').count() === 1, `[${lang}] product dialog opens`);
    check(await page.locator('.detail__name').innerText() !== '', `[${lang}] dialog shows a product name`);
    // A modal <dialog> is centred by the UA's own `margin: auto` against
    // `inset: 0`. A universal `* { margin: 0 }` reset silently replaces that and
    // pins the dialog to the top-left corner — which looks like a broken layout
    // and is actually a one-line reset bug. Guard it.
    const dlg = await page.evaluate(() => {
      const d = document.querySelector('[data-detail]');
      const r = d.getBoundingClientRect();
      const img = d.querySelector('img');
      const ir = img ? img.getBoundingClientRect() : null;
      /* Every derivative is a square with a constant 6% transparent margin (see
         build-images.mjs), so the top 6% of the image BOX is guaranteed to be
         nothing. A check that measures the box calls that overshoot a crop. */
      const pad = ir ? ir.height * 0.06 : 0;
      return {
        offX: Math.abs((r.x + r.width / 2) - innerWidth / 2),
        offY: Math.abs((r.y + r.height / 2) - innerHeight / 2),
        topCut: ir ? Math.round(Math.max(0, -ir.y - pad)) : 0,
        onScreen: ir ? (Math.min(ir.bottom, innerHeight) - Math.max(ir.top, 0)) / ir.height : 1,
      };
    });
    check(dlg.offX < 4 && dlg.offY < 4, `[${lang}] dialog is centred in the viewport`,
          `off by ${Math.round(dlg.offX)}x${Math.round(dlg.offY)}px`);
    /* THE BOTTOM BLEED IS THE DESIGN, AND THIS CHECK USED TO FORBID IT.
       It was written to catch a real bug — `* { margin: 0 }` replacing the UA's
       `margin: auto` on a modal dialog, which pinned it to the top-left and took
       21px off the photo — and it asserted `cut === 0` on the image box. The
       detail view then deliberately grew until the product runs off the bottom
       of the frame, which is the single thing every blind judge rewarded it for
       ("A and C end politely inside a rectangle with air on all sides"), and the
       check started failing the winning composition at 229px.

       Deleting it would give back the bug. So it now asserts the two things that
       actually distinguish a bleed from a break. A DELIBERATE bleed only ever
       goes off the BOTTOM — the frame is anchored at the top and grown downward.
       A MISPOSITIONED dialog loses the TOP of the photograph, which is where the
       close button is and where a customer looks first. And a photo that has
       become wildly mis-sized fails the coverage floor whichever way it went.

       Measured on the shipped build: 0px past the top at both viewports, and
       79.7% of the box on screen at 1440x900 / 96.5% at 390x844 across all 45
       products. The floor is 60%, well clear of both, so it catches a break
       without pinning the design to today's numbers. */
    check(dlg.topCut === 0, `[${lang}] the dialog photo is not cut off at the TOP`,
          `${dlg.topCut}px past the top edge — a bleed goes off the bottom, not the top`);
    check(dlg.onScreen >= 0.6, `[${lang}] most of the dialog photo is on screen`,
          `only ${(dlg.onScreen * 100).toFixed(1)}% of it is`);

    // A CLOSED <dialog> must be out of the way. The UA gives it display:none;
    // styling `.detail { display: flex }` unconditionally overrides that, and the
    // dialog then sits invisibly over the whole page — hit-testing above the hero,
    // swallowing taps meant for the buttons underneath. It looks completely normal
    // in a screenshot, which is exactly why it needs a check.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    const closed = await page.evaluate(() => {
      const d = document.querySelector('[data-detail]');
      const cs = getComputedStyle(d);
      const r = d.getBoundingClientRect();
      const covers = r.width * r.height > innerWidth * innerHeight * 0.25;
      const onTop = document.elementFromPoint(Math.round(innerWidth / 2), Math.round(innerHeight * 0.4));
      return {
        open: d.open, display: cs.display, area: Math.round(r.width) + 'x' + Math.round(r.height),
        covers, blocking: !!(onTop && onTop.closest('dialog')),
        onTop: onTop ? (onTop.className || onTop.tagName).toString().split(' ')[0] : 'none',
      };
    });
    const outOfWay = !closed.open && (closed.display === 'none' || !closed.covers);
    check(outOfWay, `[${lang}] the closed dialog is out of the way`,
          outOfWay ? `display:${closed.display}`
                   : `it is display:${closed.display} at ${closed.area}, covering the page while closed`);
    check(!closed.blocking, `[${lang}] nothing under the closed dialog is blocked`,
          closed.blocking ? `the element on top at mid-screen is .${closed.onTop}, inside the dialog`
                          : `the element on top at mid-screen is .${closed.onTop}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    check(await page.locator('[data-detail][open]').count() === 0, `[${lang}] dialog closes on Escape`);

    // Nothing may scroll the page sideways.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(overflow <= 1, `[${lang}] no horizontal overflow at 1440`, `${overflow}px`);

    await ctx.close();
  }

  // Scroll-reveal must not leave holes. A customer flicking down the page jumps
  // a screen at a time; if the reveal animation is still running, they look at
  // empty rectangles. Measured, not assumed — see the filmstrip in .bench.
  const rm = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  const rp = await rm.newPage();
  await rp.goto(`http://localhost:${port}/`, { waitUntil: 'load' });
  await rp.waitForTimeout(1400);

  /* WHERE THE FOUR SAMPLES GO, AND WHY IT IS NO LONGER 20/40/60/80% OF THE DOCUMENT.
     ==================================================================================
     This check jumps down the page and asks whether the cards it can see have
     finished painting. To ask that, it has to land somewhere cards ARE.

     It used to sample 20/40/60/80% of the whole document, which worked when the
     page was a hero and then the menu. The approved design (site/.site/b.html)
     puts four full-height sections between the two — the statement, the story,
     the four category panels and the three beats, 4131px of them — so on the
     real page 20% lands at y=2755, inside the story band, and 40% at y=5509,
     inside the third beat. Measured on this build: the document is 14673px, the
     cards run from y=6884 to y=13478, and two of the four samples were landing
     outside that by design. `if (!r.visible) continue` recorded them as no data,
     `sampled` came back 2, and the gate failed.

     The honest reading of that failure is not "the page is wrong" and not "the
     paint check is wrong" — it is that the SAMPLE POSITIONS were being computed
     over a range most of which has no cards in it. So they are now computed over
     the range that does: every scroll position from which at least one card is
     on screen. That keeps four samples MANDATORY and hands the paint check below
     four card-bearing screens instead of two, so it is strictly more evidence
     than before, not less.

     The two checks under it are the ones that keep "4 of 4" from becoming a
     tautology. Deriving the range from the page means a degenerate page — no
     cards, or every card collapsed to a point — would produce four identical
     scroll positions and score a triumphant 4 of 4 having read one screen four
     times. So the band must exist, and the four landings must be at least a
     screen apart, which is also what the thing being simulated actually is: a
     customer flicking down a screen at a time. */
  const band = await rp.evaluate(() => {
    const cards = [...document.querySelectorAll('.card')];
    if (!cards.length) return null;
    const tops = cards.map((c) => c.getBoundingClientRect().top + scrollY);
    const bots = cards.map((c) => c.getBoundingClientRect().bottom + scrollY);
    const maxScroll = Math.max(0, document.body.scrollHeight - innerHeight);
    // A scroll position y shows a card iff [top, bottom] meets [y, y + innerHeight].
    return {
      from: Math.round(Math.max(0, Math.min(Math.min(...tops) - innerHeight + 1, maxScroll))),
      to: Math.round(Math.max(0, Math.min(Math.max(...bots) - 1, maxScroll))),
      vh: innerHeight, cards: cards.length,
    };
  });
  check(band !== null && band.to > band.from,
        `[motion] the page has a band of cards to sample`,
        band ? `${band.cards} cards over a ${band.to - band.from}px scroll range (y ${band.from}–${band.to})`
             : 'no .card elements exist at all — the paint check below would have nothing to look at');

  const positions = band && band.to > band.from
    ? [0.2, 0.4, 0.6, 0.8].map((f) => Math.round(band.from + (band.to - band.from) * f))
    : [];
  const gaps = positions.slice(1).map((y, i) => y - positions[i]);
  check(positions.length === 4 && gaps.every((g) => g >= band.vh),
        `[motion] the four samples are a screen-jump apart, so they are four different screens`,
        positions.length === 4
          ? `gaps of ${gaps.join(', ')}px against a ${band.vh}px viewport`
          : 'no band to sample');

  // Start from nothing, not from a perfect score. Seeding this with 1/1 made the
  // check pass even when it measured no cards at all, and report "1/1 at  down
  // the page" — a green line that had looked at nothing. A check that cannot
  // distinguish "everything painted" from "nothing found" is not a check.
  let worst = null;
  let sampled = 0;
  for (const y of positions) {
    await rp.evaluate((to) => window.scrollTo({ top: to, behavior: 'instant' }), y);
    await rp.waitForTimeout(450);
    const r = await rp.evaluate(() => {
      const vis = [...document.querySelectorAll('.card')].filter((c) => {
        const b = c.getBoundingClientRect(); return b.bottom > 0 && b.top < innerHeight;
      });
      return { visible: vis.length, painted: vis.filter((c) => +getComputedStyle(c).opacity > 0.9).length };
    });
    if (!r.visible) continue;
    sampled++;
    if (!worst || r.painted / r.visible < worst.painted / worst.visible) worst = { ...r, at: `y=${y}` };
  }
  check(sampled === 4, `[motion] all four scroll positions had cards on screen to measure`,
        sampled === 4 ? '4 of 4'
                      : `only ${sampled} of 4 — without this, the check below would pass having looked at nothing`);
  check(worst !== null && worst.painted / worst.visible >= 0.9,
        `[motion] cards have painted 450ms after a scroll jump`,
        worst ? `worst was ${worst.painted}/${worst.visible} at ${worst.at}`
              : 'no cards were on screen at any sampled position');

  // `animation-timeline: view()` resolves against the subject's nearest ANCESTOR
  // SCROLL CONTAINER. Give any element between the card and the page an
  // `overflow: hidden` and that element becomes one — so the animation measures
  // the photo's position inside a 227px button instead of inside the window, its
  // progress pins at 1, and the reveal silently does nothing. It renders exactly
  // like a finished reveal, so no screenshot can tell the difference.
  //
  // The only way to see it is to measure: the same card, at two different
  // distances from the fold, should place its photograph differently inside its
  // own tile. If it does not, the timeline is anchored to the wrong scroller.
  const probe = await rp.evaluate(async () => {
    if (!CSS.supports('animation-timeline', 'view()')) return { skipped: true };
    const card = [...document.querySelectorAll('.card')].find((c) => c.querySelector('img'));
    if (!card) return { skipped: true };
    const read = async (fracFromTop) => {
      const y = card.getBoundingClientRect().top + scrollY - innerHeight * fracFromTop;
      window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 260));
      const cr = card.getBoundingClientRect();
      const ir = card.querySelector('img').getBoundingClientRect();
      return { dx: ir.x - cr.x, dy: ir.y - cr.y, h: ir.height };
    };
    const near = await read(0.85);   // just entering the window
    const far = await read(0.25);    // well inside it
    return { moved: Math.abs(near.dy - far.dy) + Math.abs(near.h - far.h), near, far };
  });
  if (!probe.skipped) {
    const anchored = probe.moved > 1;
    check(anchored, `[motion] scroll-linked reveal is anchored to the page, not to a clipped ancestor`,
          anchored
            ? `the photograph moves ${probe.moved.toFixed(1)}px within its tile between two scroll distances`
            : `the photograph sits identically at two scroll distances — something between .card and the ` +
              `document has overflow other than visible, so view() is measuring the wrong scroller`);
  }
  await rm.close();

  // Switching language must not throw away what you were looking at. On a
  // bilingual menu the switch is most likely at the exact moment somebody failed
  // to read something, so landing them back at the top of an unfiltered page is
  // the worst possible answer. State lives in the query string — see
  // src/app/url-state.js — and this checks it actually survives the trip.
  const lc = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const lp = await lc.newPage();
  await lp.goto(`http://localhost:${port}/`, { waitUntil: 'load' });
  await lp.waitForTimeout(900);
  await lp.locator('[data-cat="bebidas"]').first().click();
  await lp.waitForTimeout(400);
  await lp.fill('[data-search]', 'fresa');
  await lp.waitForTimeout(500);
  const before = { url: lp.url(), cards: await lp.locator('.card').count() };
  await lp.locator('.nav__lang, [data-lang-link]').first().click();
  await lp.waitForTimeout(1400);
  const after = {
    lang: await lp.getAttribute('html', 'lang'),
    cards: await lp.locator('.card').count(),
    search: await lp.inputValue('[data-search]').catch(() => ''),
  };
  check(before.url.includes('c=bebidas') && before.url.includes('q=fresa'),
        `[state] the filter and the search are in the URL`, before.url);
  check(after.lang === 'en' && after.search === 'fresa' && after.cards === before.cards,
        `[state] language switch keeps the category and the search`,
        `after: ${after.lang}, "${after.search}", ${after.cards} cards (was ${before.cards})`);
  await lc.close();

  // The menu must survive JavaScript not running. The grid is built client-side,
  // so without a fallback the page is an empty cream field — and that is not only
  // a browser-setting edge case: it is what a customer sees if any script on the
  // page throws. A menu that renders nothing is worse than a menu that renders
  // plainly.
  for (const [lang, seg] of [['es', ''], ['en', 'en/']]) {
    const nj = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    const np = await nj.newPage();
    await np.goto(`http://localhost:${port}/${seg}`, { waitUntil: 'load' });
    await np.waitForTimeout(500);
    const items = await np.locator('.plain li').count();
    const shown = await np.evaluate(() =>
      [...document.querySelectorAll('.plain li span')].map((e) => e.textContent.trim()));
    const invented = shown.filter((s) => !approved.has(s));
    check(items === menu.counts.products, `[no-js ${lang}] the whole menu still renders`,
          `${items} of ${menu.counts.products} items`);
    check(invented.length === 0, `[no-js ${lang}] the fallback shows no unapproved copy`,
          invented.slice(0, 3).join(' | '));
    await nj.close();
  }

  // Mobile: the same overflow check at 390, where it actually bites.
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mp = await m.newPage();
  await mp.goto(`http://localhost:${port}/`, { waitUntil: 'load' });
  await mp.waitForTimeout(900);
  const mOverflow = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(mOverflow <= 1, `[mobile] no horizontal overflow at 390`, `${mOverflow}px`);
  const tapTargets = await mp.evaluate(() =>
    [...document.querySelectorAll('button, a')].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.height < 40 || r.width < 40);
    }).map((e) => (e.className || e.tagName) + ' ' + Math.round(e.getBoundingClientRect().height) + 'px').slice(0, 6));
  check(tapTargets.length === 0, `[mobile] every tap target is at least 40px`, tapTargets.join(' | '));
  await m.close();
} finally {
  await browser.close();
  server.kill();
}

for (const o of ok) console.log(`  pass  ${o}`);
for (const f of fails) console.log(`  FAIL  ${f}`);
console.log(`\n${ok.length} passed, ${fails.length} failed`);
process.exit(fails.length ? 1 : 0);
