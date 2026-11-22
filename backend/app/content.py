"""Static content shared with the app (exported from mobile/data/seed.ts by scripts/export_seed.mts)."""

import json
from functools import lru_cache
from pathlib import Path

PATH = Path(__file__).with_name("seed_data.json")


@lru_cache
def data() -> dict:
    return json.loads(PATH.read_text())


def routine_library() -> list[dict]:
    return data()["ROUTINE_LIBRARY"]


def concern_order() -> list[str]:
    return data()["CONCERN_ORDER"]


def concerns() -> dict:
    return data()["CONCERNS"]


def zone_label() -> dict:
    return data()["ZONE_LABEL"]


def skin_tones() -> list[str]:
    return data()["SKIN_TONES"]


def default_availability() -> dict:
    a = dict(data()["DEFAULT_AVAILABILITY"])
    a["timeOff"] = None
    return a
