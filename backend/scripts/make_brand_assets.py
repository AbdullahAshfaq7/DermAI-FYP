"""Draw the Lumen app icon, Android foreground, favicon and splash from the aperture mark.

The geometry matches `LogoMark` in mobile/components/visual.tsx: six blades in the
Fitzpatrick tones around a violet lens, on a 48-unit grid.

    cd backend && uv run python scripts/make_brand_assets.py
"""

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2] / "mobile"
OUT = ROOT / "assets" / "images" / "branding"
FONT = ROOT / "node_modules/@expo-google-fonts/bricolage-grotesque/700Bold/BricolageGrotesque_700Bold.ttf"

NIGHT = (0x15, 0x0E, 0x26)
VIOLET = (0x7B, 0x63, 0xFF)
LENS_CORE = (0xE9, 0xE4, 0xFF)
TONES = ["#F5DCCB", "#EBC2A2", "#D4A07A", "#A8714C", "#7A4B31", "#4A2E22"]
SS = 4  # supersampling


def blade(cx: float, cy: float, unit: float, rot: float) -> list[tuple[float, float]]:
    """One blade: outer arc r=22 from -118 to -62 degrees, inner arc r=9 back from -42 to -98."""
    pts = []
    for i in range(41):
        a = math.radians(-118 + 56 * i / 40 + rot)
        pts.append((cx + 22 * unit * math.cos(a), cy + 22 * unit * math.sin(a)))
    for i in range(41):
        a = math.radians(-42 - 56 * i / 40 + rot)
        pts.append((cx + 9 * unit * math.cos(a), cy + 9 * unit * math.sin(a)))
    return pts


def draw_mark(img: Image.Image, cx: float, cy: float, size: float) -> None:
    d = ImageDraw.Draw(img)
    u = size / 48
    for i, tone in enumerate(TONES):
        d.polygon(blade(cx, cy, u, i * 60), fill=tone)
    for r, c in ((5.2, VIOLET), (2.2, LENS_CORE)):
        d.ellipse([cx - r * u, cy - r * u, cx + r * u, cy + r * u], fill=c)


def glow(size: tuple[int, int], cx: float, cy: float, radius: float, alpha: int) -> Image.Image:
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=(*VIOLET, alpha))
    return layer.filter(ImageFilter.GaussianBlur(radius * 0.45))


def canvas(w: int, h: int, mark: float, mark_y: float | None = None, bg=NIGHT, halo=True) -> Image.Image:
    W, H = w * SS, h * SS
    img = Image.new("RGBA", (W, H), (*bg, 255) if bg else (0, 0, 0, 0))
    cy = (mark_y if mark_y is not None else h / 2) * SS
    if halo:
        img = Image.alpha_composite(img, glow((W, H), W / 2, cy, mark * SS * 0.62, 120))
    draw_mark(img, W / 2, cy, mark * SS)
    return img


def save(img: Image.Image, name: str, w: int, h: int, rgb=True) -> None:
    out = img.resize((w, h), Image.LANCZOS)
    if rgb:
        out = out.convert("RGB")
    path = OUT / name if not name.startswith("../") else (OUT / name).resolve()
    out.save(path, optimize=True)
    print("wrote", path.relative_to(ROOT), out.size)


def main() -> None:
    # iOS / store icon: full bleed, no transparency.
    save(canvas(1024, 1024, 640), "app-icon-square.png", 1024, 1024)
    # Web favicon.
    save(canvas(512, 512, 340), "app-icon.png", 512, 512)
    # Android adaptive foreground: transparent, mark inside the 66% safe zone. Background colour is in app.json.
    save(canvas(1024, 1024, 520, bg=None, halo=False), "adaptive-icon-foreground-square.png", 1024, 1024, rgb=False)

    # Splash (resizeMode cover): mark and wordmark centred, like the in-app night splash.
    w, h = 1284, 2778
    img = canvas(w, h, 300, mark_y=h / 2 - 90)
    font = ImageFont.truetype(str(FONT), 112 * SS)
    d = ImageDraw.Draw(img)
    text = "DermAI"
    box = d.textbbox((0, 0), text, font=font)
    d.text(((w * SS - (box[2] - box[0])) / 2 - box[0], (h / 2 + 120) * SS), text, font=font, fill=(255, 255, 255, 255))
    save(img, "../../Splash-screen.png", w, h)


if __name__ == "__main__":
    main()
