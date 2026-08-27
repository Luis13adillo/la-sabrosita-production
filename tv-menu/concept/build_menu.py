#!/usr/bin/env python3
"""
Build the La Sabrosita Spanish TV menu board concept (1920x1080).

Reads brand values from brand/brand.json through token names (never pasted hex).
Places approved MASTER PNGs from tv-menu/assets/products/ untouched except for
transparent-padding trim, scale and position.
"""
import json, os, shutil, subprocess, sys
from PIL import Image

ROOT = "/Users/luismiguel/Desktop/la-sabrosita"
SP = "/private/tmp/claude-501/-Users-luismiguel-Desktop-la-sabrosita/12a39cec-ca2d-49e0-b5af-2de1e5ca044e/scratchpad"
BUILD = os.path.join(SP, "build")
IMG = os.path.join(BUILD, "img")
os.makedirs(IMG, exist_ok=True)

# ---------------------------------------------------------------- brand ----
brand = json.load(open(os.path.join(ROOT, "brand", "brand.json")))
P = brand["color"]["palette"]
PINK   = P["hotPink"]["hex"]
PURPLE = P["deepPurple"]["hex"]
BLUE   = P["electricBlue"]["hex"]
YELLOW = P["sunnyYellow"]["hex"]
CREAM  = P["baseCream"]["hex"]
DARK   = brand["color"]["contrastFields"]["darkContrast"]
FAMILY = ", ".join(f"'{f}'" if " " in f else f for f in brand["typography"]["fallbackStack"])
LOGO_SRC = os.path.join(ROOT, "brand", brand["logo"]["primary"]["file"])

def rgba(hex_, a):
    h = hex_.lstrip("#")
    return f"rgba({int(h[0:2],16)},{int(h[2:4],16)},{int(h[4:6],16)},{a})"

# ------------------------------------------------------- product assets ----
PROD_DIR = os.path.join(ROOT, "tv-menu", "assets", "products")
_cache = {}

def art(filename, max_long=1200):
    """Trim transparent padding + downscale for render. Product pixels unaltered."""
    if filename not in _cache:
        im = Image.open(os.path.join(PROD_DIR, filename)).convert("RGBA")
        im = im.crop(im.getchannel("A").getbbox())
        if max(im.size) > max_long:
            s = max_long / max(im.size)
            im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        im.save(os.path.join(IMG, filename))
        _cache[filename] = {"path": "img/" + filename, "aspect": im.width / im.height}
    return _cache[filename]

def food(filename, *, h, x, y, z=5, rot=0, shadow=1.0):
    a = art(filename)
    w = h * a["aspect"]
    tf = f"transform:rotate({rot}deg);" if rot else ""
    sh = (f"filter:drop-shadow(0 {26*shadow:.0f}px {34*shadow:.0f}px rgba(0,0,0,.55)) "
          f"drop-shadow(0 4px 10px rgba(0,0,0,.4));")
    return (f'<img class="food" src="{a["path"]}" style="left:{x:.0f}px;top:{y:.0f}px;'
            f'width:{w:.0f}px;height:{h:.0f}px;z-index:{z};{tf}{sh}">')

