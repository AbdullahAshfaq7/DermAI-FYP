"""Admin portal: access control, every admin action, and the edge cases around them."""

from datetime import timedelta

import pytest

from app.db import session
from app.models import AdminLog, Appointment, Dermatologist, Scan, User
from app.timeutil import utcnow
from tests.conftest import Api, register
from tests.test_derm import onboard

ADMIN_GETS = ["/admin/overview", "/admin/users", "/admin/users/u-ayesha", "/admin/derms", "/admin/derms/dr-sana", "/admin/appointments", "/admin/cases", "/admin/scans", "/admin/audit"]


def actions(*names: str) -> list[str]:
    with session() as db:
        return [a.action for a in db.query(AdminLog).order_by(AdminLog.at) if not names or a.action in names]


# ───────────── Access ─────────────


@pytest.mark.parametrize("path", ADMIN_GETS)
def test_admin_routes_need_admin(client, ayesha, sana, path):
    assert client.get(path).status_code == 401
    ayesha.get(path, 403)
    sana.get(path, 403)


def test_admin_writes_need_admin(client, ayesha, sana):
    for who in (ayesha, sana):
        who.post("/admin/users", 403, json={"role": "admin", "name": "Evil Admin", "email": "evil@x.com", "password": "secret123"})
        who.post("/admin/users/u-nida/suspend", 403, json={})
        who.delete("/admin/users/u-nida", 403)
        who.post("/admin/broadcast", 403, json={"audience": "all", "title": "Hi there"})
        who.post("/admin/derms/dr-sana/reject", 403, json={"note": "x"})


def test_admin_login_and_state(admin):
    assert admin.state["session"]["role"] == "admin"
    admin.get("/me/state")
    assert admin.state["session"]["email"] == "admin@dermai.pk"


# ───────────── Overview ─────────────


def test_overview_counts(admin):
    o = admin.get("/admin/overview")
    with session() as db:
        assert o["users"]["total"] == db.query(User).count()
        assert o["users"]["patients"] == db.query(User).filter(User.role == "patient").count()
        assert o["users"]["dermatologists"] == 3 and o["users"]["admins"] == 1
        assert o["scans"]["total"] == db.query(Scan).count()
        done_fees = sum(a.fee for a in db.query(Appointment).filter(Appointment.status == "done"))
    assert o["doctors"]["approved"] == 3 and o["doctors"]["pending"] == 0
    assert o["revenue"]["gross"] == done_fees and o["revenue"]["commission"] == round(done_fees * o["revenue"]["commissionPct"] / 100)
    assert len(o["recentUsers"]) == 5 and o["users"]["suspended"] == 0


def test_overview_with_empty_tables(client, admin):
    with session() as db:
        db.query(Scan).delete()
        db.query(Appointment).delete()
        db.commit()
    o = admin.get("/admin/overview")
    assert o["scans"] == {"total": 0, "thisWeek": 0, "averageScore": None}
    assert o["revenue"]["gross"] == 0 and o["appointments"]["upcoming"] == 0


# ───────────── Users: list, search, detail ─────────────


def test_list_filter_search_and_paginate(admin):
    all_ = admin.get("/admin/users")
    assert all_["total"] == len(all_["users"]) and all_["total"] == 11
    docs = admin.get("/admin/users?role=dermatologist")["users"]
    assert {u["email"] for u in docs} == {"sana@clinic.pk", "umar@clinic.pk", "hira@clinic.pk"} and all(u["dermStatus"] == "approved" for u in docs)
    assert [u["email"] for u in admin.get("/admin/users?q=AYESHA")["users"]] == ["ayesha@mail.com"]
    assert admin.get("/admin/users?q=demo.dermai")["total"] == 6
    assert admin.get("/admin/users?q=u-nida")["users"][0]["name"] == "Nida Saleem"
    # Wildcards in the search are literal, not SQL patterns.
    assert admin.get("/admin/users?q=%25")["total"] == 0
    assert admin.get("/admin/users?q=_")["total"] == 0
    p1 = admin.get("/admin/users?limit=5&offset=0")
    p2 = admin.get("/admin/users?limit=5&offset=5")
    assert len(p1["users"]) == 5 and not {u["id"] for u in p1["users"]} & {u["id"] for u in p2["users"]}
    assert admin.get("/admin/users?offset=9999")["users"] == []
    assert admin.get("/admin/users?limit=0")["limit"] == 1 and admin.get("/admin/users?limit=100000")["limit"] == 200
    assert admin.get("/admin/users?offset=-5")["offset"] == 0
    admin.get("/admin/users?role=superuser", 400)
    admin.get("/admin/users?status=banned", 400)
    admin.get("/admin/users?limit=abc", 422)


