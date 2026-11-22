"""Dermatologist onboarding, cases, assessments, schedule, plus the admin verification queue."""

import re

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import storage
from app.common import In, base_url, notify, respond
from app.db import get_db
from app.errors import ApiError, not_found
from app.models import AiLabel, Appointment, Blocked, Case, Dermatologist, Message, Thread, User
from app.routine import steps_matching
from app.security import admin_user, derm_user
from app.slots import validate_availability
from app.state import prefs_of, settings_of
from app.timeutil import iso, parse_iso, utcnow
from app.uploads import read_upload, store

router = APIRouter(prefix="/derm", tags=["dermatologist"])
admin = APIRouter(prefix="/admin", tags=["admin"])

SPECIALTIES = {"Acne", "Pigmentation", "Melasma", "Rosacea", "Eczema", "Psoriasis", "Hair and scalp", "Scars", "Moles and skin checks", "Paediatric", "Redness", "Sensitivity"}
PMDC_RE = re.compile(r"^\d{4,6}-[A-Z]$")


def derm(user: User) -> Dermatologist:
    assert user.derm is not None
    return user.derm


LANGUAGES = {"English", "Urdu", "Punjabi", "Sindhi", "Pashto", "Saraiki", "Balochi"}


class ProfileIn(In):
    name: str
    specialties: list[str]
    city: str = ""
    bio: str = ""
    years: int | None = None
    languages: list[str] | None = None


@router.put("/profile")
def put_profile(body: ProfileIn, request: Request, user: User = Depends(derm_user), db: Session = Depends(get_db)):
    name = " ".join(body.name.split())
    if len(re.sub(r"^dr\.?\s+", "", name, flags=re.I)) < 3:
        raise ApiError(400, "bad_name", "Enter your name as on your PMDC licence.")
    if not body.specialties:
        raise ApiError(400, "need_specialty", "Pick at least one thing you treat.")
    if any(s not in SPECIALTIES for s in body.specialties):
        raise ApiError(400, "bad_specialty", "Unknown specialty.")
    if body.years is not None and not 0 <= body.years <= 60:
        raise ApiError(400, "bad_years", "Years in practice must be 0 to 60.")
    user = db.merge(user)
    user.name = name if re.match(r"^dr\.?\s", name, re.I) else f"Dr. {name}"
    d = derm(user)
    d.specialties = list(dict.fromkeys(body.specialties))
    if body.city:
        d.city = body.city[:80]
    if body.bio:
        d.bio = body.bio[:500]
    if body.years is not None:
        d.years = body.years
    if body.languages is not None:
        if not body.languages or any(x not in LANGUAGES for x in body.languages):
            raise ApiError(400, "bad_languages", "Pick the languages you consult in.")
        d.languages = list(dict.fromkeys(body.languages))
    if d.step == "profile":
        d.step = "credentials"
    return respond(db, user, request)


@router.post("/credentials")
async def post_credentials(
    request: Request,
    pmdc: str = Form(...),
    qualification: str = Form(...),
    clinic: str = Form(...),
    city: str = Form(""),
    since: str = Form(""),
    certificate: UploadFile | None = File(None),
    degree: UploadFile | None = File(None),
    cnic: UploadFile | None = File(None),
    user: User = Depends(derm_user),
    db: Session = Depends(get_db),
):
    pmdc = pmdc.strip().upper()
    if not PMDC_RE.match(pmdc):
        raise ApiError(400, "bad_pmdc", "Enter your PMDC number like 12345-P.")
    if len(qualification.strip()) < 3 or len(clinic.strip()) < 3:
        raise ApiError(400, "missing_fields", "Add your qualification and clinic.")
    taken = db.scalar(select(Dermatologist).where(Dermatologist.pmdc == pmdc, Dermatologist.id != user.derm.id))
    if taken:
        raise ApiError(409, "pmdc_taken", "This PMDC number is already registered. Contact support if that's wrong.")
    user = db.merge(user)
    d = derm(user)
    if certificate is not None and certificate.filename:
        data, ext = await read_upload(certificate, allow_pdf=True, what="certificate")
        storage.delete(d.certificate_key)
        d.certificate_key, d.certificate_name = store("credentials", data, ext), certificate.filename[:200]
    if degree is not None and degree.filename:
        data, ext = await read_upload(degree, allow_pdf=True, what="degree certificate")
        storage.delete(d.degree_key)
        d.degree_key, d.degree_name = store("credentials", data, ext), degree.filename[:200]
    if cnic is not None and cnic.filename:
        data, ext = await read_upload(cnic, allow_pdf=True, what="CNIC photo")
        storage.delete(d.cnic_key)
        d.cnic_key, d.cnic_name = store("credentials", data, ext), cnic.filename[:200]
    if not d.certificate_key or not d.degree_key:
        raise ApiError(400, "documents_missing", "Upload your PMDC certificate and degree certificate.")
    if since.strip():
        year = int(since) if since.strip().isdigit() else 0
        if not 1960 <= year <= utcnow().year:
            raise ApiError(400, "bad_year", "Enter the year you started practising, like 2015.")
        d.practising_since = year
    d.pmdc, d.qualification, d.clinic = pmdc, qualification.strip()[:200], clinic.strip()[:200]
    if city.strip():
        d.city = city.strip()[:80]
    elif not d.city:
        known = next((c for c in ("Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar") if c.lower() in clinic.lower()), "")
        d.city = known
    if d.step in ("profile", "credentials"):
        d.step = "services"
    if d.status == "approved":
        # Changed credentials need checking again.
        d.status = "pending"
        d.submitted_at = utcnow()
    return respond(db, user, request)


