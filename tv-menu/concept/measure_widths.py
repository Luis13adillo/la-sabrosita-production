#!/usr/bin/env python3
"""
Measure rendered text width for every menu string at the real font, and write
widths.json as width-per-1px-of-font-size ratios.

Panel widths are computed from these ratios, so a stale entry means a clipped or
over-wide panel. Re-run this whenever menu_data.MENU changes.
"""
import json, os, re, subprocess

SP = os.path.dirname(os.path.abspath(__file__))
import sys
sys.path.insert(0, SP)
from menu_data import MENU, BOTTOM, TITLES

FONTCSS = open(os.path.join(SP, "fonts", "noto-embedded.css")).read()

groups = {k: list(v[2]) for k, v in MENU.items()}
groups["TITLES"] = TITLES
groups["BOTTOM"] = ["".join(row[2:5]) for row in BOTTOM]

# Menu items and bottom-bar copy render at weight 700; category titles at 900.
WEIGHT = {"TITLES": 900}

spans = []
for g, items in groups.items():
    for t in items:
        spans.append(f'<span data-g="{g}" style="font-weight:{WEIGHT.get(g,700)}">{t}</span>')

html = f"""<meta charset="utf-8"><style>{FONTCSS}
body{{font-family:'Noto Sans','Helvetica Neue',Arial,sans-serif;font-size:100px;
  white-space:nowrap}}
span{{display:inline-block}}
</style>
<div id="probe">{''.join(spans)}</div>
<script>
document.fonts.ready.then(() => {{
  const out = {{}};
  document.querySelectorAll('#probe span').forEach(s => {{
    const g = s.dataset.g;
    (out[g] = out[g] || {{}})[s.textContent] = +(s.getBoundingClientRect().width / 100).toFixed(4);
  }});
  document.title = 'W:' + JSON.stringify(out);
}});
</script>"""

path = os.path.join(SP, "measure_items.html")
open(path, "w").write(html)

dom = subprocess.run([
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "--headless=new", "--disable-gpu", "--no-sandbox", "--virtual-time-budget=20000",
    "--dump-dom", "file://" + path,
], check=True, capture_output=True, text=True).stdout

m = re.search(r"<title>W:(.*?)</title>", dom, re.S)
if not m:
    raise SystemExit("measurement failed: no title payload in DOM")

widths = json.loads(m.group(1).replace("&amp;", "&"))
# TITLES were written with &amp; in the source list; key them back the same way.
widths["TITLES"] = {k.replace("&", "&amp;"): v for k, v in widths["TITLES"].items()}

json.dump(widths, open(os.path.join(SP, "widths.json"), "w"), indent=1, ensure_ascii=False)

for g, d in widths.items():
    print(f"{g:10} {len(d):2} items  widest={max(d, key=d.get)!r} {max(d.values())}")
