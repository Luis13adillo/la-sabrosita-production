#!/usr/bin/env python3
"""
Build data/source-inventory.json from the client's MANUALLY APPROVED image folder.

Source of truth (client, 2026-08-16):

    ~/Downloads/LaSabrosita/       -> reached through assets/manual (a symlink)

This REPLACES tv-menu/assets/products/products.json for the reel. That catalog is
still Rubric's business and is untouched; it simply is not what this video reads
any more. Nothing in the Downloads folder is moved, renamed, copied or modified —
it is read in place, and the symlink is the only thing this project adds.

Why the table below is written out by hand instead of parsed from filenames:

  - Two files carry no product token at all (AguasFrescas.png, RealPaletas.png).
  - One filename has a stray trailing dash (`esquites-_master_v02`).
  - `elote-regular` and `elote-con-hot-cheetos` both start with "elote", so a
    prefix match would fold two different menu items together.
  - The category a product belongs to is a menu decision, not a filename fact.

So every row is a reviewed statement about a picture somebody actually looked at.
`depicts` is what is visible in the image, recorded so a later reader can check
the mapping without opening 46 files.

Run:  python3 scripts/build-inventory.py
"""

import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
PROJECT = HERE.parent
sys.path.insert(0, str(HERE))
import asset_paths as AP        # noqa: E402

# PORTABILITY, 2026-08-17
# ----------------------
# This used to read `assets/manual`, an ABSOLUTE symlink to
# ~/Downloads/LaSabrosita, so it only ran on one Mac. The selection now
# resolves through scripts/asset_paths.py, which reads data/image-paths.json
# and returns a path INSIDE the repository for every image. Nothing here
# reads Downloads any more.
SRC = None   # resolved per image by asset_paths
OUT = PROJECT / "data" / "source-inventory.json"

# The client's actual TV menu board, category by category and line by line.
# Used for two things, both of which matter:
#
#   1. ORDER. Products are sequenced the way they are printed on the board, so
#      related items land in the same scene because the menu says they are
#      related — Elote next to Elote Hot Cheetos, Esquite next to Esquite Hot
#      Cheetos. Sorting by filename instead put "elote-con-hot-cheetos" ahead of
#      "elote-regular" purely because c sorts before r, which is exactly the
#      filename logic this reel is not supposed to use.
#
#   2. A CHECK. Every display name below has to be a real line on that board.
#      If one is not, the build stops rather than inventing a menu item.
BOARD = PROJECT.parent.parent / "concept" / "widths.json"

# The four approved menu categories, in menu-board order.
CATEGORY_ORDER = ["HELADOS", "ANTOJITOS", "POSTRES", "BEBIDAS"]

