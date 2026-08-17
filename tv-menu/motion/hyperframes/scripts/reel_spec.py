#!/usr/bin/env python3
"""
The reel's timing and geometry, stated once.

WHY THIS FILE EXISTS
Two generators have to agree exactly or the reel tears:

  build-index.py   writes the ROOT — the shared background, the ring, the
                   ticker, the logo, and the mount window each frame gets.
  build-frames.py  writes each FRAME — the product and its name card, and the
                   motion inside that mount window.

The mount window and the motion inside it are the same numbers seen from two
sides. When they drifted apart by hand the product started entering before its
mount was on screen, which renders as a product that pops in already half-way
through its own entrance. So the numbers live here and neither generator gets
to hold a private copy.

WHERE THE DESIGN CAME FROM
The client approved a 15-item reference reel (the React piece in
"Motion graphics for food items"): one product on the right, a translucent name
card on the left, a persistent logo, a scrolling ticker, and a product ring on
the open and the close. This is that layout re-derived for the 39-frame menu at
1920x1080 — same shapes, same beat, recomputed against this project's own
1915x1788 logo and its 2000x2000 MASTERs rather than the reference's assets.

Colour and type family are NOT here. They come from brand.json via
assets/brand-tokens.css. Sizes, radii and timing are project working values —
brand.json marks all three notSpecifiedInSource. See design.md.
"""

import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
PROJECT = HERE.parent

CANVAS_W, CANVAS_H = 1920, 1080

# TV safe areas. Broadcast convention, not a client value (brand.json lists
# safe-title margins under notSpecifiedInSource).
SAFE_ACTION = 54
SAFE_TITLE = 96


# ============================================================== TIMING ======
# The reference reel runs one product every 3.4s and Luis confirmed that beat
# over the old 60s ceiling: this is a shop-window loop, so length costs nothing
# and 1.28s was never long enough to read a name AND a description.
BEAT = 3.40          # one product, on screen
COLD_OPEN = 4.00     # ring fades, logo flies to the corner
CLOSE = 5.00         # ring returns, logo comes back to centre

# A mount opens BEFORE its beat and closes after it, so the outgoing product is
# still leaving while the next one arrives — the overlap IS the transition.
# Two mounts are alive at once, which is why build-index.py alternates tracks.
PRE_ROLL = 0.35
TAIL = 0.10
MOUNT = PRE_ROLL + BEAT + TAIL      # 3.85

# Motion inside a mount, in MOUNT-LOCAL seconds (0 = the mount opens).
# Product first, card a beat behind it, description last: the eye lands on the
# food, then reads. waterfall-entry, cited by the scene plan.
T_PRODUCT_IN = 0.00
T_CARD_IN = 0.15
T_DESC_IN = 0.30
D_PRODUCT_IN = 0.80
D_CARD_IN = 0.75
D_DESC_IN = 0.70

# The slow push-in across the hold. sine-wave-loop's Critical Constraints cap
# ambient scale at 0.008-0.015 for a BREATH; this is not a breath, it is a
# one-way drift (0.97 -> 1.05) that never returns, so it reads as a camera
# easing in rather than a card pulsing. It is also the reference reel's own
# move, which is what Luis approved.
T_DRIFT_IN = 0.45
DRIFT_FROM, DRIFT_TO = 0.97, 1.05

T_EXIT = PRE_ROLL + BEAT - 0.30     # 3.45 — ends at 3.80, inside MOUNT (3.85)
D_EXIT = 0.35

# The CARD leaves earlier than the product, and this is not a taste call — it
# is arithmetic. The next mount opens at PRE_ROLL before its beat and its card
# starts arriving T_CARD_IN after that, which lands on THIS frame's beat end
# minus 0.20s. Both cards sit at the same 110,340. Overlap them and two names
# and two pills stack at 40-60% opacity each, which does not read as a
# crossfade — it reads as a bug, and `hyperframes check` flags it as
# content_overlap. Verified in renders/look before and after.
#
#   card out  ends at beat + 3.20
#   next card starts at beat + 3.20
#
# Exactly adjacent: no gap where the left side is empty, no frame where two
# names are legible at once. The product zone still crosses, because the two
# products are travelling in opposite directions and never occupy one spot.
T_CARD_EXIT = 3.25
D_CARD_EXIT = 0.30

# Entrance / exit travel, in px. The product comes in from the right edge of
# its own zone and leaves to the left, so the reel always moves one way. The
# exit travels further than the entrance arrives from: during the 0.35s the
# two products share the zone, the extra distance is what keeps them from
# reading as one pile.
X_IN = 220
X_OUT = -260
Y_CARD_IN = 60
Y_CARD_OUT = 40


def beat_start(index):
    """When product `index` (0-based) takes the screen."""
    return round(COLD_OPEN + index * BEAT, 2)


def mount_window(index):
    """(start, duration) of the sub-composition host for product `index`."""
    return round(beat_start(index) - PRE_ROLL, 2), MOUNT


