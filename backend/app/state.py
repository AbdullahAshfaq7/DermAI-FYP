"""Builds the `AppState` the app renders (mobile/store/state.ts) for the signed-in person.
Every mutation returns a fresh copy so the app never has to merge partial updates."""

import re
import statistics
from datetime import date, datetime, timedelta

from sqlalchemy import or_, select, update
from sqlalchemy.orm import Session

from app import storage
from app.config import get_settings
from app.content import default_availability
from app.models import (
    AiMessage,
    Appointment,
    Blocked,
    Case,
    Dermatologist,
    Favorite,
    Message,
    Notification,
    RoutineLog,
    Saved,
    Scan,
    Share,
    Thread,
    User,
)
from app.routine import streak_before
from app.slots import first_free, next_free
from app.timeutil import iso, today_local, utcnow

STATE_VERSION = 3

DEFAULT_PROFILE = {
    "tone": None,
    "feel": None,
    "concerns": [],
    "otherConcerns": [],
    "avoid": [],
    "current": None,
    "currentProducts": [],
    "done": False,
    "phone": "",
    "dob": "",
    "gender": "",
    "city": "",
}
DEFAULT_SETTINGS = {
    "remindAm": True,
    "remindPm": True,
    "remindRescan": True,
    "rescanDays": 10,
    "quiet": True,
    "quietFrom": "11 pm",
    "quietTo": "7 am",
    "keepPhotos": False,
    "photoRetention": "1y",
    "skipGuide": False,
    "rescanDue": None,
    "train": False,
    "language": "English",
}
DEFAULT_PREFS = {"amTime": "7:30 am", "pmTime": "10:00 pm", "length": 4, "budget": "Medium", "rebuild": True, "removed": [], "doctorSteps": [], "paused": {}}
DEFAULT_SERVICES = {"video": {"on": True, "fee": 3000}, "clinic": {"on": True, "fee": 3500}, "message": {"on": True, "fee": 1500}}
SERVICE_SHORT = {"video": "Video", "clinic": "Clinic", "message": "Message"}


def profile_of(u: User) -> dict:
    return {**DEFAULT_PROFILE, **(u.profile or {})}


def settings_of(u: User) -> dict:
    return {**DEFAULT_SETTINGS, **(u.settings or {})}


def prefs_of(u: User) -> dict:
    p = {**DEFAULT_PREFS, **(u.routine_prefs or {})}
    # Routines used to be 3, 4 or 6 steps; they are now 2 to 5 per half of the day.
    if p.get("length") not in (2, 3, 4, 5):
        p["length"] = 5 if (p.get("length") or 0) > 5 else 3
    return p


def short_name(name: str) -> str:
    parts = name.split()
    return f"{parts[0]} {parts[-1][0]}." if len(parts) > 1 else name


