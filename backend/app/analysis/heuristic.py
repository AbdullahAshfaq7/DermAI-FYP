"""A pixel-statistics stand-in for the skin model (PRD FR-3 to FR-5).

It reads the real photo: finds skin inside the face oval, checks focus and light, then scores each
concern per face zone from CIELAB colour and texture statistics. It is deterministic (the same photo
gives the same reading) but it is NOT a validated medical model; the trained ONNX model replaces it.
"""

import io

import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

from app.analysis.base import CONCERNS, RANK, ZONES, Analysis, Check, QualityResult, level_for

MIN_SIDE = 300
WORK_SIDE = 512

# Zone boxes inside the face bounding box, as (u0, u1, v0, v1) fractions.
ZONE_BOX = {
    "forehead": (0.25, 0.75, 0.06, 0.26),
    "nose": (0.42, 0.58, 0.42, 0.66),
    "leftCheek": (0.12, 0.38, 0.46, 0.72),
    "rightCheek": (0.62, 0.88, 0.46, 0.72),
    "chin": (0.36, 0.64, 0.88, 0.99),
}
# Which zones each concern is read from.
CONCERN_ZONES = {
    "acne": ["chin", "forehead", "leftCheek", "rightCheek"],
    "dryness": ["leftCheek", "rightCheek", "forehead"],
    "redness": ["nose", "leftCheek", "rightCheek"],
    "darkSpots": ["leftCheek", "rightCheek", "forehead"],
    "sensitivity": ["leftCheek", "rightCheek"],
    "pores": ["nose", "leftCheek", "rightCheek"],
}


class BadImage(ValueError):
    pass


def load(image: bytes) -> np.ndarray:
    try:
        im = Image.open(io.BytesIO(image))
        im = ImageOps.exif_transpose(im)
        im = im.convert("RGB")
    except (UnidentifiedImageError, OSError) as e:
        raise BadImage("That file isn't a photo we can read. Use a JPEG or PNG.") from e
    if min(im.size) < MIN_SIDE:
        raise BadImage(f"The photo is too small. Use one at least {MIN_SIDE} pixels on each side.")
    scale = WORK_SIDE / max(im.size)
    im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.BILINEAR)
    return np.asarray(im, dtype=np.float32)


def to_lab(rgb: np.ndarray) -> np.ndarray:
    c = rgb / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    m = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]], dtype=np.float32)
    xyz = c @ m.T
    xyz /= np.array([0.95047, 1.0, 1.08883], dtype=np.float32)
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    L = 116 * f[..., 1] - 16
    a = 500 * (f[..., 0] - f[..., 1])
    b = 200 * (f[..., 1] - f[..., 2])
    return np.stack([L, a, b], axis=-1)


def laplacian(gray: np.ndarray) -> np.ndarray:
    p = np.pad(gray, 1, mode="edge")
    return p[:-2, 1:-1] + p[2:, 1:-1] + p[1:-1, :-2] + p[1:-1, 2:] - 4 * p[1:-1, 1:-1]


def skin_mask(rgb: np.ndarray) -> np.ndarray:
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    y = 0.299 * r + 0.587 * g + 0.114 * b
    cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
    cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b
    return (cb >= 77) & (cb <= 127) & (cr >= 133) & (cr <= 173) & (y > 25) & (y < 250)


def oval(h: int, w: int) -> np.ndarray:
    yy, xx = np.mgrid[0:h, 0:w]
    return ((xx - 0.5 * w) / (0.34 * w)) ** 2 + ((yy - 0.50 * h) / (0.44 * h)) ** 2 <= 1


class Prepared:
    def __init__(self, image: bytes):
        self.rgb = load(image)
        h, w, _ = self.rgb.shape
        self.gray = 0.299 * self.rgb[..., 0] + 0.587 * self.rgb[..., 1] + 0.114 * self.rgb[..., 2]
        self.oval = oval(h, w)
        self.skin = skin_mask(self.rgb) & self.oval
        self.skin_ratio = float(self.skin.sum() / max(1, self.oval.sum()))
        ys, xs = np.nonzero(self.skin)
        if len(xs) > 50:
            x0, x1 = np.percentile(xs, [2, 98])
            y0, y1 = np.percentile(ys, [2, 98])
        else:
            x0, x1, y0, y1 = 0.16 * w, 0.84 * w, 0.07 * h, 0.87 * h
        self.box = (int(x0), int(x1), int(y0), int(y1))

    def zone_mask(self, zone: str) -> np.ndarray:
        x0, x1, y0, y1 = self.box
        u0, u1, v0, v1 = ZONE_BOX[zone]
        m = np.zeros_like(self.skin)
        bx0, bx1 = int(x0 + u0 * (x1 - x0)), int(x0 + u1 * (x1 - x0))
        by0, by1 = int(y0 + v0 * (y1 - y0)), int(y0 + v1 * (y1 - y0))
        m[by0 : max(by0 + 1, by1), bx0 : max(bx0 + 1, bx1)] = True
        return m & self.skin


