# La Sabrosita Product Showcase — proof pass

Canvas 1920×1080 · 30 fps · 18.0s · silent · seamless loop.

Six frames. The four product frames are the repeatable unit — the full video adds
more of them and changes nothing else. Frame 1 and Frame 6 are the loop seam:
both resolve to the bare branded background, so the last rendered frame matches
the first and an in-store player can repeat the file all day with no visible cut.

Motion vocabulary, cited from `/hyperframes-animation`:
`multi-phase-camera`, `spring-pop-entrance`, `waterfall-entry`,
`ambient-glow-bloom`, `sine-wave-loop`, `depth-of-field-blur`,
`particle-burst` (sparkle drift, deterministic), plus the transition catalog's
`css-scale` → zoom through (accent, bookends) and `css-dissolve` → blur
crossfade (primary, product-to-product).

---

## Frame 1 — Open

- id: `s-open`
- status: outline
- src: inline (`index.html`, `#s-open`)
- window: 0.00 – 3.00s
- rules: `spring-pop-entrance`, `waterfall-entry`, `ambient-glow-bloom`, `multi-phase-camera`
- transition_out: zoom through → Frame 2 at 2.75s

The branded field is already alive at t=0 — `bg-tv.png` drifting, sparkles
turning. The logo card settles in on a smooth `power3.out` scale, the client's
own headline `¡HECHO CON SABOR!` whips up word by word beneath it, and a
sunny-yellow rule draws across. Camera holds wide, then begins its push.

---

## Frame 2 — Crazy Shake

- id: `s-p1`
- status: outline
- src: inline (`index.html`, `#s-p1`)
- window: 2.75 – 6.20s
- product: `assets/products/crazy-shakes.png` (2000×2000 transparent master, from the ZIP)
- copy: eyebrow `HELADOS & PALETAS` · name `Crazy Shake` · sub `Ice Cream & Paletas`
- layout: type left, product right
- rules: `spring-pop-entrance`, `waterfall-entry`, `ambient-glow-bloom`, `sine-wave-loop`, `multi-phase-camera`, `depth-of-field-blur`
- transition_out: blur crossfade → Frame 3 at 5.95s

Hero enters from below on `expo.out`, blur resolving to sharp as it lands —
weight, not bounce. Glow blooms behind it on the same beat. Background rack-focus
blurs as the camera pushes, so the product is the only sharp thing in frame.

---

## Frame 3 — Chamoyada

- id: `s-p2`
- status: outline
- src: inline (`index.html`, `#s-p2`)
- window: 5.95 – 9.40s
- product: `assets/products/chamoyada.png`
- copy: eyebrow `BEBIDAS` · name `Chamoyada` · sub `Drinks`
- layout: type right, product left (mirrored — breaks the metronome)
- rules: same set as Frame 2, mirrored
- transition_out: blur crossfade → Frame 4 at 9.15s

---

## Frame 4 — Churros

- id: `s-p3`
- status: outline
- src: inline (`index.html`, `#s-p3`)
- window: 9.15 – 12.60s
- product: `assets/products/churros.png`
- copy: eyebrow `POSTRES & DULCES` · name `Churros` · sub `Desserts & Sweets`
- layout: type left, product right
- rules: same set as Frame 2
- transition_out: blur crossfade → Frame 5 at 12.35s

---

## Frame 5 — Coctel de Fruta

- id: `s-p4`
- status: outline
- src: inline (`index.html`, `#s-p4`)
- window: 12.35 – 15.80s
- product: `assets/products/coctel-fruta.png`
- copy: eyebrow `POSTRES & DULCES` · name `Coctel de Fruta` · sub `Fruit Cocktail`
- layout: type right, product left
- rules: same set as Frame 2, mirrored
- transition_out: zoom through → Frame 6 at 15.55s

---

## Frame 6 — Close / loop seam

- id: `s-close`
- status: outline
- src: inline (`index.html`, `#s-close`)
- window: 15.55 – 18.00s
- rules: `spring-pop-entrance`, `ambient-glow-bloom`, `multi-phase-camera`
- transition_out: clears to the bare branded field, matching t=0

The logo card returns and holds, then clears over the last 0.45s. The camera
drift completes exactly two whole sine cycles across the 18s, so its transform
at t=18.00 equals its transform at t=0 — that is what makes the loop seamless
rather than merely similar.

---

## Structure proposed for the full video (not built in this pass)

The proof is one cycle of a repeatable unit. Scaling it is additive:

| Block                    | Products | Runtime |
| ------------------------ | -------- | ------- |
| Open                     | —        | 3.0s    |
| Helados & Paletas        | 3        | 10.4s   |
| Bebidas                  | 2        | 6.9s    |
| Antojitos & Preparados   | 3        | 10.4s   |
| Postres & Dulces         | 5        | 17.3s   |
| Close / loop seam        | —        | 2.5s    |
| **Total**                | **13**   | **~51s**|

At 13 products the piece should move from one inline file to
`compositions/<product>.html` sub-compositions — one file per product, mounted
by a thin `index.html`. The proof is deliberately inline because a single
18-second file with hand-tuned transition seams is easier to review and change
than six files, and the conversion is mechanical.