def age_from(dob: str) -> int:
    for fmt in ("%d %b %Y", "%d %B %Y", "%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            d = datetime.strptime(dob.strip(), fmt).date()
        except (ValueError, AttributeError):
            continue
        t = today_local()
        return max(0, t.year - d.year - ((t.month, t.day) < (d.month, d.day)))
    return 0


def settle(db: Session) -> None:
    """Visits that ended more than an hour ago are done; expired shares are dropped."""
    cutoff = utcnow() - timedelta(hours=1)
    for a in db.scalars(select(Appointment).where(Appointment.status == "upcoming", Appointment.service != "message", Appointment.start < cutoff)):
        if a.start + timedelta(minutes=a.minutes) < cutoff:
            a.status = "done"
    db.execute(update(Share).where(Share.until < utcnow()).values(scan_ids=[]))
    db.flush()


def active_shares(db: Session, patient_id: str | None = None, derm_id: str | None = None) -> list[Share]:
    q = select(Share).where(Share.until > utcnow())
    if patient_id:
        q = q.where(Share.patient_id == patient_id)
    if derm_id:
        q = q.where(Share.derm_id == derm_id)
    return [s for s in db.scalars(q) if s.scan_ids]


def scan_dict(s: Scan, base: str, shared_with: list[str] | None = None, with_photo: bool = True) -> dict:
    return {
        "id": s.id,
        "date": iso(s.date),
        "score": s.score,
        "concerns": s.concerns,
        "zones": s.zones,
        "where": s.where,
        "quality": s.quality,
        "confidence": s.confidence,
        "photoUri": storage.url_for(s.photo_key, base) if with_photo else None,
        "photoTone": s.photo_tone,
        "sharedWith": shared_with or [],
    }


def service_detail(d: Dermatologist, kind: str) -> str:
    if kind == "video":
        return "20 min"
    if kind == "clinic":
        return d.clinic or "In clinic"
    pron = "She reviews" if d.female else "He reviews" if d.female is False else "Reviews"
    return f"{pron} your scan in 24 hrs"


def reply_hours(db: Session, d: Dermatologist, fallback: int) -> int:
    gaps = []
    for t in db.scalars(select(Thread).where(Thread.derm_id == d.id)):
        waiting: datetime | None = None
        for m in t.messages:
            if m.sender == "patient" and waiting is None:
                waiting = m.at
            elif m.sender == "doctor" and waiting is not None:
                gaps.append((m.at - waiting).total_seconds() / 3600)
                waiting = None
    if not gaps:
        return fallback
    return max(1, round(statistics.median(gaps)))


def patient_count(db: Session, d: Dermatologist) -> int:
    ids = {a.patient_id for a in db.scalars(select(Appointment).where(Appointment.derm_id == d.id))}
    ids |= {t.patient_id for t in db.scalars(select(Thread).where(Thread.derm_id == d.id))}
    return len(ids)


def years_of(d: Dermatologist) -> int:
    if d.practising_since:
        return max(0, today_local().year - d.practising_since)
    return d.years


def doctor_dict(db: Session, d: Dermatologist, base: str) -> dict:
    services = {**DEFAULT_SERVICES, **(d.services or {})}
    return {
        "id": d.id,
        "name": d.user.name,
        "pmdc": d.pmdc,
        "qualifications": d.qualification,
        "years": years_of(d),
        "rating": round(d.rating, 1),
        "reviews": d.review_count,
        "replyHours": reply_hours(db, d, 24),
        "bio": d.bio or f"Dermatologist. Treats {', '.join(s.lower() for s in d.specialties[:3]) or 'skin concerns'}.",
        "focus": d.focus or ", ".join(d.specialties[:2]),
        "specialties": d.specialties,
        "city": d.city,
        "clinic": d.clinic,
        "female": bool(d.female),
        "tone": d.tone,
        "photoUrl": storage.url_for(d.user.avatar_key, base),
        "services": [{"type": k, "fee": int(services[k]["fee"]), "detail": service_detail(d, k)} for k in ("video", "clinic", "message") if services[k].get("on")],
        "nextFree": next_free(db, d),
        "nextSlot": first_free(db, d),
        "languages": d.languages or ["English", "Urdu"],
        "patients": patient_count(db, d),
    }


def directory(db: Session, base: str) -> list[dict]:
    rows = db.scalars(select(Dermatologist).join(User).where(Dermatologist.status == "approved").order_by(Dermatologist.rating.desc(), User.name))
    return [doctor_dict(db, d, base) for d in rows]


def message_dict(m: Message, base: str) -> dict:
    out = {"id": m.id, "from": m.sender, "text": m.text, "at": iso(m.at)}
    if m.note:
        out["note"] = m.note
    if m.attachment_key:
        out["attachment"] = storage.url_for(m.attachment_key, base) or "photo"
    return out


def thread_dict(db: Session, t: Thread, base: str) -> dict:
    patient = db.get(User, t.patient_id)
    share = db.scalar(select(Share).where(Share.patient_id == t.patient_id, Share.derm_id == t.derm_id, Share.until > utcnow()))
    case = db.scalar(select(Case).where(Case.patient_id == t.patient_id, Case.derm_id == t.derm_id).order_by(Case.received_at.desc()))
    return {
        "id": t.id,
        "caseNumber": f"DA-{case.number}" if case and case.number else None,
        "doctorId": t.derm_id,
        "patientId": t.patient_id,
        "patientName": patient.name if patient else "Patient",
        "caseTitle": t.case_title,
        "sharedScans": len(share.scan_ids) if share else 0,
        "messages": [message_dict(m, base) for m in t.messages],
        "unreadForPatient": t.unread_for_patient,
        "unreadForDoctor": t.unread_for_doctor,
    }


def appointment_dict(a: Appointment, patient_name: str) -> dict:
    return {
        "id": a.id,
        "doctorId": a.derm_id,
        "patientName": patient_name,
        "service": a.service,
        "start": iso(a.start),
        "minutes": a.minutes,
        "reason": a.reason,
        "sharedScanIds": a.shared_scan_ids,
        "status": a.status,
        "fee": a.fee,
        "paymentMethod": a.payment_method,
        "paymentStatus": a.payment_status,
        "cancelledBy": a.cancelled_by,
        "rating": a.rating,
        "caseId": a.case_id,
    }


def notification_dict(n: Notification) -> dict:
    return {"id": n.id, "icon": n.icon, "title": n.title, "body": n.body, "at": iso(n.at), "href": n.href, "read": n.read}


def case_patient(db: Session, c: Case) -> dict:
    u = db.get(User, c.patient_id)
    prof = profile_of(u) if u else DEFAULT_PROFILE
    tone = prof.get("tone")
    latest = db.scalar(select(Scan).where(Scan.user_id == c.patient_id).order_by(Scan.date.desc()))
    routine = []
    if u:
        from app.routine import build_routine

        scan = {"concerns": latest.concerns} if latest else None
        for period in ("am", "pm"):
            routine += [{"id": s["id"], "title": s["title"], "period": period, "doctor": bool(s.get("doctor"))} for s in build_routine(period, prof, prefs_of(u), scan)]
    return {
        "id": c.patient_id,
        "routine": routine,
        "gender": prof.get("gender", ""),
        "name": u.name if u else "Patient",
        "age": age_from(prof.get("dob", "")),
        "fitz": (tone + 1) if isinstance(tone, int) else 0,
        "type": prof.get("feel") or "Normal",
        "avoids": prof.get("avoid", []),
        "tone": latest.photo_tone if latest else (tone if isinstance(tone, int) else 2),
    }


def case_dict(db: Session, c: Case, base: str) -> dict:
    share = db.scalar(select(Share).where(Share.patient_id == c.patient_id, Share.derm_id == c.derm_id, Share.until > utcnow()))
    visible = set(share.scan_ids) if share else set()
    photos = []
    for p in c.photos or []:
        item = {"date": p["date"], "tone": p.get("tone", 2)}
        sid = p.get("scanId")
        if sid and sid in visible:
            s = db.get(Scan, sid)
            if s and s.photo_key:
                item["uri"] = storage.url_for(s.photo_key, base)
        photos.append(item)
    out = {
        "id": c.id,
        "number": f"DA-{c.number}" if c.number else None,
        "flags": c.flags or [],
        "patient": case_patient(db, c),
        "complaint": c.complaint,
        "summary": c.summary,
        "urgency": c.urgency,
        "receivedAt": iso(c.received_at),
        "status": c.status,
        "channel": c.channel,
        "photos": photos,
        "ai": c.ai,
        "threadId": c.thread_id,
    }
    if c.draft:
        out["draft"] = c.draft
    if c.assessment:
        out["assessment"] = c.assessment
    return out


def visit_list(db: Session, d: Dermatologist) -> list[dict]:
    out = []
    for a in db.scalars(select(Appointment).where(Appointment.derm_id == d.id, Appointment.status != "cancelled", Appointment.service != "message")):
        p = db.get(User, a.patient_id)
        out.append(
            {
                "id": a.id,
                "start": iso(a.start),
                "minutes": a.minutes,
                "kind": "visit",
                "patientName": short_name(p.name) if p else "Patient",
                "service": a.service,
                "label": f"{SERVICE_SHORT[a.service]} · {a.reason.lower() if a.reason else 'new patient'}"[:60],
                "caseId": a.case_id,
                "status": a.status,
            }
        )
    for b in db.scalars(select(Blocked).where(Blocked.derm_id == d.id)):
        out.append({"id": b.id, "start": iso(b.start), "minutes": b.minutes, "kind": "blocked", "label": b.label})
    return sorted(out, key=lambda v: v["start"])


def derm_dict(db: Session, u: User, base: str) -> dict:
    d = u.derm
    if d is None:
        return {
            "step": "profile",
            "status": "draft",
            "specialties": [],
            "photo": False,
            "pmdc": "",
            "qualification": "",
            "clinic": "",
            "certificate": None,
            "cnic": None,
            "services": DEFAULT_SERVICES,
            "availability": default_availability(),
            "cases": [],
            "visits": [],
            "readThreads": [],
        }
    threads = list(db.scalars(select(Thread).where(Thread.derm_id == d.id)))
    cases = list(db.scalars(select(Case).where(Case.derm_id == d.id).order_by(Case.received_at.desc())))
    appts = list(db.scalars(select(Appointment).where(Appointment.derm_id == d.id)))
    patients = {a.patient_id for a in appts} | {t.patient_id for t in threads}
    ledger = []
    for a in appts:
        if a.status == "cancelled":
            continue
        p = db.get(User, a.patient_id)
        ledger.append({"id": a.id, "patientName": p.name if p else "Patient", "service": a.service, "start": iso(a.start), "fee": a.fee, "status": a.status})
    return {
        "id": d.id,
        "step": d.step,
        "status": d.status,
        "reviewNote": d.review_note,
        "specialties": d.specialties,
        "photo": bool(u.avatar_key),
        "photoUrl": storage.url_for(u.avatar_key, base),
        "pmdc": d.pmdc,
        "qualification": d.qualification,
        "clinic": d.clinic,
        "city": d.city,
        "certificate": d.certificate_name,
        "cnic": d.cnic_name,
        "degree": d.degree_name,
        "languages": d.languages or ["English", "Urdu"],
        "practisingSince": d.practising_since,
        "submittedAt": iso(d.submitted_at),
        "services": {**DEFAULT_SERVICES, **(d.services or {})},
        "availability": {**default_availability(), **(d.availability or {})},
        "cases": [case_dict(db, c, base) for c in cases],
        "visits": visit_list(db, d),
        "readThreads": [t.id for t in threads if t.unread_for_doctor == 0],
        "verifiedAt": iso(d.approved_at),
        "stats": {"patients": len(patients), "rating": round(d.rating, 1), "reviews": d.review_count, "replyHours": reply_hours(db, d, 0)},
        "ledger": sorted(ledger, key=lambda x: x["start"], reverse=True),
        "commissionPct": get_settings().commission_pct,
    }


def build_state(db: Session, u: User, base: str) -> dict:
    settle(db)
    db.commit()
    base = base.rstrip("/")
    notifications = db.scalars(select(Notification).where(Notification.user_id == u.id).order_by(Notification.at.desc()).limit(100))
    state: dict = {
        "version": STATE_VERSION,
        "session": {
            "id": u.id,
            "role": u.role,
            "name": u.name,
            "email": u.email,
            "demo": u.demo,
            "avatarUrl": storage.url_for(u.avatar_key, base),
        },
        "pendingRole": None,
        "consent": u.consent,
        "profile": profile_of(u),
        "scans": [],
        "guideSeen": u.guide_seen,
        "routineLog": {},
        "streakBase": 0,
        "routinePrefs": prefs_of(u),
        "settings": settings_of(u),
        "shares": [],
        "saved": [],
        "favorites": [],
        "appointments": [],
        "threads": [],
        "aiChat": [],
        "notifications": [notification_dict(n) for n in notifications],
        "derm": derm_dict(db, u, base),
        "doctors": directory(db, base),
    }

    if u.role == "patient":
        shares = active_shares(db, patient_id=u.id)
        shared_with: dict[str, list[str]] = {}
        for s in shares:
            for sid in s.scan_ids:
                shared_with.setdefault(sid, []).append(s.derm_id)
        scans = list(db.scalars(select(Scan).where(Scan.user_id == u.id).order_by(Scan.date.desc())))
        state["scans"] = [scan_dict(s, base, shared_with.get(s.id)) for s in scans]
        since = (today_local() - timedelta(days=120)).isoformat()
        log = {r.day: r.steps for r in db.scalars(select(RoutineLog).where(RoutineLog.user_id == u.id, RoutineLog.day >= since))}
        state["routineLog"] = log
        latest = {"concerns": scans[0].concerns} if scans else None
        state["streakBase"] = streak_before(today_local(), log, profile_of(u), prefs_of(u), latest)
        state["shares"] = [{"doctorId": s.derm_id, "scanIds": s.scan_ids, "until": iso(s.until)} for s in shares]
        state["saved"] = [
            {"id": s.id, "kind": s.kind, "title": s.title, "subtitle": s.subtitle, "icon": s.icon, "source": s.source, **({"routineStepId": s.routine_step_id} if s.routine_step_id else {})}
            for s in db.scalars(select(Saved).where(Saved.user_id == u.id).order_by(Saved.created_at.desc()))
        ]
        state["favorites"] = [f.derm_id for f in db.scalars(select(Favorite).where(Favorite.user_id == u.id).order_by(Favorite.created_at))]
        state["appointments"] = [
            appointment_dict(a, u.name) for a in db.scalars(select(Appointment).where(Appointment.patient_id == u.id).order_by(Appointment.start.desc()))
        ]
        threads = db.scalars(select(Thread).where(Thread.patient_id == u.id).order_by(Thread.created_at.desc()))
        state["threads"] = sorted((thread_dict(db, t, base) for t in threads), key=lambda t: t["messages"][-1]["at"] if t["messages"] else "", reverse=True)
        state["aiChat"] = [
            {"id": m.id, "from": m.sender, "text": m.text, "at": iso(m.at), **({"referral": True} if m.referral else {}), **({"suggest": m.suggest} if m.suggest else {})}
            for m in db.scalars(select(AiMessage).where(AiMessage.user_id == u.id).order_by(AiMessage.at))
        ]
    elif u.role == "dermatologist" and u.derm:
        threads = db.scalars(select(Thread).where(Thread.derm_id == u.derm.id))
        state["threads"] = sorted((thread_dict(db, t, base) for t in threads), key=lambda t: t["messages"][-1]["at"] if t["messages"] else "", reverse=True)
    return state


def thread_for(db: Session, u: User, thread_id: str) -> Thread | None:
    t = db.get(Thread, thread_id)
    if not t:
        return None
    if u.role == "patient" and t.patient_id == u.id:
        return t
    if u.role == "dermatologist" and u.derm and t.derm_id == u.derm.id:
        return t
    return None


def scan_visible_to(db: Session, u: User, scan: Scan) -> bool:
    if scan.user_id == u.id:
        return True
    if u.role == "dermatologist" and u.derm:
        share = db.scalar(select(Share).where(Share.patient_id == scan.user_id, Share.derm_id == u.derm.id, Share.until > utcnow()))
        return bool(share and scan.id in share.scan_ids)
    return False


def safe_title(text: str, fallback: str) -> str:
    t = re.sub(r"\s+", " ", text or "").strip()
    return (t[:60] or fallback)


def as_date(s: str) -> date | None:
    try:
        return date.fromisoformat(s)
    except (TypeError, ValueError):
        return None


__all__ = ["build_state", "settle", "or_"]