def test_patient_detail_has_everything(admin):
    u = admin.get("/admin/users/u-ayesha")
    assert u["role"] == "patient" and u["email"] == "ayesha@mail.com"
    assert u["counts"]["scans"] == 5 and len(u["scans"]) == 5
    assert u["appointments"] and u["appointments"][0]["doctorName"].startswith("Dr.")
    assert u["cases"] and u["cases"][0]["number"].startswith("DA-")
    assert set(u["profile"]) >= {"phone", "dob", "gender", "city", "tone", "concerns"}
    assert set(u["settings"]) >= {"remindAm", "photoRetention", "train"}
    assert u["consent"]["adult"] is True and u["derm"] is None
    # Scan photos stay private to the patient's phone.
    assert all("photoUri" not in s for s in u["scans"])


def test_doctor_detail_has_everything(admin):
    u = admin.get("/admin/users/u-dr-sana")
    d = u["derm"]
    assert d["id"] == "dr-sana" and d["status"] == "approved" and d["pmdc"]
    assert set(d["services"]) == {"video", "clinic", "message"} and d["availability"]
    assert d["stats"]["appointments"] > 0 and u["appointments"] and u["cases"]


def test_unknown_user_404(admin):
    admin.get("/admin/users/u-nobody", 404)
    admin.patch("/admin/users/u-nobody", 404, json={"name": "X Y"})
    admin.post("/admin/users/u-nobody/suspend", 404, json={})
    admin.post("/admin/users/u-nobody/restore", 404)
    admin.post("/admin/users/u-nobody/password", 404, json={"password": "secret123"})
    admin.delete("/admin/users/u-nobody", 404)


# ───────────── Users: create and edit ─────────────


def test_create_each_role_and_they_can_log_in(client, admin):
    for role, email in (("patient", "p1@mail.com"), ("dermatologist", "d1@clinic.pk"), ("admin", "a2@dermai.pk")):
        r = admin.post("/admin/users", json={"role": role, "name": "  Test   Person ", "email": f"  {email.upper()} ", "password": "secret123"})
        who = Api(client, email, "secret123")
        assert who.state["session"]["role"] == role
        detail = admin.get(f"/admin/users/{r['id']}")
        assert detail["email"] == email
    assert admin.get("/admin/users?q=d1@clinic.pk")["users"][0]["name"] == "Dr. Test Person"
    doc = Api(client, "d1@clinic.pk", "secret123")
    assert doc.state["derm"]["step"] == "profile" and doc.state["derm"]["status"] == "draft"
    assert actions("user.create") == ["user.create"] * 3


def test_create_validation(admin):
    ok = {"role": "patient", "name": "Valid Name", "email": "v@mail.com", "password": "secret123"}
    admin.post("/admin/users", 400, json={**ok, "role": "root"})
    admin.post("/admin/users", 400, json={**ok, "name": "A"})
    admin.post("/admin/users", 400, json={**ok, "name": "x" * 81})
    admin.post("/admin/users", 400, json={**ok, "email": "not-an-email"})
    admin.post("/admin/users", 400, json={**ok, "password": "short1"})
    admin.post("/admin/users", 400, json={**ok, "password": "nonumbers"})
    admin.post("/admin/users", 409, json={**ok, "email": "Ayesha@Mail.com"})
    admin.post("/admin/users", 422, json={**ok, "isAdmin": True})
    admin.post("/admin/users", 422, json={"role": "patient"})
    admin.post("/admin/users", json=ok)


def test_edit_user_fields(client, admin, ayesha):
    admin.patch("/admin/users/u-ayesha", json={"name": "Ayesha  Khan", "phone": "+92 300 1234567", "dob": "1999-04-12", "gender": "Female", "city": "Karachi"})
    ayesha.get("/me/state")
    p = ayesha.state["profile"]
    assert ayesha.state["session"]["name"] == "Ayesha Khan" and p["phone"] == "+92 300 1234567" and p["dob"] == "12 Apr 1999" and p["city"] == "Karachi"
    admin.patch("/admin/users/u-dr-sana", json={"name": "Sana Iqbal"})
    assert admin.get("/admin/users/u-dr-sana")["name"] == "Dr. Sana Iqbal"
    admin.patch("/admin/users/u-ayesha", json={"email": "ayesha.k@mail.com"})
    Api(client, "ayesha.k@mail.com")
    # Clearing optional fields is allowed.
    admin.patch("/admin/users/u-ayesha", json={"phone": "", "dob": "", "gender": ""})
    assert admin.get("/admin/users/u-ayesha")["profile"]["phone"] == ""


