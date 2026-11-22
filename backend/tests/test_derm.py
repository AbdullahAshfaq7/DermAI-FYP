import io

from PIL import Image

from app.db import session
from app.models import AiLabel
from tests.conftest import face_bytes, register

PDF = b"%PDF-1.4\n%fake certificate\n"


def jpg() -> bytes:
    b = io.BytesIO()
    Image.new("RGB", (600, 400), (200, 200, 200)).save(b, "JPEG")
    return b.getvalue()


def onboard(client, email="ali@clinic.pk"):
    d = register(client, role="dermatologist", name="Ali Hamid", email=email)
    d.post("/me/consent", json={"adult": True})
    d.put("/derm/profile", json={"name": "Ali Hamid", "specialties": ["Acne", "Rosacea"]})
    assert d.state["derm"]["step"] == "credentials"
    d.post("/derm/credentials", data={"pmdc": "77777-p", "qualification": "FCPS Dermatology", "clinic": "Johar Town, Lahore", "since": "2015"}, files={"certificate": ("pmdc.pdf", PDF, "application/pdf"), "degree": ("degree.jpg", jpg(), "image/jpeg")})
    assert d.state["derm"]["step"] == "services" and d.state["derm"]["city"] == "Lahore"
    d.put("/derm/services", json={"services": {"video": {"on": True, "fee": 2200}, "clinic": {"on": False, "fee": 0}, "message": {"on": True, "fee": 900}}})
    assert d.state["derm"]["step"] == "done" and d.state["derm"]["status"] == "pending"
    return d


def test_onboarding_validation(client):
    d = register(client, role="dermatologist", name="Ali Hamid", email="ali@clinic.pk")
    d.put("/derm/profile", 400, json={"name": "Dr. A", "specialties": ["Acne"]})
    d.put("/derm/profile", 400, json={"name": "Ali Hamid", "specialties": []})
    d.put("/derm/profile", 400, json={"name": "Ali Hamid", "specialties": ["Astrology"]})
    d.put("/derm/profile", 400, json={"name": "Ali Hamid", "specialties": ["Acne"], "languages": ["Klingon"]})
    d.put("/derm/profile", json={"name": "Ali Hamid", "specialties": ["Acne"]})
    form = {"pmdc": "12345-P", "qualification": "FCPS", "clinic": "Gulberg, Lahore"}
    docs = {"certificate": ("a.pdf", PDF, "application/pdf"), "degree": ("d.jpg", jpg(), "image/jpeg")}
    d.post("/derm/credentials", 400, data={**form, "pmdc": "abc"}, files=docs)
    d.post("/derm/credentials", 400, data=form)  # no documents
    d.post("/derm/credentials", 400, data=form, files={"certificate": ("a.pdf", PDF, "application/pdf")})  # degree missing
    d.post("/derm/credentials", 415, data=form, files={"certificate": ("a.exe", b"MZ....", "application/octet-stream"), "degree": ("d.jpg", jpg(), "image/jpeg")})
    d.post("/derm/credentials", 409, data={**form, "pmdc": "54123-P"}, files=docs)
    d.post("/derm/credentials", 400, data={**form, "since": "1800"}, files=docs)
    d.put("/derm/services", 409, json={"services": {"video": {"on": True, "fee": 2000}, "clinic": {"on": True, "fee": 2000}, "message": {"on": True, "fee": 1000}}})
    d.post("/derm/credentials", data=form, files=docs)
    d.put("/derm/services", 400, json={"services": {"video": {"on": False, "fee": 0}, "clinic": {"on": False, "fee": 0}, "message": {"on": False, "fee": 0}}})
    d.put("/derm/services", 400, json={"services": {"video": {"on": True, "fee": 10}, "clinic": {"on": False, "fee": 0}, "message": {"on": False, "fee": 0}}})
    d.put("/derm/services", 400, json={"services": {"video": {"on": True, "fee": 1000}}})