class ServiceIn(In):
    on: bool
    fee: int


class ServicesIn(In):
    services: dict[str, ServiceIn]


@router.put("/services")
def put_services(body: ServicesIn, request: Request, user: User = Depends(derm_user), db: Session = Depends(get_db)):
    if set(body.services) != {"video", "clinic", "message"}:
        raise ApiError(400, "bad_services", "Set video, clinic and message.")
    if not any(s.on for s in body.services.values()):
        raise ApiError(400, "no_services", "Offer at least one kind of visit.")
    for k, s in body.services.items():
        if s.on and not 500 <= s.fee <= 50000:
            raise ApiError(400, "bad_fee", "Fees must be between PKR 500 and 50,000.")
    user = db.merge(user)
    d = derm(user)
    if d.step != "done" and (not d.certificate_key or not d.degree_key or not d.pmdc):
        raise ApiError(409, "credentials_first", "Add your credentials first.")
    d.services = {k: {"on": s.on, "fee": s.fee} for k, s in body.services.items()}
    if d.step != "done":
        d.step = "done"
    if d.status in ("draft", "rejected"):
        d.status = "pending"
        d.submitted_at = utcnow()
        for a in db.scalars(select(User).where(User.role == "admin")):
            notify(db, a.id, "verified-user", "Doctor waiting for review", f"{user.name} · PMDC {d.pmdc}", "/admin")
    return respond(db, user, request)


@router.put("/availability")
def put_availability(body: dict, request: Request, user: User = Depends(derm_user), db: Session = Depends(get_db)):
    problem = validate_availability(body)
    if problem:
        raise ApiError(400, "bad_availability", problem)
    user = db.merge(user)
    derm(user).availability = {"days": body["days"], "gapMinutes": body["gapMinutes"], "noticeHours": body["noticeHours"], "timeOff": body.get("timeOff")}
    return respond(db, user, request)


class BlockIn(In):
    start: str
    minutes: int
    label: str = "Blocked"


@router.post("/blocked")
def add_block(body: BlockIn, request: Request, user: User = Depends(derm_user), db: Session = Depends(get_db)):
    if not 10 <= body.minutes <= 12 * 60:
        raise ApiError(400, "bad_length", "Block between 10 minutes and 12 hours.")
    try:
        start = parse_iso(body.start)
    except ValueError:
        raise ApiError(400, "bad_time", "Pick a start time.")
    db.add(Blocked(derm_id=user.derm.id, start=start, minutes=body.minutes, label=(body.label or "Blocked")[:200]))
    return respond(db, db.merge(user), request)


@router.delete("/blocked/{block_id}")
def remove_block(block_id: str, request: Request, user: User = Depends(derm_user), db: Session = Depends(get_db)):
    b = db.get(Blocked, block_id)
    if not b or b.derm_id != user.derm.id:
        raise not_found("That blocked time")
    db.delete(b)
    return respond(db, db.merge(user), request)


def own_case(db: Session, user: User, case_id: str) -> Case:
    c = db.get(Case, case_id)
    if not c or c.derm_id != user.derm.id:
        raise not_found("That case")
    return c


class ChangeIn(In):
    action: str  # add | pause | stop
    step_id: str | None = None
    title: str = ""
    detail: str = ""
    period: str = "pm"
    weeks: int | None = None


class AssessmentIn(In):
    findings: list[str] = []
    ai_rating: str = "correct"
    note: str = ""
    stop: list[str] = []
    keep: list[str] = []
    changes: list[ChangeIn] = []
    rescan_weeks: int | None = None