# ------------------------------------------------------------- content ----
MENU = {
    "HELADOS": ("HELADOS", "& PALETAS", [
        "Banana Split", "Choco Banana", "Crazy Shake Oreo", "Crazy Shake Marshmallows",
        "Crazy Shake Cookies", "Helado en Cono", "Helado Chino", "La Sabrosita",
        "Paletas", "Paletas Locas", "Sandwich de Helado"]),
    "ANTOJITOS": ("ANTOJITOS", "& PREPARADOS", [
        "Diablitos", "Elote", "Elote Hot Cheetos", "Esquimal", "Esquite",
        "Esquite Hot Cheetos", "Chicharron en Rueda", "Chicharron Preparado",
        "Marucha Loca", "Nachos", "Platano Frito", "Tostilocos", "Tosti Esquite"]),
    "POSTRES": ("POSTRES", "& DULCES", [
        "Bionico", "Bionico con Nieve", "Bomba", "Canasta", "Churros",
        "Coctel de Fruta", "Crepa", "Crepa Dubai", "Croissant", "Fresas con Crema",
        "Fresas Dubai", "Fresas en Cajita", "Gelatina", "Mango en Flor",
        "Mini Pancakes", "Mini Pancakes Dubai", "Pastel Tres Leche", "Waffle"]),
    "BEBIDAS": ("BEBIDAS", "", [
        "Aguas Frescas", "Aguas Explosivas", "Chamoyada", "Frappe", "Licuado",
        "Mangonada", "Michelaguas", "Raspado", "Sodas Exoticas"]),
}
WIDTHS = json.load(open(os.path.join(SP, "widths.json")))

BOTTOM = [
    (PINK,   "drop",  "Diferentes sabores de ", "Aguas Frescas", " todos los días.",  YELLOW),
    (BLUE,   "cone",  "Diferentes sabores de ", "helado", " todos los días.",          BLUE),
    (YELLOW, "leaf",  "Todos nuestros sabores son ", "naturales.", " Sin sabores artificiales.", YELLOW),
    (PINK,   "heart", "Personaliza tu helado con tus ", "sabores y toppings", " favoritos.", YELLOW),
]

BULLET, PAD, GAP = 24, 24, 18

def split(items, n):
    out, i = [], 0
    for k in n:
        out.append(items[i:i + k]); i += k
    assert i == len(items)
    return out

def panel_width(key, splits, fs, pad=PAD, gap=GAP):
    w = WIDTHS[key]
    return round(sum(max(w[t] for t in c) * fs + BULLET for c in split(MENU[key][2], splits))
                 + gap * (len(splits) - 1) + pad * 2)

def panel(key, x, y, w, h, *, splits, fs, lh, style="rule", accent=PINK,
          title_fs=42, pad=PAD, gap=GAP, tgap=14, z=20, pad_top=0):
    a, b, items = MENU[key]
    wd = WIDTHS[key]
    cols = []
    for c in split(items, splits):
        cw = round(max(wd[t] for t in c) * fs + BULLET)
        lis = "".join(
            f'<li style="font-size:{fs}px;line-height:{lh}px">'
            f'<span class="dot" style="background:{accent};width:{round(fs*.26)}px;'
            f'height:{round(fs*.26)}px;top:{round(lh/2-fs*.13)}px"></span>{t}</li>' for c_ in [c] for t in c_)
        cols.append(f'<ul style="width:{cw}px">{lis}</ul>')
    body = (f'<div class="cols" style="gap:{gap}px;padding-top:{pad_top}px">'
            + "".join(cols) + "</div>")
    if style == "bar":
        head = (f'<div class="bar" style="background:{accent};font-size:{title_fs}px">'
                f'{a} <span style="opacity:.9">{b}</span></div>')
        cls = "panel bar-panel"
    else:
        sec = f'<span style="color:{accent}"> {b}</span>' if b else ""
        head = (f'<div class="ttl" style="font-size:{title_fs}px">{a}{sec}</div>'
                f'<div class="rule" style="background:{accent}"></div>')
        cls = "panel"
    return (f'<div class="{cls}" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;'
            f'z-index:{z};--pad:{pad}px;--tgap:{tgap}px">{head}{body}</div>')

def star(x, y, s, color, op=1, rot=0, z=3):
    return (f'<svg class="deco" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px;'
            f'opacity:{op};transform:rotate({rot}deg);z-index:{z}" viewBox="0 0 100 100">'
            f'<path fill="{color}" d="M50 0C56 34 66 44 100 50C66 56 56 66 50 100'
            f'C44 66 34 56 0 50C34 44 44 34 50 0Z"/></svg>')

