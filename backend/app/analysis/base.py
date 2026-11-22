from dataclasses import dataclass, field
from typing import Protocol

CONCERNS = ["acne", "dryness", "redness", "darkSpots", "sensitivity", "pores"]
ZONES = ["forehead", "nose", "leftCheek", "rightCheek", "chin"]
RANK = {"Clear": 0, "Mild": 1, "Moderate": 2, "High": 3}


def level_for(pct: float) -> str:
    """Same bands as the app (mobile/lib/analysis.ts levelFor)."""
    if pct < 30:
        return "Clear"
    if pct < 60:
        return "Mild"
    if pct < 76:
        return "Moderate"
    return "High"


@dataclass
class Check:
    key: str
    label: str
    ok: bool
    note: str | None = None

    def as_dict(self) -> dict:
        d = {"key": self.key, "label": self.label, "ok": self.ok}
        if self.note:
            d["note"] = self.note
        return d


@dataclass
class QualityResult:
    checks: list[Check]
    usable: bool
    dim: bool
    reason: str | None = None
    metrics: dict = field(default_factory=dict)


@dataclass
class Analysis:
    score: int
    concerns: dict  # {key: {pct, level}}
    zones: dict  # {zone: level}
    where: dict  # {concern: [zones]}
    confidence: int


class SkinAnalyzer(Protocol):
    def check(self, image: bytes) -> QualityResult: ...

    def analyse(self, image: bytes, dim: bool) -> Analysis: ...
