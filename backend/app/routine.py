"""Server copy of the routine generator (mobile/lib/routine.ts buildRoutine) so streaks and doctor
"stop" changes are computed the same way the app shows them."""

import re
from datetime import date, timedelta

from app.content import routine_library


MAX_COST = {"Low": 1, "Medium": 2, "Any": 3}
RANK = {"Clear": 0, "Mild": 1, "Moderate": 2, "High": 3}


def doctor_step(d: dict) -> dict:
    """A step a dermatologist added, shaped like a library step."""
    return {
        "id": d["id"],
        "period": d.get("period", "pm"),
        "title": d["title"],
        "subtitle": d.get("detail") or "From your dermatologist",
        "ingredients": [d["title"]],
        "why": f"Added by {d.get('by', 'your dermatologist')}.",
        "how": [d["detail"]] if d.get("detail") else [],
        "avoid": "",
        "minLength": 2,
        "cost": 1,
        "targets": [],
        "doctor": True,
        "by": d.get("by"),
    }


def paused_ids(prefs: dict, today: date | None = None) -> set[str]:
    """Steps a doctor paused until a date that hasn't passed yet."""
    today = today or date.today()
    out = set()
    for sid, until in (prefs.get("paused") or {}).items():
        try:
            if date.fromisoformat(until[:10]) > today:
                out.add(sid)
        except (TypeError, ValueError):
            continue
    return out


def build_routine(period: str, profile: dict, prefs: dict, scan: dict | None = None, today: date | None = None) -> list[dict]:
    """Mirror of mobile/lib/routine.ts buildRoutine; keep the two in step.
    Doctor-added steps always appear (they don't count toward the length); paused steps drop out until their date."""
    avoid = [a.lower() for a in profile.get("avoid", [])]
    length = prefs.get("length", 4)
    removed = set(prefs.get("removed", [])) | paused_ids(prefs, today)
    max_cost = MAX_COST.get(prefs.get("budget", "Any"), 3)
    out = []
    for s in routine_library():
        if s["period"] != period or s.get("rank", 99) > length or s["id"] in removed or s.get("cost", 1) > max_cost:
            continue
        if any(not re.match(r"^no\s", i, re.I) and any(a in i.lower() for a in avoid) for i in s["ingredients"]):
            continue
        out.append(s)

    def need(s: dict) -> int:
        if not scan or not s.get("targets"):
            return -1
        return max(RANK[scan["concerns"][k]["level"]] for k in s["targets"])

    if prefs.get("rebuild") and scan:
        out = [s for s in out if need(s) != 0]
        basics = [s for s in out if not s.get("targets")]
        treatments = sorted((s for s in out if s.get("targets")), key=lambda s: -need(s))
        keep = {s["id"] for s in (basics + treatments)[:length]}
        out = [s for s in out if s["id"] in keep]
    else:
        out = out[:length]
    extra = [doctor_step(d) for d in prefs.get("doctorSteps", []) if d.get("period", "pm") == period and d["id"] not in removed]
    # Doctor steps go before the moisturiser/sunscreen so the order still reads cleanse, treat, protect.
    tail = [s for s in out if s["id"].endswith(("moisturiser", "spf"))]
    head = [s for s in out if s not in tail]
    return head + extra + tail


def steps_matching(texts: list[str]) -> list[str]:
    """Routine step ids a doctor's "stop" list refers to, e.g. "Salicylic acid" -> pm-salicylic."""
    ids = []
    for t in texts:
        t = t.strip().lower()
        if len(t) < 3:
            continue
        for s in routine_library():
            title = s["title"].lower()
            names = [title] + [i.lower() for i in s["ingredients"] if not i.lower().startswith("no ")]
            if any(t in n or n in t for n in names) and s["id"] not in ids:
                ids.append(s["id"])
    return ids


def streak_before(today: date, log: dict[str, list[str]], profile: dict, prefs: dict, scan: dict | None = None) -> int:
    """Consecutive days before today with every morning step done."""
    am = {s["id"] for s in build_routine("am", profile, prefs, scan)}
    if not am:
        return 0
    n = 0
    d = today - timedelta(days=1)
    while am.issubset(set(log.get(d.isoformat(), []))):
        n += 1
        d -= timedelta(days=1)
    return n
