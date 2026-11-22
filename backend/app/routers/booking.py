"""Directory, slots, bookings and patient–doctor threads."""

import re
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.common import In, base_url, respond
from app.content import concerns as concern_info
from app.content import zone_label
from app.db import get_db
from app.errors import ApiError, not_found
from app.models import Appointment, Case, Dermatologist, Message, Notification, Scan, Share, Thread, User
from app.security import current_user, patient_user
from app.slots import DURATION, busy_intervals, is_bookable, slots_for
from app.state import doctor_dict, directory, short_name, thread_for
from app.timeutil import iso, local, parse_iso, today_local, utcnow
from app.uploads import read_upload, store

router = APIRouter(tags=["booking"])

PAYMENT_METHODS = {"pay_at_visit", "card", "jazzcash", "easypaisa"}
URGENT = re.compile(r"mole|chang(e|ed|ing) (shape|colou?r|size)|bleed|spreading", re.I)
SERIOUS = re.compile(r"pain|hurt|cyst|pus|fever|swell|weeks|months", re.I)
SERVICE_TITLE = {"video": "Video", "clinic": "Clinic", "message": "Message"}


def approved(db: Session, derm_id: str) -> Dermatologist:
    d = db.get(Dermatologist, derm_id)
    if not d or d.status != "approved":
        raise not_found("That doctor")
    return d


@router.get("/doctors")
def list_doctors(request: Request, city: str | None = None, service: str | None = None, female: bool | None = None, q: str | None = None, user: User = Depends(current_user), db: Session = Depends(get_db)):
    out = directory(db, base_url(request))
    if city:
        out = [d for d in out if d["city"].lower() == city.lower()]
    if service:
        out = [d for d in out if any(s["type"] == service for s in d["services"])]
    if female is not None:
        out = [d for d in out if d["female"] == female]
    if q:
        ql = q.lower()
        out = [d for d in out if ql in d["name"].lower() or any(ql in s.lower() for s in d["specialties"])]
    return {"doctors": out}