def test_edit_user_validation(admin):
    admin.patch("/admin/users/u-ayesha", 400, json={})
    admin.patch("/admin/users/u-ayesha", 409, json={"email": "sana@clinic.pk"})
    admin.patch("/admin/users/u-ayesha", json={"email": "AYESHA@mail.com"})  # her own email, other case
    admin.patch("/admin/users/u-ayesha", 400, json={"email": "nope"})
    admin.patch("/admin/users/u-ayesha", 400, json={"name": " "})
    admin.patch("/admin/users/u-ayesha", 400, json={"phone": "call me"})
    admin.patch("/admin/users/u-ayesha", json={"dob": "3 March 2002"})
    assert admin.get("/admin/users/u-ayesha")["profile"]["dob"] == "3 Mar 2002"
    admin.patch("/admin/users/u-ayesha", 400, json={"dob": "yesterday"})
    admin.patch("/admin/users/u-ayesha", 400, json={"dob": "1999-02-30"})
    admin.patch("/admin/users/u-ayesha", 400, json={"dob": (utcnow() + timedelta(days=30)).date().isoformat()})
    admin.patch("/admin/users/u-ayesha", 400, json={"dob": "1850-01-01"})
    admin.patch("/admin/users/u-ayesha", 400, json={"gender": "Robot"})
    admin.patch("/admin/users/u-ayesha", 400, json={"gender": "Other"})
    admin.patch("/admin/users/u-ayesha", 422, json={"role": "admin"})


# ───────────── Users: password, sessions, suspension, delete ─────────────


def test_admin_sets_password_and_old_sessions_end(client, admin, ayesha):
    admin.post("/admin/users/u-ayesha/password", 400, json={"password": "abc"})
    admin.post("/admin/users/u-ayesha/password", json={"password": "newpass99"})
    ayesha.get("/me/state", 401)
    assert client.post("/auth/refresh", json={"refreshToken": ayesha.refresh}).status_code == 401
    assert client.post("/auth/login", json={"email": "ayesha@mail.com", "password": "demo1234"}).status_code == 401
    Api(client, "ayesha@mail.com", "newpass99")


def test_sign_out_everywhere(client, admin, ayesha):
    assert admin.get("/admin/users/u-ayesha")["activeSessions"] >= 1
    admin.post("/admin/users/u-ayesha/sign-out")
    ayesha.get("/me/state", 401)
    assert admin.get("/admin/users/u-ayesha")["activeSessions"] == 0
    admin.post("/admin/users/u-admin/sign-out", 409)
    Api(client, "ayesha@mail.com")  # can still log in


def test_suspend_blocks_everything_and_restore_undoes_it(client, admin, ayesha):
    admin.post("/admin/users/u-ayesha/suspend", json={"reason": "Abusive messages"})
    ayesha.get("/me/state", 401)
    assert client.post("/auth/refresh", json={"refreshToken": ayesha.refresh}).status_code == 401
    r = client.post("/auth/login", json={"email": "ayesha@mail.com", "password": "demo1234"})
    assert r.status_code == 403 and r.json()["error"]["code"] == "account_suspended"
    u = admin.get("/admin/users/u-ayesha")
    assert u["suspended"] and u["suspendedReason"] == "Abusive messages"
    assert [x["id"] for x in admin.get("/admin/users?status=suspended")["users"]] == ["u-ayesha"]
    assert admin.get("/admin/overview")["users"]["suspended"] == 1
    admin.post("/admin/users/u-ayesha/suspend", 409, json={})
    admin.post("/admin/users/u-ayesha/restore")
    admin.post("/admin/users/u-ayesha/restore", 409)
    Api(client, "ayesha@mail.com")
    assert actions("user.suspend", "user.restore") == ["user.suspend", "user.restore"]