# file -> (display name, category, what the image shows)
#
# Display names use the client's menu-board wording. No flavour name is invented
# anywhere: where a product has several images they share ONE name, and the
# difference between them is carried by the picture alone.
INVENTORY = {
    # ---------------------------------------------------------- HELADOS ---
    "RealPaletas.png": (
        "Paletas", "HELADOS",
        "grouped shot — the whole paleta range fanned on crushed ice with fruit"),
    # Renamed by the client 2026-08-16 (bananasplit -> bananasplit1). The old
    # filename no longer exists, so the previous reference was dead.
    "lasabrosita_bananasplit1_enhanced_v02_1786574294521.png": (
        "Banana Split", "HELADOS",
        "split banana in a white boat dish, three scoops, syrup, cherries"),
    "lasabrosita_choco-banana_master_v01_1786749441143.png": (
        "Choco Banana", "HELADOS",
        "chocolate-dipped banana on a stick with nut sprinkle"),
    "lasabrosita_crazy-shakes_master_v01_1786749567455.png": (
        "Crazy Shake", "HELADOS",
        "shake with whipped cream, chocolate drizzle and a whole Oreo"),
    "lasabrosita_crazy-shakes_master_v02_1786749103746.png": (
        "Crazy Shake", "HELADOS",
        "shake with a marshmallow-studded rim and chocolate drizzle down the cup"),
    "lasabrosita_crazy-shakes_master_v03_1786751666844.png": (
        "Crazy Shake", "HELADOS",
        "shake with a chocolate-sprinkle rim and two wafer sticks standing up"),
    "lasabrosita_crazy-shakes_master_v04_1786754000102.png": (
        "Crazy Shake", "HELADOS",
        "pink shake, rainbow-sprinkle rim, cake slice and a candle"),
    "lasabrosita_helado-chico_master_v01_1786750132349.png": (
        "Helado en Cono", "HELADOS",
        "two scoops on a waffle cone"),
    "lasabrosita_helado-chino_master_v01_1786749676565.png": (
        "Helado Chino", "HELADOS",
        "packaged peach-flavour moulded ice cream in its printed box"),
    "lasabrosita_helado-chino_master_v02_1786751663700.png": (
        "Helado Chino", "HELADOS",
        "packaged mango-flavour moulded ice cream in its printed box"),
    "lasabrosita_paleta-loca_master_v02_1786750630712.png": (
        "Paletas Locas", "HELADOS",
        "chamoy cup loaded with fruit, a tamarind paleta standing in it"),
    "lasabrosita_sandwich-de-helado_master_v01_1786745597408.png": (
        "Sandwich de Helado", "HELADOS",
        "vanilla ice-cream sandwich between two chocolate wafers"),
    "lasabrosita_vaso-la-sabrosita_master_v01_1786752206548.png": (
        "La Sabrosita", "HELADOS",
        "the house cup — layered ice cream, strawberries, cake and wafer"),

    # -------------------------------------------------------- ANTOJITOS ---
    "lasabrosita_chicharron-en-rueda_master_v01_1786750264098.png": (
        "Chicharron en Rueda", "ANTOJITOS",
        "bagged wheel-shaped chicharrones, plain"),
    "lasabrosita_chicharron-preparado_master_v02_1786737545135.png": (
        "Chicharron Preparado", "ANTOJITOS",
        "flat chicharron sheet dressed with cabbage, cream, tomato and lime"),
    "lasabrosita_diablitos_master_v01_1786749677163.png": (
        "Diablitos", "ANTOJITOS",
        "dark chamoy cup with tamarind straw and a red straw"),
    # Client supplied a corrected transparent cut-out on 2026-08-16 under a new
    # filename (enhanced_v01 -> master_v01). Same product, same identity.
    "lasabrosita_elote-regular_master_v01_1786750023360.png": (
        "Elote", "ANTOJITOS",
        "corn on a stick with mayo, cheese and chile"),
    "lasabrosita_elote-con-hot-cheetos_master_v02_1786750634245.png": (
        "Elote Hot Cheetos", "ANTOJITOS",
        "corn on a stick coated in crushed Hot Cheetos with mustard drizzle"),
    "lasabrosita_esquimales_master_v01_1786749455174.png": (
        "Esquimal", "ANTOJITOS",
        "chocolate-coated bar on a stick under dense rainbow sprinkles"),
    "lasabrosita_esquites-_master_v02_1786750022528.png": (
        "Esquite", "ANTOJITOS",
        "white foam cup of corn with cheese, chile powder, lime and a spoon"),
    "lasabrosita_esquites-hot-cheetos_master_v02_1786750022528.png": (
        "Esquite Hot Cheetos", "ANTOJITOS",
        "white foam cup of corn under a tall red Hot Cheetos mound, lime wedge"),
    "lasabrosita_marucha-loca_master_v01_1786737425162.png": (
        "Marucha Loca", "ANTOJITOS",
        "instant-noodle cup buried in Hot Cheetos, cream and cheese in a tray"),
    "lasabrosita_platano-frito_master_v01_1786750053785.png": (
        "Platano Frito", "ANTOJITOS",
        "fried plantain rounds with cream and strawberry drizzle"),
    "lasabrosita_tostilocos_master_v01_1786749464122.png": (
        "Tostilocos", "ANTOJITOS",
        "open Tostitos bag loaded with cucumber, jicama, peanuts and chamoy"),

    # ---------------------------------------------------------- POSTRES ---
    "lasabrosita_bionico-con-nieve_master_v02_1786750635027.png": (
        "Bionico con Nieve", "POSTRES",
        "tray of fruit and cream topped with strawberries and a cherry"),
    "lasabrosita_churros_master_v01_1786751660230.png": (
        "Churros", "POSTRES",
        "kraft carton of sugared churros"),
    "lasabrosita_coktel-de-fruta_master_v03_1786643037755.png": (
        "Coctel de Fruta", "POSTRES",
        "clear cup of layered fruit with chile and standing mango spears"),
    "lasabrosita_crepa_master_v01_1786750148022.png": (
        "Crepa", "POSTRES",
        "folded crepe with strawberries, cream and icing sugar"),
    # Corrected transparent version, 2026-08-16, then renamed by the client
    # (crepa-dubai -> crepa-dubai1). The plating changed with the correction:
    # the dish is on a white plate now, not in a clamshell.
    "lasabrosita_crepa-dubai1_enhanced_v01_1786749837363.png": (
        "Crepa Dubai", "POSTRES",
        "crepe on a white plate under green kataifi, banana, strawberry and chocolate"),
    "lasabrosita_croissant-con-helado_master_v01_1786752208201.png": (
        "Croissant", "POSTRES",
        "split croissant in a clamshell with ice cream, fruit and chocolate"),
    "lasabrosita_fresas-con-crema_master_v01_1786749781237.png": (
        "Fresas con Crema", "POSTRES",
        "cup of strawberries in cream under a whipped-cream crown"),
    "lasabrosita_fresas-dubai_master_v01_1786737290671.png": (
        "Fresas Dubai", "POSTRES",
        "cup of chocolate-shelled strawberries with pistachio crumb"),
    "lasabrosita_fresas-en-cajita_master_v01_1786749786803.png": (
        "Fresas en Cajita", "POSTRES",
        "printed strawberry carton topped with cream, sprinkles, wafer and cherry"),
    "lasabrosita_gelatina_master_v02_1786750022930.png": (
        "Gelatina", "POSTRES",
        "lidded cup — pink base with blue and purple gelatin cubes"),
    "lasabrosita_gelatina_master_v03_1786750138087.png": (
        "Gelatina", "POSTRES",
        "lidded cup — white base with blue and green gelatin cubes"),
    "lasabrosita_mango-en-palo_master_v02_1786750623131.png": (
        "Mango en Flor", "POSTRES",
        "mango carved into a flower on a stick, dusted with chile"),
    "lasabrosita_mini-pancakes_master_v01_1786749822726.png": (
        "Mini Pancakes", "POSTRES",
        "tray of mini pancakes with chocolate drizzle and sliced strawberries"),
    "lasabrosita_mini-pancakes-dubai_master_v01_1786750287502.png": (
        "Mini Pancakes Dubai", "POSTRES",
        "clamshell of mini pancakes under green kataifi and pistachio"),
    "lasabrosita_waffle_master_v01_1786749802836.png": (
        "Waffle", "POSTRES",
        "waffle bowl with cream, strawberries, chocolate and wafer sticks"),

    # ---------------------------------------------------------- BEBIDAS ---
    "AguasFrescas.png": (
        "Aguas Frescas", "BEBIDAS",
        "grouped shot — a full row of aguas frescas jars with the fruit they are made from"),
    "lasabrosita_aguas-explosivas_master_v01_1786749566189.png": (
        "Aguas Explosivas", "BEBIDAS",
        "chamoy-rimmed cup loaded with fruit, tamarind stick and straw"),
    "lasabrosita_chamoyada_master_v01_1786746470000.png": (
        "Chamoyada", "BEBIDAS",
        "mango chamoyada with chamoy swirl and a tamarind straw"),
    "lasabrosita_frappe-20oz_master_v01_1786749550180.png": (
        "Frappe", "BEBIDAS",
        "chocolate frappe with whipped cream and a green straw"),
    "lasabrosita_licuado_master_v02_1786749106577.png": (
        "Licuado", "BEBIDAS",
        "strawberry licuado under a dome lid with whipped cream and a cherry"),
    "lasabrosita_michelaguas_master_v01_1786750172488.png": (
        "Michelaguas", "BEBIDAS",
        "branded Micheláguas jar of mango with a chile rim"),
    "lasabrosita_raspados_master_v01_1786749454753.png": (
        "Raspado", "BEBIDAS",
        "cup of red shaved ice piled above the rim"),
}

