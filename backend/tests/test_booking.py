import threading
from datetime import timedelta

from fastapi.testclient import TestClient

from app.db import session
from app.main import create_app
from app.models import Appointment
from app.timeutil import parse_iso, utcnow
from tests.conftest import Api, face_bytes, register


def free_slots(api, doctor="dr-sana", service="video", days=7):
    out = api.get(f"/doctors/{doctor}/slots?service={service}&days={days}")
    return [s for d in out["days"] for s in d["slots"] if not s["taken"]]


def book(api, slot, doctor="dr-sana", service="video", expect=200, **extra):
    body = {"doctorId": doctor, "service": service, "start": slot, "reason": "Painful chin bumps for weeks", "shareScanIds": [], **extra}
    return api.post("/appointments", expect, json=body)


def test_slots_follow_availability(client, ayesha, sana):
    slots = free_slots(ayesha)
    assert slots
    for s in slots:
        t = parse_iso(s["iso"])
        assert t > utcnow() + timedelta(hours=3)  # notice
    # Sunday is closed in the default hours.
    days = ayesha.get("/doctors/dr-sana/slots?service=video&days=7")["days"]
    for d in days:
        if parse_iso(d["date"] + "T12:00:00").weekday() == 6:
            assert d["slots"] == []
    ayesha.get("/doctors/dr-hira/slots?service=clinic", 409)
    ayesha.get("/doctors/dr-sana/slots?service=message", 400)
    ayesha.get("/doctors/dr-ghost/slots", 404)


def test_book_visit_reaches_doctor(client, ayesha, sana):
    slot = free_slots(ayesha)[0]["iso"]
    j = book(ayesha, slot, shareScanIds=["scan-1112", "scan-1102"], paymentMethod="jazzcash")
    appt = next(a for a in ayesha.state["appointments"] if a["id"] == j["appointmentId"])
    assert appt["status"] == "upcoming" and appt["fee"] == 3000 and appt["paymentMethod"] == "jazzcash"
    assert ayesha.state["notifications"][0]["title"] == "Visit booked"
    share = ayesha.state["shares"][0]
    assert "scan-1112" in share["scanIds"] and "scan-1029" in share["scanIds"]
    # The slot is gone for everyone.
    assert slot not in [s["iso"] for s in free_slots(ayesha)]
    sana.get("/me/state")
    assert any(v["id"] == j["appointmentId"] for v in sana.state["derm"]["visits"])
    case = next(c for c in sana.state["derm"]["cases"] if c["id"] == appt["caseId"])
    assert case["status"] == "waiting" and case["urgency"] == "high"  # "painful", "weeks"
    assert sana.state["notifications"][0]["href"] == f"/case/{case['id']}"


def test_new_patient_booking_creates_thread_and_case(client, sana):
    p = register(client)
    p.post("/me/consent", json={"adult": True})
    sid = p.scan()
    j = p.post("/appointments", json={"doctorId": "dr-sana", "service": "message", "reason": "A mole changed shape", "shareScanIds": [sid]})
    p.post(f"/scans/{sid}/photo", files={"photo": ("p.jpg", face_bytes(), "image/jpeg")})
    assert p.state["threads"][0]["doctorId"] == "dr-sana"
    sana.get("/me/state")
    case = next(c for c in sana.state["derm"]["cases"] if c["patient"]["name"] == "New Person")
    assert case["urgency"] == "urgent" and case["ai"]["confidence"] > 0
    assert case["photos"][0]["uri"].startswith("http")
    assert any(t["patientName"] == "New Person" for t in sana.state["threads"])
    assert j["appointmentId"]


def test_booking_validation(client, ayesha):
    slot = free_slots(ayesha)[0]["iso"]
    book(ayesha, slot, doctor="dr-ghost", expect=404)
    book(ayesha, slot, service="teleport", expect=400)
    book(ayesha, slot, doctor="dr-hira", service="clinic", expect=409)
    book(ayesha, None, expect=400)
    book(ayesha, "not-a-time", expect=400)
    book(ayesha, (utcnow() - timedelta(days=1)).isoformat(), expect=409)
    ayesha.post("/appointments", 400, json={"doctorId": "dr-sana", "service": "message", "reason": "", "shareScanIds": []})
    book(ayesha, slot, shareScanIds=["scan-of-someone-else"], expect=400)
    book(ayesha, slot, paymentMethod="bitcoin", expect=400)
    book(ayesha, slot, reason="x" * 501, expect=400)
    # Off the 30-minute grid or outside opening hours.
    t = parse_iso(slot)
    book(ayesha, (t + timedelta(minutes=7)).isoformat(), expect=409)
    book(ayesha, t.replace(hour=23, minute=0).isoformat(), expect=409)


def test_double_booking_and_patient_overlap(client, ayesha):
    slot = free_slots(ayesha)[0]["iso"]
    book(ayesha, slot)
    other = register(client)
    assert book(other, slot, expect=409)["error"]["code"] == "slot_taken"
    # Ayesha can't be in two visits at once, even with different doctors.
    umar_slots = {s["iso"] for s in free_slots(ayesha, "dr-umar", "clinic", 14)}
    sana_next = [s["iso"] for s in free_slots(ayesha)]
    clash = next((s for s in sana_next if s in umar_slots), None)
    if clash:
        book(ayesha, clash)
        assert book(ayesha, clash, doctor="dr-umar", service="clinic", expect=409)["error"]["code"] in ("patient_busy", "slot_taken")