def test_suspended_doctor_visits_cancelled_and_patients_told(client, admin, ayesha):
    with session() as db:
        upcoming = db.query(Appointment).filter(Appointment.derm_id == "dr-sana", Appointment.status == "upcoming").count()
    assert upcoming > 0
    admin.post("/admin/users/u-dr-sana/suspend", json={"reason": "Licence under review"})
    with session() as db:
        assert db.query(Appointment).filter(Appointment.derm_id == "dr-sana", Appointment.status == "upcoming").count() == 0
        assert db.query(Appointment).filter(Appointment.derm_id == "dr-sana", Appointment.cancelled_by == "admin").count() == upcoming
    ayesha.get("/me/state")
    assert any(n["title"] == "Visit cancelled" for n in ayesha.state["notifications"])


def test_cannot_suspend_or_delete_self_or_last_admin(client, admin):
    admin.post("/admin/users/u-admin/suspend", 409, json={})
    admin.delete("/admin/users/u-admin", 409)
    r = admin.post("/admin/users", json={"role": "admin", "name": "Second Admin", "email": "a2@dermai.pk", "password": "secret123"})
    second = Api(client, "a2@dermai.pk", "secret123")
    # With two admins, one can suspend the other, but not the last active one.
    admin.post(f"/admin/users/{r['id']}/suspend", json={})
    second.get("/admin/overview", 401)
    admin.post(f"/admin/users/{r['id']}/restore")
    second = Api(client, "a2@dermai.pk", "secret123")
    second.post("/admin/users/u-admin/suspend", json={})
    admin.get("/admin/overview", 401)
    second.post("/admin/users/u-admin/restore")
    second.delete("/admin/users/u-admin")
    second.delete(f"/admin/users/{r['id']}", 409)


def test_delete_patient_removes_their_data(client, admin):
    admin.delete("/admin/users/u-ayesha")
    admin.get("/admin/users/u-ayesha", 404)
    assert admin.get("/admin/scans?user_id=u-ayesha")["total"] == 0
    assert client.post("/auth/login", json={"email": "ayesha@mail.com", "password": "demo1234"}).status_code == 401
    with session() as db:
        entry = db.query(AdminLog).filter(AdminLog.action == "user.delete").one()
        assert entry.target_id == "u-ayesha" and "ayesha@mail.com" in entry.detail


def test_delete_doctor_tells_patients(client, admin, ayesha):
    admin.delete("/admin/users/u-dr-sana")
    ayesha.get("/me/state")
    assert "dr-sana" not in [d["id"] for d in ayesha.state["doctors"]]
    assert any("left DermAI" in n["title"] for n in ayesha.state["notifications"])


def test_audit_survives_admin_deletion(client, admin):
    r = admin.post("/admin/users", json={"role": "admin", "name": "Temp Admin", "email": "t@dermai.pk", "password": "secret123"})
    temp = Api(client, "t@dermai.pk", "secret123")
    temp.post("/admin/broadcast", json={"audience": "patients", "title": "Hello patients"})
    admin.delete(f"/admin/users/{r['id']}")
    entries = admin.get("/admin/audit")["entries"]
    assert any(e["action"] == "broadcast" and e["adminName"] == "Temp Admin" for e in entries)


# ───────────── Doctors ─────────────


def test_verification_queue_and_filters(client, admin):
    d = onboard(client)
    did = d.state["derm"]["id"]
    q = admin.get("/admin/derms")["derms"]
    assert [x["id"] for x in q] == [did] and q[0]["certificate"] and q[0]["degree"] and q[0]["submittedAt"]
    assert len(admin.get("/admin/derms?status=all")["derms"]) == 4
    assert len(admin.get("/admin/derms?status=approved")["derms"]) == 3
    assert [x["id"] for x in admin.get("/admin/derms?status=all&q=77777")["derms"]] == [did]
    assert [x["id"] for x in admin.get("/admin/derms?status=pending&q=lahore")["derms"]] == [did]
    assert [x["id"] for x in admin.get("/admin/derms?status=all&q=ali@clinic")["derms"]] == [did]
    admin.get("/admin/derms?status=whatever", 400)
    admin.get("/admin/derms/dr-none", 404)
    admin.post(f"/admin/derms/{did}/approve")
    admin.post(f"/admin/derms/{did}/approve", 409)
    assert admin.get("/admin/overview")["doctors"]["approved"] == 4
    assert actions("derm.approve") == ["derm.approve"]