@router.get("/doctors/{derm_id}")
def get_doctor(derm_id: str, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return {"doctor": doctor_dict(db, approved(db, derm_id), base_url(request))}


@router.get("/doctors/{derm_id}/slots")
def get_slots(derm_id: str, service: str = "video", days: int = 7, start: str | None = None, user: User = Depends(current_user), db: Session = Depends(get_db)):
    d = approved(db, derm_id)
    if service not in ("video", "clinic"):
        raise ApiError(400, "bad_service", "Slots are for video or clinic visits.")
    if not (d.services or {}).get(service, {}).get("on"):
        raise ApiError(409, "service_off", "This doctor doesn't offer that kind of visit.")
    days = max(1, min(days, 21))
    first = today_local()
    if start:
        try:
            first = max(first, date.fromisoformat(start))
        except ValueError:
            raise ApiError(400, "bad_date", "Bad date.")
    busy = busy_intervals(db, d.id)
    return {"days": [{"date": (first + timedelta(days=i)).isoformat(), "slots": slots_for(d, first + timedelta(days=i), service, busy)} for i in range(days)]}


FLAG_WORDS = [
    (re.compile(r"chang(e|ed|ing) (shape|colou?r|size)", re.I), "changed shape or colour"),
    (re.compile(r"\bmole\b", re.I), "mole"),
    (re.compile(r"bleed", re.I), "bleeding"),
    (re.compile(r"spreading", re.I), "spreading"),
    (re.compile(r"fever", re.I), "fever reported"),
    (re.compile(r"pain|hurt", re.I), "painful"),
    (re.compile(r"pus|swell", re.I), "swelling or pus"),
    (re.compile(r"weeks|months", re.I), "lasting weeks"),
]


def urgency_for(reason: str, scans: list[Scan]) -> str:
    return triage(reason, scans)[0]


def triage(reason: str, scans: list[Scan]) -> tuple[str, list[str]]:
    """Urgency from the referral rules (FR-11), with the reasons the doctor's inbox shows."""
    from app.content import concerns as info

    flags = [label for rx, label in FLAG_WORDS if rx.search(reason or "")]
    latest = scans[-1] if scans else None
    if latest:
        high = [info()[k]["label"].lower() for k, c in latest.concerns.items() if c["level"] == "High"]
        if high:
            flags.append(f"AI: {', '.join(high)} high")
    worsening = len(scans) >= 2 and scans[0].score - scans[-1].score >= 5
    if worsening:
        flags.append(f"score down {scans[0].score - scans[-1].score} across scans")
    levels = [c["level"] for c in latest.concerns.values()] if latest else []
    if URGENT.search(reason or ""):
        level = "urgent"
    elif "High" in levels or worsening or SERIOUS.search(reason or ""):
        level = "high"
    elif "Moderate" in levels:
        level = "moderate"
    else:
        level = "mild"
    return level, flags[:3]


def ai_reading(scans: list[Scan]) -> dict:
    if not scans:
        return {"confidence": 0, "reading": "No scans shared yet. Ask the patient to share a scan.", "zones": {z: "Clear" for z in zone_label()}}
    s = scans[-1]
    parts = []
    for k, c in sorted(s.concerns.items(), key=lambda kv: -kv[1]["pct"]):
        if c["level"] == "Clear" or len(parts) == 3:
            continue
        where = " and ".join(zone_label()[z] for z in (s.where or {}).get(k, []))
        parts.append(f"{concern_info()[k]['label']} {c['level'].lower()}" + (f", {where}" if where else ""))
    text = ". ".join(parts) + "." if parts else "No concern above clear."
    if len(scans) >= 2:
        d = s.score - scans[0].score
        text += f" Score {'up' if d > 0 else 'down'} {abs(d)} across {len(scans)} scans." if d else f" Score steady across {len(scans)} scans."
    return {"confidence": s.confidence, "reading": text, "zones": s.zones, "scanId": s.id}


def next_case_number(db: Session) -> int:
    from sqlalchemy import func

    return max(2040, db.scalar(select(func.max(Case.number))) or 0) + 1


class BookIn(In):
    doctor_id: str
    service: str
    start: str | None = None
    reason: str = ""
    share_scan_ids: list[str] = []
    payment_method: str = "pay_at_visit"


@router.post("/appointments")
def book(body: BookIn, request: Request, user: User = Depends(patient_user), db: Session = Depends(get_db)):
    user = db.merge(user)
    if body.service not in ("video", "clinic", "message"):
        raise ApiError(400, "bad_service", "Pick video, clinic or message.")
    if body.payment_method not in PAYMENT_METHODS:
        raise ApiError(400, "bad_payment", "Pick a payment method.")
    reason = " ".join(body.reason.split())
    if len(reason) > 500:
        raise ApiError(400, "reason_too_long", "Keep the reason under 500 characters.")
    if len(body.share_scan_ids) > 10:
        raise ApiError(400, "too_many_scans", "Share up to 10 scans.")
    # Lock the doctor's row so two people can't take the same slot at once.
    d = db.scalar(select(Dermatologist).where(Dermatologist.id == body.doctor_id).with_for_update())
    if not d or d.status != "approved":
        raise not_found("That doctor")
    svc = (d.services or {}).get(body.service, {})
    if not svc.get("on"):
        raise ApiError(409, "service_off", "This doctor doesn't offer that kind of visit.")
    scans = list(db.scalars(select(Scan).where(Scan.user_id == user.id, Scan.id.in_(body.share_scan_ids or [""]))))
    if len(scans) != len(set(body.share_scan_ids)):
        raise ApiError(400, "bad_scans", "One of those scans no longer exists.")
    scans.sort(key=lambda s: s.date)

    if body.service == "message":
        if not reason and not scans:
            raise ApiError(400, "need_detail", "Add a reason or share at least one scan.")
        start = utcnow()
    else:
        if not body.start:
            raise ApiError(400, "need_slot", "Pick a time.")
        try:
            start = parse_iso(body.start)
        except ValueError:
            raise ApiError(400, "bad_slot", "Pick a time.")
        if start <= utcnow():
            raise ApiError(409, "slot_past", "That time has passed. Pick another.")
        if not is_bookable(d, start, body.service, busy_intervals(db, d.id)):
            raise ApiError(409, "slot_taken", "That time was just taken or isn't open. Pick another.")
        end = start + timedelta(minutes=DURATION[body.service])
        for mine in db.scalars(select(Appointment).where(Appointment.patient_id == user.id, Appointment.status == "upcoming", Appointment.service != "message")):
            if start < mine.start + timedelta(minutes=mine.minutes) and end > mine.start:
                raise ApiError(409, "patient_busy", "You already have a visit at that time.")

    thread = db.scalar(select(Thread).where(Thread.patient_id == user.id, Thread.derm_id == d.id))
    if not thread:
        thread = Thread(patient_id=user.id, derm_id=d.id, case_title=(reason[:60] or "New case"))
        db.add(thread)
        db.flush()
    elif reason:
        thread.case_title = reason[:60]

    if scans:
        share = db.scalar(select(Share).where(Share.patient_id == user.id, Share.derm_id == d.id))
        until = max(start, utcnow()) + timedelta(days=30)
        if share:
            share.scan_ids = list(dict.fromkeys([*(share.scan_ids if share.until > utcnow() else []), *[s.id for s in scans]]))
            share.until = max(share.until, until)
        else:
            db.add(Share(patient_id=user.id, derm_id=d.id, scan_ids=[s.id for s in scans], until=until))

    case = db.scalar(select(Case).where(Case.patient_id == user.id, Case.derm_id == d.id, Case.status != "closed").order_by(Case.received_at.desc()))
    urgency, flags = triage(reason, scans)
    summary = " · ".join(x for x in [SERVICE_TITLE[body.service], reason[:40].lower() if reason else "scan review", f"{len(scans)} scan{'s' if len(scans) != 1 else ''}" if scans else ""] if x)
    photos = [{"date": local(s.date).date().isoformat(), "tone": s.photo_tone, "scanId": s.id} for s in scans[-6:]]
    if case:
        if reason:
            case.complaint = reason
        case.summary, case.channel, case.status, case.received_at = summary, body.service, "waiting", utcnow()
        if scans:
            case.photos, case.ai = photos, ai_reading(scans)
        case.urgency, case.flags = urgency, flags
    else:
        case = Case(
            derm_id=d.id,
            patient_id=user.id,
            thread_id=thread.id,
            number=next_case_number(db),
            complaint=reason or "Scan review",
            summary=summary,
            urgency=urgency,
            flags=flags,
            channel=body.service,
            photos=photos,
            ai=ai_reading(scans),
        )
        db.add(case)
    db.flush()

    appt = Appointment(
        patient_id=user.id,
        derm_id=d.id,
        case_id=case.id,
        service=body.service,
        start=start,
        minutes=DURATION[body.service],
        reason=reason,
        shared_scan_ids=[s.id for s in scans],
        fee=int(svc.get("fee", 0)),
        payment_method=body.payment_method,
        payment_status="due",
    )
    db.add(appt)
    db.flush()
    from app.common import notify

    when = "Case review by message" if body.service == "message" else f"{local(start).strftime('%a %-d %b, %-I:%M %p').replace('AM', 'am').replace('PM', 'pm')}"
    notify(db, user.id, "event-available", "Visit booked", f"{when} with {d.user.name}", f"/booked/{appt.id}")
    notify(db, d.user_id, "assignment", f"New {SERVICE_TITLE[body.service].lower()} booking", f"{user.name}: {reason or 'scan review'} · {when}", f"/case/{case.id}")
    return respond(db, user, request, appointmentId=appt.id)


@router.post("/appointments/{appt_id}/cancel")
def cancel(appt_id: str, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    a = db.get(Appointment, appt_id)
    is_patient = a is not None and user.role == "patient" and a.patient_id == user.id
    is_doctor = a is not None and user.role == "dermatologist" and user.derm is not None and a.derm_id == user.derm.id
    if not a or not (is_patient or is_doctor):
        raise not_found("That booking")
    if a.status != "upcoming":
        raise ApiError(409, "not_cancellable", "This booking is already cancelled." if a.status == "cancelled" else "This visit has already happened.")
    if is_patient and a.service != "message" and a.start - utcnow() < timedelta(hours=2):
        raise ApiError(409, "too_late", "Visits can be cancelled up to 2 hours before. Message your doctor instead.")
    a.status, a.cancelled_by = "cancelled", "patient" if is_patient else "doctor"
    d = db.get(Dermatologist, a.derm_id)
    patient = db.get(User, a.patient_id)
    from app.common import notify

    if is_patient:
        notify(db, d.user_id, "event-busy", "Booking cancelled", f"{patient.name} cancelled their {SERVICE_TITLE[a.service].lower()} booking", "/schedule")
    else:
        notify(db, a.patient_id, "event-busy", "Visit cancelled", f"{d.user.name} cancelled your visit. You won't be charged.", f"/booked/{a.id}")
    return respond(db, db.merge(user), request)


class RateIn(In):
    stars: int


@router.post("/appointments/{appt_id}/rate")
def rate(appt_id: str, body: RateIn, request: Request, user: User = Depends(patient_user), db: Session = Depends(get_db)):
    a = db.get(Appointment, appt_id)
    if not a or a.patient_id != user.id:
        raise not_found("That booking")
    if not 1 <= body.stars <= 5:
        raise ApiError(400, "bad_rating", "Rate from 1 to 5 stars.")
    if a.status != "done":
        raise ApiError(409, "not_done", "You can rate a visit after it happens.")
    if a.rating:
        raise ApiError(409, "already_rated", "You've already rated this visit.")
    a.rating = body.stars
    d = db.get(Dermatologist, a.derm_id)
    d.rating = (d.rating * d.review_count + body.stars) / (d.review_count + 1)
    d.review_count += 1
    return respond(db, db.merge(user), request)


@router.post("/threads/{thread_id}/messages")
async def send_message(
    thread_id: str,
    request: Request,
    text: str = Form(""),
    photo: UploadFile | None = File(None),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    t = thread_for(db, user, thread_id)
    if not t:
        raise not_found("That conversation")
    text = text.strip()
    if len(text) > 2000:
        raise ApiError(400, "too_long", "Keep messages under 2,000 characters.")
    key = None
    if photo is not None and photo.filename:
        data, ext = await read_upload(photo)
        key = store("messages", data, ext)
    if not text and not key:
        raise ApiError(400, "empty", "Type a message or attach a photo.")
    sender = "patient" if user.role == "patient" else "doctor"
    db.add(Message(thread_id=t.id, sender=sender, text=text or "Sent a photo", attachment_key=key))
    d = db.get(Dermatologist, t.derm_id)
    if sender == "patient":
        t.unread_for_doctor += 1
        t.unread_for_patient = 0
        to, title, href = d.user_id, f"Message from {user.name}", f"/inbox/{t.id}"
    else:
        t.unread_for_patient += 1
        t.unread_for_doctor = 0
        to, title, href = t.patient_id, f"{short_dr(d.user.name)} replied", f"/thread/{t.id}"
    preview = f'"{text[:60]}{"…" if len(text) > 60 else ""}"' if text else "Sent a photo"
    existing = db.scalar(select(Notification).where(Notification.user_id == to, Notification.href == href, Notification.read.is_(False)))
    if existing:
        existing.title, existing.body, existing.at = title, preview, utcnow()
    else:
        from app.common import notify

        notify(db, to, "chat", title, preview, href)
    return respond(db, db.merge(user), request)


def short_dr(name: str) -> str:
    parts = re.sub(r"^Dr\.?\s+", "", name, flags=re.I).split()
    return f"Dr. {parts[-1]}" if parts else name


@router.post("/threads/{thread_id}/read")
def mark_read(thread_id: str, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    t = thread_for(db, user, thread_id)
    if not t:
        raise not_found("That conversation")
    if user.role == "patient":
        t.unread_for_patient = 0
        href = f"/thread/{t.id}"
    else:
        t.unread_for_doctor = 0
        href = f"/inbox/{t.id}"
    for n in db.scalars(select(Notification).where(Notification.user_id == user.id, Notification.href == href, Notification.read.is_(False))):
        n.read = True
    return respond(db, db.merge(user), request)


__all__ = ["router", "short_name", "iso", "datetime"]