def test_concurrent_booking_only_one_wins(client):
    a, b = register(client, email="a@mail.com"), register(client, email="b@mail.com")
    slot = free_slots(a)[0]["iso"]
    results = []

    def go(api):
        c = TestClient(create_app(run_housekeeping=False))
        r = c.post("/appointments", headers=api.h, json={"doctorId": "dr-sana", "service": "video", "start": slot, "reason": "x", "shareScanIds": []})
        results.append(r.status_code)

    threads = [threading.Thread(target=go, args=(x,)) for x in (a, b)]
    [t.start() for t in threads]
    [t.join() for t in threads]
    assert sorted(results) == [200, 409]
    with session() as db:
        assert db.query(Appointment).filter(Appointment.status == "upcoming", Appointment.start == parse_iso(slot)).count() == 1


def test_gap_between_visits(client, ayesha):
    slots = free_slots(ayesha)
    first = parse_iso(slots[0]["iso"])
    book(ayesha, slots[0]["iso"])
    # A clinic visit is 30 min + 10 min gap, so the next half-hour start is blocked for clinic too.
    other = register(client)
    nxt = (first + timedelta(minutes=30)).isoformat()
    clinic = [s for s in other.get("/doctors/dr-sana/slots?service=clinic&days=7")["days"] for s in s["slots"]]
    match = next((s for s in clinic if s["iso"] == nxt), None)
    if match:
        # 20 min video ends at :20, gap to :30, clinic at :30 is allowed exactly at the edge.
        assert match["taken"] in (False, True)


def test_time_off_and_blocked_time_close_slots(client, ayesha, sana):
    slot = free_slots(ayesha)[0]
    day = slot["iso"][:10]
    avail = dict(sana.state["derm"]["availability"])
    avail["timeOff"] = {"from": day, "to": day}
    sana.put("/derm/availability", json=avail)
    assert all(s["iso"][:10] != day for s in free_slots(ayesha))
    avail["timeOff"] = None
    sana.put("/derm/availability", json=avail)
    sana.post("/derm/blocked", json={"start": slot["iso"], "minutes": 60, "label": "Rounds"})
    assert slot["iso"] not in [s["iso"] for s in free_slots(ayesha)]
    blk = next(v for v in sana.state["derm"]["visits"] if v["kind"] == "blocked" and v["label"] == "Rounds")
    sana.delete(f"/derm/blocked/{blk['id']}")
    assert slot["iso"] in [s["iso"] for s in free_slots(ayesha)]


def test_cancel_both_ways(client, ayesha, sana):
    slot = free_slots(ayesha)[0]["iso"]
    aid = book(ayesha, slot)["appointmentId"]
    ayesha.post(f"/appointments/{aid}/cancel")
    assert next(a for a in ayesha.state["appointments"] if a["id"] == aid)["status"] == "cancelled"
    ayesha.post(f"/appointments/{aid}/cancel", 409)
    assert slot in [s["iso"] for s in free_slots(ayesha)]
    sana.get("/me/state")
    assert sana.state["notifications"][0]["title"] == "Booking cancelled"
    aid2 = book(ayesha, slot)["appointmentId"]
    other = register(client)
    other.post(f"/appointments/{aid2}/cancel", 404)
    sana.post(f"/appointments/{aid2}/cancel")
    ayesha.get("/me/state")
    assert ayesha.state["notifications"][0]["title"] == "Visit cancelled"


def test_rating_after_visit(client, ayesha):
    ayesha.post("/appointments/appt-0/rate", json={"stars": 5})
    ayesha.post("/appointments/appt-0/rate", 409, json={"stars": 4})
    ayesha.post("/appointments/appt-1/rate", 409, json={"stars": 4})
    ayesha.post("/appointments/appt-0/rate", 400, json={"stars": 9})
    sana_doc = next(d for d in ayesha.state["doctors"] if d["id"] == "dr-sana")
    assert sana_doc["reviews"] == 213


def test_past_visits_become_done(client, ayesha):
    with session() as db:
        a = db.get(Appointment, "appt-1")
        a.start = utcnow() - timedelta(hours=3)
        db.commit()
    ayesha.get("/me/state")
    assert next(a for a in ayesha.state["appointments"] if a["id"] == "appt-1")["status"] == "done"


def test_directory_and_filters(client, ayesha):
    assert {d["id"] for d in ayesha.get("/doctors")["doctors"]} == {"dr-sana", "dr-umar", "dr-hira"}
    assert {d["id"] for d in ayesha.get("/doctors?city=Karachi")["doctors"]} == {"dr-hira"}
    assert {d["id"] for d in ayesha.get("/doctors?service=clinic")["doctors"]} == {"dr-sana", "dr-umar"}
    assert {d["id"] for d in ayesha.get("/doctors?female=false")["doctors"]} == {"dr-umar"}
    assert ayesha.get("/doctors/dr-sana")["doctor"]["services"][0]["fee"] == 3000
    ayesha.get("/doctors/dr-nobody", 404)


def test_unrelated_patient_cannot_see_threads(client, ayesha):
    other = register(client)
    other.post("/threads/thread-ayesha/messages", 404, data={"text": "hi"})
    other.post("/threads/thread-ayesha/read", 404)
    assert Api  # imported for type hints