class HeuristicAnalyzer:
    def check(self, image: bytes) -> QualityResult:
        try:
            p = Prepared(image)
        except BadImage as e:
            return QualityResult(checks=[Check("face", str(e), False)], usable=False, dim=False, reason=str(e))

        checks: list[Check] = []
        reason = None
        face_y = p.gray[p.skin] if p.skin.any() else p.gray[p.oval]
        varied = float(face_y.std()) > 4.0
        face_ok = p.skin_ratio >= 0.30 and varied
        checks.append(Check("face", "Face fully visible" if face_ok else "No face found in the oval", face_ok))
        if not face_ok:
            reason = "We couldn't find a face in the oval. Face the camera, fill the oval and try again."

        brightness = float(np.mean(p.gray[p.oval]))
        lz, rz = p.zone_mask("leftCheek"), p.zone_mask("rightCheek")
        imbalance = float(np.median(p.gray[lz]) - np.median(p.gray[rz])) if lz.sum() > 30 and rz.sum() > 30 else 0.0
        dim = False
        if brightness < 50:
            checks.append(Check("light", "Too dark to read your skin", False))
            # Darkness also hides the face, so it is the reason to show.
            reason = "It's too dark. Face a window or a bright light and try again."
        elif brightness > 230:
            checks.append(Check("light", "Too bright, details are washed out", False))
            reason = "The photo is too bright. Step out of direct light and try again."
        elif brightness < 80:
            dim = True
            checks.append(Check("light", "A little dim", False, "Still usable"))
        elif abs(imbalance) > 30:
            dim = True
            side = "left" if imbalance < 0 else "right"
            checks.append(Check("light", f"Slightly dim on the {side} side", False, "Still usable"))
        else:
            checks.append(Check("light", "Even light", True))

        # Focus: Laplacian variance, normalised for exposure so dark photos aren't called blurry.
        x0, x1, y0, y1 = p.box
        raw = float(laplacian(p.gray[y0:y1, x0:x1]).var()) if (x1 - x0) > 8 and (y1 - y0) > 8 else 0.0
        sharp = raw / max(0.15, (brightness / 128) ** 2)
        focus_ok = sharp >= 10.0
        checks.insert(1, Check("focus", "In focus" if focus_ok else "Photo is blurry", focus_ok))
        if not focus_ok and not reason:
            reason = "The photo is blurry. Hold the phone steady and tap to focus."

        return QualityResult(
            checks=checks,
            usable=reason is None,
            dim=dim,
            reason=reason,
            metrics={"skinRatio": round(p.skin_ratio, 3), "sharpness": round(sharp, 1), "brightness": round(brightness, 1), "imbalance": round(imbalance, 1)},
        )

    def analyse(self, image: bytes, dim: bool) -> Analysis:
        p = Prepared(image)
        lab = to_lab(p.rgb)
        L, a = lab[..., 0], lab[..., 1]
        chroma = np.hypot(lab[..., 1], lab[..., 2])
        tex = np.abs(laplacian(p.gray))
        skin = p.skin if p.skin.sum() > 200 else p.oval
        Lm, am, cm = float(np.median(L[skin])), float(np.median(a[skin])), float(np.median(chroma[skin]))
        a_q20 = float(np.percentile(a[skin], 20))
        tex_m = float(np.median(tex[skin])) + 1e-3

        per_zone: dict[str, dict[str, float]] = {}
        for z in ZONES:
            m = p.zone_mask(z)
            if m.sum() < 30:
                m = skin
            za, zl, zc, zt = a[m], L[m], chroma[m], tex[m]
            red_delta = float(za.mean() - a_q20)
            red_frac = float((za > am + 6).mean())
            acne_frac = float((za > am + 9).mean())
            spot_frac = float((zl < Lm - 14).mean())
            texture = float(zt.mean() / tex_m)
            chroma_def = max(0.0, (cm - float(zc.mean())) / max(cm, 1.0))
            l_spread = float(zl.std())
            per_zone[z] = {
                "redness": 18 + 5.5 * red_delta + 90 * red_frac,
                "acne": 14 + 330 * acne_frac + 1.5 * max(0.0, red_delta - 4),
                "darkSpots": 16 + 210 * spot_frac + 0.9 * max(0.0, l_spread - 6),
                "pores": 12 + 26 * max(0.0, texture - 0.8),
                "dryness": 14 + 160 * chroma_def + 0.8 * max(0.0, l_spread - 8),
                "sensitivity": 15 + 3.2 * red_delta + 70 * red_frac,
            }

        concerns: dict[str, dict] = {}
        zone_pct: dict[str, dict[str, float]] = {z: {} for z in ZONES}
        for k in CONCERNS:
            vals = []
            for z in CONCERN_ZONES[k]:
                v = float(np.clip(per_zone[z][k], 5, 95))
                zone_pct[z][k] = v
                vals.append(v)
            pct = int(round(np.clip(0.6 * max(vals) + 0.4 * (sum(vals) / len(vals)), 5, 95)))
            concerns[k] = {"pct": pct, "level": level_for(pct)}

        zones = {z: "Clear" for z in ZONES}
        where: dict[str, list[str]] = {}
        for k in CONCERNS:
            ranked = sorted(CONCERN_ZONES[k], key=lambda z: zone_pct[z][k], reverse=True)
            hits = [z for z in ranked if zone_pct[z][k] >= 30][:2]
            if concerns[k]["level"] != "Clear" and not hits:
                hits = ranked[:1]
            where[k] = hits
            for z in hits:
                lvl = level_for(zone_pct[z][k])
                if RANK[lvl] > RANK[zones[z]]:
                    zones[z] = lvl

        avg = sum(c["pct"] for c in concerns.values()) / len(concerns)
        score = int(max(20, min(98, round(100 - avg * 0.55))))
        confidence = int(np.clip(90 - (10 if dim else 0) - max(0.0, (0.55 - p.skin_ratio) * 60), 50, 95))
        return Analysis(score=score, concerns=concerns, zones=zones, where=where, confidence=confidence)