def ico(kind):
    c = CREAM
    d = {
      "drop": f'<path fill="{c}" d="M50 12C68 36 80 50 80 63a30 30 0 0 1-60 0C20 50 32 36 50 12Z"/>',
      "cone": (f'<path fill="{c}" d="M50 14a21 21 0 0 1 21 21a19 19 0 0 1-2 9H31a19 19 0 0 1-2-9'
               f'a21 21 0 0 1 21-21Z"/><path fill="{c}" d="M30 50h40L50 92Z"/>'),
      "leaf": (f'<path fill="{c}" d="M86 14C48 10 20 30 18 58c-1 20 10 32 10 32'
               f'C36 62 56 36 86 14Z"/>'
               f'<path fill="{c}" d="M88 11C56 34 36 62 26 96l9 3C44 68 62 40 92 17Z"/>'),
      "heart": f'<path fill="{c}" d="M50 84C22 64 14 50 14 38A20 20 0 0 1 50 28A20 20 0 0 1 86 38C86 50 78 64 50 84Z"/>',
    }[kind]
    return f'<svg viewBox="0 0 100 100">{d}</svg>'

# ================================================================= LAYOUT ====
# Vertical bands
BAND_LOW_Y, BAND_LOW_H = 662, 284        # antojitos / postres
TALL_Y,  TALL_H        = 186, 468        # helados / bebidas
BAR_H                  = 126

parts = []

# ---- background ------------------------------------------------------------
parts.append(f'''
<div class="bg"></div>
<svg class="bgart" viewBox="0 0 1920 1080" preserveAspectRatio="none">
 <defs>
  <radialGradient id="gv"><stop offset="0" stop-color="{PURPLE}" stop-opacity="1"/>
    <stop offset="1" stop-color="{PURPLE}" stop-opacity="0"/></radialGradient>
  <radialGradient id="gp"><stop offset="0" stop-color="{PINK}" stop-opacity=".46"/>
    <stop offset="1" stop-color="{PINK}" stop-opacity="0"/></radialGradient>
  <radialGradient id="gb"><stop offset="0" stop-color="{BLUE}" stop-opacity=".30"/>
    <stop offset="1" stop-color="{BLUE}" stop-opacity="0"/></radialGradient>
  <linearGradient id="brush" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="{PINK}" stop-opacity=".85"/>
    <stop offset="1" stop-color="{PINK}" stop-opacity=".25"/></linearGradient>
 </defs>
 <ellipse cx="960" cy="330" rx="880" ry="430" fill="url(#gv)"/>
 <ellipse cx="180"  cy="300" rx="520" ry="420" fill="url(#gp)"/>
 <ellipse cx="1780" cy="300" rx="520" ry="430" fill="url(#gp)"/>
 <ellipse cx="960"  cy="1010" rx="1000" ry="300" fill="url(#gb)"/>
 <ellipse cx="960"  cy="640" rx="720" ry="280" fill="url(#gp)" opacity=".5"/>
 <path d="M-60 620C300 540 700 700 1090 606C1450 520 1740 690 1990 604" stroke="{PINK}"
   stroke-opacity=".13" stroke-width="150" fill="none" stroke-linecap="round"/>
 <path d="M-60 250C340 156 660 356 1000 250" stroke="{BLUE}" stroke-opacity=".12"
   stroke-width="96" fill="none" stroke-linecap="round"/>
 <path d="M1180 880C1420 820 1700 900 1990 840" stroke="{BLUE}" stroke-opacity=".10"
   stroke-width="90" fill="none" stroke-linecap="round"/>
</svg>''')

