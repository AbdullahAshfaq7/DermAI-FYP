"""Rasterise the DermAI mark from mobile/assets/logo.json (the same data the app draws with)."""

import json
import re
from pathlib import Path

from PIL import Image, ImageDraw

LOGO = json.loads((Path(__file__).resolve().parents[2] / "mobile" / "assets" / "logo.json").read_text())
SS = 4  # supersampling for smooth edges


def _bezier(p0, p1, p2, p3, n=24):
    out = []
    for i in range(1, n + 1):
        t = i / n
        u = 1 - t
        out.append(
            (
                u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
                u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1],
            )
        )
    return out


def flatten(d: str) -> list[tuple[float, float]]:
    """Absolute M, L, C, Z path data -> polygon points on the 48-unit grid."""
    toks = re.findall(r"[MLCZ]|-?\d*\.?\d+", d)
    pts: list[tuple[float, float]] = []
    i = 0
    cmd = ""
    while i < len(toks):
        if toks[i] in "MLCZ":
            cmd = toks[i]
            i += 1
            if cmd == "Z":
                continue
        if cmd in "ML":
            pts.append((float(toks[i]), float(toks[i + 1])))
            i += 2
        elif cmd == "C":
            c = [float(x) for x in toks[i : i + 6]]
            pts += _bezier(pts[-1], (c[0], c[1]), (c[2], c[3]), (c[4], c[5]))
            i += 6
    return pts


def _hex(c: str):
    return tuple(int(c[k : k + 2], 16) for k in (1, 3, 5))


def _gradient(size: tuple[int, int], frm, to, stops, scale: float, ox: float, oy: float) -> Image.Image:
    """Linear gradient between two points on the 48 grid, drawn at the given scale and offset."""
    import numpy as np

    w, h = size
    ys, xs = np.mgrid[0:h, 0:w]
    gx = (xs - ox) / scale
    gy = (ys - oy) / scale
    dx, dy = to[0] - frm[0], to[1] - frm[1]
    t = np.clip(((gx - frm[0]) * dx + (gy - frm[1]) * dy) / (dx * dx + dy * dy), 0, 1)
    a, b = np.array(_hex(stops[0])), np.array(_hex(stops[1]))
    rgb = (a[None, None, :] * (1 - t[..., None]) + b[None, None, :] * t[..., None]).astype("uint8")
    return Image.fromarray(rgb, "RGB")


def draw_mark(img: Image.Image, cx: float, cy: float, size: float) -> None:
    """Draw the mark centred on (cx, cy), `size` pixels tall, onto an RGBA image (already supersampled)."""
    scale = size / 48
    ox, oy = cx - 24 * scale, cy - 24 * scale
    for key in ("leaf", "head"):
        part = LOGO[key]
        mask = Image.new("L", img.size, 0)
        ImageDraw.Draw(mask).polygon([(ox + x * scale, oy + y * scale) for x, y in flatten(part["d"])], fill=255)
        img.paste(_gradient(img.size, part["from"], part["to"], part["stops"], scale, ox, oy), (0, 0), mask)
    d = ImageDraw.Draw(img)
    for sq in LOGO["squares"]:
        x, y, s = ox + sq["x"] * scale, oy + sq["y"] * scale, sq["s"] * scale
        d.rounded_rectangle([x, y, x + s, y + s], radius=s * 0.22, fill=_hex(sq["fill"]))


if __name__ == "__main__":
    import sys

    out = sys.argv[1]
    w = 1200
    img = Image.new("RGBA", (w * 2 * SS // 2, w * SS // 2), (247, 244, 251, 255))
    half = img.size[0] // 2
    left = img.crop((0, 0, half, img.size[1]))
    draw_mark(left, half / 2, img.size[1] / 2, img.size[1] * 0.8)
    right = Image.new("RGBA", left.size, (21, 14, 38, 255))
    draw_mark(right, half / 2, img.size[1] / 2, img.size[1] * 0.8)
    img.paste(left, (0, 0))
    img.paste(right, (half, 0))
    img.resize((w, w // 2), Image.LANCZOS).convert("RGB").save(out)