# Images that are photographs on a white background rather than transparent
# cut-outs cannot sit directly on the brand gradient, so build-frames.py puts
# them on a cream card instead. Which images those are is DETECTED here from the
# alpha channel, never hand-listed — so when the client supplies a corrected
# cut-out the card disappears on the next build with no code change.
#
# As of 2026-08-16 the list is empty: Banana Split, Elote and Crepa Dubai were
# the last three, and all three have been replaced with transparent versions.


def board_order():
    """{category: [menu line, ...]} in printed board order."""
    raw = json.loads(BOARD.read_text())
    return {c: list(raw[c].keys()) for c in CATEGORY_ORDER}


def main():
    files = sorted(AP.all_images())
    missing = [f for f in files if f not in INVENTORY]
    stale = [f for f in INVENTORY if f not in files]
    if missing:
        raise SystemExit(
            "Images in assets/manual that this table does not describe:\n  "
            + "\n  ".join(missing)
            + "\n\nLook at each one and add a row. Do not guess from the filename.")
    if stale:
        raise SystemExit(
            "INVENTORY names files that are not in assets/manual:\n  " + "\n  ".join(stale))

    # Every display name must be a real line on the client's board.
    board = board_order()
    offboard = sorted({
        f"{cat} / {name}" for name, cat, _ in INVENTORY.values() if name not in board[cat]
    })
    if offboard:
        raise SystemExit(
            "These display names are not lines on the client's menu board "
            f"({BOARD}):\n  " + "\n  ".join(offboard)
            + "\n\nUse the board's wording. Do not invent a menu item.")

    from PIL import Image
    Image.MAX_IMAGE_PIXELS = None

    entries = []
    for f in files:
        name, cat, depicts = INVENTORY[f]
        im = Image.open(AP.abs_for(f))
        w, h = im.size
        if im.mode in ("RGBA", "LA") or "transparency" in im.info:
            lo, _ = im.convert("RGBA").split()[-1].getextrema()
            cutout = lo < 255
        else:
            cutout = False
        entries.append({
            "file": f,
            "name": name,
            "category": cat,
            "depicts": depicts,
            "width": w, "height": h,
            "cutout": cutout,
            "boardRank": board[cat].index(name),
        })

    # Sequence by the printed board, then keep a product's own images adjacent
    # in the order the client numbered them.
    entries.sort(key=lambda e: (CATEGORY_ORDER.index(e["category"]), e["boardRank"], e["file"]))

    by_name = {}
    for e in entries:
        by_name.setdefault(e["name"], []).append(e["file"])

    inv = {
        "_generated": "scripts/build-inventory.py — edit the script's INVENTORY table, not this file",
        "_source": "~/Downloads/LaSabrosita (client's manual selection, 2026-08-16), read via assets/manual",
        "_note": "This supersedes tv-menu/assets/products/products.json for the reel. "
                 "That catalog is unmodified and still Rubric's source of truth.",
        "imageCount": len(entries),
        "productCount": len(by_name),
        "opaqueImages": [e["file"] for e in entries if not e["cutout"]],
        "categoryOrder": CATEGORY_ORDER,
        "productsPerCategory": {
            c: sorted({e["name"] for e in entries if e["category"] == c}) for c in CATEGORY_ORDER
        },
        "multiImageProducts": {k: v for k, v in by_name.items() if len(v) > 1},
        "images": entries,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(inv, indent=2, ensure_ascii=False) + "\n")

    print(f"wrote {OUT.relative_to(PROJECT)}")
    print(f"  {inv['imageCount']} images -> {inv['productCount']} distinct products")
    for c in CATEGORY_ORDER:
        print(f"    {c:<10} {len(inv['productsPerCategory'][c]):>2} products")
    print(f"  products with more than one image:")
    for k, v in inv["multiImageProducts"].items():
        print(f"    {k:<22} {len(v)}")
    print(f"  images with NO transparency (need a card): {len(inv['opaqueImages'])}")
    for f in inv["opaqueImages"]:
        print(f"    {f}")


if __name__ == "__main__":
    main()
