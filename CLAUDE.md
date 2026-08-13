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

## Folder map

```
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
