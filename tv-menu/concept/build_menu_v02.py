#!/usr/bin/env python3
"""
Build the La Sabrosita Spanish TV menu board, 1920x1080 (v02).

Every colour is read from brand/brand.json through its token name — never a
pasted hex — per the workspace rule in CLAUDE.md.

Every food pixel on the board is an approved MASTER PNG from
tv-menu/assets/products/, placed untouched apart from transparent-padding trim,
uniform scale and position. No food is drawn, painted or generated.

v02 vs the v01 concept:
  - Crazy Shake correction: three flavour lines collapse to one "Crazy Shake",
    and the pink callout reads CRAZY SHAKE, not CRAZY SHAKE COOKIES.
  - Styling pushed toward the approved reference: brush splatters behind the
    logo and badge, spark ticks, category icons, the curved arrow and the
    MANGONADA callout.
"""
import json, os, shutil, subprocess, sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from menu_data import MENU, BOTTOM, FOOD_MASTERS

ROOT = "/Users/luismiguel/Desktop/la-sabrosita"
SP = os.path.dirname(os.path.abspath(__file__))
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
KEY = {"pink": PINK, "blue": BLUE, "yellow": YELLOW}

def rgba(hex_, a):
    h = hex_.lstrip("#")
    return f"rgba({int(h[0:2],16)},{int(h[2:4],16)},{int(h[4:6],16)},{a})"

# ------------------------------------------------------- product assets ----
PROD_DIR = os.path.join(ROOT, "tv-menu", "assets", "products")
APPROVED = {m["file"] for m in json.load(open(os.path.join(PROD_DIR, "products.json")))}
_cache, _used = {}, []

def art(filename, max_long=1400):
    """Trim transparent padding + downscale for render. Product pixels unaltered."""
    if filename not in APPROVED:
        raise SystemExit(f"REFUSED: {filename} is not in products.json")
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
    _used.append(filename)
    w = h * a["aspect"]
    tf = f"transform:rotate({rot}deg);" if rot else ""
    sh = (f"filter:drop-shadow(0 {26*shadow:.0f}px {34*shadow:.0f}px rgba(0,0,0,.55)) "
          f"drop-shadow(0 4px 10px rgba(0,0,0,.4));")
    return (f'<img class="food" src="{a["path"]}" style="left:{x:.0f}px;top:{y:.0f}px;'
            f'width:{w:.0f}px;height:{h:.0f}px;z-index:{z};{tf}{sh}">')

WIDTHS = json.load(open(os.path.join(SP, "widths.json")))
BULLET, PAD, GAP = 24, 24, 18

def split(items, n):
    out, i = [], 0
    for k in n:
        out.append(items[i:i + k]); i += k
    assert i == len(items), f"split {n} does not cover {len(items)} items"
    return out

def panel_width(key, splits, fs, pad=PAD, gap=GAP):
    w = WIDTHS[key]
    return round(sum(max(w[t] for t in c) * fs + BULLET for c in split(MENU[key][2], splits))
                 + gap * (len(splits) - 1) + pad * 2)

def panel(key, x, y, w, h, *, splits, fs, lh, style="rule", accent=PINK,
          title_fs=42, pad=PAD, gap=GAP, tgap=14, z=20, pad_top=0, icon=""):
    a, b, items = MENU[key]
    wd = WIDTHS[key]
    cols = []
    for c in split(items, splits):
        cw = round(max(wd[t] for t in c) * fs + BULLET)
        lis = "".join(
            f'<li style="font-size:{fs}px;line-height:{lh}px">'
            f'<span class="dot" style="background:{accent};width:{round(fs*.26)}px;'
            f'height:{round(fs*.26)}px;top:{round(lh/2-fs*.13)}px"></span>{t}</li>' for t in c)
        cols.append(f'<ul style="width:{cw}px">{lis}</ul>')
    body = (f'<div class="cols" style="gap:{gap}px;padding-top:{pad_top}px">'
            + "".join(cols) + "</div>")
    if style == "bar":
        head = (f'<div class="bar" style="background:{accent};font-size:{title_fs}px">'
                f'{a} <span class="baraccent">{b}</span></div>')
        cls = "panel bar-panel"
    else:
        # Stacked two-line title, as in the approved reference.
        sec = (f'<div class="ttl2" style="font-size:{title_fs}px;color:{accent}">{b}</div>'
               if b else "")
        head = (f'<div class="ttlrow"><div class="ttl" style="font-size:{title_fs}px">{a}</div>'
                f'{icon}</div>{sec}<div class="rule" style="background:{accent}"></div>')
        cls = "panel"
    return (f'<div class="{cls}" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;'
            f'z-index:{z};--pad:{pad}px;--tgap:{tgap}px">{head}{body}</div>')

