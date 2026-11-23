"""Admin portal: platform overview, every account, doctor verification, bookings, cases, scans,
announcements and an audit trail. Every change is written to `admin_log`."""

import re
from datetime import timedelta

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session

from app import storage
from app.common import In, base_url, notify
from app.config import get_settings
from app.db import get_db
from app.errors import ApiError, not_found
from app.models import (
    AdminLog,
    AiMessage,
    Appointment,
    Case,
    Dermatologist,
    Notification,
    RefreshToken,
    Saved,
    Scan,
    Share,
    Thread,
    User,
)
from app.routers.auth import doctor_name, remove_user
from app.routers.derm import LANGUAGES, SPECIALTIES, approve_derm, reject_derm
from app.security import admin_user, hash_password, normalise_email, password_problem, valid_email
from app.state import DEFAULT_PREFS, DEFAULT_PROFILE, DEFAULT_SERVICES, DEFAULT_SETTINGS, profile_of, settings_of, settle, years_of
from app.timeutil import iso, today_local, tz, utcnow

router = APIRouter(prefix="/admin", tags=["admin"])

ROLES = ("patient", "dermatologist", "admin")
DERM_STATUSES = ("draft", "pending", "approved", "rejected")
APPT_STATUSES = ("upcoming", "done", "cancelled")
PAYMENT_STATUSES = ("due", "paid", "refunded")
CASE_STATUSES = ("waiting", "replied", "closed")
URGENCIES = ("mild", "moderate", "urgent")
GENDERS = ("", "Female", "Male", "Prefer not to say")
DOB_FORMATS = ("%d %b %Y", "%d %B %Y", "%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y")
PHONE_RE = re.compile(r"^\+?[\d\s\-()]{7,20}$")


def log(db: Session, admin: User, action: str, target_type: str = "", target_id: str = "", detail: str = "") -> None:
    db.add(AdminLog(admin_id=admin.id, admin_name=admin.name, action=action, target_type=target_type, target_id=target_id, detail=detail[:2000]))


def like(q: str) -> str:
    return "%" + q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"


def page(limit: int, offset: int) -> tuple[int, int]:
    return max(1, min(limit, 200)), max(0, offset)


# ───────────── Overview ─────────────


@router.get("/overview")
def overview(user: User = Depends(admin_user), db: Session = Depends(get_db)):
    settle(db)
    db.commit()
    by_role = dict(db.execute(select(User.role, func.count()).group_by(User.role)).all())
    by_derm = dict(db.execute(select(Dermatologist.status, func.count()).group_by(Dermatologist.status)).all())
    by_appt = dict(db.execute(select(Appointment.status, func.count()).group_by(Appointment.status)).all())
    by_case = dict(db.execute(select(Case.status, func.count()).group_by(Case.status)).all())
    urgent_open = db.scalar(select(func.count()).select_from(Case).where(Case.urgency == "urgent", Case.status != "closed")) or 0
    suspended = db.scalar(select(func.count()).select_from(User).where(User.suspended.is_(True))) or 0
    week_ago = utcnow() - timedelta(days=7)
    new_week = db.scalar(select(func.count()).select_from(User).where(User.created_at >= week_ago)) or 0
    scans_total = db.scalar(select(func.count()).select_from(Scan)) or 0
    scans_week = db.scalar(select(func.count()).select_from(Scan).where(Scan.date >= week_ago)) or 0
    avg_score = db.scalar(select(func.avg(Scan.score)))
    gross = db.scalar(select(func.coalesce(func.sum(Appointment.fee), 0)).where(Appointment.status == "done")) or 0
    paid = db.scalar(select(func.coalesce(func.sum(Appointment.fee), 0)).where(Appointment.payment_status == "paid")) or 0
    pct = get_settings().commission_pct
    day = today_local()
    start = utcnow().astimezone(tz()).replace(hour=0, minute=0, second=0, microsecond=0)
    today_visits = db.scalar(
        select(func.count()).select_from(Appointment).where(Appointment.status != "cancelled", Appointment.start >= start, Appointment.start < start + timedelta(days=1))
    ) or 0
    recent = db.scalars(select(User).order_by(User.created_at.desc()).limit(5))
    activity = db.scalars(select(AdminLog).order_by(AdminLog.at.desc()).limit(8))
    return {
        "today": day.isoformat(),
        "users": {"total": sum(by_role.values()), "patients": by_role.get("patient", 0), "dermatologists": by_role.get("dermatologist", 0), "admins": by_role.get("admin", 0), "suspended": suspended, "newThisWeek": new_week},
        "doctors": {s: by_derm.get(s, 0) for s in DERM_STATUSES},
        "appointments": {**{s: by_appt.get(s, 0) for s in APPT_STATUSES}, "today": today_visits},
        "cases": {**{s: by_case.get(s, 0) for s in CASE_STATUSES}, "urgentOpen": urgent_open},
        "scans": {"total": scans_total, "thisWeek": scans_week, "averageScore": round(float(avg_score)) if avg_score is not None else None},
        "revenue": {"gross": int(gross), "paid": int(paid), "commissionPct": pct, "commission": round(int(gross) * pct / 100)},
        "recentUsers": [user_row(db, u) for u in recent],
        "activity": [log_dict(a) for a in activity],
    }