def test_cannot_approve_incomplete_doctor(client, admin):
    d = register(client, role="dermatologist", name="Half Done", email="half@clinic.pk")
    d.get("/me/state")
    with session() as db:
        did = db.query(Dermatologist).filter(Dermatologist.user_id == d.state["session"]["id"]).one().id
    assert [x["id"] for x in admin.get("/admin/derms?status=draft")["derms"]] == [did]
    admin.post(f"/admin/derms/{did}/approve", 409)
    admin.post("/admin/derms/dr-none/approve", 404)
    admin.post("/admin/derms/dr-none/reject", 404, json={})


def test_revoking_verified_doctor_hides_and_cancels(client, admin, ayesha):
    with session() as db:
        a = Appointment(patient_id="u-ayesha", derm_id="dr-umar", service="video", start=utcnow() + timedelta(days=3), minutes=20, fee=3000, payment_status="paid")
        db.add(a)
        db.commit()
        upcoming = a.id
    admin.post("/admin/derms/dr-umar/reject", json={"note": "PMDC licence expired"})
    ayesha.get("/me/state")
    assert "dr-umar" not in [d["id"] for d in ayesha.state["doctors"]]
    with session() as db:
        assert db.query(Appointment).filter(Appointment.derm_id == "dr-umar", Appointment.status == "upcoming").count() == 0
    umar = Api(client, "umar@clinic.pk")
    assert umar.state["derm"]["status"] == "rejected" and "expired" in umar.state["derm"]["reviewNote"]
    a = admin.get(f"/admin/appointments/{upcoming}")
    assert a["cancelledBy"] == "admin" and a["paymentStatus"] == "refunded"
    assert any("no longer available" in n["body"] for n in ayesha.state["notifications"])
    assert actions("derm.revoke") == ["derm.revoke"]
    # The demo doctors have no degree on file, so they can't be re-approved until they upload one.
    admin.post("/admin/derms/dr-umar/approve", 409)


def test_revoke_then_reapprove_onboarded_doctor(client, admin):
    d = onboard(client)
    did = d.state["derm"]["id"]
    patient = register(client)
    admin.post(f"/admin/derms/{did}/approve")
    patient.get("/me/state")
    assert did in [x["id"] for x in patient.state["doctors"]]
    admin.post(f"/admin/derms/{did}/reject", json={"note": "Check licence"})
    patient.get("/me/state")
    assert did not in [x["id"] for x in patient.state["doctors"]]
    admin.post(f"/admin/derms/{did}/approve")
    patient.get("/me/state")
    assert did in [x["id"] for x in patient.state["doctors"]]


def test_edit_doctor_profile(admin, ayesha):
    admin.patch(
        "/admin/derms/dr-hira",
        json={
            "clinic": "DHA Phase 5, Lahore",
            "city": "Lahore",
            "bio": "Skin of colour specialist.",
            "focus": "Melasma",
            "practisingSince": 2010,
            "specialties": ["Melasma", "Pigmentation", "Melasma"],
            "languages": ["English", "Punjabi"],
            "female": True,
            "services": {"video": {"on": True, "fee": 2500}, "clinic": {"on": False, "fee": 0}, "message": {"on": True, "fee": 1000}},
        },
    )
    ayesha.get("/me/state")
    hira = next(d for d in ayesha.state["doctors"] if d["id"] == "dr-hira")
    assert hira["clinic"] == "DHA Phase 5, Lahore" and hira["specialties"] == ["Melasma", "Pigmentation"] and hira["languages"] == ["English", "Punjabi"]
    assert [s["type"] for s in hira["services"]] == ["video", "message"] and hira["services"][0]["fee"] == 2500
    assert hira["years"] >= 16
    admin.patch("/admin/derms/dr-hira", json={"practisingSince": None})


def test_edit_doctor_validation(admin):
    p = "/admin/derms/dr-hira"
    admin.patch(p, 400, json={})
    admin.patch(p, 400, json={"qualification": "x"})
    admin.patch(p, 400, json={"clinic": "ab"})
    admin.patch(p, 400, json={"practisingSince": 1900})
    admin.patch(p, 400, json={"practisingSince": utcnow().year + 1})
    admin.patch(p, 400, json={"specialties": []})
    admin.patch(p, 400, json={"specialties": ["Astrology"]})
    admin.patch(p, 400, json={"languages": ["Klingon"]})
    admin.patch(p, 400, json={"services": {"video": {"on": True, "fee": 2000}}})
    admin.patch(p, 400, json={"services": {k: {"on": False, "fee": 0} for k in ("video", "clinic", "message")}})
    admin.patch(p, 400, json={"services": {k: {"on": True, "fee": 100} for k in ("video", "clinic", "message")}})
    admin.patch(p, 400, json={"services": {k: {"on": True, "fee": 60000} for k in ("video", "clinic", "message")}})
    admin.patch(p, 422, json={"pmdc": "99999-P"})
    admin.patch("/admin/derms/dr-none", 404, json={"city": "Lahore"})


