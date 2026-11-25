#!/usr/bin/env bash
# Downloads the free skin models into backend/models (MIT, huggingface.co/mufasabrownie/glowlytics-skin-models).
# acne_detector.onnx is used as published; skin_signals.onnx is rebuilt from its PyTorch weights (see
# scripts/export_skin_signals.py). torch and timm are only pulled into a temporary env for that one step.
set -euo pipefail
cd "$(dirname "$0")/.."
REPO=https://huggingface.co/mufasabrownie/glowlytics-skin-models/resolve/main
mkdir -p models
[ -f models/acne_detector.onnx ] || curl -fSL -o models/acne_detector.onnx "$REPO/acne_detector.onnx"
if [ ! -f models/skin_signals.onnx ]; then
  tmp=$(mktemp -d)
  trap 'rm -rf "$tmp"' EXIT
  curl -fSL -o "$tmp/skin_signals_best.pt" "$REPO/skin_signals_best.pt"
  cp scripts/export_skin_signals.py "$tmp/"
  (cd "$tmp" && uv run --no-project --with torch --with timm --with onnx python -I export_skin_signals.py skin_signals_best.pt "$OLDPWD/models/skin_signals.onnx")
fi
ls -la models