# ───────────── Users ─────────────


def user_row(db: Session, u: User) -> dict:
    prof = profile_of(u)
    return {
        "id": u.id,
        "role": u.role,
        "name": u.name,
        "email": u.email,
        "phone": prof.get("phone", ""),
        "city": (u.derm.city if u.derm else "") or prof.get("city", ""),
        "demo": u.demo,
        "suspended": u.suspended,
        "dermStatus": u.derm.status if u.derm else None,
        "createdAt": iso(u.created_at),
        "lastLoginAt": iso(u.last_login_at),
    }


@router.get("/users")
def list_users(
    role: str = "",
    q: str = "",
    status: str = "",
    limit: int = 50,
    offset: int = 0,
    user: User = Depends(admin_user),
    db: Session = Depends(get_db),
):
    if role and role not in ROLES:
        raise ApiError(400, "bad_role", "Role must be patient, dermatologist or admin.")
    if status and status not in ("active", "suspended"):
        raise ApiError(400, "bad_status", "Status must be active or suspended.")
    limit, offset = page(limit, offset)
    query = select(User)
    if role:
        query = query.where(User.role == role)
    if status:
        query = query.where(User.suspended.is_(status == "suspended"))
    q = q.strip()
    if q:
        query = query.where(or_(User.name.ilike(like(q), escape="\\"), User.email.ilike(like(q), escape="\\"), User.id == q))
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = db.scalars(query.order_by(User.created_at.desc(), User.id).limit(limit).offset(offset))
    return {"users": [user_row(db, u) for u in rows], "total": total, "limit": limit, "offset": offset}


def get_user(db: Session, user_id: str) -> User:
    u = db.get(User, user_id)
    if not u:
        raise not_found("That account")
    return u