def test_pending_doctor_hidden_until_admin_approves(client, admin):
    d = onboard(client)
    patient = register(client)
    assert "Dr. Ali Hamid" not in [x["name"] for x in patient.state["doctors"]]
    patient.post("/appointments", 404, json={"doctorId": d.state["derm"]["id"], "service": "message", "reason": "x"})
    pending = admin.get("/admin/derms")["derms"]
    assert [p["email"] for p in pending] == ["ali@clinic.pk"] and pending[0]["certificate"].startswith("http") and pending[0]["degree"].startswith("http")
    patient.get("/admin/derms", 403)
    d.post(f"/admin/derms/{d.state['derm']['id']}/approve", 403)
    admin.post(f"/admin/derms/{d.state['derm']['id']}/approve")
    patient.get("/me/state")
    doc = next(x for x in patient.state["doctors"] if x["name"] == "Dr. Ali Hamid")
    assert [s["type"] for s in doc["services"]] == ["video", "message"] and doc["services"][0]["fee"] == 2200
    assert doc["city"] == "Lahore" and doc["nextSlot"]["iso"] and doc["years"] >= 10
    d.get("/me/state")
    assert d.state["derm"]["status"] == "approved" and d.state["derm"]["verifiedAt"]
    assert d.state["notifications"][0]["title"] == "You're verified"
    patient.post("/appointments", json={"doctorId": doc["id"], "service": "message", "reason": "Redness"})


def test_reject_and_resubmit(client, admin):
    d = onboard(client)
    admin.post(f"/admin/derms/{d.state['derm']['id']}/reject", json={"note": "Certificate is unreadable"})
    d.get("/me/state")
    assert d.state["derm"]["status"] == "rejected" and "unreadable" in d.state["derm"]["reviewNote"]
    d.post("/derm/credentials", data={"pmdc": "77777-P", "qualification": "FCPS Dermatology", "clinic": "Johar Town, Lahore"}, files={"certificate": ("pmdc.pdf", PDF, "application/pdf")})
    d.put("/derm/services", json={"services": d.state["derm"]["services"]})
    assert d.state["derm"]["status"] == "pending"


def test_patient_routes_blocked_for_doctor_and_vice_versa(client, ayesha, sana):
    ayesha.put("/derm/profile", 403, json={"name": "X Y Z", "specialties": ["Acne"]})
    ayesha.post("/derm/cases/case-ayesha/assessment", 403, json={"note": "x"})
    other = register(client, role="dermatologist", name="Other Doc", email="o@clinic.pk")
    other.put("/derm/cases/case-ayesha/draft", 404, json={"note": "x"})
    other.post("/threads/thread-ayesha/messages", 404, data={"text": "hello"})


def test_messaging_round_trip(client, ayesha, sana):
    ayesha.post("/threads/thread-ayesha/messages", data={"text": "The bumps hurt more today"}, files={"photo": ("p.jpg", face_bytes(), "image/jpeg")})
    sent = ayesha.state["threads"][0]["messages"][-1]
    assert sent["from"] == "patient" and sent["attachment"].startswith("http")
    sana.get("/me/state")
    t = next(t for t in sana.state["threads"] if t["id"] == "thread-ayesha")
    assert t["messages"][-1]["text"] == "The bumps hurt more today" and t["unreadForDoctor"] == 2
    assert "thread-ayesha" not in sana.state["derm"]["readThreads"]
    sana.post("/threads/thread-ayesha/read")
    assert "thread-ayesha" in sana.state["derm"]["readThreads"]
    sana.post("/threads/thread-ayesha/messages", data={"text": "Use a warm compress tonight."})
    ayesha.get("/me/state")
    t = ayesha.state["threads"][0]
    assert t["messages"][-1]["from"] == "doctor" and t["unreadForPatient"] == 1
    assert any(n["title"] == "Dr. Iqbal replied" for n in ayesha.state["notifications"])
    ayesha.post("/threads/thread-ayesha/messages", 400, data={"text": "   "})
    ayesha.post("/threads/thread-ayesha/messages", 400, data={"text": "x" * 2001})
    ayesha.post("/threads/thread-ayesha/messages", 415, data={"text": "hi"}, files={"photo": ("p.txt", b"not an image", "text/plain")})


