# tv-menu — Remotion TV menu workspace

**Nothing is built here yet.** This folder currently holds only the 47 product
masters staged for the TV menu, plus `products.json` that indexes them.

```
tv-menu/
  assets/products/    47 × LS_*_MASTER_v01.png  +  products.json
```

This README exists to record one decision before any code lands, because it is
much harder to undo afterwards.

## The brand system is not in this folder

The TV menu **reads its brand values from [`../brand/brand.json`](../brand/brand.json)**,
which is the workspace's official global brand source of truth. It is not a
TV-menu asset. The printed menus in `menus/en/` and `menus/es/`, promo scenes,
social, and print all read from the same file.

**Do not copy colours, fonts, or logo rules into this project.** Not into a
`theme.ts`, not into a Tailwind config, not into a constants file, not "just the
five hex codes to get started".

The reason is not tidiness. The client will revise the palette at some point, and
when they do, the revision has to reach the English TV board, the Spanish TV
board, the print menus, and every promo at the same moment. A hex code pasted
into a Remotion component is a second answer to "what colour is La Sabrosita
pink?", and second answers drift silently — the TV board keeps rendering the old
pink and nothing in the system reports it.

This is the same rule that keeps approval state in Rubric and nowhere else, and
that keeps `docs/production-standard.md` a mirror rather than a source. One fact,
one home. See [../CLAUDE.md](../CLAUDE.md).

## How to consume it, when the project is built

`brand.json` is plain JSON with no build step, so Remotion reads it directly:

```ts
import brand from '../../brand/brand.json';

const pink  = brand.color.palette.hotPink.hex;    // "#F20A88"
const cream = brand.color.palette.baseCream.hex;  // "#FFF8EF"
```

Read through the token name, not the literal. `brand.color.palette.hotPink.hex`
survives a palette revision; `"#F20A88"` typed into a component does not.

The logo comes from the same place — `brand/logos/LS_Logo_Primary_v01.png`,
referenced through `brand.logo.primary.file`. Do not copy it into
`tv-menu/assets/`.

## Before you style anything, read what the brand does not define

`brand.json` deliberately sets some fields to `null` and lists them under
`notSpecifiedInSource`. Several of them are things a TV menu needs immediately:

- gradient stop positions and angle
- corner radius for rounded panels
- type sizes and line heights
- **safe-title margins for TV output**
- **motion timing and easing**

The guidelines do not cover these. That means they are open questions for the
client, not blanks to fill in from taste and then treat as brand rules. When one
gets a real answer, it goes into `brand.json` — not into this folder.

Motion timing in particular has no brand answer at all today. The guidelines are
a static-design document; the only motion-adjacent line in the whole PDF is
"rounded animated shapes" on page 19.

## The product masters are frozen

The 47 PNGs in `assets/products/` are approved masters. Do not rename, move,
recompress, or regenerate them, and do not "clean up" `products.json`. Same rule
as the main `assets/` tree — see [../CLAUDE.md](../CLAUDE.md) and
[../docs/naming.md](../docs/naming.md).