def total_seconds(product_frames):
    return round(COLD_OPEN + product_frames * BEAT + CLOSE, 2)


# ============================================================== PRODUCT =====
# The food owns the right two-thirds of the frame; the card owns the left.
# Centre x 1400 is the reference reel's own.
#
# The width is set by the DRIFT, not by the resting frame. A wide dish sized to
# the box reaches its edges, and the hold then scales it to DRIFT_TO about a
# pivot near the centre — so the resting box has to sit far enough inside
# action-safe that the drifted peak still clears it:
#
#   half-width <= (1866 - 1400) / 1.05 = 443.8   ->  width 887, rounded to 890
#
# At 920 the peak right edge landed at 1883, past action-safe. Nothing looked
# wrong on a monitor; it is TV overscan that would have eaten it.
#
# Bottom 930 clears the ticker (top edge 998) with the same margin to spare.
PRODUCT_BOX = (955, 150, 890, 780)     # left, top, w, h

# Grouped shots (the paleta range, the aguas frescas wall) are 3:2 photographs
# rather than cut-outs, so they are WIDTH-limited in this box and land shorter
# than a solo product. They keep the same box: giving them a wider one pushed
# them under the card, and the card is translucent, not a scrim — a product
# reading through it looks like a mistake, not a layer.

# A cluster is every approved MASTER of ONE product, fanned inside the same
# box under one name. Gaps mirror the CSS in compositions/product-scene.css.
CLUSTER_GAP = {2: 40, 3: 24, 4: 0}
CLUSTER_OVERLAP = {4: 40}
CLUSTER_TILT = {4: (-6, -2, 2, 6), 3: (-4, 0, 4), 2: (-3, 3)}

# A client-named pair is two DIFFERENT menu items shown together.
PAIR_GAP = 40


# ================================================================ CARD ======
CARD_X, CARD_Y, CARD_W = 110, 340, 820
CARD_PAD_T, CARD_PAD_X, CARD_PAD_B = 44, 48, 52
CARD_INNER = CARD_W - 2 * CARD_PAD_X          # 724

PILL_SIZE = 28
PILL_PAD_X, PILL_PAD_Y = 26, 14
PILL_TRACK = 0.14
PILL_H = PILL_SIZE + 2 * PILL_PAD_Y           # line-height is 1 in the CSS

NAME_SIZES = (104, 92, 80, 70)
NAME_TRACK = -0.02
NAME_LINE = 1.02
NAME_GAP = 26                                  # margin-top, pill -> name
NAME_MAX_LINES = 2

DESC_SIZES = (38, 34, 30)
DESC_TRACK = 0.0
DESC_LINE = 1.3
DESC_GAP = 22                                  # margin-top, name -> desc
DESC_MAX_LINES = 2

# The card may not reach the ticker. 998 is the ticker's top edge; 40px of air
# under the card keeps the two from reading as one stacked block.
CARD_MAX_BOTTOM = CANVAS_H - 82 - 40           # 958


# ================================================================ LOGO ======
# The primary lockup is 1915x1788 (brand.json -> logo.primary), and it is used
# BARE — no card, no panel, no fill of any kind behind it.
#
# NO BACKGROUND, 2026-08-17 (Luis, explicit). The reference reel set its logo on
# a white card and this project copied that. Wrong for this brand: the file is a
# real transparent PNG — verified, 51.2% of its pixels are fully transparent,
# all four corners at alpha 0, with 21,564 partial-alpha pixels of anti-aliased
# edge — and the mark is drawn with its OWN white keyline, which is the
# separation the card was duplicating. Anything behind it is a second answer to
# a question the artwork already answers.
#
# Do not reintroduce a card, a panel, a scrim, a plate or a "subtle" fill.
LOGO_ASPECT = 1915 / 1788
LOGO_W = 660
LOGO_H = round(LOGO_W / LOGO_ASPECT, 1)

# Two states, and the move between them is the whole cold open.
#
# The corner scale is not a taste value: brand.json publishes a 250px digital
# minimum for the mark, so the resting corner size has to clear it.
#   660 x 0.38 = 250.8px  -> just over the floor
# Dropping the card also dropped its 40px of padding, so the scale went UP from
# 0.36 to keep the mark itself the same size rather than the box around it.
LOGO_MIN_W = 250
LOGO_BIG = (round((CANVAS_W - LOGO_W) / 2, 1),
            round(470 - LOGO_H / 2, 1), 1.0)
LOGO_SMALL = (72.0, 54.0, 0.38)
T_LOGO_MOVE, D_LOGO_MOVE = 2.60, 1.40          # ends exactly as the first beat opens

assert LOGO_W * LOGO_SMALL[2] >= LOGO_MIN_W, (
    f"corner logo would render {LOGO_W * LOGO_SMALL[2]:.0f}px wide, under the "
    f"{LOGO_MIN_W}px minimum brand.json publishes")


