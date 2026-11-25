"""Draw the app icon, Android foreground, favicon and splash from the DermAI mark.

The mark comes from mobile/assets/logo.json, the same data the app draws with.

    cd backend && uv run python scripts/make_brand_assets.py
"""

from pathlib import Path

from brand_mark import SS, draw_mark
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2] / "mobile"
OUT = ROOT / "assets" / "images" / "branding"
FONT = ROOT / "node_modules/@expo-google-fonts/bricolage-grotesque/800ExtraBold/BricolageGrotesque_800ExtraBold.ttf"
FONT_SANS = ROOT / "node_modules/@expo-google-fonts/instrument-sans/500Medium/InstrumentSans_500Medium.ttf"

NIGHT = (0x0E, 0x1A, 0x2E)
BLUE = (0x4F, 0x8B, 0xEA)
AI_BLUE = (0x6F, 0xA9, 0xF2)


def glow(size: tuple[int, int], cx: float, cy: float, radius: float, alpha: int) -> Image.Image:
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=(*BLUE, alpha))
    return layer.filter(ImageFilter.GaussianBlur(radius * 0.45))


def canvas(w: int, h: int, mark: float, mark_y: float | None = None, bg=NIGHT, halo=True) -> Image.Image:
    W, H = w * SS, h * SS
    img = Image.new("RGBA", (W, H), (*bg, 255) if bg else (0, 0, 0, 0))
    cy = (mark_y if mark_y is not None else h / 2) * SS
    if halo:
        img = Image.alpha_composite(img, glow((W, H), W / 2, cy, mark * SS * 0.6, 110))
    draw_mark(img, W / 2, cy, mark * SS)
    return img


def save(img: Image.Image, name: str, w: int, h: int, rgb=True) -> None:
    out = img.resize((w, h), Image.LANCZOS)
    if rgb:
        out = out.convert("RGB")
    path = (OUT / name).resolve()
    out.save(path, optimize=True)
    print("wrote", path.relative_to(ROOT), out.size)


def main() -> None:
    # iOS / store icon: full bleed, no transparency.
    save(canvas(1024, 1024, 620), "app-icon-square.png", 1024, 1024)
    # Web favicon.
    save(canvas(512, 512, 330), "app-icon.png", 512, 512)
    # Android adaptive foreground: transparent, mark inside the 66% safe zone. Background colour is in app.json.
    save(canvas(1024, 1024, 500, bg=None, halo=False), "adaptive-icon-foreground-square.png", 1024, 1024, rgb=False)

    # Splash logo: the lockup on a transparent square. The splash plugin centres it at a set width
    # on the Night background colour from app.json, so nothing else belongs in the image.
    n = 1200
    img = canvas(n, n, 600, mark_y=380, bg=None, halo=False)
    d = ImageDraw.Draw(img)
    font = ImageFont.truetype(str(FONT), 230 * SS)
    derm, ai = "derm", "AI"
    wd, wa = d.textlength(derm, font=font), d.textlength(ai, font=font)
    x0 = (n * SS - (wd + wa)) / 2
    y0 = 720 * SS
    d.text((x0, y0), derm, font=font, fill=(255, 255, 255, 255))
    d.text((x0 + wd, y0), ai, font=font, fill=(*AI_BLUE, 255))
    tag = ImageFont.truetype(str(FONT_SANS), 84 * SS)
    text = "AI Skin Insights"
    d.text(((n * SS - d.textlength(text, font=tag)) / 2, y0 + 300 * SS), text, font=tag, fill=(0xA6, 0xB8, 0xD4, 255))
    save(img, "splash-logo.png", n, n, rgb=False)


if __name__ == "__main__":
    main()