def star(x, y, s, color, op=1, rot=0, z=3):
    return (f'<svg class="deco" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px;'
            f'opacity:{op};transform:rotate({rot}deg);z-index:{z}" viewBox="0 0 100 100">'
            f'<path fill="{color}" d="M50 0C56 34 66 44 100 50C66 56 56 66 50 100'
            f'C44 66 34 56 0 50C34 44 44 34 50 0Z"/></svg>')

def ticks(x, y, s, color, rot=0, z=3, op=1):
    """Three short energy strokes, the little marks flanking SABOR! in the reference."""
    return (f'<svg class="deco" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px;'
            f'opacity:{op};transform:rotate({rot}deg);z-index:{z}" viewBox="0 0 100 100">'
            f'<g stroke="{color}" stroke-width="11" stroke-linecap="round" fill="none">'
            f'<path d="M12 30H44"/><path d="M6 58H32"/><path d="M20 82H50"/></g></svg>')

def icon_svg(kind, color, size=44):
    d = {
      "cone": (f'<path fill="{color}" d="M50 8a24 24 0 0 1 24 24a22 22 0 0 1-2 10H28a22 22 0 0 1-2-10'
               f'A24 24 0 0 1 50 8Z"/><path fill="{color}" d="M27 48h46L50 96Z"/>'),
      "cup":  (f'<path fill="{color}" d="M24 34h52l-6 56a8 8 0 0 1-8 7H38a8 8 0 0 1-8-7Z"/>'
               f'<rect x="18" y="22" width="64" height="14" rx="7" fill="{color}"/>'
               f'<path d="M62 22 78 2" stroke="{color}" stroke-width="8" stroke-linecap="round"/>'),
    }[kind]
    return (f'<svg class="ttlicon" style="width:{size}px;height:{size}px" '
            f'viewBox="0 0 100 100">{d}</svg>')

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
TALL_Y,  TALL_H        = 214, 424        # helados / bebidas
BAND_LOW_Y, BAND_LOW_H = 664, 282        # antojitos / postres
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

# ---- painted brush splatters (reference motif: ragged magenta paint) --------
parts.append(f'''
<svg class="deco" style="left:-30px;top:-40px;width:640px;height:400px;z-index:2"
     viewBox="0 0 640 400">
 <g fill="{PINK}">
  <path opacity=".92" d="M74 66c58-34 150-52 232-40c66 10 128 40 168 84c30 33 36 78 10 108
    c-30 34-96 44-158 46c-74 2-152-8-206-40C64 190 38 150 42 116c3-24 14-38 32-50Z"/>
  <path opacity=".55" d="M20 150c26-40 64-16 58 16c-5 26-34 46-52 34c-16-10-18-32-6-50Z"/>
  <path opacity=".45" d="M470 40c34-22 66 6 52 34c-12 24-52 34-66 16c-11-14-4-38 14-50Z"/>
  <path opacity=".38" d="M400 264c30-16 58 10 44 34c-12 21-50 26-62 8c-9-14-1-32 18-42Z"/>
  <path opacity=".30" d="M120 296c22-12 44 6 34 26c-9 17-38 21-47 6c-7-11 0-25 13-32Z"/>
 </g>
</svg>''')

parts.append(f'''
<svg class="deco" style="left:1420px;top:-60px;width:540px;height:400px;z-index:2"
     viewBox="0 0 540 400">
 <g fill="{PINK}">
  <path opacity=".90" d="M300 60c78-26 168-8 204 46c30 44 18 108-26 146c-46 40-124 56-196 48
    c-70-8-128-42-146-90c-18-48 14-104 74-126c28-10 60-16 90-24Z"/>
  <path opacity=".48" d="M60 106c30-24 62 4 50 32c-10 24-48 32-60 14c-9-14-4-34 10-46Z"/>
  <path opacity=".36" d="M116 292c26-14 50 8 38 30c-10 19-44 24-54 8c-8-12-1-28 16-38Z"/>
 </g>
</svg>''')

for s in [(300, 300, 30, YELLOW, .95, 0), (256, 372, 17, CREAM, .8, 20),
          (700, 46, 26, YELLOW, .95, 0),  (1206, 60, 22, CREAM, .75, 15),
          (1276, 402, 24, YELLOW, .85, 0), (1560, 300, 18, YELLOW, .8, 0),
          (92, 556, 22, PINK, .9, 0),      (1858, 690, 24, YELLOW, .75, 0),
          (330, 700, 20, CREAM, .55, 0),   (1080, 632, 18, PINK, .8, 0),
          (596, 122, 15, CREAM, .65, 0),   (1420, 634, 20, CREAM, .6, 0),
          (466, 118, 19, BLUE, .75, 0),    (1176, 214, 16, BLUE, .7, 0)]:
    parts.append(star(*s))