def test_repeat_messages_reuse_one_notification(client, ayesha, sana):
    sana.post("/me/notifications/read-all")
    for i in range(3):
        ayesha.post("/threads/thread-ayesha/messages", data={"text": f"msg {i}"})
    sana.get("/me/state")
    unread = [n for n in sana.state["notifications"] if not n["read"] and n["href"] == "/inbox/thread-ayesha"]
    assert len(unread) == 1 and "msg 2" in unread[0]["body"]


def test_assessment_updates_patient_routine_and_labels(client, ayesha, sana):
    draft = {"findings": ["Inflammatory acne"], "aiRating": "partly", "note": "Stop azelaic acid for two weeks.", "stop": ["Azelaic acid"], "keep": ["SPF"]}
    sana.put("/derm/cases/case-ayesha/draft", json=draft)
    case = next(c for c in sana.state["derm"]["cases"] if c["id"] == "case-ayesha")
    assert case["draft"]["note"] == draft["note"]
    sana.post("/derm/cases/case-ayesha/assessment", 400, json={**draft, "note": ""})
    sana.post("/derm/cases/case-ayesha/assessment", 400, json={**draft, "aiRating": "maybe"})
    sana.post("/derm/cases/case-ayesha/assessment", json=draft)
    case = next(c for c in sana.state["derm"]["cases"] if c["id"] == "case-ayesha")
    assert case["status"] == "replied" and "draft" not in case and case["assessment"]["removedSteps"] == ["pm-azelaic"]
    ayesha.get("/me/state")
    assert "pm-azelaic" in ayesha.state["routinePrefs"]["removed"]
    msg = ayesha.state["threads"][0]["messages"][-1]
    assert msg["note"]["stop"] == ["Azelaic acid"] and msg["note"]["keep"] == ["SPF"]
    # Ayesha did not opt in to training, so no label is kept.
    with session() as db:
        assert db.query(AiLabel).count() == 0


def test_training_label_kept_only_with_opt_in(client, sana):
    sana.post("/derm/cases/case-zara/assessment", json={"findings": [], "aiRating": "correct", "note": "Start adapalene.", "stop": [], "keep": []})
    with session() as db:
        assert db.query(AiLabel).count() == 1


def test_close_reopen_and_closed_case_cannot_be_assessed(client, sana):
    sana.post("/derm/cases/case-omar/status", json={"status": "closed"})
    sana.post("/derm/cases/case-omar/assessment", 409, json={"note": "x"})
    sana.post("/derm/cases/case-omar/status", json={"status": "waiting"})
    sana.post("/derm/cases/case-omar/status", 400, json={"status": "deleted"})
    sana.post("/derm/cases/nope/status", 404, json={"status": "closed"})


def test_availability_validation(client, sana):
    a = sana.state["derm"]["availability"]
    sana.put("/derm/availability", json={**a, "gapMinutes": 15, "noticeHours": 6})
    assert sana.state["derm"]["availability"]["gapMinutes"] == 15
    bad_days = [dict(x) for x in a["days"]]
    bad_days[0] = {**bad_days[0], "open": True, "from": "7:00 pm", "to": "2:00 pm"}
    for bad in (
        {**a, "days": bad_days},
        {**a, "days": a["days"][:5]},
        {**a, "gapMinutes": 500},
        {**a, "noticeHours": -1},
        {**a, "timeOff": {"from": "2026-12-24", "to": "2026-12-20"}},
        {**a, "timeOff": {"from": "soon"}},
    ):
        sana.put("/derm/availability", 400, json=bad)
    sana.post("/derm/blocked", 400, json={"start": "2026-12-01T10:00:00+05:00", "minutes": 5})


def test_doctor_stats_and_ledger(client, sana):
    d = sana.state["derm"]
    assert d["stats"]["patients"] >= 5 and d["stats"]["rating"] == 4.9
    assert d["commissionPct"] == 10 and all(x["fee"] > 0 for x in d["ledger"])
    assert d["visits"] and d["cases"]