# ================================================================ RING ======
# Six products frame the open and the close — three down each side.
#
# The reference reel put four across the top and four across the bottom. That
# does not survive this project's assets: its centred logo card is 720x678 and
# covers x600-1320, y131-809, so the two middle TOP items rendered behind the
# lockup, and at the close the two middle BOTTOM items rendered behind
# "ICE-CREAM AND SNACKS / Swedesboro, New Jersey". Six items missing two of
# themselves is not a frame, it is an accident — checked in renders/look.
#
# Two columns instead. The centre belt (x 600-1320) is left entirely to the
# logo and the words, and every item clears both:
#
#   item box   260 wide -> x 120-380 and x 1540-1800
#   logo card  x 600-1320          -> clear
#   close text ~x 660-1260 at y856 -> clear
#   ticker     top edge 998, lowest item bottom 992 -> clear
RING_POS = ((250, 208), (250, 535), (250, 862),
            (1670, 208), (1670, 535), (1670, 862))
RING_BOX = 260
T_RING_OUT, D_RING_OUT = 1.00, 2.20            # clears before the logo starts moving
D_RING_IN, RING_STAGGER = 0.85, 0.07


# ============================================================== TICKER ======
TICKER_H = 82
TICKER_SPEED = 105                             # px per second, left
TICKER_SIZE = 28
TICKER_TRACK = 0.16
TICKER_GAP = 52
TICKER_WORDS = (
    "Aguas frescas", "Chamoyadas", "Bionicos", "Churros",
    "Crepas", "Crazy shakes", "Chicharrón preparado", "Diablitos",
)


# ====================================================== TEXT MEASUREMENT ====
class Face:
    """
    Advance widths for one weight, from the shipped woff2.

    data/type-metrics.json is generated by scripts/build-type-metrics.py and is
    sums of advances only — no kerning — so a measured string is a hair WIDER
    than it renders. That is the safe direction: this decides whether text fits.
    """

    def __init__(self, weight, tracking=0.0):
        data = json.loads((PROJECT / "data" / "type-metrics.json").read_text())
        self.adv = data["weights"][str(weight)]["advance"]
        self.tracking = tracking
        self._fallback = self.adv.get("n", 0.6)

    def width(self, text, size):
        total = sum(self.adv.get(ch, self._fallback) for ch in text)
        return total * size + self.tracking * size * len(text)

    def wrap(self, text, size, max_w):
        """Greedy word wrap, the same rule the browser applies."""
        lines, cur = [], ""
        for word in text.split():
            trial = f"{cur} {word}".strip()
            if cur and self.width(trial, size) > max_w:
                lines.append(cur)
                cur = word
            else:
                cur = trial
        if cur:
            lines.append(cur)
        return lines


def fit(face, text, sizes, max_w, max_lines):
    """
    Largest size at which `text` wraps into at most `max_lines`.

    Returns (size, lines). Falls back to the smallest size and whatever line
    count it takes — a name is never dropped, and the caller reports the miss
    rather than the reel silently losing a word.
    """
    for size in sizes:
        lines = face.wrap(text, size, max_w)
        if len(lines) <= max_lines:
            return size, lines
    size = sizes[-1]
    return size, face.wrap(text, size, max_w)


# ===================================================== IMAGE PLACEMENT =====
def place_geom(bb, box):
    """
    Scale and offset one master so its FOOD fills the shot box.

    `contain` on the raw <img> fits the 2000x2000 canvas, which leaves products
    with a lot of transparent margin rendering far smaller than products that
    fill their canvas. Instead: fit the measured opaque box, then offset the
    image so that opaque box is centred horizontally and sits on the box floor.

    The image overflows the shot box with transparent padding — never cropped.
    """
    W, H = box
    cw, ch = bb["canvas"]
    bw, bh = bb["w"] * cw, bb["h"] * ch          # food size, source pixels
    k = min(W / bw, H / bh)                       # contain, against the FOOD
    img_w = cw * k
    img_h = ch * k
    return {
        "w": img_w,
        "h": img_h,
        "left": (W - bw * k) / 2 - bb["x0"] * img_w,   # centre the food
        "top": (H - bh * k) - bb["y0"] * img_h,        # stand it on the floor
    }


def place_style(bb, box):
    """Inline style for one <img>, from place_geom."""
    g = place_geom(bb, box)
    return (f'width: {g["w"]:.1f}px; left: {g["left"]:.1f}px; top: {g["top"]:.1f}px;')


def food_aspect(bb):
    """Width / height of the visible food, used to size a shot box to it."""
    cw, ch = bb["canvas"]
    return (bb["w"] * cw) / (bb["h"] * ch)


def card_height(name_size, name_lines, desc_size, desc_lines):
    """Rendered height of the name card, so the caller can check it fits."""
    h = CARD_PAD_T + PILL_H + NAME_GAP
    h += name_lines * name_size * NAME_LINE
    if desc_lines:
        h += DESC_GAP + desc_lines * desc_size * DESC_LINE
    return round(h + CARD_PAD_B, 1)
