#!/usr/bin/env node
/**
 * Enforce the disclosure rule mechanically.
 *
 * The brief says: anything brand.json marks null that this site chooses goes in
 * INVENTED.md. That is easy to promise and easy to forget, so this checks it.
 *
 * It reads every custom property defined anywhere in styles/ and compares the
 * list against the tokens declared in data/invented.json. It reports:
 *
 *   UNDISCLOSED  a value the site invented that INVENTED.md does not mention
 *   STALE        a token INVENTED.md documents that no longer exists
 *   HARDCODED    a literal colour or font-family typed into a stylesheet
 *                instead of coming through a token — the CLAUDE.md rule
 *
 * Run: node scripts/check-invented.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const REPO = path.resolve(SITE, '..');
const STYLES = path.join(SITE, 'styles');

const brand = JSON.parse(fs.readFileSync(path.join(REPO, 'brand/brand.json'), 'utf8'));
const invented = JSON.parse(fs.readFileSync(path.join(SITE, 'data/invented.json'), 'utf8'));

// Every token name INVENTED.md claims to cover. Ranges like "--s-1 … --s-12" are
// expanded, and a bare prefix covers the tokens under it.
const declared = new Set();
for (const g of invented.groups) {
  for (const v of g.values) {
    const t = v.token;
    const range = t.match(/^(--[\w-]+?)(\d+)\s*[….]+\s*(--[\w-]+?)(\d+)$/);
    if (range) {
      for (let i = Number(range[2]); i <= Number(range[4]); i++) declared.add(`${range[1]}${i}`);
    } else if (t.startsWith('--')) {
      declared.add(t.trim());
    }
  }
}

const files = fs.readdirSync(STYLES).filter((f) => f.endsWith('.css'));
const defined = new Map();          // token -> file it is defined in
const hardcoded = [];
// brand.json typography.sizes and typography.lineHeights are BOTH null, so every
// type size on this site is an invented value. The tokens are disclosed; a literal
// typed straight into a rule is not, and it is the easiest kind to introduce
// without noticing. Same for letter-spacing, which the PDF also never publishes.
const literalType = [];

// Colour literals and font families that should have come from a token.
const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const RGBFN = /\b(?:rgba?|hsla?)\(\s*[\d.]+/g;
const FONTFAM = /font-family\s*:\s*([^;]+);/g;

// White is not an invention. brand.json logo.approvedBackgrounds lists white as
// an approved field, and white-with-alpha is a scrim over a brand colour, not a
// new colour. Everything else typed as a literal is a finding.
const isWhite = (s) => /^#(fff|ffff|ffffff|ffffffff)$/i.test(s) ||
  /^rgba?\(\s*255\s*[, ]\s*255\s*[, ]\s*255/.test(s);

for (const f of files) {
  const css = fs.readFileSync(path.join(STYLES, f), 'utf8');
  // Strip comments so documentation of a measured hex is not reported as code.
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // A definition, not a selector: `--x:` at the start of a declaration. Without
  // the anchor, `.btn--primary:hover` reads as a custom property named --primary.
  for (const m of code.matchAll(/(?:^|[{;])\s*(--[\w-]+)\s*:/gm)) {
    if (!defined.has(m[1])) defined.set(m[1], f);
  }
  if (f === 'tokens.css' || f === 'fonts.css') continue;   // generated
  // A colour inside a mask is not a paint — in `mask-image` the channel that
  // matters is alpha, and #000 there means "fully opaque", not black. Drop those
  // declarations before looking for literals.
  const paint = code.replace(/(-webkit-)?mask(-image)?\s*:[^;]+;/g, '');
  for (const m of paint.matchAll(HEX)) if (!isWhite(m[0])) hardcoded.push(`${f}: ${m[0]}`);
  // rgb(var(--token) / .2) is a token with an alpha, not a literal colour. Only
  // a function whose first argument is a number is a hardcoded colour.
  for (const m of paint.matchAll(/\b(?:rgba?|hsla?)\([\s]*[\d.]+[^)]*\)?/g)) {
    if (!isWhite(m[0])) hardcoded.push(`${f}: ${m[0].slice(0, 40)}`);
  }
  // A literal length where brand.json has nothing to say. `inherit`, `0`, and
  // unitless line-heights that come from a token are not findings.
  for (const m of paint.matchAll(/(font-size|letter-spacing)\s*:\s*([^;}]+)[;}]/g)) {
    const v = m[2].trim();
    if (/var\(|inherit|^0$|clamp\(|calc\(/.test(v)) continue;
    literalType.push(`${f}: ${m[1]}: ${v}`);
  }

  for (const m of paint.matchAll(FONTFAM)) {
    const v = m[1].trim();
    if (!v.startsWith('var(') && !/^inherit$/.test(v)) hardcoded.push(`${f}: font-family: ${v}`);
  }
}

// Tokens that come straight from brand.json are not inventions.
const fromBrand = new Set();
for (const k of Object.keys(brand.color.palette)) {
  const kebab = k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
  fromBrand.add(`--c-${kebab}`); fromBrand.add(`--c-${kebab}-rgb`);
}
// Typography tokens read straight out of brand.json typography: the two family
// stacks and the three weights it publishes. --font-display / --w-display /
// --w-semi were added when brand.json was corrected to carry typography.display
// (Fredoka) alongside typography.body. They are transcriptions, not inventions —
// which face brand.json NAMES is a brand fact; that the kit lets us pick one is
// the invention, and that is disclosed in INVENTED.md under "The display
// typeface" instead.
for (const t of ['--c-dark', '--c-brand', '--c-structure', '--c-accent', '--c-highlight',
                 '--c-reading', '--c-category', '--c-item', '--c-body', '--c-muted',
                 '--c-note', '--font', '--w-body', '--w-bold',
                 '--font-display', '--w-display', '--w-semi']) fromBrand.add(t);

const undisclosed = [...defined.keys()].filter((t) => !declared.has(t) && !fromBrand.has(t));
const stale = [...declared].filter((t) => !defined.has(t));

const say = (label, list) => {
  if (!list.length) { console.log(`  pass  ${label}: none`); return 0; }
  console.log(`  FAIL  ${label}: ${list.length}`);
  for (const x of list) console.log(`          ${x}${defined.get(x) ? `  (${defined.get(x)})` : ''}`);
  return list.length;
};

console.log('Disclosure check — every invented value must appear in INVENTED.md\n');
let n = 0;
n += say('UNDISCLOSED custom properties', undisclosed);
n += say('STALE entries in data/invented.json', stale);
n += say('HARDCODED colours or font families', [...new Set(hardcoded)]);
// Disclosed by exact value: if data/invented.json records the value, the literal
// is documented and does not need to become a token to be honest.
const disclosedValues = new Set();
for (const g of invented.groups) for (const v of g.values) disclosedValues.add(String(v.value).trim());
const undocumentedType = [...new Set(literalType)].filter((l) => {
  const v = l.split(': ').slice(2).join(': ').trim();
  return !disclosedValues.has(v);
});
n += say('LITERAL type sizes not disclosed in INVENTED.md', undocumentedType);
if (process.argv.includes('--stub') && undisclosed.length) {
  // Print a ready-to-paste block for data/invented.json, with each token's actual
  // value read out of the stylesheet, so disclosing one is a matter of writing
  // the note rather than re-deriving the value.
  const stub = undisclosed.map((t) => {
    const file = defined.get(t);
    const css = fs.readFileSync(path.join(STYLES, file), 'utf8');
    const m = css.match(new RegExp(`${t}\\s*:\\s*([^;]+);`));
    return { token: t, value: m ? m[1].trim() : '?', note: `TODO — defined in ${file}` };
  });
  console.log('\n--- paste into a data/invented.json group ---');
  console.log(JSON.stringify(stub, null, 2));
}
console.log(`\n${n === 0 ? 'clean' : n + ' item(s) to resolve'}`);
process.exit(n ? 1 : 0);
