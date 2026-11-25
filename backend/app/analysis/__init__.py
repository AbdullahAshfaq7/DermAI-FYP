import logging
from functools import lru_cache

from app.analysis.base import Analysis, QualityResult, SkinAnalyzer
from app.analysis.heuristic import HeuristicAnalyzer
from app.config import get_settings

log = logging.getLogger(__name__)


@lru_cache
def get_analyzer() -> SkinAnalyzer:
    """The ONNX models when they are on disk (scripts/fetch_models.sh), else the pixel heuristic.
    DERMAI_ANALYZER=heuristic|model|auto picks one."""
    s = get_settings()
    found = all((s.model_dir / f).exists() for f in ("skin_signals.onnx", "acne_detector.onnx"))
    if s.analyzer == "model" or (s.analyzer == "auto" and found):
        from app.analysis.model import ModelAnalyzer

        log.info("Skin analyzer: ONNX models from %s", s.model_dir)
        return ModelAnalyzer(s.model_dir)
    log.info("Skin analyzer: heuristic (no models in %s)", s.model_dir)
    return HeuristicAnalyzer()


__all__ = ["Analysis", "QualityResult", "SkinAnalyzer", "get_analyzer"]
