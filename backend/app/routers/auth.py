import logging
import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app import storage
from app.common import In, respond
from app.config import get_settings
from app.db import get_db
from app.errors import ApiError
from app.models import Appointment, Case, Dermatologist, Message, PasswordReset, RefreshToken, Scan, ScanUpload, Thread, User
from app.security import (
    check_password,
    current_user,
    hash_password,
    make_access_token,
    new_refresh_secret,
    normalise_email,
    password_problem,
    sha,
    valid_email,
)
from app.state import DEFAULT_PREFS, DEFAULT_PROFILE, DEFAULT_SETTINGS
from app.timeutil import utcnow

router = APIRouter(prefix="/auth", tags=["auth"])
log = logging.getLogger("dermai.auth")


class RegisterIn(In):
    role: str
    name: str
    email: str
    password: str


class LoginIn(In):
    email: str
    password: str


class RefreshIn(In):
    refresh_token: str


class ForgotIn(In):
    email: str


class ResetIn(In):
    email: str
    code: str
    password: str


class ChangePasswordIn(In):
    current: str
    password: str


class DeleteIn(In):
    password: str


def issue_tokens(db: Session, user: User) -> dict:
    secret = new_refresh_secret()
    db.add(RefreshToken(user_id=user.id, token_hash=sha(secret), expires_at=utcnow() + timedelta(days=get_settings().refresh_days)))
    return {"accessToken": make_access_token(user), "refreshToken": secret}


def doctor_name(name: str) -> str:
    import re

    return name if re.match(r"^dr\.?\s", name, re.I) else f"Dr. {name}"


@router.post("/register")
def register(body: RegisterIn, request: Request, db: Session = Depends(get_db)):
    if body.role not in ("patient", "dermatologist"):
        raise ApiError(400, "bad_role", "Choose patient or dermatologist.")
    name = " ".join(body.name.split())
    if len(name) < 2 or len(name) > 80:
        raise ApiError(400, "bad_name", "Enter your full name.")
    email = normalise_email(body.email)
    if not valid_email(email):
        raise ApiError(400, "bad_email", "Enter a valid email address.")
    problem = password_problem(body.password)
    if problem:
        raise ApiError(400, "weak_password", problem)
    if db.scalar(select(User).where(User.email == email)):
        raise ApiError(409, "email_taken", "An account with this email already exists. Log in instead.")
    user = User(
        role=body.role,
        name=doctor_name(name) if body.role == "dermatologist" else name,
        email=email,
        password_hash=hash_password(body.password),
        profile=dict(DEFAULT_PROFILE),
        settings=dict(DEFAULT_SETTINGS),
        routine_prefs=dict(DEFAULT_PREFS),
    )
    db.add(user)
    db.flush()
    if body.role == "dermatologist":
        from app.content import default_availability
        from app.state import DEFAULT_SERVICES

        db.add(Dermatologist(user_id=user.id, services=DEFAULT_SERVICES, availability=default_availability()))
        db.flush()
        db.refresh(user)
    tokens = issue_tokens(db, user)
    return respond(db, user, request, **tokens)


@router.post("/login")
def login(body: LoginIn, request: Request, db: Session = Depends(get_db)):
    email = normalise_email(body.email)
    if not email or not body.password:
        raise ApiError(400, "missing_fields", "Enter your email and password.")
    user = db.scalar(select(User).where(User.email == email))
    if not user or not check_password(body.password, user.password_hash):
        raise ApiError(401, "bad_credentials", "That email and password don't match.")
    if user.suspended:
        raise ApiError(403, "account_suspended", "This account has been suspended. Contact DermAI support.")
    user.last_login_at = utcnow()
    tokens = issue_tokens(db, user)
    return respond(db, user, request, **tokens)


@router.post("/refresh")
def refresh(body: RefreshIn, db: Session = Depends(get_db)):
    row = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == sha(body.refresh_token)))
    if not row or row.revoked or row.expires_at < utcnow():
        raise ApiError(401, "bad_refresh", "Your session ended. Please sign in again.")
    user = db.get(User, row.user_id)
    if not user or user.suspended:
        raise ApiError(401, "bad_refresh", "Your session ended. Please sign in again.")
    row.revoked = True
    tokens = issue_tokens(db, user)
    db.commit()
    return tokens


@router.post("/logout")
def logout(body: RefreshIn, db: Session = Depends(get_db)):
    db.execute(update(RefreshToken).where(RefreshToken.token_hash == sha(body.refresh_token)).values(revoked=True))
    db.commit()
    return {"ok": True}


