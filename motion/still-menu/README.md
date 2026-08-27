# La Sabrosita — Still Menu Motion

A 1920×1080, **60-second**, seamlessly looping menu board for the in-store TV.
The full menu in Spanish for 30 seconds, a cross-dissolve, the same menu in
English for 30 seconds, then back to the start on the frame it began on.

Delivery: `renders/LS_Still-Menu_Motion_v01.mp4` — H.264, MP4, 1920×1080, 30fps.

**The video was already designed.** It arrived finished, as `StillMenuMotion.zip`.
This project renders it and corrects the logo. It does not design anything.

## This project hosts the client's video — it does not re-implement it

`StillMenuMotion.zip` is a **Claude Design** project, not a HyperFrames one: a
React scene (`src/sabrosita-scene.jsx`) drawn by a small animation runtime
(`src/animations-v3.jsx`), where every frame is a pure function of one number —
the authored time `T`.

There were two ways to get an MP4 out of it:

1. **Port it** — rewrite the scene as HyperFrames HTML with GSAP tweens.
2. **Host it** — run the client's own code and drive its clock.

This project does (2), and the reason is not effort. A port is a redraw. Every
eased entrance, every `Math.sin` breathing curve, every stagger delay and panel
radius would be re-typed by hand into a different runtime, and the result would
be *a video that looks like* the approved one. Hosting it renders *the* approved
one. The brief said do not redesign; the safest way to honour that is for the
design to still be running.

It works because the scene already speaks the protocol a frame renderer needs.
Its canvas listens for `data-om-seek-to-time-frame` and, given `{time, sync:true}`,
applies that timestamp through `ReactDOM.flushSync` — the DOM *is* that frame
before `dispatchEvent` returns. No waiting on a paint, no accumulated state, no
playback. Exactly what HyperFrames wants.

So `index.html` is a thin adapter:

```
HyperFrames seeks  →  paused GSAP timeline  →  data-om-seek-to-time-frame  →  the client's scene
   (per frame)          (carries the playhead)      (synchronous commit)          (draws it)
```

The timeline animates nothing. It exists to carry the playhead, because
HyperFrames drives one paused timeline registered on `window.__timelines`. The
composition's `data-duration="60"` matches the length the client's own
`OM_SCENES` contract declares (two 30-second halves).

`index.html` also hides the Claude Design editor chrome — `<Stage>` paints a dark
mat, stacks a 44px playback bar under the canvas, and scales the canvas to fit
whatever viewport it is in. The canvas itself is exactly 1920×1080, so pinning it
to scale 1 in a 1920×1080 box reproduces the authored frame 1:1.

## What was changed, and what was not

**Changed — one thing.** The logo. The mark in the supplied video is
`assets/logo3.png`, a **fully opaque** raster (alpha is 255 everywhere — its white
background is baked into the pixels), and the scene sat it inside a white rounded
card with a drop shadow. It is now the workspace's official transparent logo,
`brand/logos/LS_Logo_Primary_v01.png`, on the pink blob with no card and no
shadow. Same anchor (x 44, y 20), same width (262), same rise-in, same breathing
scale, same timing.

The card went too, on Luis's call: swapping the image alone leaves the white
card, and the card is what reads as "the logo has a white background". Removing
the shadow follows the brand guidelines, which prohibit drop shadows, glows and
outlines on the mark.

```diff
-        <div style={{ background: C.cream, borderRadius: 26, padding: '16px 20px', boxShadow: '0 18px 40px rgba(12,2,16,.4)' }}>
-          <img src="assets/logo3.png" alt="La Sabrosita" style={{ display: 'block', width: '100%' }} />
-        </div>
+        <img src="assets/logo-official.png" alt="La Sabrosita" style={{ display: 'block', width: '100%' }} />
```

**Not changed — everything else.** `src/animations-v3.jsx` and
`src/tweaks-panel.jsx` are byte-identical to the ZIP; verify with `cmp`.
`src/sabrosita-scene.jsx` differs by exactly the three lines above. Layout, copy,
colour, product placement, timing, easing, the Spanish→English dissolve and the
loop seam are all untouched.

## Two transport fixes, in the build output only

