# File naming — La Sabrosita

The client's locked naming rule, from their workbook:

```
LS_[Product]_[Size]_MASTER_v01.png
```

In practice the same shape covers every artifact kind, not just masters:

```
LS_[Product]_[Size]_[KIND]_v[NN].[ext]
```

## The parts

| Part | Rule | Examples |
|---|---|---|
| `LS_` | Fixed prefix. Always. | `LS_` |
| `[Product]` | Product name, hyphenated, no spaces | `Banana-Split`, `Mangonada`, `Chicharron-Preparado` |
| `[Size]` | Only when the product has one. Omitted entirely if not. | `16oz` |
| `[KIND]` | Uppercase artifact kind | `ORIGINAL`, `ENHANCED`, `MASTER`, `QA-SHEET` |
| `v[NN]` | Two-digit version, zero-padded | `v01`, `v02` |
| `[ext]` | Whatever the file actually is | `.png`, `.jpg` |

Real files currently in the workspace:

```
LS_Banana-Split_ORIGINAL_v02.jpg
LS_Banana-Split_ENHANCED_v02.png
LS_Banana-Split_MASTER_v02.png
LS_Banana-Split_QA-SHEET_v02.jpg
LS_Mangonada_16oz_ORIGINAL_v02.jpg
LS_Mangonada_16oz_ENHANCED_v02.png
LS_Mangonada_16oz_MASTER_v02.png
LS_Mangonada_16oz_QA-SHEET_v02.jpg
```

Note `Mangonada_16oz` — the size is its own underscore-separated slot, while the
product name itself uses hyphens between words. That is what keeps `Banana-Split`
(one product, two words) distinguishable from `Mangonada_16oz` (product plus
size).

## Versions are never overwritten

A new version is a **new file** with the next number. `v01` stays on disk even
after `v02` exists.

This is not tidiness. Rubric stores paths, and a human approved a specific file.
Overwriting `v02` in place would silently change something already reviewed, and
nothing in the system would report it. Adding `v03` is visible.

If a `v01` was declared in the client's registry but never actually produced, it
stays recorded and Rubric reports it as `missing`. That is the honest answer, and
it is not a bug to be tidied away.

## Where each kind lives

```
assets/products/originals/    ORIGINAL
assets/products/enhanced/     ENHANCED
assets/products/masters/      MASTER
assets/products/qa/           QA-SHEET
```

## Client capture filenames

Files straight off the client's phone (`IMG_0504.HEIC`, `20260805_152634.jpg`)
keep their original names. They are evidence, and the original filename is part of
what makes them traceable back to the capture. They are **not** renamed into the
`LS_` scheme — a derived, renamed copy is a different artifact and gets its own
`LS_..._ORIGINAL_vNN` name.

## Menus and deliverables

Menu artwork and handoff packages are not in the client's workbook standard, so
these are this workspace's conventions:

```
menus/en/     LS_Menu_[Board]_EN_v[NN].[ext]
menus/es/     LS_Menu_[Board]_ES_v[NN].[ext]
menus/shared/ LS_Menu_[Asset]_v[NN].[ext]

deliverables/ YYYY-MM-DD_[what-it-is]/
```

Deliverable folders are dated first so they sort chronologically, e.g.
`2026-08-14_batch-1-masters/`.

## Never do this

- Rename an existing file under `assets/` — Rubric stores that path
- Reuse a version number
- Re-export or recompress a file "at the same name"
- Use spaces, accents, or `#`, `&`, `%` in filenames

The product `Chicharrón Preparado` carries its accent in the catalog name in
Rubric; the **filename** drops it: `LS_Chicharron-Preparado_...`.