@router.get("/users/{user_id}")
def user_detail(user_id: str, request: Request, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    u = get_user(db, user_id)
    base = base_url(request).rstrip("/")
    out = {
        **user_row(db, u),
        "avatarUrl": storage.url_for(u.avatar_key, base),
        "suspendedReason": u.suspended_reason,
        "consent": u.consent,
        "profile": profile_of(u),
        "settings": settings_of(u),
        "routinePrefs": {**DEFAULT_PREFS, **(u.routine_prefs or {})},
        "activeSessions": db.scalar(select(func.count()).select_from(RefreshToken).where(RefreshToken.user_id == u.id, RefreshToken.revoked.is_(False), RefreshToken.expires_at > utcnow())) or 0,
        "counts": {
            "scans": db.scalar(select(func.count()).select_from(Scan).where(Scan.user_id == u.id)) or 0,
            "saved": db.scalar(select(func.count()).select_from(Saved).where(Saved.user_id == u.id)) or 0,
            "aiMessages": db.scalar(select(func.count()).select_from(AiMessage).where(AiMessage.user_id == u.id)) or 0,
            "notifications": db.scalar(select(func.count()).select_from(Notification).where(Notification.user_id == u.id)) or 0,
        },
        "scans": [],
        "appointments": [],
        "cases": [],
        "derm": None,
    }
    if u.role == "patient":
        out["scans"] = [scan_row(s, u) for s in db.scalars(select(Scan).where(Scan.user_id == u.id).order_by(Scan.date.desc()).limit(50))]
        out["appointments"] = [appt_row(db, a) for a in db.scalars(select(Appointment).where(Appointment.patient_id == u.id).order_by(Appointment.start.desc()))]
        out["cases"] = [case_row(db, c) for c in db.scalars(select(Case).where(Case.patient_id == u.id).order_by(Case.received_at.desc()))]
    if u.derm:
        d = u.derm
        out["derm"] = derm_detail(db, d, base)
        out["appointments"] = [appt_row(db, a) for a in db.scalars(select(Appointment).where(Appointment.derm_id == d.id).order_by(Appointment.start.desc()))]
        out["cases"] = [case_row(db, c) for c in db.scalars(select(Case).where(Case.derm_id == d.id).order_by(Case.received_at.desc()))]
    return out


class CreateUserIn(In):
    role: str
    name: str
    email: str
    password: str


def clean_name(name: str) -> str:
    name = " ".join(name.split())
    if len(name) < 2 or len(name) > 80:
        raise ApiError(400, "bad_name", "Enter a full name (2 to 80 characters).")
    return name


def check_email(db: Session, email: str, exclude_id: str | None = None) -> str:
    email = normalise_email(email)
    if not valid_email(email):
        raise ApiError(400, "bad_email", "Enter a valid email address.")
    q = select(User).where(User.email == email)
    if exclude_id:
        q = q.where(User.id != exclude_id)
    if db.scalar(q):
        raise ApiError(409, "email_taken", "Another account already uses this email.")
    return email


@router.post("/users")
def create_user(body: CreateUserIn, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    if body.role not in ROLES:
        raise ApiError(400, "bad_role", "Role must be patient, dermatologist or admin.")
    name = clean_name(body.name)
    email = check_email(db, body.email)
    problem = password_problem(body.password)
    if problem:
        raise ApiError(400, "weak_password", problem)
    u = User(
        role=body.role,
        name=doctor_name(name) if body.role == "dermatologist" else name,
        email=email,
        password_hash=hash_password(body.password),
        profile=dict(DEFAULT_PROFILE),
        settings=dict(DEFAULT_SETTINGS),
        routine_prefs=dict(DEFAULT_PREFS),
    )
    db.add(u)
    db.flush()
    if body.role == "dermatologist":
        from app.content import default_availability

        db.add(Dermatologist(user_id=u.id, services=DEFAULT_SERVICES, availability=default_availability()))
    log(db, user, "user.create", "user", u.id, f"{body.role} {email}")
    db.commit()
    return {"ok": True, "id": u.id}


class UpdateUserIn(In):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    dob: str | None = None
    gender: str | None = None
    city: str | None = None


@router.patch("/users/{user_id}")
def update_user(user_id: str, body: UpdateUserIn, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    u = get_user(db, user_id)
    changed = []
    if body.name is not None:
        name = clean_name(body.name)
        u.name = doctor_name(name) if u.role == "dermatologist" else name
        changed.append("name")
    if body.email is not None:
        u.email = check_email(db, body.email, exclude_id=u.id)
        changed.append("email")
    prof = profile_of(u)
    if body.phone is not None:
        if body.phone and not PHONE_RE.match(body.phone):
            raise ApiError(400, "bad_phone", "Enter a phone number like +92 300 1234567.")
        prof["phone"] = body.phone
        changed.append("phone")
    if body.dob is not None:
        prof["dob"] = clean_dob(body.dob) if body.dob else ""
        changed.append("dob")
    if body.gender is not None:
        if body.gender not in GENDERS:
            raise ApiError(400, "bad_gender", "Pick Female, Male or Prefer not to say.")
        prof["gender"] = body.gender
        changed.append("gender")
    if body.city is not None:
        prof["city"] = body.city[:80]
        if u.derm:
            u.derm.city = body.city[:80]
        changed.append("city")
    if not changed:
        raise ApiError(400, "nothing_to_change", "Change at least one field.")
    u.profile = prof
    log(db, user, "user.update", "user", u.id, ", ".join(changed))
    db.commit()
    return {"ok": True}


def clean_dob(raw: str) -> str:
    """Accepts the formats the app accepts and stores the app's own style, e.g. 14 Mar 2001."""
    from datetime import datetime

    for fmt in DOB_FORMATS:
        try:
            born = datetime.strptime(raw.strip(), fmt).date()
            break
        except ValueError:
            continue
    else:
        raise ApiError(400, "bad_dob", "Enter the date of birth like 14 Mar 2001.")
    if born > today_local() or born.year < 1900:
        raise ApiError(400, "bad_dob", "That date of birth isn't possible.")
    return f"{born.day} {born.strftime('%b %Y')}"


class PasswordIn(In):
    password: str


def end_sessions(db: Session, u: User) -> None:
    u.token_version += 1
    db.execute(update(RefreshToken).where(RefreshToken.user_id == u.id).values(revoked=True))


@router.post("/users/{user_id}/password")
def set_password(user_id: str, body: PasswordIn, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    u = get_user(db, user_id)
    problem = password_problem(body.password)
    if problem:
        raise ApiError(400, "weak_password", problem)
    u.password_hash = hash_password(body.password)
    end_sessions(db, u)
    log(db, user, "user.password", "user", u.id)
    db.commit()
    return {"ok": True}


@router.post("/users/{user_id}/sign-out")
def sign_out_everywhere(user_id: str, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    u = get_user(db, user_id)
    if u.id == user.id:
        raise ApiError(409, "self", "Use Log out to end your own session.")
    end_sessions(db, u)
    log(db, user, "user.sign_out", "user", u.id)
    db.commit()
    return {"ok": True}


class SuspendIn(In):
    reason: str = ""


def other_admins(db: Session, u: User) -> int:
    return db.scalar(select(func.count()).select_from(User).where(User.role == "admin", User.id != u.id, User.suspended.is_(False))) or 0


@router.post("/users/{user_id}/suspend")
def suspend(user_id: str, body: SuspendIn, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    u = get_user(db, user_id)
    if u.id == user.id:
        raise ApiError(409, "self", "You can't suspend your own account.")
    if u.suspended:
        raise ApiError(409, "already_suspended", "This account is already suspended.")
    if u.role == "admin" and other_admins(db, u) == 0:
        raise ApiError(409, "last_admin", "Keep at least one active admin.")
    u.suspended, u.suspended_reason = True, body.reason[:300]
    end_sessions(db, u)
    hidden = ""
    if u.derm:
        # A suspended doctor's upcoming visits are cancelled and patients told.
        n = cancel_doctor_visits(db, u.derm, "Your visit was cancelled because the doctor is unavailable. You won't be charged.")
        hidden = f"; {n} visits cancelled" if n else ""
    log(db, user, "user.suspend", "user", u.id, (body.reason or "no reason") + hidden)
    db.commit()
    return {"ok": True}


@router.post("/users/{user_id}/restore")
def restore(user_id: str, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    u = get_user(db, user_id)
    if not u.suspended:
        raise ApiError(409, "not_suspended", "This account isn't suspended.")
    u.suspended, u.suspended_reason = False, ""
    log(db, user, "user.restore", "user", u.id)
    db.commit()
    return {"ok": True}


def cancel_doctor_visits(db: Session, d: Dermatologist, message: str) -> int:
    upcoming = list(db.scalars(select(Appointment).where(Appointment.derm_id == d.id, Appointment.status == "upcoming")))
    for a in upcoming:
        a.status, a.cancelled_by = "cancelled", "admin"
        if a.payment_status == "paid":
            a.payment_status = "refunded"
        notify(db, a.patient_id, "event-busy", "Visit cancelled", message, f"/booked/{a.id}")
    return len(upcoming)


@router.delete("/users/{user_id}")
def delete_user(user_id: str, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    u = get_user(db, user_id)
    if u.id == user.id:
        raise ApiError(409, "self", "You can't delete your own account here.")
    if u.role == "admin" and other_admins(db, u) == 0:
        raise ApiError(409, "last_admin", "Keep at least one active admin.")
    detail = f"{u.role} {u.email}"
    remove_user(db, u)
    log(db, user, "user.delete", "user", user_id, detail)
    db.commit()
    return {"ok": True}


# ───────────── Doctors ─────────────


def derm_detail(db: Session, d: Dermatologist, base: str) -> dict:
    services = {**DEFAULT_SERVICES, **(d.services or {})}
    return {
        "id": d.id,
        "userId": d.user_id,
        "name": d.user.name,
        "email": d.user.email,
        "suspended": d.user.suspended,
        "step": d.step,
        "status": d.status,
        "reviewNote": d.review_note,
        "pmdc": d.pmdc,
        "qualification": d.qualification,
        "clinic": d.clinic,
        "city": d.city,
        "bio": d.bio,
        "focus": d.focus,
        "specialties": d.specialties,
        "languages": d.languages,
        "years": years_of(d),
        "practisingSince": d.practising_since,
        "female": d.female,
        "services": services,
        "availability": d.availability,
        "rating": round(d.rating, 1),
        "reviews": d.review_count,
        "submittedAt": iso(d.submitted_at),
        "approvedAt": iso(d.approved_at),
        "certificate": storage.url_for(d.certificate_key, base),
        "certificateName": d.certificate_name,
        "degree": storage.url_for(d.degree_key, base),
        "degreeName": d.degree_name,
        "cnic": storage.url_for(d.cnic_key, base),
        "cnicName": d.cnic_name,
        "stats": {
            "appointments": db.scalar(select(func.count()).select_from(Appointment).where(Appointment.derm_id == d.id)) or 0,
            "upcoming": db.scalar(select(func.count()).select_from(Appointment).where(Appointment.derm_id == d.id, Appointment.status == "upcoming")) or 0,
            "cases": db.scalar(select(func.count()).select_from(Case).where(Case.derm_id == d.id)) or 0,
            "earned": int(db.scalar(select(func.coalesce(func.sum(Appointment.fee), 0)).where(Appointment.derm_id == d.id, Appointment.status == "done")) or 0),
        },
    }


@router.get("/derms")
def list_derms(request: Request, status: str = "pending", q: str = "", user: User = Depends(admin_user), db: Session = Depends(get_db)):
    if status not in (*DERM_STATUSES, "all"):
        raise ApiError(400, "bad_status", "Status must be draft, pending, approved, rejected or all.")
    query = select(Dermatologist).join(User, User.id == Dermatologist.user_id)
    if status != "all":
        query = query.where(Dermatologist.status == status)
    q = q.strip()
    if q:
        query = query.where(or_(User.name.ilike(like(q), escape="\\"), User.email.ilike(like(q), escape="\\"), Dermatologist.pmdc.ilike(like(q), escape="\\"), Dermatologist.city.ilike(like(q), escape="\\")))
    # Oldest submissions first, so the queue is fair.
    rows = db.scalars(query.order_by(Dermatologist.submitted_at.asc().nulls_last(), User.name))
    base = base_url(request).rstrip("/")
    return {"derms": [derm_detail(db, d, base) for d in rows]}


def get_derm(db: Session, derm_id: str) -> Dermatologist:
    d = db.get(Dermatologist, derm_id)
    if not d:
        raise not_found("That doctor")
    return d


@router.get("/derms/{derm_id}")
def derm_one(derm_id: str, request: Request, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    return derm_detail(db, get_derm(db, derm_id), base_url(request).rstrip("/"))


@router.post("/derms/{derm_id}/approve")
def admin_approve(derm_id: str, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    d = get_derm(db, derm_id)
    if d.status == "approved":
        raise ApiError(409, "already_approved", "This doctor is already verified.")
    approve_derm(db, d)
    log(db, user, "derm.approve", "derm", d.id, d.user.name)
    db.commit()
    return {"ok": True}


class RejectIn(In):
    note: str = ""


@router.post("/derms/{derm_id}/reject")
def admin_reject(derm_id: str, body: RejectIn, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    d = get_derm(db, derm_id)
    was_approved = d.status == "approved"
    reject_derm(db, d, body.note[:500])
    n = 0
    if was_approved:
        # Taking a verified doctor out of the directory cancels their upcoming visits.
        n = cancel_doctor_visits(db, d, "Your visit was cancelled because the doctor is no longer available. You won't be charged.")
    log(db, user, "derm.revoke" if was_approved else "derm.reject", "derm", d.id, (body.note or "no note") + (f"; {n} visits cancelled" if n else ""))
    db.commit()
    return {"ok": True}


class ServiceIn(In):
    on: bool
    fee: int


class DermUpdateIn(In):
    qualification: str | None = None
    clinic: str | None = None
    city: str | None = None
    bio: str | None = None
    focus: str | None = None
    practising_since: int | None = None
    specialties: list[str] | None = None
    languages: list[str] | None = None
    female: bool | None = None
    services: dict[str, ServiceIn] | None = None


@router.patch("/derms/{derm_id}")
def update_derm(derm_id: str, body: DermUpdateIn, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    d = get_derm(db, derm_id)
    fields = body.model_dump(exclude_unset=True)
    if not fields:
        raise ApiError(400, "nothing_to_change", "Change at least one field.")
    if body.qualification is not None:
        if len(body.qualification) < 3:
            raise ApiError(400, "bad_qualification", "Enter the qualification, like FCPS Dermatology.")
        d.qualification = body.qualification[:200]
    if body.clinic is not None:
        if len(body.clinic) < 3:
            raise ApiError(400, "bad_clinic", "Enter the clinic name and area.")
        d.clinic = body.clinic[:200]
    if body.city is not None:
        d.city = body.city[:80]
    if body.bio is not None:
        d.bio = body.bio[:500]
    if body.focus is not None:
        d.focus = body.focus[:200]
    if "practising_since" in fields:
        y = body.practising_since
        if y is not None and not 1960 <= y <= utcnow().year:
            raise ApiError(400, "bad_year", f"Practising since must be between 1960 and {utcnow().year}.")
        d.practising_since = y
    if body.specialties is not None:
        if not body.specialties or any(s not in SPECIALTIES for s in body.specialties):
            raise ApiError(400, "bad_specialty", "Pick at least one known specialty.")
        d.specialties = list(dict.fromkeys(body.specialties))
    if body.languages is not None:
        if not body.languages or any(x not in LANGUAGES for x in body.languages):
            raise ApiError(400, "bad_languages", "Pick at least one known language.")
        d.languages = list(dict.fromkeys(body.languages))
    if "female" in fields:
        d.female = body.female
    if body.services is not None:
        if set(body.services) != {"video", "clinic", "message"}:
            raise ApiError(400, "bad_services", "Set video, clinic and message.")
        if not any(s.on for s in body.services.values()):
            raise ApiError(400, "no_services", "Offer at least one kind of visit.")
        if any(s.on and not 500 <= s.fee <= 50000 for s in body.services.values()):
            raise ApiError(400, "bad_fee", "Fees must be between PKR 500 and 50,000.")
        d.services = {k: {"on": s.on, "fee": s.fee} for k, s in body.services.items()}
    log(db, user, "derm.update", "derm", d.id, ", ".join(fields))
    db.commit()
    return {"ok": True}


# ───────────── Appointments ─────────────


def appt_row(db: Session, a: Appointment) -> dict:
    p = db.get(User, a.patient_id)
    d = db.get(Dermatologist, a.derm_id)
    return {
        "id": a.id,
        "patientId": a.patient_id,
        "patientName": p.name if p else "Deleted patient",
        "doctorId": a.derm_id,
        "doctorName": d.user.name if d else "Deleted doctor",
        "service": a.service,
        "start": iso(a.start),
        "minutes": a.minutes,
        "reason": a.reason,
        "status": a.status,
        "fee": a.fee,
        "paymentMethod": a.payment_method,
        "paymentStatus": a.payment_status,
        "cancelledBy": a.cancelled_by,
        "rating": a.rating,
        "caseId": a.case_id,
        "sharedScans": len(a.shared_scan_ids or []),
        "createdAt": iso(a.created_at),
    }


@router.get("/appointments")
def list_appointments(
    status: str = "",
    service: str = "",
    q: str = "",
    limit: int = 50,
    offset: int = 0,
    user: User = Depends(admin_user),
    db: Session = Depends(get_db),
):
    if status and status not in APPT_STATUSES:
        raise ApiError(400, "bad_status", "Status must be upcoming, done or cancelled.")
    if service and service not in ("video", "clinic", "message"):
        raise ApiError(400, "bad_service", "Service must be video, clinic or message.")
    settle(db)
    db.commit()
    limit, offset = page(limit, offset)
    query = select(Appointment)
    if status:
        query = query.where(Appointment.status == status)
    if service:
        query = query.where(Appointment.service == service)
    q = q.strip()
    if q:
        patients = select(User.id).where(User.name.ilike(like(q), escape="\\"))
        doctors = select(Dermatologist.id).join(User, User.id == Dermatologist.user_id).where(User.name.ilike(like(q), escape="\\"))
        query = query.where(or_(Appointment.id == q, Appointment.patient_id.in_(patients), Appointment.derm_id.in_(doctors)))
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    order = Appointment.start.asc() if status == "upcoming" else Appointment.start.desc()
    rows = db.scalars(query.order_by(order, Appointment.id).limit(limit).offset(offset))
    return {"appointments": [appt_row(db, a) for a in rows], "total": total, "limit": limit, "offset": offset}


def get_appt(db: Session, appt_id: str) -> Appointment:
    a = db.get(Appointment, appt_id)
    if not a:
        raise not_found("That booking")
    return a


@router.get("/appointments/{appt_id}")
def appointment_one(appt_id: str, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    return appt_row(db, get_appt(db, appt_id))


class CancelIn(In):
    note: str = ""


@router.post("/appointments/{appt_id}/cancel")
def cancel_appointment(appt_id: str, body: CancelIn, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    a = get_appt(db, appt_id)
    if a.status != "upcoming":
        raise ApiError(409, "not_cancellable", "This booking is already cancelled." if a.status == "cancelled" else "This visit has already happened.")
    a.status, a.cancelled_by = "cancelled", "admin"
    if a.payment_status == "paid":
        a.payment_status = "refunded"
    msg = body.note[:200] or "DermAI support cancelled this booking. You won't be charged."
    notify(db, a.patient_id, "event-busy", "Visit cancelled", msg, f"/booked/{a.id}")
    d = db.get(Dermatologist, a.derm_id)
    if d:
        p = db.get(User, a.patient_id)
        notify(db, d.user_id, "event-busy", "Booking cancelled by DermAI", f"{p.name if p else 'A patient'}'s booking was cancelled. {body.note[:120]}".strip(), "/schedule")
    log(db, user, "appointment.cancel", "appointment", a.id, body.note or "")
    db.commit()
    return {"ok": True}


class PaymentIn(In):
    status: str


@router.post("/appointments/{appt_id}/payment")
def set_payment(appt_id: str, body: PaymentIn, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    a = get_appt(db, appt_id)
    if body.status not in PAYMENT_STATUSES:
        raise ApiError(400, "bad_payment", "Payment must be due, paid or refunded.")
    if body.status == "refunded" and a.payment_status != "paid":
        raise ApiError(409, "not_paid", "Only a paid booking can be refunded.")
    if body.status == a.payment_status:
        raise ApiError(409, "unchanged", f"This booking is already {a.payment_status}.")
    old = a.payment_status
    a.payment_status = body.status
    log(db, user, "appointment.payment", "appointment", a.id, f"{old} → {body.status}")
    db.commit()
    return {"ok": True}


# ───────────── Cases ─────────────


def case_row(db: Session, c: Case) -> dict:
    p = db.get(User, c.patient_id)
    d = db.get(Dermatologist, c.derm_id)
    return {
        "id": c.id,
        "number": f"DA-{c.number}" if c.number else None,
        "patientId": c.patient_id,
        "patientName": p.name if p else "Deleted patient",
        "doctorId": c.derm_id,
        "doctorName": d.user.name if d else "Deleted doctor",
        "complaint": c.complaint,
        "summary": c.summary,
        "urgency": c.urgency,
        "flags": c.flags or [],
        "status": c.status,
        "channel": c.channel,
        "receivedAt": iso(c.received_at),
        "assessed": c.assessment is not None,
    }


@router.get("/cases")
def list_cases(status: str = "", urgency: str = "", q: str = "", limit: int = 50, offset: int = 0, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    if status and status not in CASE_STATUSES:
        raise ApiError(400, "bad_status", "Status must be waiting, replied or closed.")
    if urgency and urgency not in URGENCIES:
        raise ApiError(400, "bad_urgency", "Urgency must be mild, moderate or urgent.")
    limit, offset = page(limit, offset)
    query = select(Case)
    if status:
        query = query.where(Case.status == status)
    if urgency:
        query = query.where(Case.urgency == urgency)
    q = q.strip()
    if q:
        num = q.upper().removeprefix("DA-")
        patients = select(User.id).where(User.name.ilike(like(q), escape="\\"))
        conds = [Case.patient_id.in_(patients), Case.complaint.ilike(like(q), escape="\\")]
        if num.isdigit():
            conds.append(Case.number == int(num))
        query = query.where(or_(*conds))
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = db.scalars(query.order_by(Case.received_at.desc(), Case.id).limit(limit).offset(offset))
    return {"cases": [case_row(db, c) for c in rows], "total": total, "limit": limit, "offset": offset}


@router.get("/cases/{case_id}")
def case_one(case_id: str, request: Request, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    c = db.get(Case, case_id)
    if not c:
        raise not_found("That case")
    out = {**case_row(db, c), "ai": c.ai, "assessment": c.assessment, "photos": len(c.photos or []), "messages": []}
    t = db.get(Thread, c.thread_id) if c.thread_id else db.scalar(select(Thread).where(Thread.patient_id == c.patient_id, Thread.derm_id == c.derm_id))
    if t:
        out["messages"] = [{"id": m.id, "from": m.sender, "text": m.text, "at": iso(m.at), "hasPhoto": bool(m.attachment_key), "hasNote": bool(m.note)} for m in t.messages]
    # Reading a private conversation is itself recorded.
    log(db, user, "case.view", "case", c.id)
    db.commit()
    return out


class CaseStatusIn(In):
    status: str


@router.post("/cases/{case_id}/status")
def case_status(case_id: str, body: CaseStatusIn, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    c = db.get(Case, case_id)
    if not c:
        raise not_found("That case")
    if body.status not in CASE_STATUSES:
        raise ApiError(400, "bad_status", "Status must be waiting, replied or closed.")
    if body.status == c.status:
        raise ApiError(409, "unchanged", f"This case is already {c.status}.")
    old, c.status = c.status, body.status
    log(db, user, "case.status", "case", c.id, f"{old} → {body.status}")
    db.commit()
    return {"ok": True}


# ───────────── Scans ─────────────


def scan_row(s: Scan, owner: User | None) -> dict:
    """Scores only: photos live on the patient's phone and are never shown to admins."""
    return {
        "id": s.id,
        "userId": s.user_id,
        "patientName": owner.name if owner else "Patient",
        "date": iso(s.date),
        "score": s.score,
        "quality": s.quality,
        "confidence": s.confidence,
        "concerns": s.concerns,
    }


@router.get("/scans")
def list_scans(user_id: str = "", limit: int = 50, offset: int = 0, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    limit, offset = page(limit, offset)
    query = select(Scan)
    if user_id:
        query = query.where(Scan.user_id == user_id)
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = list(db.scalars(query.order_by(Scan.date.desc(), Scan.id).limit(limit).offset(offset)))
    owners = {u.id: u for u in db.scalars(select(User).where(User.id.in_({s.user_id for s in rows})))} if rows else {}
    return {"scans": [scan_row(s, owners.get(s.user_id)) for s in rows], "total": total, "limit": limit, "offset": offset}


@router.delete("/scans/{scan_id}")
def delete_scan(scan_id: str, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    s = db.get(Scan, scan_id)
    if not s:
        raise not_found("That scan")
    storage.delete(s.photo_key)
    for sh in db.scalars(select(Share).where(Share.patient_id == s.user_id)):
        if scan_id in (sh.scan_ids or []):
            sh.scan_ids = [x for x in sh.scan_ids if x != scan_id]
    db.delete(s)
    log(db, user, "scan.delete", "scan", scan_id)
    db.commit()
    return {"ok": True}


# ───────────── Announcements ─────────────


class BroadcastIn(In):
    audience: str
    title: str
    body: str = ""


@router.post("/broadcast")
def broadcast(body: BroadcastIn, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    roles = {"all": ("patient", "dermatologist"), "patients": ("patient",), "dermatologists": ("dermatologist",)}.get(body.audience)
    if not roles:
        raise ApiError(400, "bad_audience", "Send to all, patients or dermatologists.")
    if not 3 <= len(body.title) <= 120:
        raise ApiError(400, "bad_title", "Write a title of 3 to 120 characters.")
    if len(body.body) > 300:
        raise ApiError(400, "body_too_long", "Keep the message under 300 characters.")
    ids = list(db.scalars(select(User.id).where(User.role.in_(roles), User.suspended.is_(False))))
    for uid in ids:
        notify(db, uid, "campaign", body.title, body.body, "/notifications")
    log(db, user, "broadcast", "audience", body.audience, f"{body.title} → {len(ids)} people")
    db.commit()
    return {"ok": True, "sent": len(ids)}


# ───────────── Audit ─────────────


def log_dict(a: AdminLog) -> dict:
    return {"id": a.id, "adminName": a.admin_name, "action": a.action, "targetType": a.target_type, "targetId": a.target_id, "detail": a.detail, "at": iso(a.at)}


@router.get("/audit")
def audit(limit: int = Query(100), offset: int = 0, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    limit, offset = page(limit, offset)
    total = db.scalar(select(func.count()).select_from(AdminLog)) or 0
    rows = db.scalars(select(AdminLog).order_by(AdminLog.at.desc(), AdminLog.id).limit(limit).offset(offset))
    return {"entries": [log_dict(a) for a in rows], "total": total, "limit": limit, "offset": offset}
