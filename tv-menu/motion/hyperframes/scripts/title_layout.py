#!/usr/bin/env python3
"""
Product-name display typography: sizing and composition.

WHAT CHANGED AND WHY (2026-08-16, client review)
The previous pass set names as deep-purple on a cream rounded card. That card was
a defensible reading of brand.json — visualDirection.readabilityRule says "Keep
menu text on cream reading areas" — but on a motion piece it read as a UI label
sitting on top of the picture, and it was rejected. Names are DISPLAY TYPE now:
cream, straight onto the composition, no card, no pill, no border.

Two things follow from losing the card, and both are handled here:

1. LEGIBILITY IS NO LONGER GUARANTEED. A cream card carried its own contrast
   anywhere on the frame. Cream glyphs do not — over the cream drips they simply
   disappear. So placement is now constrained by a measured luminance map
   (data/background-busy.json -> lumaHot) and a name may only sit where the
   artwork stays dark enough to hold it.

2. PLACEMENT HAD TO STOP BEING A FREE SEARCH. Hunting the largest gap put each
   label wherever that frame happened to have room, so 41 frames had 41
   unrelated answers. A name is now placed by COMPOSITION: four anchored
   relationships to the product, each aligned to the title-safe margins, so the
   same product shape always produces the same layout and the reel reads as one
   system rather than a pile of one-offs.

BRAND, AND WHERE THIS DEPARTS FROM IT
brand/brand.json -> typography.roles.emphasis: item names are Noto Sans Bold,
weight 700. Fixed, never varied here.

The hierarchy table gives menuItem the colour deepPurple, and these names are
cream instead. That is a deliberate, in-palette departure, and brand.json itself
licenses it: _hierarchyProvenance records that the colour assignments were "read
off the rendered example on that page, not written as a rule in the PDF text.
Treat them as the designer's demonstrated intent, not a locked specification."
Deep purple was the ink for type on a cream reading area; with the reading area
gone, cream is the readable ink and deep purple becomes the shadow under it.
Both are palette colours. No new colour is introduced.

Sizes remain a PROJECT decision, not brand: typography.sizes is null and
notSpecifiedInSource lists "Type sizes, line heights, letter spacing".
"""

import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
PROJECT = HERE.parent

CANVAS_W, CANVAS_H = 1920, 1080

# TV safe areas. brand.json lists "Safe-title margins for TV output" under
# notSpecifiedInSource, so these are the broadcast conventions, not client values.
SAFE_L, SAFE_T, SAFE_R, SAFE_B = 96, 96, 1824, 984

CELL = 20
COLS, ROWS = CANVAS_W // CELL, CANVAS_H // CELL
BUSY_DIV = 2                  # data/background-busy.json is a 40px grid

# ---------------------------------------------------------------- type scale --
# Display type, so the range runs higher and the floor sits higher than the old
# carded labels: with no box around it a name has to carry the frame on weight
# and size alone. Project decision, not brand.
SIZE_MAX, SIZE_MIN, SIZE_STEP = 168, 76, 4

LINE_H = 1.04                 # must match .title line-height in product-scene.css
TRACKING_EM = -0.025          # must match .title letter-spacing
WIDTH_SLACK = 6               # measurement is a prediction; never let it wrap

# Clear space held between a name and the product, the logo, the ribbon and the
# other name on a pair. Generous per the brief, but it is also the tightest
# constraint in the system: at 44 the widest frames (Banana Split's boat dish,
# the four-up Crazy Shake) missed a fit by ten or twenty pixels and would have
# had to lose their name entirely, since product sizing is fixed this pass. 34px
# is still over 3% of the frame height between type and food.
CLEAR = 34

STRIDE = 20

# Line counts the placer may use, in order of preference. Three is a genuine
# display-typography option for a long name in a narrow column, not a fallback to
# small type — the score below still prefers fewer lines at equal size.
LINE_OPTIONS = (1, 2, 3)

# Cream cannot sit on the drips. lumaHot is, per cell, the fraction of pixels too
# bright for cream to hold WCAG AA-large (3.0:1).
#
# Judged over the WHOLE block, not per cell. A per-cell veto was the first
# attempt and it rejected essentially every frame: a display-size name covers
# 300-plus cells, the artwork has stars scattered through it every couple of
# hundred pixels, and one star cell inside the block killed the placement. But a
# star behind a glyph is survivable — the deep-purple shadow absorbs it — while
# half a cream drip under the same name is not. What separates those two cases is
# HOW MUCH of the block is bright, so that is what gets measured.
HOT_MEAN_MAX = 0.04