# ───────────── Appointments ─────────────


def upcoming_id(derm="dr-sana") -> str:
    with session() as db:
        return db.query(Appointment).filter(Appointment.derm_id == derm, Appointment.status == "upcoming").order_by(Appointment.start).first().id


def test_list_and_filter_appointments(admin):
    all_ = admin.get("/admin/appointments")
    assert all_["total"] == len(all_["appointments"]) > 0
    up = admin.get("/admin/appointments?status=upcoming")["appointments"]
    assert up and all(a["status"] == "upcoming" for a in up)
    assert [a["start"] for a in up] == sorted(a["start"] for a in up)
    assert all(a["service"] == "video" for a in admin.get("/admin/appointments?service=video")["appointments"])
    assert all("Ayesha" in a["patientName"] or "Ayesha" in a["doctorName"] for a in admin.get("/admin/appointments?q=ayesha")["appointments"])
    assert all(a["doctorId"] == "dr-sana" for a in admin.get("/admin/appointments?q=sana")["appointments"])
    admin.get("/admin/appointments?status=lost", 400)
    admin.get("/admin/appointments?service=phone", 400)
    a = admin.get(f"/admin/appointments/{up[0]['id']}")
    assert a["patientName"] and a["doctorName"] and a["fee"] > 0
    admin.get("/admin/appointments/appt-none", 404)


def test_admin_cancels_booking_even_last_minute(client, admin, ayesha):
    aid = upcoming_id()
    with session() as db:
        a = db.get(Appointment, aid)
        a.start = utcnow() + timedelta(minutes=30)  # patients can't cancel this late; support can
        a.payment_status = "paid"
        patient_id = a.patient_id
        db.commit()
    admin.post(f"/admin/appointments/{aid}/cancel", json={"note": "Doctor is unwell today."})
    a = admin.get(f"/admin/appointments/{aid}")
    assert a["status"] == "cancelled" and a["cancelledBy"] == "admin" and a["paymentStatus"] == "refunded"
    admin.post(f"/admin/appointments/{aid}/cancel", 409, json={})
    admin.post("/admin/appointments/appt-none/cancel", 404, json={})
    with session() as db:
        email = db.get(User, patient_id).email
    p = Api(client, email)
    assert any(n["body"] == "Doctor is unwell today." for n in p.state["notifications"])
    sana = Api(client, "sana@clinic.pk")
    assert any(n["title"] == "Booking cancelled by DermAI" for n in sana.state["notifications"])


def test_cannot_cancel_done_visit(admin):
    done = next(a for a in admin.get("/admin/appointments?status=done")["appointments"])
    admin.post(f"/admin/appointments/{done['id']}/cancel", 409, json={})


def test_payment_status_changes(admin):
    aid = upcoming_id()
    admin.post(f"/admin/appointments/{aid}/payment", 409, json={"status": "refunded"})  # never paid
    admin.post(f"/admin/appointments/{aid}/payment", 400, json={"status": "free"})
    admin.post(f"/admin/appointments/{aid}/payment", json={"status": "paid"})
    admin.post(f"/admin/appointments/{aid}/payment", 409, json={"status": "paid"})
    admin.post(f"/admin/appointments/{aid}/payment", json={"status": "refunded"})
    assert admin.get(f"/admin/appointments/{aid}")["paymentStatus"] == "refunded"
    admin.post("/admin/appointments/appt-none/payment", 404, json={"status": "paid"})
    assert any("paid → refunded" in e["detail"] for e in admin.get("/admin/audit")["entries"])


# ───────────── Cases ─────────────