@router.post("/forgot")
def forgot(body: ForgotIn, db: Session = Depends(get_db)):
    """Always answers the same way so it can't be used to find out who has an account."""
    email = normalise_email(body.email)
    if not valid_email(email):
        raise ApiError(400, "bad_email", "Enter a valid email address.")
    out: dict = {"ok": True}
    user = db.scalar(select(User).where(User.email == email))
    if user:
        db.execute(update(PasswordReset).where(PasswordReset.user_id == user.id, PasswordReset.used.is_(False)).values(used=True))
        code = f"{secrets.randbelow(1_000_000):06d}"
        db.add(PasswordReset(user_id=user.id, code_hash=sha(f"{user.id}:{code}"), expires_at=utcnow() + timedelta(minutes=15)))
        db.commit()
        # TODO(next): send by email (SMTP) instead of logging; see docs/NEXT.md.
        log.warning("Password reset code for %s: %s (valid 15 min)", email, code)
        if get_settings().dev_mode:
            out["devCode"] = code
    return out


@router.post("/reset")
def reset(body: ResetIn, db: Session = Depends(get_db)):
    email = normalise_email(body.email)
    user = db.scalar(select(User).where(User.email == email))
    bad = ApiError(400, "bad_code", "That code is wrong or has expired. Request a new one.")
    if not user:
        raise bad
    row = db.scalar(
        select(PasswordReset).where(PasswordReset.user_id == user.id, PasswordReset.used.is_(False)).order_by(PasswordReset.expires_at.desc())
    )
    if not row or row.expires_at < utcnow() or row.attempts >= 5:
        raise bad
    if row.code_hash != sha(f"{user.id}:{body.code.strip()}"):
        row.attempts += 1
        db.commit()
        raise bad
    problem = password_problem(body.password)
    if problem:
        raise ApiError(400, "weak_password", problem)
    row.used = True
    user.password_hash = hash_password(body.password)
    user.token_version += 1
    db.execute(update(RefreshToken).where(RefreshToken.user_id == user.id).values(revoked=True))
    db.commit()
    return {"ok": True}


@router.post("/change-password")
def change_password(body: ChangePasswordIn, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not check_password(body.current, user.password_hash):
        raise ApiError(400, "bad_password", "Your current password is wrong.")
    problem = password_problem(body.password)
    if problem:
        raise ApiError(400, "weak_password", problem)
    if body.current == body.password:
        raise ApiError(400, "same_password", "Choose a password you haven't used here.")
    user = db.merge(user)
    user.password_hash = hash_password(body.password)
    user.token_version += 1
    db.execute(update(RefreshToken).where(RefreshToken.user_id == user.id).values(revoked=True))
    db.flush()
    tokens = issue_tokens(db, user)
    return respond(db, user, request, **tokens)


def delete_user_files(db: Session, user: User) -> None:
    keys = [user.avatar_key]
    keys += [s.photo_key for s in db.scalars(select(Scan).where(Scan.user_id == user.id))]
    keys += [u.photo_key for u in db.scalars(select(ScanUpload).where(ScanUpload.user_id == user.id))]
    thread_q = select(Thread.id).where(Thread.patient_id == user.id)
    if user.derm:
        keys += [user.derm.certificate_key, user.derm.cnic_key, user.derm.degree_key]
        thread_q = select(Thread.id).where((Thread.patient_id == user.id) | (Thread.derm_id == user.derm.id))
    keys += [m.attachment_key for m in db.scalars(select(Message).where(Message.thread_id.in_(thread_q)))]
    for k in keys:
        storage.delete(k)


@router.delete("/account")
def delete_account(body: DeleteIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    user = db.merge(user)
    if not check_password(body.password, user.password_hash):
        raise ApiError(400, "bad_password", "That password is wrong.")
    remove_user(db, user)
    db.commit()
    return {"ok": True}


def remove_user(db: Session, user: User) -> None:
    """Deletes the account with its files; a doctor's patients with upcoming visits are told."""
    delete_user_files(db, user)
    if user.derm:
        # Their bookings, threads and cases go with the account; tell patients with upcoming visits.
        from app.common import notify

        upcoming = db.scalars(select(Appointment).where(Appointment.derm_id == user.derm.id, Appointment.status == "upcoming"))
        for pid in {a.patient_id for a in upcoming}:
            notify(db, pid, "event-busy", f"{user.name} left DermAI", "Your upcoming visit was cancelled. You won't be charged.", "/appointments")
        db.execute(Case.__table__.delete().where(Case.derm_id == user.derm.id))
    db.delete(user)
