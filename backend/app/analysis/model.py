"""Skin analysis with pretrained ONNX models (Glowlytics skin models, MIT, huggingface.co/mufasabrownie/glowlytics-skin-models).

- `skin_signals.onnx`: EfficientNet-B0 trained on face photos (UTKFace + FFHQ). Gives four 0-1 scores where higher
  is healthier: structure (pores, texture), hydration, sun damage (pigmentation) and elasticity.
- `acne_detector.onnx`: YOLOv8s that boxes acne lesions. Lesions are counted per face zone.

Pores, dryness, dark spots and acne come from the models. Redness and sensitivity, which no free model covers yet,
and the per-zone spread of the model scores still come from the pixel-statistics analyzer. Photo checks (face,
focus, light) also stay with the heuristic. These models are NOT validated medical devices.
"""

import io
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageOps

from app.analysis.base import CONCERNS, Analysis, QualityResult
from app.analysis.heuristic import CONCERN_ZONES, ZONE_BOX, HeuristicAnalyzer, Prepared, assemble, concern_from_zones, zone_scores

SIGNALS = ["structure", "hydration", "sunDamage", "elasticity"]
# Which concern each signal reads (pct = 100 - healthy score).
SIGNAL_CONCERN = {"structure": "pores", "hydration": "dryness", "sunDamage": "darkSpots"}
MEAN = np.array([0.485, 0.456, 0.406], np.float32)
STD = np.array([0.229, 0.224, 0.225], np.float32)
DET_SIDE = 640
DET_CONF = 0.30
DET_IOU = 0.45


def _session(path: Path) -> ort.InferenceSession:
    opts = ort.SessionOptions()
    opts.intra_op_num_threads = 2
    return ort.InferenceSession(str(path), opts, providers=["CPUExecutionProvider"])


def nms(boxes: np.ndarray, scores: np.ndarray, iou: float) -> list[int]:
    """Greedy non-max suppression over (x0, y0, x1, y1) boxes."""
    order, keep = scores.argsort()[::-1], []
    area = (boxes[:, 2] - boxes[:, 0]) * (boxes[:, 3] - boxes[:, 1])
    while order.size:
        i = order[0]
        keep.append(int(i))
        xx0 = np.maximum(boxes[i, 0], boxes[order[1:], 0])
        yy0 = np.maximum(boxes[i, 1], boxes[order[1:], 1])
        xx1 = np.minimum(boxes[i, 2], boxes[order[1:], 2])
        yy1 = np.minimum(boxes[i, 3], boxes[order[1:], 3])
        inter = np.clip(xx1 - xx0, 0, None) * np.clip(yy1 - yy0, 0, None)
        order = order[1:][inter / (area[i] + area[order[1:]] - inter + 1e-6) <= iou]
    return keep


class ModelAnalyzer:
    def __init__(self, model_dir: Path):
        self.signals = _session(model_dir / "skin_signals.onnx")
        self.detector = _session(model_dir / "acne_detector.onnx")
        self.heuristic = HeuristicAnalyzer()

    def check(self, image: bytes) -> QualityResult:
        return self.heuristic.check(image)

    # --- model passes -------------------------------------------------------------------------------------------

    def signal_scores(self, face: Image.Image) -> dict[str, float]:
        """0-100 healthy scores from a square face crop."""
        x = face.resize((224, 224), Image.BILINEAR)
        x = ((np.asarray(x, np.float32) / 255 - MEAN) / STD).transpose(2, 0, 1)[None]
        out = self.signals.run(None, {"image": x})[0][0]
        return {k: float(v) * 100 for k, v in zip(SIGNALS, out)}

    def lesions(self, im: Image.Image) -> np.ndarray:
        """Acne boxes as (cx, cy) centres in 0-1 image coordinates."""
        w, h = im.size
        r = DET_SIDE / max(w, h)
        nw, nh = round(w * r), round(h * r)
        ox, oy = (DET_SIDE - nw) // 2, (DET_SIDE - nh) // 2
        canvas = Image.new("RGB", (DET_SIDE, DET_SIDE), (114, 114, 114))
        canvas.paste(im.resize((nw, nh), Image.BILINEAR), (ox, oy))
        x = (np.asarray(canvas, np.float32) / 255).transpose(2, 0, 1)[None]
        y = self.detector.run(None, {"images": x})[0][0]  # (5, 8400): cx, cy, w, h, conf
        keep = y[4] > DET_CONF
        if not keep.any():
            return np.zeros((0, 2), np.float32)
        cx, cy, bw, bh, conf = y[:, keep]
        boxes = np.stack([cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2], 1)
        idx = nms(boxes, conf, DET_IOU)
        return np.stack([(cx[idx] - ox) / nw, (cy[idx] - oy) / nh], 1)

    # --- analysis -----------------------------------------------------------------------------------------------

    def analyse(self, image: bytes, dim: bool) -> Analysis:
        p = Prepared(image)
        im = ImageOps.exif_transpose(Image.open(io.BytesIO(image))).convert("RGB")
        h, w, _ = p.rgb.shape
        x0, x1, y0, y1 = p.box
        zone_pct = zone_scores(p)
        concerns = {k: concern_from_zones(zone_pct, k) for k in CONCERNS}

        # Global signals on a square crop around the face, with a margin like the training photos.
        side = max(x1 - x0, y1 - y0) * 1.25
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        sx, sy = im.width / w, im.height / h
        crop = (max(0, (cx - side / 2) * sx), max(0, (cy - side / 2) * sy), min(im.width, (cx + side / 2) * sx), min(im.height, (cy + side / 2) * sy))
        sig = self.signal_scores(im.crop(tuple(round(v) for v in crop)))
        for s, k in SIGNAL_CONCERN.items():
            pct = float(np.clip(100 - sig[s], 5, 95))
            # Keep the heuristic's zone ranking but scale it so the worst zone matches the model's reading.
            top = max(zone_pct[z][k] for z in CONCERN_ZONES[k])
            for z in CONCERN_ZONES[k]:
                zone_pct[z][k] = float(np.clip(pct * zone_pct[z][k] / max(top, 1.0), 5, 95))
            concerns[k] = int(round(pct))

        # Acne: lesions counted inside each zone of the face box.
        pts = self.lesions(im) * np.array([w, h], np.float32)
        on_face = [(px, py) for px, py in pts if x0 <= px <= x1 and y0 <= py <= y1]
        for z in CONCERN_ZONES["acne"]:
            u0, u1, v0, v1 = ZONE_BOX[z]
            # Zones are widened a little so lesions between boxes still count somewhere.
            zx0, zx1 = x0 + (u0 - 0.06) * (x1 - x0), x0 + (u1 + 0.06) * (x1 - x0)
            zy0, zy1 = y0 + (v0 - 0.06) * (y1 - y0), y0 + (v1 + 0.06) * (y1 - y0)
            n = sum(zx0 <= px <= zx1 and zy0 <= py <= zy1 for px, py in on_face)
            zone_pct[z]["acne"] = float(np.interp(n, [0, 1, 4, 8, 15], [8, 30, 50, 68, 88]))
        concerns["acne"] = int(round(np.interp(len(on_face), [0, 3, 10, 20, 35], [8, 30, 55, 72, 92])))

        result = assemble(concerns, zone_pct, dim, p.skin_ratio)
        # Elasticity has no concern of its own in the app; it nudges the overall score.
        result.score = int(max(20, min(98, round(0.85 * result.score + 0.15 * sig["elasticity"]))))
        return result


__all__ = ["ModelAnalyzer"]