def test_cases_list_detail_and_status(admin):
    cases = admin.get("/admin/cases")
    assert cases["total"] > 0
    c = cases["cases"][0]
    assert c["number"].startswith("DA-") and c["patientName"] and c["doctorName"]
    assert all(x["status"] == "waiting" for x in admin.get("/admin/cases?status=waiting")["cases"])
    assert all(x["urgency"] == "urgent" for x in admin.get("/admin/cases?urgency=urgent")["cases"])
    assert [x["id"] for x in admin.get(f"/admin/cases?q={c['number']}")["cases"]] == [c["id"]]
    assert [x["id"] for x in admin.get(f"/admin/cases?q={c['number'][3:]}")["cases"]] == [c["id"]]
    admin.get("/admin/cases?status=open", 400)
    admin.get("/admin/cases?urgency=meh", 400)
    detail = admin.get("/admin/cases/case-ayesha")
    assert detail["messages"] and {"from", "text", "at"} <= set(detail["messages"][0])
    assert "case.view" in actions()
    admin.post("/admin/cases/case-ayesha/status", json={"status": "closed"})
    admin.post("/admin/cases/case-ayesha/status", 409, json={"status": "closed"})
    admin.post("/admin/cases/case-ayesha/status", 400, json={"status": "archived"})
    admin.get("/admin/cases/case-none", 404)
    admin.post("/admin/cases/case-none/status", 404, json={"status": "closed"})


# ───────────── Scans ─────────────


def test_scans_list_and_delete(admin, ayesha):
    s = admin.get("/admin/scans?user_id=u-ayesha")
    assert s["total"] == 5 and all(x["patientName"] == admin.get("/admin/users/u-ayesha")["name"] and x["userId"] == "u-ayesha" for x in s["scans"])
    assert all("photoUri" not in x for x in s["scans"])
    shared = "scan-1102"
    admin.delete(f"/admin/scans/{shared}")
    admin.delete(f"/admin/scans/{shared}", 404)
    ayesha.get("/me/state")
    assert shared not in [x["id"] for x in ayesha.state["scans"]]
    assert all(shared not in sh["scanIds"] for sh in ayesha.state["shares"])
    assert admin.get("/admin/scans?limit=2")["limit"] == 2


# ───────────── Broadcast ─────────────


def test_broadcast_reaches_the_right_people(client, admin, ayesha, sana):
    admin.post("/admin/users/u-nida/suspend", json={})
    r = admin.post("/admin/broadcast", json={"audience": "patients", "title": "New feature", "body": "Try routine reminders."})
    with session() as db:
        patients = db.query(User).filter(User.role == "patient", User.suspended.is_(False)).count()
    assert r["sent"] == patients
    ayesha.get("/me/state")
    sana.get("/me/state")
    assert ayesha.state["notifications"][0]["title"] == "New feature"
    assert all(n["title"] != "New feature" for n in sana.state["notifications"])
    r = admin.post("/admin/broadcast", json={"audience": "dermatologists", "title": "Payout on Friday"})
    assert r["sent"] == 3
    r = admin.post("/admin/broadcast", json={"audience": "all", "title": "Maintenance tonight"})
    assert r["sent"] == patients + 3
    admin.post("/admin/broadcast", 400, json={"audience": "admins", "title": "Hello there"})
    admin.post("/admin/broadcast", 400, json={"audience": "all", "title": "Hi"})
    admin.post("/admin/broadcast", 400, json={"audience": "all", "title": "x" * 121})
    admin.post("/admin/broadcast", 400, json={"audience": "all", "title": "Valid title", "body": "x" * 301})
    admin.post("/admin/broadcast", 422, json={"title": "No audience"})


# ───────────── Audit ─────────────


def test_audit_log_records_and_paginates(admin):
    admin.patch("/admin/users/u-ayesha", json={"city": "Lahore"})
    admin.post("/admin/users/u-nida/suspend", json={"reason": "spam"})
    log = admin.get("/admin/audit")
    assert log["total"] == 2 and log["entries"][0]["action"] == "user.suspend" and log["entries"][0]["detail"] == "spam"
    assert log["entries"][1]["detail"] == "city" and log["entries"][0]["adminName"] == "DermAI Admin"
    assert len(admin.get("/admin/audit?limit=1")["entries"]) == 1
    assert admin.get("/admin/audit?offset=50")["entries"] == []
    assert admin.get("/admin/overview")["activity"][0]["action"] == "user.suspend"


def test_reads_are_not_logged_except_private_cases(admin):
    for p in ADMIN_GETS:
        admin.get(p)
    assert actions() == []