Both are about getting the client's code into a rendering browser intact. Neither
changes a byte of `src/`.

- **`</script>` inside a comment.** `animations-v3.jsx` documents the `OM_SCENES`
  contract in a comment that shows a literal `</script>` tag. HyperFrames inlines
  local `<script src>` into the page before rendering, so that comment closed the
  script early and the rest of the file landed in the page as visible text —
  a purple page covered in source code. `scripts/build-jsx.mjs` escapes the slash
  in the emitted JS, which is inert in JavaScript.

- **Fonts embedded as `data:` URIs.** The scene's own runtime walks
  `document.styleSheets` on mount, downloads every `@font-face` url it finds and
  re-inserts them inline (that is for Claude Design's SVG export). It is
  asynchronous, and a font re-resolving partway through a render is exactly the
  frame-to-frame drift a render must not have. It skips any url already `data:`,
  so shipping the faces pre-inlined turns the routine into a no-op — instead of
  editing a line of the client's code.

## Layout

```
BRIEF.md                what this is and what was agreed
index.html              the HyperFrames composition — the adapter described above
src/
  sabrosita-scene.jsx   the client's scene. ONE change: the logo
  animations-v3.jsx     the client's runtime. Byte-identical to the ZIP
  tweaks-panel.jsx      the client's editor panel. Byte-identical to the ZIP
  support.js            the Claude Design host loader. Kept for reference; not
                        loaded — index.html mounts the scene directly
  source.dc.html        the client's project file, verbatim. The OM_SCENES and
                        OM_PLAYBACK literals in index.html are copied from it
build/                  src/*.jsx compiled to plain JS (generated)
vendor/                 React 18.3.1, ReactDOM 18.3.1, GSAP 3.14.2
assets/
  products -> ../../product-showcase/assets/products    (symlink)
  brand    -> ../../../brand                            (symlink)
  *.png                 symlinks giving the scene its images at the paths it
                        already names — so the scene file did not have to change
  fonts.css             Noto Sans, embedded (generated, ~1.7 MB)
scripts/
  build-jsx.mjs         src/*.jsx -> build/*.js
  build-fonts.mjs       Google Fonts -> assets/fonts.css
renders/                MP4 output (gitignored)
```

Every symlink is **relative** and stays inside the repository — the same rule the
Menu Items Motion project settled on after an absolute symlink made it
unbuildable anywhere but one Mac.

## Rebuilding

```bash
curl -sSfL -o /tmp/babel.min.js https://unpkg.com/@babel/standalone@7.29.0/babel.min.js
BABEL_STANDALONE=/tmp/babel.min.js node scripts/build-jsx.mjs
node scripts/build-fonts.mjs        # only if the font axis changes

npx hyperframes lint
npx hyperframes snapshot . -o renders/verify --at 0,5,12,29.8,30.2,45,59.9
npx hyperframes render --fps 30 --quality high --format mp4 \
  --output renders/LS_Still-Menu_Motion_v01.mp4
```

Babel is deliberately not a dependency: it is a build tool, not part of the
deliverable. `build-jsx.mjs` uses the same Babel version and the same
`["react","typescript"]` presets Claude Design uses in the browser, so the
emitted code is what that browser would have produced.

## What `check` reports

`npx hyperframes check` **fails**, and it should be left failing:

- **80 layout warnings**, all at `t=30–30.13s`. That is the Spanish→English
  cross-dissolve, where both boards are on screen at once. Overlapping text
  during a crossfade is the design.
- **8 contrast errors**, all 2.44:1. That is the brand's yellow (`#F5C21E`) on
  the brand's hot pink (`#F20A88`) — "NATURAL" in the badge and "SHAKE" in the
  Crazy Shake circle. Client-approved brand colours in a client-approved layout.

Both were already reported before the logo change, on the unmodified scene.
Clearing them would mean redesigning the video, which is the one thing this
project must not do. Lint, runtime and motion are all clean.

## The Menu Items Motion video is not touched

`tv-menu/motion/hyperframes/` is a separate finished deliverable — 41 products,
one at a time, 2m21.6s. It was read here only to match its render settings
(1920×1080, 30fps, H.264 High, `yuv420p`, MP4). Nothing in it was modified.
