from app.analysis.base import Analysis, QualityResult, SkinAnalyzer
from app.analysis.heuristic import HeuristicAnalyzer

_analyzer: SkinAnalyzer = HeuristicAnalyzer()


def get_analyzer() -> SkinAnalyzer:
    """The ONNX model plugs in here once it is trained (see docs/NEXT.md)."""
    return _analyzer


__all__ = ["Analysis", "QualityResult", "SkinAnalyzer", "get_analyzer"]
