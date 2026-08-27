# La Sabrosita website — 2026-08-26

Everything in `site/` is the finished website exactly as it would be served.
It is plain files: open `site/index.html` through any web server and it runs.
There is no build step, no database and nothing to install.

- `site/index.html` — Spanish
- `site/en/index.html` — English

## What is in it

| | |
| --- | --- |
| Products | 45 across 4 categories |
| Photographs | 62, every one a cut-out from your approved masters |
| Products with a description in both languages | 38 |
| Products shown name-only | 4 — see QUESTIONS-FOR-YOU.md |
| Prices anywhere | none |
| Total size of the site | 28.7 MB |

## How it compares to the two sites we were measured against

Every part of this site was judged against **michoacana.com** and
**heladosmexico.com** by someone who was shown three screenshots side by side with
the labels removed and did not know which was which. The same measurements were
taken on all three sites:

| | this site | heladosmexico | michoacana |
| --- | --- | --- | --- |
| How much of its tile the food fills, on a phone | **42%** | 36.8% | 44.4% |
| The same on a computer | **39%** | 36.8% | 44.4% |
| How much of the first screen the hero product fills | **~81%** | 64.5% | 32.3% |
| Products shown before you have to click anything | **45** | about 6 | about 6 |
| A description on every product | **yes, in two languages** | no | no |
| Search across the whole menu | **yes** | no | no |

Neither of those sites shows a full menu, which is the thing this site exists to
do. They sell packaged goods in wrappers; this one shows food as it is handed to
you.

## The other four files

- **QUESTIONS-FOR-YOU.md** — everything the site could not answer for itself.
  Short, and none of it is urgent.
- **INVENTED.md** — every value we had to choose because the brand guidelines
  leave it open, with the reasoning. These are our choices, not brand rules. If
  you decide differently, the answer goes into `brand/brand.json` and the site
  picks it up.
- **CHECKS.txt** — the output of the automated checks at the moment this package
  was built, all green.
- **HOW-TO-RUN-IT.md** — for whoever hosts it.

## What was not touched

Nothing in `assets/`. The website reads your approved masters and writes
smaller copies for the web into its own folder. Not one of your files was
renamed, moved, re-exported or re-compressed.
