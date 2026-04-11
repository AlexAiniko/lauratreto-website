import math
from PIL import Image, ImageDraw
from pathlib import Path

SIZE = 1024
BG = (250, 247, 242)
CORAL = (232, 101, 74)
WHITE = (250, 247, 242)

SCALE = 4
W = SIZE * SCALE
img = Image.new("RGB", (W, W), BG)
d = ImageDraw.Draw(img)

def S(v): return v * SCALE

# Coral rounded-square background
pad = S(80)
d.rounded_rectangle([pad, pad, W - pad, W - pad], radius=S(200), fill=CORAL)

cx = W / 2

# --- Kettlebell geometry (a round ball + handle ring, one unified outline) ---
# Handle outer ring (ellipse)
HX_OUT  = S(145)
HY_MID  = S(340)
OUTER_RY = S(120)
HY_TOP  = HY_MID - OUTER_RY

# Inner hole of handle — BIG so the grip reads as an open loop
IHX = S(95)
IHY_CY = S(335)
INNER_RY = S(75)

# Body sphere — smaller + higher so it fits inside the coral background
BODY_CY = S(660)
BODY_R  = S(245)

# Angle on body circle where shoulder bezier attaches (-55° = upper-right)
SHOULDER_DEG_R = -55
SHOULDER_DEG_L = 180 - SHOULDER_DEG_R  # 235

SHOULDER_RX = cx + BODY_R * math.cos(math.radians(SHOULDER_DEG_R))
SHOULDER_RY = BODY_CY + BODY_R * math.sin(math.radians(SHOULDER_DEG_R))
SHOULDER_LX = cx + BODY_R * math.cos(math.radians(SHOULDER_DEG_L))
SHOULDER_LY = BODY_CY + BODY_R * math.sin(math.radians(SHOULDER_DEG_L))


def arc_pts(cx_, cy_, rx, ry, t0, t1, n=80):
    pts = []
    for i in range(n + 1):
        t = t0 + (t1 - t0) * i / n
        a = math.radians(t)
        pts.append((cx_ + rx * math.cos(a), cy_ + ry * math.sin(a)))
    return pts


def quad_bezier(p0, p1, p2, n=40):
    pts = []
    for i in range(n + 1):
        t = i / n
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1]
        pts.append((x, y))
    return pts


outline = []

# 1. Upper half of outer handle ring (left to right, over the top)
outline += arc_pts(cx, HY_MID, HX_OUT, OUTER_RY, 180, 360, 60)

# 2. Bezier from handle right edge out/down to body shoulder
ctrl_r = (cx + HX_OUT + S(25), HY_MID + S(120))
outline += quad_bezier(
    (cx + HX_OUT, HY_MID),
    ctrl_r,
    (SHOULDER_RX, SHOULDER_RY),
    30,
)[1:]

# 3. Most of the body circle (clockwise from upper-right around to upper-left)
outline += arc_pts(
    cx, BODY_CY, BODY_R, BODY_R, SHOULDER_DEG_R, SHOULDER_DEG_L, 120
)[1:]

# 4. Bezier from left shoulder up to handle left edge
ctrl_l = (cx - HX_OUT - S(25), HY_MID + S(120))
outline += quad_bezier(
    (SHOULDER_LX, SHOULDER_LY),
    ctrl_l,
    (cx - HX_OUT, HY_MID),
    30,
)[1:]

# Draw filled silhouette
d.polygon(outline, fill=WHITE)

# Cut handle inner hole (coral)
d.ellipse(
    [cx - IHX, IHY_CY - INNER_RY, cx + IHX, IHY_CY + INNER_RY],
    fill=CORAL,
)

img = img.resize((SIZE, SIZE), Image.LANCZOS)

out_dir = Path("/Users/paymore/Desktop/LAURA TRETO COACHING/Output")
out_dir.mkdir(exist_ok=True)
out = out_dir / "LAURA-tiktok-app-icon-1024.png"
img.save(out, "PNG")
print(f"saved {out} {img.size}")
