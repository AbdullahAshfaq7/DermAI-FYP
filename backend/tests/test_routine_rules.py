from datetime import timedelta

from app.db import session
from app.models import Appointment
from app.routine import build_routine, steps_matching
from app.timeutil import utcnow
from tests.conftest import register

PROFILE = {"avoid": []}


def scan(**levels):
    base = {k: {"pct": 10, "level": "Clear"} for k in ("acne", "dryness", "redness", "darkSpots", "sensitivity", "pores")}
    for k, v in levels.items():
        base[k] = {"pct": 70, "level": v}
    return {"concerns": base}


def ids(steps):
    return [s["id"] for s in steps]


def test_budget_filters_premium_steps():
    any_ = ids(build_routine("am", PROFILE, {"length": 6, "budget": "Any", "removed": []}))
    low = ids(build_routine("am", PROFILE, {"length": 6, "budget": "Low", "removed": []}))
    assert "am-vitc" in any_ and "am-vitc" not in low and "am-niacinamide" not in low
    assert set(low) == {"am-cleanser", "am-moisturiser", "am-spf"}


def test_rebuild_drops_treatments_for_clear_concerns_and_prioritises_worst():
    prefs = {"length": 4, "budget": "Any", "removed": [], "rebuild": True}
    clear = ids(build_routine("pm", PROFILE, {**prefs, "length": 6}, scan()))
    assert "pm-azelaic" not in clear and "pm-salicylic" not in clear and "pm-spot" not in clear
    acne = ids(build_routine("pm", PROFILE, {**prefs, "length": 6}, scan(acne="High")))
    assert "pm-salicylic" in acne and "pm-spot" in acne and "pm-azelaic" not in acne
    # Without rebuild the scan is ignored.
    assert "pm-azelaic" in ids(build_routine("pm", PROFILE, {**prefs, "rebuild": False}, scan()))


def test_avoid_list_and_removed_steps():
    prefs = {"length": 6, "budget": "Any", "removed": ["am-spf"]}
    out = ids(build_routine("am", {"avoid": ["Niacinamide"]}, prefs))
    assert "am-niacinamide" not in out and "am-spf" not in out
    # "No fragrance" never trips a "Fragrance" avoid.
    assert "am-cleanser" in ids(build_routine("am", {"avoid": ["Fragrance"]}, prefs))


def test_stop_text_matches_steps():
    assert steps_matching(["Salicylic acid"]) == ["pm-salicylic"]
    assert steps_matching(["clay mask", "xy"]) == []
    assert "am-vitc" in steps_matching(["Vitamin C serum"])


def test_patient_cannot_cancel_within_two_hours(client, ayesha, sana):
    with session() as db:
        a = db.get(Appointment, "appt-1")
        a.start = utcnow() + timedelta(minutes=90)
        db.commit()
    r = ayesha.post("/appointments/appt-1/cancel", 409)
    assert r["error"]["code"] == "too_late"
    # The doctor still can.
    sana.post("/appointments/appt-1/cancel")


def test_message_review_cancel_and_assessment_closes_it(client, sana):
    p = register(client)
    p.post("/me/consent", json={"adult": True})
    sid = p.scan()
    aid = p.post("/appointments", json={"doctorId": "dr-sana", "service": "message", "reason": "Redness", "shareScanIds": [sid]})["appointmentId"]
    case_id = next(a for a in p.state["appointments"] if a["id"] == aid)["caseId"]
    sana.post(f"/derm/cases/{case_id}/assessment", json={"findings": ["Rosacea"], "aiRating": "correct", "note": "Use SPF.", "stop": [], "keep": []})
    p.get("/me/state")
    assert next(a for a in p.state["appointments"] if a["id"] == aid)["status"] == "done"
    p.post(f"/appointments/{aid}/cancel", 409)
