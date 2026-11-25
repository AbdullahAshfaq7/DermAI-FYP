"""Rebuilds skin_signals.onnx from the published PyTorch weights.

The Hugging Face repo's skin_signals.onnx points at a weights file that was never uploaded, so it can't load.
This recreates the same network (timm EfficientNet-B0 + 1280-512-256 shared layers + four 256-64-1 sigmoid heads,
as on the model card) and exports it. Run by scripts/fetch_models.sh in a throwaway env with torch and timm.

Usage: python export_skin_signals.py skin_signals_best.pt out.onnx
"""

import sys

import timm
import torch
import torch.nn as nn


class SkinSignals(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = timm.create_model("efficientnet_b0", pretrained=False, num_classes=0)
        self.shared = nn.Sequential(nn.Linear(1280, 512), nn.ReLU(), nn.Dropout(0.3), nn.Linear(512, 256), nn.ReLU(), nn.Dropout(0.2))
        self.heads = nn.ModuleList([nn.Sequential(nn.Linear(256, 64), nn.ReLU(), nn.Linear(64, 1), nn.Sigmoid()) for _ in range(4)])

    def forward(self, x):
        h = self.shared(self.backbone(x))
        return torch.cat([head(h) for head in self.heads], dim=1)


if __name__ == "__main__":
    pt, out = sys.argv[1:3]
    m = SkinSignals()
    # weights_only: never unpickle arbitrary objects from a downloaded file.
    m.load_state_dict(torch.load(pt, map_location="cpu", weights_only=True), strict=True)
    m.eval()
    torch.onnx.export(m, torch.randn(1, 3, 224, 224), out, input_names=["image"], output_names=["scores"], opset_version=17, dynamo=False)
    print("wrote", out)