def test_prescription_add_pause_stop_and_rescan(client, ayesha, sana):
    case = next(c for c in sana.state["derm"]["cases"] if c["id"] == "case-ayesha")
    routine = {r["id"]: r for r in case["patient"]["routine"]}
    assert "am-cleanser" in routine and case["number"] == "DA-2038"
    body = {
        "findings": ["Inflamed acne"],
        "aiRating": "correct",
        "note": "Pause the azelaic acid, start adapalene.",
        "changes": [
            {"action": "add", "title": "Adapalene 0.1%", "detail": "Every other night", "period": "pm"},
            {"action": "pause", "stepId": "pm-azelaic", "title": "Azelaic acid 10%", "weeks": 2},
        ],
        "rescanWeeks": 4,
    }
    for bad in (
        {**body, "changes": [{"action": "add", "title": "", "period": "pm"}]},
        {**body, "changes": [{"action": "pause", "stepId": "pm-azelaic", "weeks": 40}]},
        {**body, "changes": [{"action": "explode", "stepId": "x"}]},
        {**body, "rescanWeeks": 100},
    ):
        sana.post("/derm/cases/case-ayesha/assessment", 400, json=bad)
    sana.post("/derm/cases/case-ayesha/assessment", json=body)
    ayesha.get("/me/state")
    prefs = ayesha.state["routinePrefs"]
    added = prefs["doctorSteps"]
    assert added[0]["title"] == "Adapalene 0.1%" and added[0]["by"] == "Dr. Sana Iqbal" and added[0]["id"].startswith("rx-")
    assert "pm-azelaic" in prefs["paused"]
    assert ayesha.state["settings"]["rescanDue"]
    assert any(n["title"] == "New scan requested" for n in ayesha.state["notifications"])
    sent = next(n for n in ayesha.state["notifications"] if n["title"].endswith("sent your assessment"))
    assert sent["body"].startswith("Pause the azelaic acid, start adapalene.") and "routine changed (2 steps)" in sent["body"]
    msg = ayesha.state["threads"][0]["messages"][-1]
    assert msg["note"]["changes"][0]["action"] == "add" and msg["note"]["rescanWeeks"] == 4
    # The doctor now sees the added step in the patient's routine and can stop it later.
    sana.get("/me/state")
    case = next(c for c in sana.state["derm"]["cases"] if c["id"] == "case-ayesha")
    rx = next(r for r in case["patient"]["routine"] if r["doctor"])
    assert "pm-azelaic" not in [r["id"] for r in case["patient"]["routine"]]
    sana.post("/derm/cases/case-ayesha/assessment", json={**body, "changes": [{"action": "stop", "stepId": rx["id"], "title": rx["title"]}], "rescanWeeks": None})
    ayesha.get("/me/state")
    assert ayesha.state["routinePrefs"]["doctorSteps"] == []
    # Patients can't add doctor steps themselves.
    ayesha.patch("/me/routine-prefs", 400, json={"doctorSteps": [{"id": "rx-1", "title": "x"}]})


def test_cases_carry_numbers_and_flag_reasons(client, sana):
    from tests.conftest import register

    p = register(client)
    p.post("/me/consent", json={"adult": True})
    sid = p.scan()
    p.post("/appointments", json={"doctorId": "dr-sana", "service": "message", "reason": "Rash spreading with a fever", "shareScanIds": [sid]})
    sana.get("/me/state")
    case = next(c for c in sana.state["derm"]["cases"] if c["patient"]["name"] == "New Person")
    assert case["number"].startswith("DA-") and int(case["number"][3:]) > 2041
    assert "spreading" in case["flags"] and "fever reported" in case["flags"]


def test_clip_never_cuts_mid_word():
    from app.routers.derm import clip

    assert clip("short note", 90) == "short note"
    out = clip("This looks like inflamed acne, not a cyst. Pause the azelaic acid and start adapalene tonight.", 70)
    assert out.endswith("…") and "adap…" not in out and len(out) <= 71