# header brush band with drips (brand motif: subtle drips)
parts.append(f'''
<svg class="deco" style="left:-40px;top:-70px;width:2000px;height:330px;z-index:2"
     viewBox="0 0 2000 330">
 <path fill="url(#brush2)" d="M0 90C230 46 420 116 690 82C960 48 1210 118 1500 84
   C1720 58 1880 104 2000 78L2000 0L0 0Z"/>
 <defs><linearGradient id="brush2" x1="0" y1="0" x2="0" y2="1">
   <stop offset="0" stop-color="{PINK}" stop-opacity=".34"/>
   <stop offset="1" stop-color="{PINK}" stop-opacity="0"/></linearGradient></defs>
 <g fill="{PINK}" opacity=".26">
   <path d="M240 84c10 0 14 26 8 40s-20 12-24 -2 2 -38 16 -38Z"/>
   <path d="M628 74c11 0 15 34 8 50s-22 14-26 -3 4 -47 18 -47Z"/>
   <path d="M1180 84c10 0 14 28 8 42s-21 12-25 -3 3 -39 17 -39Z"/>
   <path d="M1622 76c11 0 15 30 8 45s-21 13-25 -3 3 -42 17 -42Z"/>
 </g>
</svg>''')

for s in [(300, 296, 30, YELLOW, .95, 0), (256, 366, 17, CREAM, .8, 20),
          (762, 120, 26, YELLOW, .9, 0),  (1140, 92, 20, CREAM, .7, 15),
          (1276, 402, 24, YELLOW, .85, 0), (1596, 118, 18, YELLOW, .8, 0),
          (92, 556, 22, PINK, .9, 0),      (1858, 690, 24, YELLOW, .75, 0),
          (330, 700, 20, CREAM, .55, 0),   (1080, 632, 18, PINK, .8, 0),
          (596, 122, 15, CREAM, .65, 0),   (1420, 634, 20, CREAM, .6, 0)]:
    parts.append(star(*s))

# ---- header ----------------------------------------------------------------
LOGO_W = 278
LOGO_H = LOGO_W * brand["logo"]["primary"]["height"] / brand["logo"]["primary"]["width"]
assert LOGO_W >= brand["logo"]["minimumSize"]["digitalMinWidthPx"]
parts.append(f'<img class="logo" src="logo.png" style="left:44px;top:6px;'
             f'width:{LOGO_W}px;height:{LOGO_H:.0f}px;z-index:40">')

parts.append('''
<div class="head" style="z-index:38">
  <div class="h1">¡HECHO CON</div>
  <div class="h2">SABOR!</div>
  <div class="h3">Para ti</div>
</div>''')

parts.append(f'''
<div class="badge" style="z-index:38">
  <svg viewBox="0 0 344 216" class="blob">
    <path fill="{PINK}" d="M170 4c60 -10 122 26 144 74c20 44 4 94 -34 118c-42 26 -106 22 -150 10
      C86 194 38 170 24 128C10 84 38 38 82 20c26 -11 60 -10 88 -16Z"/>
  </svg>
  <div class="btxt">
    <div class="b1">TODO</div><div class="b2">NATURAL</div>
    <div class="b3">SIN SABORES</div><div class="b3">ARTIFICIALES</div>
  </div>
</div>''')

# ---- callout blob (sits behind the centre hero, peeking right) --------------
parts.append(f'''
<div class="callout" style="left:1112px;top:190px;width:198px;height:198px;z-index:24">
  <svg viewBox="0 0 200 200"><path fill="{PINK}" d="M100 3c50 -3 90 34 96 80
    c6 46 -28 92 -74 108c-45 15 -96 -8 -113 -50C-8 98 14 46 54 20c14 -9 30 -15 46 -17Z"/></svg>
  <div class="ctxt"><span>CRAZY</span><span class="y">SHAKE</span><span>COOKIES</span></div>
</div>''')

