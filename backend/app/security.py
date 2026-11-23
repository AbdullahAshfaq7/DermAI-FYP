import hashlib
import hmac
import re
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.errors import ApiError
from app.models import Dermatologist, User

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")


def normalise_email(email: str) -> str:
    return email.strip().lower()


def valid_email(email: str) -> bool:
    return bool(EMAIL_RE.match(email)) and len(email) <= 254


def password_problem(pw: str) -> str | None:
    if len(pw) < 8:
        return "Use at least 8 characters."
    if not re.search(r"\d", pw):
        return "Add at least one number."
    if len(pw.encode()) > 72:
        return "Use 72 characters or fewer."
    return None


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt(rounds=10)).decode()


def check_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode()[:72], hashed.encode())
    except ValueError:
        return False


def sha(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()


def make_access_token(user: User) -> str:
    s = get_settings()
    exp = datetime.now(timezone.utc) + timedelta(minutes=s.access_minutes)
    return jwt.encode({"sub": user.id, "typ": "access", "tv": user.token_version, "exp": exp}, s.secret_key, algorithm="HS256")


def new_refresh_secret() -> str:
    return secrets.token_urlsafe(40)


def sign(value: str) -> str:
    return hmac.new(get_settings().secret_key.encode(), value.encode(), hashlib.sha256).hexdigest()[:32]


def current_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise ApiError(401, "not_signed_in", "Please sign in.")
    token = authorization.split(" ", 1)[1]
    try:
        claims = jwt.decode(token, get_settings().secret_key, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise ApiError(401, "token_expired", "Your session expired. Please sign in again.")
    except jwt.InvalidTokenError:
        raise ApiError(401, "bad_token", "Please sign in again.")
    if claims.get("typ") != "access":
        raise ApiError(401, "bad_token", "Please sign in again.")
    user = db.get(User, claims.get("sub"))
    if not user or user.token_version != claims.get("tv"):
        raise ApiError(401, "bad_token", "Please sign in again.")
    if user.suspended:
        raise ApiError(401, "account_suspended", "This account has been suspended. Contact DermAI support.")
    return user


def patient_user(user: User = Depends(current_user)) -> User:
    if user.role != "patient":
        raise ApiError(403, "patients_only", "This is only for patient accounts.")
    return user


def derm_user(user: User = Depends(current_user)) -> User:
    if user.role != "dermatologist" or not user.derm:
        raise ApiError(403, "doctors_only", "This is only for dermatologist accounts.")
    return user


def admin_user(user: User = Depends(current_user)) -> User:
    if user.role != "admin":
        raise ApiError(403, "admins_only", "Admins only.")
    return user


def derm_of(user: User) -> Dermatologist:
    assert user.derm is not None
    return user.derm
