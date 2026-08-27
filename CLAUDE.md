# La Sabrosita Ice Cream & Snacks — Production Workspace

This is the **client production workspace** for La Sabrosita Ice Cream & Snacks
(Swedesboro, New Jersey). It holds the client's own media and the menu/motion
work built from it.

## This is not Rubric

Rubric lives at `~/Desktop/rubric` and is a separate repository. It is the
production **tracker** — the pipeline, the stages, the approval state. This
workspace is the **media and deliverables**. They are deliberately two things:

| | Rubric (`~/Desktop/rubric`) | This workspace |
|---|---|---|
| Owns | pipeline state, stages, approvals, the product catalog | the actual files |
| Answers | "where is this product in production?" | "what are the bytes?" |
| Client media in git | no — gitignored on purpose | yes, via Git LFS |

**Never edit Rubric from this workspace.** No changes to `templates/product-assets`,
no changes to `products.json`, no new environment variables. If something needs to
change in the tracker, that is a separate task in the Rubric repo.

## `assets/` is referenced by Rubric — do not rename or move anything in it

Rubric's Product Assets module points `PRODUCT_ASSETS_ASSET_ROOT` at
`~/Desktop/la-sabrosita/assets`. Every file in the catalog is stored as a path
**relative to that folder**, for example:

```
products/originals/LS_Banana-Split_ORIGINAL_v02.jpg
products/masters/LS_Mangonada_16oz_MASTER_v02.png
```

Rubric checks whether each of those files exists on disk every time it loads.
That means:

- **Renaming a file breaks the link.** Rubric will report the artifact as
  `missing`, and a job can fall backwards down the pipeline.
- **Moving a file breaks the link**, same way.
- **Re-compressing or re-exporting a file changes the bytes** of an asset a human
  already reviewed and approved. The approved thing is the file, not the filename.

If a path genuinely has to change, the correct order is: change it in Rubric
first (so the catalog records the new path), then move the file. Not the reverse.

**Do not** delete, rename, move, regenerate, recompress, convert, or "clean up"
anything under `assets/`. New versions are added as new files with a new version
number — see [docs/naming.md](docs/naming.md).

## Approval state lives in Rubric, not here

There is intentionally **no `approved/` folder** in this workspace. Whether a
master is approved is a fact recorded in Rubric's catalog, and it must have
exactly one home. A folder named `approved/` would become a second, silently
drifting answer to the same question.

## `brand/` is the one source of brand values — import it, never copy it

`brand/brand.json` is the official **global** brand source of truth: colours,
typography, logo rules, visual direction. It is not a TV-menu asset. The TV
menus, the English and Spanish print menus, promo scenes, social, and print all
read from that one file.

**Do not paste brand values into a project.** No `theme.ts`, no Tailwind config,
no constants file, not "just the five hex codes to get started". Import
`brand.json` and read through the token name:

```ts
import brand from '../../brand/brand.json';
const pink = brand.color.palette.hotPink.hex;   // not "#F20A88"
```

A pasted hex code is a second answer to "what colour is La Sabrosita pink?" It
stops updating the day the client revises the palette, and nothing reports it —
the same class of silent drift that the no-`approved/`-folder rule prevents.

The **PDF in `brand/guidelines/` is authoritative**; `brand.json` is a
transcription of it. If they disagree, fix `brand.json`, never the PDF.

## The shop's own facts live in `brand/business.json`, not in `brand.json`

Address, phone number and opening hours are **not** in the guidelines PDF — all
20 pages of it and all 3 of the Identity Kit were read on 2026-08-26 to be sure.
They came from the client, from his Google Business Profile, and they live in
[brand/business.json](brand/business.json) so that `brand.json` keeps meaning
exactly one thing: what the PDF says.

    1422 Kings Hwy, Swedesboro, NJ 08085  ·  (856) 472-2254

Anything that needs an address, a phone number or opening hours **reads that
file**. Do not paste them into a page, a component, or a JSON-LD block — same
rule, and same reason, as the brand colours.

Where the guidelines do not define something — gradient stops, corner radius,
type sizes, TV safe-title margins, motion timing — `brand.json` says `null` and
lists it under `notSpecifiedInSource`. Those are questions for the client. Do not
fill one in from taste and let it become a de-facto brand rule. If the client
answers one, it goes into `brand.json`, not into the project that needed it.

New versions are new files (`LS_Brand-Guidelines_v02.pdf`), never overwrites —
same rule as everything else here. Full detail: [brand/README.md](brand/README.md).

## Folder map

```
brand/               official global brand source of truth
  guidelines/        the client's approved guidelines PDF
  logos/             logo files
  brand.json         machine-readable brand system — import this, never copy it
assets/              client media — read-only in practice, tracked in Git LFS
  products/
    originals/       client-supplied source photos and menu-board captures
    enhanced/        enhanced intermediates
    masters/         2000x2000 transparent PNG masters
    qa/              QA comparison sheets
menus/
  en/                English menu boards
  es/                Spanish menu boards
  shared/            artwork and data shared by both languages
motion/              future Remotion / code workspace (not built yet)
deliverables/        dated client handoff packages only
docs/
  production-standard.md   mirror of the client's locked production rules
  naming.md                file naming convention
```

## What does not go in Git

Rendered TV videos, Remotion render output, `node_modules`, secrets and `.env`
files, OS junk, and temporary files. See [.gitignore](.gitignore) — it is
commented, and the comments are the reasoning, not decoration.

## Docs are mirrors, not sources of truth

[docs/production-standard.md](docs/production-standard.md) is a **copy** of the
client's production rules, kept here so someone working in this repo can read them
without opening Rubric. The authoritative copy is
`templates/product-assets/config.json` in Rubric, which in turn came from the
client's own workbook. If the two ever disagree, Rubric is right and this file is
stale.