# ---- food ------------------------------------------------------------------
parts.append(food("LS_Crazy-Shakes_MASTER_v01.png", h=468, x=-72, y=196, z=12))   # left bleed
parts.append(food("LS_Esquimales_MASTER_v01.png",   h=256, x=150, y=396, z=16, rot=-13))
parts.append(food("LS_Mango-en-Palo_MASTER_v02.png",h=250, x=232, y=398, z=15, rot=12))
parts.append(food("LS_Crazy-Shakes_MASTER_v03.png", h=505, x=880, y=146, z=32))   # centre hero
parts.append(food("LS_Esquites_MASTER_v01.png",     h=214, x=744, y=440, z=18))
parts.append(food("LS_Frappe_20oz_MASTER_v01.png",  h=214, x=1104, y=424, z=26))
parts.append(food("LS_Raspados_MASTER_v01.png",     h=222, x=1188, y=420, z=25))
parts.append(food("LS_Chamoyada_MASTER_v01.png",    h=484, x=1640, y=172, z=30))  # right hero
parts.append(food("LS_Waffle_MASTER_v01.png",       h=202, x=1750, y=728, z=34))

# ---- panels ----------------------------------------------------------------
w_hel = panel_width("HELADOS", [11], 27, pad=26)
parts.append(panel("HELADOS", 332, TALL_Y, w_hel, TALL_H, splits=[11], fs=27, lh=32,
                   accent=BLUE, title_fs=42, pad=26, tgap=12))

w_beb = panel_width("BEBIDAS", [9], 27, pad=26)
parts.append(panel("BEBIDAS", 1326, TALL_Y, w_beb, 420, splits=[9], fs=27, lh=32,
                   accent=BLUE, title_fs=42, pad=26, tgap=12))

w_ant = panel_width("ANTOJITOS", [5, 4, 4], 26)
parts.append(panel("ANTOJITOS", 40, BAND_LOW_Y, w_ant, BAND_LOW_H, splits=[5, 4, 4],
                   fs=26, lh=34, style="bar", accent=PINK, title_fs=34, tgap=12,
                   pad_top=17))

w_pos = panel_width("POSTRES", [6, 6, 6], 26)
parts.append(panel("POSTRES", 40 + w_ant + 22, BAND_LOW_Y, w_pos, BAND_LOW_H,
                   splits=[6, 6, 6], fs=26, lh=34, style="bar", accent=BLUE,
                   title_fs=34, tgap=12))

# ---- bottom bar ------------------------------------------------------------
cells = []
for color, kind, pre, hi, post, hicol in BOTTOM:
    cells.append(f'<div class="cell"><div class="ic" style="background:{color}">{ico(kind)}</div>'
                 f'<div class="ctext">{pre}<b style="color:{hicol}">{hi}</b>{post}</div></div>')
parts.append('<div class="botbar" style="z-index:50">'
             + '<div class="sep"></div>'.join(cells) + '</div>')

print("widths:", w_hel, w_beb, w_ant, w_pos, "| antojitos 40 ->", 40+w_ant,
      "| postres", 40+w_ant+22, "->", 40+w_ant+22+w_pos)

# ------------------------------------------------------------------ html ----
FONTCSS = open(os.path.join(SP, "fonts", "noto-embedded.css")).read()
R = 30   # brand.visualDirection.cornerRadius is null - chosen here, not brand-approved