parts.append(ticks(660, 96, 58, YELLOW, rot=-8, op=.95))
parts.append(ticks(1176, 104, 54, YELLOW, rot=186, op=.95))
parts.append(ticks(384, 214, 40, BLUE, rot=170, op=.7))

# ---- header ----------------------------------------------------------------
LOGO_W = 300
LOGO_H = LOGO_W * brand["logo"]["primary"]["height"] / brand["logo"]["primary"]["width"]
assert LOGO_W >= brand["logo"]["minimumSize"]["digitalMinWidthPx"]
parts.append(f'<img class="logo" src="logo.png" style="left:52px;top:18px;'
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

# ---- callouts --------------------------------------------------------------
# CORRECTED: reads CRAZY SHAKE. There is one Crazy Shake listing, not per-flavour.
parts.append(f'''
<div class="callout" style="left:1072px;top:250px;width:214px;height:214px;z-index:24">
  <svg viewBox="0 0 200 200"><path fill="{PINK}" d="M100 3c50 -3 90 34 96 80
    c6 46 -28 92 -74 108c-45 15 -96 -8 -113 -50C-8 98 14 46 54 20c14 -9 30 -15 46 -17Z"/></svg>
  <div class="ctxt"><span>CRAZY</span><span class="y">SHAKE</span></div>
</div>''')

# The reference also carries a MANGONADA badge here. It is dropped on purpose:
# at this panel geometry every placement for it either covered BEBIDAS item text
# or sat on top of the chamoyada hero. The arrow keeps the same "look at this"
# gesture without occluding anything.
parts.append(f'''
<svg class="deco" style="left:1548px;top:548px;width:150px;height:120px;z-index:35"
     viewBox="0 0 150 120">
  <path d="M14 22C74 4 128 34 126 88" stroke="{PINK}" stroke-width="9" fill="none"
    stroke-linecap="round"/>
  <path d="M126 96 108 62 146 66Z" fill="{PINK}"/>
</svg>''')

# ---- food (approved MASTERs only) -----------------------------------------
parts.append(food("LS_Crazy-Shakes_MASTER_v01.png", h=486, x=-84, y=232, z=12))   # left bleed
parts.append(food("LS_Esquimales_MASTER_v01.png",   h=262, x=150, y=398, z=16, rot=-13))
parts.append(food("LS_Mango-en-Palo_MASTER_v02.png",h=256, x=238, y=400, z=15, rot=12))
# Centre hero must bottom out above BAND_LOW_Y (664) or it covers the
# "POSTRES & DULCES" bar title, which sits under it in z-order.
parts.append(food("LS_Crazy-Shakes_MASTER_v03.png", h=478, x=744, y=180, z=32))   # centre hero
parts.append(food("LS_Esquites_MASTER_v01.png",     h=196, x=690, y=462, z=18))
parts.append(food("LS_Frappe_20oz_MASTER_v01.png",  h=216, x=1112, y=468, z=26))
parts.append(food("LS_Raspados_MASTER_v01.png",     h=224, x=1198, y=464, z=25))
parts.append(food("LS_Chamoyada_MASTER_v01.png",    h=498, x=1636, y=196, z=30))  # right hero
# Must start right of the POSTRES panel edge (x=1694) or it covers menu text.
parts.append(food("LS_Waffle_MASTER_v01.png",       h=200, x=1714, y=750, z=34))

# ---- panels ----------------------------------------------------------------
w_hel = panel_width("HELADOS", [9], 27, pad=26)
parts.append(panel("HELADOS", 340, TALL_Y, w_hel, TALL_H, splits=[9], fs=27, lh=32,
                   accent=BLUE, title_fs=40, pad=26, tgap=12,
                   icon=icon_svg("cone", PINK, 42)))

w_beb = panel_width("BEBIDAS", [9], 27, pad=26)
parts.append(panel("BEBIDAS", 1300, TALL_Y, w_beb, TALL_H, splits=[9], fs=27, lh=32,
                   accent=BLUE, title_fs=40, pad=26, tgap=12,
                   icon=icon_svg("cup", BLUE, 42)))

# Lower band geometry is solved, not eyeballed: at fs=26 the two bars ended at
# x=1784 and collided with the right-hand hero. fs=25/pad=20/gap=15 is the
# largest type that still clears it, ending at 1694.
LOW_FS, LOW_PAD, LOW_GAP, LOW_LEFT, LOW_MID = 25, 20, 15, 34, 22

w_ant = panel_width("ANTOJITOS", [5, 4, 4], LOW_FS, pad=LOW_PAD, gap=LOW_GAP)
parts.append(panel("ANTOJITOS", LOW_LEFT, BAND_LOW_Y, w_ant, BAND_LOW_H, splits=[5, 4, 4],
                   fs=LOW_FS, lh=34, style="bar", accent=PINK, title_fs=34, tgap=12,
                   pad=LOW_PAD, gap=LOW_GAP, pad_top=17))

w_pos = panel_width("POSTRES", [6, 6, 6], LOW_FS, pad=LOW_PAD, gap=LOW_GAP)
X_POS = LOW_LEFT + w_ant + LOW_MID
parts.append(panel("POSTRES", X_POS, BAND_LOW_Y, w_pos, BAND_LOW_H,
                   splits=[6, 6, 6], fs=LOW_FS, lh=34, style="bar", accent=BLUE,
                   title_fs=34, tgap=12, pad=LOW_PAD, gap=LOW_GAP))

# ---- bottom bar ------------------------------------------------------------
cells = []
for ckey, kind, pre, hi, post in BOTTOM:
    hicol = YELLOW if ckey != "blue" else BLUE
    cells.append(f'<div class="cell"><div class="ic" style="background:{KEY[ckey]}">{ico(kind)}</div>'
                 f'<div class="ctext">{pre}<b style="color:{hicol}">{hi}</b>{post}</div></div>')
parts.append('<div class="botbar" style="z-index:50">'
             + '<div class="sep"></div>'.join(cells) + '</div>')

print(f"panels  helados={w_hel} bebidas={w_beb} antojitos={w_ant} postres={w_pos}")
print(f"        antojitos 40->{40+w_ant}   postres {X_POS}->{X_POS+w_pos}  (limit ~1740)")
if X_POS + w_pos > 1748:
    print("  !! lower band overruns the right hero")

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

.head{{position:absolute;left:600px;top:8px;width:640px;text-align:center}}
.h1{{font-weight:800;font-size:47px;line-height:48px;color:{CREAM};letter-spacing:.015em}}
.h2{{font-weight:900;font-size:106px;line-height:94px;color:{PINK};letter-spacing:-.012em;
  -webkit-text-stroke:7px {CREAM};paint-order:stroke fill}}
.h3{{font-weight:800;font-style:italic;font-size:43px;line-height:43px;color:{CREAM};
  transform:translateX(112px)}}

.badge{{position:absolute;left:1548px;top:2px;width:344px;height:216px}}
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
.ttlrow{{display:flex;align-items:center;gap:10px}}
.ttl{{font-weight:900;color:{CREAM};line-height:1.0;white-space:nowrap}}
.ttl2{{font-weight:900;line-height:1.04;white-space:nowrap}}
.ttlicon{{flex:none;filter:drop-shadow(0 3px 6px rgba(0,0,0,.4))}}
.rule{{height:6px;border-radius:3px;margin:10px 0 var(--tgap);width:100%}}
.bar{{margin:0 calc(var(--pad)*-1) var(--tgap);padding:12px var(--pad) 13px;
  border-radius:{R}px {R}px 0 0;font-weight:900;color:{CREAM};line-height:1;
  letter-spacing:.012em;white-space:nowrap}}
.baraccent{{opacity:.92}}
.cols{{display:flex;flex:1}}
.cols ul{{list-style:none}}
.cols li{{position:relative;padding-left:24px;color:{CREAM};font-weight:700;white-space:nowrap;
  text-shadow:0 2px 6px rgba(0,0,0,.45)}}
.dot{{position:absolute;left:0;border-radius:50%}}

.callout{{position:absolute}}
.callout svg{{position:absolute;inset:0;width:100%;height:100%;
  filter:drop-shadow(0 12px 22px rgba(0,0,0,.45))}}
.ctxt{{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
  justify-content:center;font-weight:900;color:{CREAM};font-size:33px;line-height:36px}}
.ctxt .y{{color:{YELLOW};font-size:41px;line-height:44px}}
.mtxt{{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
  justify-content:center;text-align:center;color:{CREAM}}}
.m1{{font-weight:900;font-size:21px;line-height:24px;letter-spacing:.03em}}
.m2{{font-weight:800;font-style:italic;font-size:20px;line-height:23px;color:{YELLOW}}}

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
    "--virtual-time-budget=20000", f"--screenshot={OUT}",
    "file://" + os.path.join(BUILD, "index.html"),
], check=True, capture_output=True)

n_items = sum(len(v[2]) for v in MENU.values())
print(f"menu lines: {n_items}  |  food images: {len(_used)} (all in products.json)")
print("rendered", OUT, Image.open(OUT).size)
