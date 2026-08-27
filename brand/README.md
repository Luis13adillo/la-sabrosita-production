# Brand — La Sabrosita

This folder is the **official global brand source of truth** for La Sabrosita Ice
Cream & Snacks. It is not TV-menu-specific and it is not menu-specific. Every
surface reads from here: TV menus, printed menus in both languages, promo scenes,
social, and print.

```
brand/
  brand.json                          the machine-readable brand system
  guidelines/
    LS_Brand-Guidelines_v01.pdf       the client's approved guidelines document
  logos/
    LS_Logo_Primary_v01.png           primary logo, transparent, 1915 × 1788
```

## The one rule

**Import `brand.json`. Never copy values out of it.**

A hex code pasted into a Remotion component is a second answer to "what colour is
La Sabrosita pink?" that nobody will remember to update. When the client revises
the palette, the revision has to land in exactly one place and reach every surface
at once. That is the entire reason this folder is top-level rather than living
inside `tv-menu/`.

This is the same reasoning that keeps approval state in Rubric and nowhere else —
see [../CLAUDE.md](../CLAUDE.md). One fact, one home.

## What is authoritative, and in which direction

The **PDF is authoritative.** `brand.json` is a transcription of it, kept in a
format code can read.

If the two ever disagree, the PDF is right and `brand.json` is stale — fix
`brand.json`, and never edit the PDF to match the code. This mirrors how
[../docs/production-standard.md](../docs/production-standard.md) relates to Rubric's
config: the readable copy defers to the real one.

## `brand.json` tells you when it does not know

The guidelines publish exact colour and typography, but they do not publish a
gradient angle, a corner radius, or type sizes. Those fields are present in
`brand.json` and set to `null`, with a `_warning` beside them, and they are listed
together under `notSpecifiedInSource`.

That is deliberate. The failure this prevents is someone needing a corner radius,
picking 24 px because it looked right on a Tuesday, and that number quietly
becoming "the brand radius" six files later. If you need one of those values, ask
the client and add it as a real answer.

The same honesty applies to the type hierarchy: page 17 of the PDF prints the four
levels, but the colours are read off the rendered example rather than stated as a
rule. `brand.json` records that distinction in `_hierarchyProvenance` instead of
flattening it.

## About the logo file

`LS_Logo_Primary_v01.png` was extracted losslessly from the client's
`La_Sabrosita_Brand_Identity_Kit.pdf` — the embedded image and its alpha mask,
decoded without recompression. It is a clean transparent cutout: corners fully
transparent, edges properly anti-aliased.

It is **not** a client-supplied standalone file, and it was not redrawn or
regenerated. If the client hands over the original vector or PNG, add it as
`v02` and update the `logo.primary` block in `brand.json`. Do not overwrite `v01`.

There is currently **no vector (SVG/AI/EPS) logo in this workspace.** For very
large print output, ask the client for one rather than upscaling this raster.

## Naming

Same house convention as the rest of the workspace — `LS_` prefix, hyphenated
names, zero-padded version, and **versions are never overwritten**. See
[../docs/naming.md](../docs/naming.md).

```
LS_Brand-Guidelines_v[NN].pdf
LS_Logo_[Variant]_v[NN].png
```

A revised guidelines document is `LS_Brand-Guidelines_v02.pdf` sitting beside
`v01`, plus a `brandVersion` bump in `brand.json`. It is never a replaced file —
the old one is what earlier work was built against.

## Git storage

The PDF and the logo are binaries and go through Git LFS, configured in
[../.gitattributes](../.gitattributes). `brand.json` and this README are text and
stay in Git normally, so their changes stay reviewable in a diff.

## `business.json` — the shop's own facts, kept beside the brand

`brand.json` is a transcription of the guidelines PDF and only that. The shop's
address, phone number and opening hours appear nowhere in that PDF, so they live
in [business.json](business.json) instead, with their provenance recorded in the
file: the client gave them on 2026-08-26 from his Google Business Profile.

    1422 Kings Hwy, Swedesboro, NJ 08085  ·  (856) 472-2254

Two hours entries carry a `_confirm` note — Friday closes at 18:00 and Saturday
runs 19:00–22:00, both unusual — and a block of `unconfirmed` facts scraped from
third-party listings (cash only, parking, wifi) that must not be published until
the client says they are true.