# Busyness still only steers: a hard edge under a glyph is a cosmetic loss, and
# the deep-purple shadow absorbs most of it.
BUSY_COST = 0.16
DIST_COST = 0.04

LOGO_CLEAR = 56
LOGO_BOX = (54, 54, 304, 287)


class Composition:
    """
    One anchored relationship between a product and its name.

    Not a free position: every composition pins the block to a title-safe margin,
    so all `side-left` names across the reel start on the same x, all `below`
    names sit on the same baseline, and the relationship a viewer learns on frame
    2 still holds on frame 39.
    """

    def __init__(self, name, align, pref):
        self.name = name
        self.align = align          # text-align, and which edge the block is pinned to
        self.pref = pref

    def positions(self, w, h, food):
        fx0, fy0, fx1, fy1 = food
        cx = min(max((fx0 + fx1) / 2 - w / 2, SAFE_L), SAFE_R - w)
        cy = (fy0 + fy1) / 2 - h / 2

        if self.name in ("below", "above"):
            # Pinned to the margin vertically, but allowed to slide sideways off
            # the product's centre line. Fixing x at the centre was too rigid:
            # "Crazy Shake" has a clean band above it on the left of the frame
            # and the cream drips on the right, and a hard-centred block sat in
            # the drips and was rejected outright. Sliding keeps the composition
            # — the name is still the band above or below the product — while
            # letting it step clear of artwork it cannot sit on.
            y = SAFE_B - h if self.name == "below" else SAFE_T
            out = []
            for d in range(0, 700, STRIDE):
                for x in ({cx - d, cx + d} if d else {cx}):
                    if SAFE_L <= x <= SAFE_R - w:
                        out.append((x, y))
            return out

        x = SAFE_L if self.name == "side-left" else SAFE_R - w
        # A side name rides the product's own vertical centre, and gives way
        # upward or downward only as far as it must.
        out = []
        for d in range(0, 420, STRIDE):
            for y in ({cy - d, cy + d} if d else {cy}):
                if SAFE_T <= y <= SAFE_B - h:
                    out.append((x, y))
        return out


COMPOSITIONS = [
    Composition("below",      "center", 100),
    Composition("side-left",  "left",    96),
    Composition("side-right", "right",   94),
    Composition("above",      "center",  86),
]