def clean_assessment(a: AssessmentIn) -> dict:
    if a.ai_rating not in ("correct", "partly", "wrong"):
        raise ApiError(400, "bad_rating", "Rate the AI reading as correct, partly right or wrong.")
    lists = {}
    for k in ("findings", "stop", "keep"):
        vals = [" ".join(x.split())[:80] for x in getattr(a, k) if x.strip()]
        if len(vals) > 12:
            raise ApiError(400, "too_many", f"Up to 12 {k}.")
        lists[k] = list(dict.fromkeys(vals))
    if len(a.note) > 3000:
        raise ApiError(400, "too_long", "Keep the note under 3,000 characters.")
    if len(a.changes) > 10:
        raise ApiError(400, "too_many", "Up to 10 routine changes.")
    changes = []
    for c in a.changes:
        if c.action == "add":
            title = " ".join(c.title.split())[:80]
            if len(title) < 2:
                raise ApiError(400, "bad_change", "Name the product or ingredient to add.")
            if c.period not in ("am", "pm"):
                raise ApiError(400, "bad_change", "Pick morning or evening.")
            changes.append({"action": "add", "title": title, "detail": " ".join(c.detail.split())[:120], "period": c.period})
        elif c.action in ("pause", "stop"):
            if not c.step_id:
                raise ApiError(400, "bad_change", "Pick the routine step to change.")
            item = {"action": c.action, "stepId": c.step_id, "title": " ".join(c.title.split())[:80]}
            if c.action == "pause":
                if not c.weeks or not 1 <= c.weeks <= 12:
                    raise ApiError(400, "bad_change", "Pause for 1 to 12 weeks.")
                item["weeks"] = c.weeks
            changes.append(item)
        else:
            raise ApiError(400, "bad_change", "Add, pause or stop a step.")
    if a.rescan_weeks is not None and not 1 <= a.rescan_weeks <= 26:
        raise ApiError(400, "bad_rescan", "Ask for a new scan in 1 to 26 weeks.")
    return {
        "findings": lists["findings"],
        "aiRating": a.ai_rating,
        "note": a.note.strip(),
        "stop": lists["stop"],
        "keep": lists["keep"],
        "changes": changes,
        "rescanWeeks": a.rescan_weeks,
    }


def apply_changes(patient: User, doctor_name: str, a: dict) -> list[str]:
    """Writes the doctor's routine changes into the patient's preferences. Returns step ids removed or paused."""
    from datetime import timedelta as td

    from app.models import new_id

    prefs = prefs_of(patient)
    removed = list(prefs.get("removed", []))
    paused = dict(prefs.get("paused") or {})
    added = list(prefs.get("doctorSteps") or [])
    touched: list[str] = []
    for sid in steps_matching(a["stop"]):
        if sid not in removed:
            removed.append(sid)
            touched.append(sid)
    today = utcnow().date()
    for c in a["changes"]:
        if c["action"] == "add":
            added.append({"id": new_id("rx"), "title": c["title"], "detail": c["detail"], "period": c["period"], "by": doctor_name, "at": today.isoformat()})
        elif c["action"] == "stop":
            sid = c["stepId"]
            added = [x for x in added if x["id"] != sid]
            if sid not in removed:
                removed.append(sid)
            touched.append(sid)
        elif c["action"] == "pause":
            paused[c["stepId"]] = (today + td(weeks=c["weeks"])).isoformat()
            touched.append(c["stepId"])
    patient.routine_prefs = {**prefs, "removed": removed, "paused": paused, "doctorSteps": added}
    return list(dict.fromkeys(touched))


@router.put("/cases/{case_id}/draft")
def save_draft(case_id: str, body: AssessmentIn, request: Request, user: User = Depends(derm_user), db: Session = Depends(get_db)):
    c = own_case(db, user, case_id)
    c.draft = clean_assessment(body)
    return respond(db, db.merge(user), request)


