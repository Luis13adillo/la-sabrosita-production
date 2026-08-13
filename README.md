# La Sabrosita Ice Cream & Snacks — Production Workspace

Client media, menu artwork, and deliverables for La Sabrosita Ice Cream & Snacks,
Swedesboro, New Jersey.

Private repository. Everything in `assets/` is the client's property.

## What is here

| Folder | What it holds |
|---|---|
| `assets/` | Client media: source photos, enhanced intermediates, 2000×2000 masters, QA sheets |
| `menus/en/` | English menu boards |
| `menus/es/` | Spanish menu boards |
| `menus/shared/` | Artwork and data used by both languages |
| `motion/` | Future Remotion / code workspace — empty on purpose, nothing built yet |
| `deliverables/` | Dated client handoff packages only |
| `docs/` | Production standard and naming convention |

## Where production state lives

Not here. The pipeline, the stages, and the approval decisions live in **Rubric**
(`~/Desktop/rubric`, module `templates/product-assets`). This repo is the files.

Rubric reads this workspace directly: its `PRODUCT_ASSETS_ASSET_ROOT` points at
`~/Desktop/la-sabrosita/assets`, and every catalog entry stores a path relative to
that folder. **Renaming or moving anything under `assets/` breaks those links.**
Read [CLAUDE.md](CLAUDE.md) before touching that folder.

## Cloning this repo

Media is stored with [Git LFS](https://git-lfs.com). Install it once, then clone:

```bash
brew install git-lfs
git lfs install
git clone git@github.com:<owner>/la-sabrosita-production.git
```

Cloning without Git LFS installed gives you small text pointer files where the
images should be, and Rubric will report every asset as `missing`.

To confirm the media came down:

```bash
git lfs ls-files | wc -l    # should match the number of tracked media files
```

## House rules

- Never rename, move, recompress, or regenerate an existing file under `assets/`.
- New versions are new files with a new version number, never overwrites.
- No `approved/` folder — approval is Rubric's state, and it gets one home.
- No rendered video, render output, `node_modules`, or secrets in Git.

Full detail: [docs/production-standard.md](docs/production-standard.md) and
[docs/naming.md](docs/naming.md).