html = f'''<meta charset="utf-8"><title>La Sabrosita — Menú ES</title>
<style>
{FONTCSS}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:1920px;height:1080px;overflow:hidden;background:{DARK}}}
body{{font-family:{FAMILY};-webkit-font-smoothing:antialiased;position:relative}}
.bg{{position:absolute;inset:0;z-index:0;background:
  linear-gradient(157deg,{PURPLE} 0%,{rgba(PURPLE,.45)} 46%,{DARK} 100%),{DARK}}}
.bgart{{position:absolute;inset:0;width:1920px;height:1080px;z-index:1}}
.deco{{position:absolute}}
.food{{position:absolute;object-fit:contain}}
.logo{{position:absolute;object-fit:contain}}

.head{{position:absolute;left:360px;top:0;width:640px;text-align:center}}
.h1{{font-weight:800;font-size:47px;line-height:48px;color:{CREAM};letter-spacing:.015em}}
.h2{{font-weight:900;font-size:102px;line-height:90px;color:{PINK};letter-spacing:-.012em;
  -webkit-text-stroke:7px {CREAM};paint-order:stroke fill}}
.h3{{font-weight:800;font-style:italic;font-size:43px;line-height:43px;color:{CREAM};
  transform:translateX(108px)}}

.badge{{position:absolute;left:1544px;top:0;width:344px;height:216px}}
.badge .blob{{position:absolute;inset:0;width:344px;height:216px;
  filter:drop-shadow(0 12px 24px rgba(0,0,0,.42))}}
.btxt{{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
  justify-content:center;text-align:center}}
.b1{{font-weight:900;font-size:40px;line-height:40px;color:{CREAM}}}
.b2{{font-weight:900;font-size:40px;line-height:44px;color:{YELLOW}}}
.b3{{font-weight:700;font-size:21px;line-height:24px;color:{CREAM};letter-spacing:.055em}}

.panel{{position:absolute;border-radius:{R}px;padding:var(--pad);display:flex;
  flex-direction:column;
  background:linear-gradient(152deg,{rgba(PURPLE,.94)},{rgba(PURPLE,.66)});
  border:2px solid {rgba(PINK,.32)};
  box-shadow:0 22px 50px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.10)}}
.bar-panel{{padding-top:0}}
.ttl{{font-weight:900;color:{CREAM};line-height:1.0;white-space:nowrap}}
.rule{{height:6px;border-radius:3px;margin:10px 0 var(--tgap);width:100%}}
.bar{{margin:0 calc(var(--pad)*-1) var(--tgap);padding:12px var(--pad) 13px;
  border-radius:{R}px {R}px 0 0;font-weight:900;color:{CREAM};line-height:1;
  letter-spacing:.012em;white-space:nowrap}}
.cols{{display:flex;flex:1}}
.cols ul{{list-style:none}}
.cols li{{position:relative;padding-left:24px;color:{CREAM};font-weight:700;white-space:nowrap;
  text-shadow:0 2px 6px rgba(0,0,0,.45)}}
.dot{{position:absolute;left:0;border-radius:50%}}

.callout,.pill{{position:absolute}}
.callout svg{{position:absolute;inset:0;width:100%;height:100%;
  filter:drop-shadow(0 12px 22px rgba(0,0,0,.45))}}
.ctxt{{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
  justify-content:center;font-weight:900;color:{CREAM};font-size:29px;line-height:32px}}
.ctxt .y{{color:{YELLOW};font-size:37px;line-height:39px}}

.botbar{{position:absolute;left:0;bottom:0;width:1920px;height:{BAR_H}px;display:flex;
  align-items:center;border-top:4px solid {rgba(PINK,.6)};
  background:linear-gradient(90deg,{PURPLE},{rgba(PINK,.34)} 50%,{PURPLE}),
             linear-gradient(0deg,{DARK},{PURPLE})}}
.cell{{flex:1;display:flex;align-items:center;gap:15px;padding:0 12px}}
.cell:first-child{{padding-left:44px}} .cell:last-child{{padding-right:44px}}
.ic{{width:62px;height:62px;border-radius:50%;flex:none;display:flex;align-items:center;
  justify-content:center;box-shadow:0 6px 16px rgba(0,0,0,.4)}}
.ic svg{{width:40px;height:40px}}
.ctext{{color:{CREAM};font-weight:700;font-size:22px;line-height:28px}}
.sep{{width:3px;height:64px;border-radius:2px;background:{rgba(CREAM,.26)};flex:none}}
</style>
{"".join(parts)}
'''

shutil.copy(LOGO_SRC, os.path.join(BUILD, "logo.png"))
open(os.path.join(BUILD, "index.html"), "w").write(html)

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(SP, "render.png")
subprocess.run([
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox",
    "--force-device-scale-factor=1", "--window-size=1920,1080",
    "--virtual-time-budget=15000", f"--screenshot={OUT}",
    "file://" + os.path.join(BUILD, "index.html"),
], check=True, capture_output=True)
print("rendered", OUT, Image.open(OUT).size)