@router.post("/cases/{case_id}/assessment")
def send_assessment(case_id: str, body: AssessmentIn, request: Request, user: User = Depends(derm_user), db: Session = Depends(get_db)):
    """Sends the doctor's note to the patient's thread, removes "stop" items from their routine,
    and keeps the AI verdict as a training label only if the patient opted in (FR-28, FR-29)."""
    c = own_case(db, user, case_id)
    a = clean_assessment(body)
    if not a["note"]:
        raise ApiError(400, "need_note", "Write a note for the patient.")
    if c.status == "closed":
        raise ApiError(409, "case_closed", "Reopen the case to send an assessment.")
    patient = db.get(User, c.patient_id)
    thread = db.get(Thread, c.thread_id) if c.thread_id else None
    if not thread:
        thread = db.scalar(select(Thread).where(Thread.patient_id == c.patient_id, Thread.derm_id == c.derm_id))
    if not thread:
        thread = Thread(patient_id=c.patient_id, derm_id=c.derm_id, case_title=c.complaint[:60] or "Case")
        db.add(thread)
        db.flush()
        c.thread_id = thread.id
    now = utcnow()
    db.add(Message(thread_id=thread.id, sender="doctor", text=a["note"], note={"stop": a["stop"], "keep": a["keep"], "changes": a["changes"], "rescanWeeks": a["rescanWeeks"]}, at=now))
    thread.unread_for_patient += 1
    thread.unread_for_doctor = 0
    removed = apply_changes(patient, user.name, a) if patient else []
    if patient and a["rescanWeeks"]:
        from datetime import timedelta as td

        due = (utcnow().date() + td(weeks=a["rescanWeeks"])).isoformat()
        patient.settings = {**settings_of(patient), "rescanDue": due}
        notify(db, patient.id, "photo-camera", "New scan requested", f"{user.name} asks for a new scan by {due[8:10].lstrip('0')} {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][int(due[5:7]) - 1]}.", "/scan")
    if patient and settings_of(patient).get("train"):
        db.add(AiLabel(case_id=c.id, patient_id=c.patient_id, scan_id=(c.ai or {}).get("scanId"), rating=a["aiRating"], findings=a["findings"]))
    c.assessment = {**a, "sentAt": iso(now), "removedSteps": removed}
    c.draft = None
    c.status = "replied"
    for appt in db.scalars(select(Appointment).where(Appointment.case_id == c.id, Appointment.service == "message", Appointment.status == "upcoming")):
        appt.status = "done"
    if patient:
        n = len(removed) + sum(1 for c in a["changes"] if c["action"] == "add")
        extra = f" Your routine changed ({n} step{'s' if n != 1 else ''})." if n else ""
        notify(db, patient.id, "stethoscope", f"{user.name} sent your assessment", clip(a["note"], 90) + extra, f"/thread/{thread.id}")
    return respond(db, db.merge(user), request)


def clip(text: str, n: int) -> str:
    """Shorten at a word boundary, with an ellipsis, so a preview never ends mid-word."""
    text = " ".join(text.split())
    if len(text) <= n:
        return text
    cut = text[:n].rsplit(" ", 1)[0].rstrip(",.;:")
    return f"{cut}…"


class StatusIn(In):
    status: str


@router.post("/cases/{case_id}/status")
def set_status(case_id: str, body: StatusIn, request: Request, user: User = Depends(derm_user), db: Session = Depends(get_db)):
    if body.status not in ("closed", "waiting"):
        raise ApiError(400, "bad_status", "Close or reopen the case.")
    c = own_case(db, user, case_id)
    c.status = body.status
    return respond(db, db.merge(user), request)


# ───────────── Admin: PMDC verification (FR-26) ─────────────


def derm_summary(d: Dermatologist, base: str) -> dict:
    return {
        "id": d.id,
        "name": d.user.name,
        "email": d.user.email,
        "pmdc": d.pmdc,
        "qualification": d.qualification,
        "clinic": d.clinic,
        "city": d.city,
        "status": d.status,
        "submittedAt": iso(d.submitted_at),
        "certificate": storage.url_for(d.certificate_key, base),
        "cnic": storage.url_for(d.cnic_key, base),
        "degree": storage.url_for(d.degree_key, base),
    }


@admin.get("/derms")
def admin_list(request: Request, status: str = "pending", user: User = Depends(admin_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Dermatologist).where(Dermatologist.status == status))
    return {"derms": [derm_summary(d, base_url(request)) for d in rows]}


def approve_derm(db: Session, d: Dermatologist) -> None:
    if d.step != "done" or not d.certificate_key or not d.degree_key:
        raise ApiError(409, "incomplete", "This doctor hasn't finished onboarding.")
    d.status, d.approved_at, d.review_note = "approved", utcnow(), ""
    notify(db, d.user_id, "verified", "You're verified", "Patients can now find and book you.", "/today")


def reject_derm(db: Session, d: Dermatologist, note: str) -> None:
    d.status, d.review_note = "rejected", note
    notify(db, d.user_id, "error-outline", "Verification needs changes", note or "Check your PMDC details and documents.", "/derm-setup/credentials")


@admin.post("/derms/{derm_id}/approve")
def admin_approve(derm_id: str, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    d = db.get(Dermatologist, derm_id)
    if not d:
        raise not_found("That doctor")
    approve_derm(db, d)
    db.commit()
    return {"ok": True}


class RejectIn(In):
    note: str = ""


@admin.post("/derms/{derm_id}/reject")
def admin_reject(derm_id: str, body: RejectIn, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    d = db.get(Dermatologist, derm_id)
    if not d:
        raise not_found("That doctor")
    reject_derm(db, d, body.note[:500])
    db.commit()
    return {"ok": True}
