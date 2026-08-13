# Production Standard — La Sabrosita

**This file is a mirror, for reading.** The authoritative copy is
`productionStandard` in `templates/product-assets/config.json` in the Rubric repo,
which was copied verbatim from the *Production Standard* sheet of
`LaSabrosita_Master_Asset_Registry.xlsx` (the client's own workbook, read
2026-08-12).

Nothing in this repo should be treated as the source of truth for Rubric's
workflow state. If this file and Rubric disagree, Rubric is right and this file is
stale — fix it here, not there.

---

## The core rule

> **Enhance aggressively. Reconstruct conservatively. Preserve the product.**

Everything below is that sentence made specific.

## The locked rules, verbatim

| Rule | Value |
|---|---|
| Core rule | Enhance aggressively. Reconstruct conservatively. Preserve the product. |
| Master format | Transparent PNG |
| Canvas | 2000 × 2000 |
| Source selection | Choose strongest available source automatically |
| Source priority | Real high-quality product photo > other real photo > menu-board extraction > POS reference |
| Structural changes | Do not add/remove/change ingredients, quantities, toppings, containers, or defining characteristics without evidence |
| Batch size | 5–10 products where practical |
| QA | Compare enhancement against source before approval |
| Naming | `LS_[Product]_[Size]_MASTER_v01.png` |
| Uncertain product | Flag Needs Review / Source Needed; do not invent |
| Master usage | Approved master feeds English TV, Spanish TV, promo scenes, social/print |

## Master specification

A master is checked against this on every load in Rubric:

| Property | Value | Checked how |
|---|---|---|
| Width | 2000 | read off the PNG header — machine-checked |
| Height | 2000 | read off the PNG header — machine-checked |
| Format | PNG | read off the PNG header — machine-checked |
| Transparent | yes | read off the PNG header — machine-checked |
| Must not contain | text, price, branding, spec box, collage | **human judgement** — no header can tell you this |
| Standalone | yes (one product, alone) | **human judgement** |

The split matters. The first four are facts Rubric states. The last two are the
wording a person is agreeing to when they record a technical QA verdict. Treating
a human judgement as an automatic check is exactly the failure this split exists
to prevent.

## Source priority, in order

Rubric picks the strongest *present* source automatically, reading this list by
position:

1. `real-product-photo` — a real high-quality photo of the actual product
2. `other-real-photo` — some other real photograph
3. `menu-board-extraction` — pulled from the client's in-store menu board
4. `pos-reference` — a point-of-sale reference image

"Present" means the file is actually on disk. A source that is recorded but whose
file is missing cannot be selected.

## The pipeline stages

In order. Each stage is a precondition for the next, and Rubric derives the
current stage by walking this list and stopping at the first unmet condition — so
a job can never claim `technical-qa` while its master does not exist on disk.

1. `intake`
2. `registry-match`
3. `source-selection`
4. `enhancement`
5. `identity-qa`
6. `master-creation`
7. `technical-qa`
8. `awaiting-approval`
9. `approved`

**A spreadsheet cell cannot promote a job past a file that is not there.** The
registry's own "QA Status" column (values like *Approval Candidate*, *Needs
Review*) is carried alongside as `registryStatus` and deliberately not mapped onto
a stage. The registry states an intention about files; the stage is derived from
whether those files exist.

## Concurrency

At most **3 production jobs** may hold a slot at once.

This is not the same number as the workbook's batch size of 5–10. A batch is how
many products are planned and reviewed together; concurrency is how many jobs may
be in flight. Conflating them would let ten jobs run because ten were planned.

## Where approval is recorded

In Rubric. Not in this repo, and not as a folder name. There is no `approved/`
directory here on purpose — see [../CLAUDE.md](../CLAUDE.md).

## Generation

This workspace does not generate images, and neither does Rubric's Product Assets
module. Generation is the `generations` skill's job; it writes a JSON sidecar
beside every output recording model, provider, prompt, refs, params and cost, and
Rubric reads that sidecar rather than trusting a hand-typed model name.