class Field:
    """What is already occupied, plus where cream type cannot go."""

    def __init__(self, busy40, hot40):
        self.occ = [[0] * COLS for _ in range(ROWS)]
        self.busy40 = busy40
        self.hot40 = hot40
        self._dirty = True

    def _mark(self, x0, y0, x1, y1):
        c0, c1 = int(x0 // CELL), int((x1 - 1) // CELL)
        r0, r1 = int(y0 // CELL), int((y1 - 1) // CELL)
        for r in range(max(0, r0), min(ROWS - 1, r1) + 1):
            row = self.occ[r]
            for c in range(max(0, c0), min(COLS - 1, c1) + 1):
                row[c] = 1
        self._dirty = True

    def add_rect(self, x0, y0, x1, y1, pad=0):
        self._mark(x0 - pad, y0 - pad, x1 + pad, y1 + pad)

    def add_alpha(self, rows, n, x, y, w, h):
        """Mark cells covered by one placed image, from its real alpha grid."""
        blank = "0" * n
        for gr in range(n):
            if rows[gr] == blank:
                continue
            cy0 = y + h * gr / n
            cy1 = y + h * (gr + 1) / n
            if cy1 < 0 or cy0 > CANVAS_H:
                continue
            gc = 0
            while gc < n:
                if rows[gr][gc] != "1":
                    gc += 1
                    continue
                start = gc
                while gc < n and rows[gr][gc] == "1":
                    gc += 1
                cx0 = x + w * start / n
                cx1 = x + w * gc / n
                if cx1 >= 0 and cx0 <= CANVAS_W:
                    self._mark(cx0, cy0, cx1, cy1)

    def _build(self):
        # Three integrals, because the three constraints are not the same kind.
        # occ is absolute — a name never covers a product, the logo or the
        # ribbon. hot and busy are both measured as averages over the block.
        blocked = [[0] * (COLS + 1) for _ in range(ROWS + 1)]
        busy = [[0.0] * (COLS + 1) for _ in range(ROWS + 1)]
        hot = [[0.0] * (COLS + 1) for _ in range(ROWS + 1)]
        for r in range(ROWS):
            b40 = self.busy40[r // BUSY_DIV]
            h40 = self.hot40[r // BUSY_DIV]
            for c in range(COLS):
                v = b40[c // BUSY_DIV]
                hv = h40[c // BUSY_DIV]
                blocked[r + 1][c + 1] = (self.occ[r][c] + blocked[r][c + 1]
                                         + blocked[r + 1][c] - blocked[r][c])
                busy[r + 1][c + 1] = (v + busy[r][c + 1]
                                      + busy[r + 1][c] - busy[r][c])
                hot[r + 1][c + 1] = (hv + hot[r][c + 1]
                                     + hot[r + 1][c] - hot[r][c])
        self._blocked, self._busy, self._hot = blocked, busy, hot
        self._dirty = False

    def _cells(self, x0, y0, x1, y1):
        c0, c1 = max(0, int(x0 // CELL)), min(COLS - 1, int((x1 - 1) // CELL))
        r0, r1 = max(0, int(y0 // CELL)), min(ROWS - 1, int((y1 - 1) // CELL))
        return r0, c0, r1, c1

    @staticmethod
    def _sum(I, r0, c0, r1, c1):
        return I[r1 + 1][c1 + 1] - I[r0][c1 + 1] - I[r1 + 1][c0] + I[r0][c0]

    def free(self, x0, y0, x1, y1):
        """Clear of everything solid AND dark enough overall to carry cream."""
        if x0 < 0 or y0 < 0 or x1 > CANVAS_W or y1 > CANVAS_H:
            return False
        if self._dirty:
            self._build()
        r0, c0, r1, c1 = self._cells(x0, y0, x1, y1)
        if r1 < r0 or c1 < c0:
            return False
        if self._sum(self._blocked, r0, c0, r1, c1) != 0:
            return False
        n = (r1 - r0 + 1) * (c1 - c0 + 1)
        return self._sum(self._hot, r0, c0, r1, c1) / n <= HOT_MEAN_MAX

    def hotness(self, x0, y0, x1, y1):
        if self._dirty:
            self._build()
        r0, c0, r1, c1 = self._cells(x0, y0, x1, y1)
        n = (r1 - r0 + 1) * (c1 - c0 + 1)
        return self._sum(self._hot, r0, c0, r1, c1) / n if n else 0.0

    def busyness(self, x0, y0, x1, y1):
        if self._dirty:
            self._build()
        r0, c0, r1, c1 = self._cells(x0, y0, x1, y1)
        n = (r1 - r0 + 1) * (c1 - c0 + 1)
        return self._sum(self._busy, r0, c0, r1, c1) / n if n else 0.0


class Metrics:
    """Text width from the shipped font, so a fit decision is exact."""

    def __init__(self, weight="700", path=None):
        data = json.loads((path or PROJECT / "data" / "type-metrics.json").read_text())
        self.weight = weight
        self.adv = data["weights"][weight]["advance"]
        self._fallback = self.adv.get("n", 0.6)

    def width(self, text, size):
        total = sum(self.adv.get(ch, self._fallback) for ch in text)
        return total * size + TRACKING_EM * size * len(text)

    def split(self, text, lines):
        """
        Break a name into `lines` balanced lines, or None if it has too few words.

        Balanced means the NARROWEST widest-line, because what a column can hold
        is set by the longest line. Three lines exists for the long pair names —
        "Esquite Hot Cheetos" beside its product has a 306px column, which two
        lines cannot reach at any size above the floor but three can.
        """
        words = text.split()
        if lines == 1:
            return (text,)
        if len(words) < lines:
            return None
        best, best_cost = None, None
        for cuts in _cut_points(len(words), lines):
            parts, prev = [], 0
            for c in list(cuts) + [len(words)]:
                parts.append(" ".join(words[prev:c]))
                prev = c
            cost = max(self.width(p, 100) for p in parts)
            if best_cost is None or cost < best_cost:
                best, best_cost = tuple(parts), cost
        return best

    def split_two(self, text):
        return self.split(text, 2)


def _cut_points(n_words, lines):
    """Every way to cut n_words into `lines` non-empty runs."""
    if lines == 2:
        return [(i,) for i in range(1, n_words)]
    out = []
    for i in range(1, n_words - lines + 2):
        for rest in _cut_points(n_words - i, lines - 1):
            out.append((i,) + tuple(i + r for r in rest))
    return out


def Metrics900():
    """The ribbon face — .ribbon / .hero-ribbon are hard-set to 900, a
    pre-existing deviation from the brand emphasis weight, flagged not changed."""
    return Metrics("900")


def box_for(metrics, name, size, lines):
    """Block size for a title. No padding: there is no card any more."""
    parts = metrics.split(name, lines)
    if not parts:
        return None
    text_w = max(metrics.width(p, size) for p in parts)
    return text_w + WIDTH_SLACK, lines * size * LINE_H


def _score(comp, field, x, y, w, h, food, lines):
    fx0, fy0, fx1, fy1 = food
    s = comp.pref - BUSY_COST * field.busyness(x, y, x + w, y + h)
    if comp.name in ("side-left", "side-right"):
        s -= DIST_COST * abs((y + h / 2) - (fy0 + fy1) / 2)
    s -= 3 * (lines - 1)      # fewer lines reads faster at equal size
    return s


def place(metrics, field, name, food, comps=None, size_max=SIZE_MAX, size_min=SIZE_MIN):
    """
    Largest display size for one name, in the best composition that holds it.

    Size decides first and composition only settles ties, so a name takes the
    layout that lets it be biggest — which is what makes the choice track the
    product's shape rather than an arbitrary ranking.
    """
    comps = comps or COMPOSITIONS
    size = size_max
    while size >= size_min:
        best = None
        for lines in LINE_OPTIONS:
            box = box_for(metrics, name, size, lines)
            if not box:
                continue
            w, h = box
            if w > SAFE_R - SAFE_L or h > SAFE_B - SAFE_T:
                continue
            for comp in comps:
                for x, y in comp.positions(w, h, food):
                    if not field.free(x - CLEAR, y - CLEAR, x + w + CLEAR, y + h + CLEAR):
                        continue
                    sc = _score(comp, field, x, y, w, h, food, lines)
                    if best is None or sc > best["score"]:
                        best = {
                            "score": sc, "comp": comp.name, "align": comp.align,
                            "size": size, "lines": lines,
                            "left": x, "top": y, "width": w, "height": h,
                            "text": metrics.split(name, lines),
                        }
                    break        # first free slot in a composition is its best
        if best:
            best.pop("score")
            return best
        size -= SIZE_STEP
    return None


def place_pair(metrics, field, names, foods, size_max=SIZE_MAX, size_min=SIZE_MIN):
    """
    ONE shared title treatment for a paired scene.

    Both names take the same size and sit on the same baseline, each centred on
    its own product. Placing them independently is what produced two labels at
    different sizes drifting toward whatever gap each found — which read as two
    unrelated captions instead of one composition, and on a menu board also made
    it ambiguous which name belonged to which product.
    """
    # A pair name cannot be centred on its own product the way a solo name is:
    # the two products stand the full height of the row, so anything centred on
    # one lands on top of it, and the bands above and below are sealed — below by
    # the row floor, above by the logo. So each name sits BESIDE its product, and
    # both take the SAME side, the same size and the same baseline. Same side is
    # what makes it one treatment instead of two: the viewer learns the
    # relationship once and it holds for both halves of the frame.
    size = size_max
    while size >= size_min:
        for lines in LINE_OPTIONS:
            boxes = [box_for(metrics, n, size, lines) for n in names]
            if any(b is None for b in boxes):
                continue
            h = max(b[1] for b in boxes)
            mid = sum((f[1] + f[3]) / 2 for f in foods) / len(foods)

            for side in ("left", "right"):
                xs, fits = [], True
                # CLEAR + CELL, not CLEAR. Occupancy is quantised to CELL, so a
                # block whose edge lands exactly on the product's edge shares a
                # cell with it and reads as a collision that is not there. One
                # extra cell of offset lets the grid express the gap.
                gap = CLEAR + CELL
                for (w, _bh), food in zip(boxes, foods):
                    x = food[0] - gap - w if side == "left" else food[2] + gap
                    if x < SAFE_L or x + w > SAFE_R:
                        fits = False
                        break
                    xs.append(x)
                if not fits:
                    continue

                for d in range(0, 420, STRIDE):
                    for y in ({mid - h / 2 - d, mid - h / 2 + d} if d else {mid - h / 2}):
                        if not (SAFE_T <= y <= SAFE_B - h):
                            continue
                        out, ok = [], True
                        for x, (w, bh), nm in zip(xs, boxes, names):
                            if not field.free(x - CLEAR, y - CLEAR,
                                              x + w + CLEAR, y + bh + CLEAR):
                                ok = False
                                break
                            out.append({"comp": f"pair-{side}", "align": side,
                                        "size": size, "lines": lines,
                                        "left": x, "top": y, "width": w, "height": bh,
                                        "text": metrics.split(nm, lines)})
                        if ok and _no_overlap(out):
                            return out
        size -= SIZE_STEP
    return None


def _no_overlap(boxes):
    for i in range(len(boxes)):
        for j in range(i + 1, len(boxes)):
            a, b = boxes[i], boxes[j]
            if (a["left"] < b["left"] + b["width"] + CLEAR
                    and b["left"] < a["left"] + a["width"] + CLEAR):
                return False
    return True
