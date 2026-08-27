# What is in this folder, and where each file came from

| File | Original | Taken | What it shows |
|---|---|---|---|
| `LS_Counter_ORIGINAL_v01.jpg` | `20260731_142131.jpg` | 2026-07-31 14:21 | The serving counter at an angle, La Sabrosita mark on the front panel, lit ceiling coves above |
| `LS_Display-Case_ORIGINAL_v01.jpg` | `20260731_142120.jpg` | 2026-07-31 14:21 | The ice cream case head-on, cups and toppings behind, window light on the right |
| `LS_Interior_ORIGINAL_v01.jpg` | `20260731_142134.jpg` | 2026-07-31 14:21 | Wide view down the room — the counter on the right, the pink arched booth seating on the left |
| `LS_Neon-Swedesboro_ORIGINAL_v01.jpg` | `ILoveSwedesboro.jpg` | supplied 2026-08-26 | THE sign — I ♥ SWEDESBORO, NJ. in yellow neon under the lit pink arch, with the tables beneath it. This is the one the town band's copy describes. |
| `LS_Storefront_ORIGINAL_v01.jpg` | `StoreFront.jpg` | supplied 2026-08-26 | The shop from the street: the window decal, the red awning, the sidewalk A-frame reading ¡NUEVA TIENDA! / NEW STORE, and the outdoor tables under the umbrella. |

Supplied by the client on 2026-08-26 in `~/Downloads/Photos-1-001 (7)/`. All three
were checked by sha256 against everything already under `assets/` before copying:
none was a duplicate. The originals in Downloads are untouched.

All three carry EXIF `orientation=6` — they are portrait photographs stored
landscape with a rotation flag. Browsers honour the flag, but image tooling often
does not, so any derivative must bake the rotation in rather than assume it.

## Nothing missing

The storefront and the neon arrived on 2026-08-26 as real files and are both
above. Every photograph the site's design asks for now exists.
