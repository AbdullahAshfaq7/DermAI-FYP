"""Database tables. Per-user preference documents (profile, settings, routine prefs) are JSON columns;
everything shared between people (scans, bookings, threads, cases) is its own table."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:12]}"


def now() -> datetime:
    return datetime.now(timezone.utc)


TS = DateTime(timezone=True)


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("u"))
    role: Mapped[str] = mapped_column(String(20))  # patient | dermatologist | admin
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(100))
    token_version: Mapped[int] = mapped_column(Integer, default=0)
    demo: Mapped[bool] = mapped_column(Boolean, default=False)
    avatar_key: Mapped[str | None] = mapped_column(String(200), nullable=True)
    guide_seen: Mapped[int] = mapped_column(Integer, default=0)
    consent: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    profile: Mapped[dict] = mapped_column(JSON, default=dict)
    settings: Mapped[dict] = mapped_column(JSON, default=dict)
    routine_prefs: Mapped[dict] = mapped_column(JSON, default=dict)
    # Set by an admin: a suspended account can't sign in and its tokens stop working.
    suspended: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))
    suspended_reason: Mapped[str] = mapped_column(String(300), default="", server_default="")
    last_login_at: Mapped[datetime | None] = mapped_column(TS, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TS, default=now)

    derm: Mapped["Dermatologist | None"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("rt"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expires_at: Mapped[datetime] = mapped_column(TS)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)


class PasswordReset(Base):
    __tablename__ = "password_resets"
    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("pr"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    code_hash: Mapped[str] = mapped_column(String(64))
    expires_at: Mapped[datetime] = mapped_column(TS)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    used: Mapped[bool] = mapped_column(Boolean, default=False)


class RoutineLog(Base):
    __tablename__ = "routine_log"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    day: Mapped[str] = mapped_column(String(10), primary_key=True)  # YYYY-MM-DD, the device's local day
    steps: Mapped[list] = mapped_column(JSON, default=list)


class Scan(Base):
    __tablename__ = "scans"
    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("scan"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    date: Mapped[datetime] = mapped_column(TS, default=now)
    score: Mapped[int] = mapped_column(Integer)
    concerns: Mapped[dict] = mapped_column(JSON)
    zones: Mapped[dict] = mapped_column(JSON)
    where: Mapped[dict] = mapped_column(JSON)
    quality: Mapped[str] = mapped_column(String(10))
    confidence: Mapped[int] = mapped_column(Integer, default=80)
    photo_key: Mapped[str | None] = mapped_column(String(200), nullable=True)
    photo_tone: Mapped[int] = mapped_column(Integer, default=2)


class ScanUpload(Base):
    """A photo that passed (or failed) the quality checks and is waiting to be analysed."""

    __tablename__ = "scan_uploads"
    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("up"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    photo_key: Mapped[str] = mapped_column(String(200))
    checks: Mapped[list] = mapped_column(JSON)
    usable: Mapped[bool] = mapped_column(Boolean)
    dim: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(TS, default=now)


class Saved(Base):
    __tablename__ = "saved"
    __table_args__ = (UniqueConstraint("user_id", "title"),)
    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("sv"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(20))
    title: Mapped[str] = mapped_column(String(200))
    subtitle: Mapped[str] = mapped_column(String(300), default="")
    icon: Mapped[str] = mapped_column(String(60), default="bookmark")
    routine_step_id: Mapped[str | None] = mapped_column(String(60), nullable=True)
    source: Mapped[str] = mapped_column(String(60), default="")
    created_at: Mapped[datetime] = mapped_column(TS, default=now)


class Favorite(Base):
    __tablename__ = "favorites"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    derm_id: Mapped[str] = mapped_column(ForeignKey("dermatologists.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(TS, default=now)


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("n"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    icon: Mapped[str] = mapped_column(String(60))
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text, default="")
    href: Mapped[str] = mapped_column(String(200))
    at: Mapped[datetime] = mapped_column(TS, default=now)
    read: Mapped[bool] = mapped_column(Boolean, default=False)


class AiMessage(Base):
    __tablename__ = "ai_messages"
    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("m"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    sender: Mapped[str] = mapped_column(String(10))  # patient | ai
    text: Mapped[str] = mapped_column(Text)
    referral: Mapped[bool] = mapped_column(Boolean, default=False)
    # A real open slot offered with a red-flag referral: {doctorId, doctorName, start, service}
    suggest: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    at: Mapped[datetime] = mapped_column(TS, default=now)


class Dermatologist(Base):
    __tablename__ = "dermatologists"
    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("dr"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    step: Mapped[str] = mapped_column(String(20), default="profile")  # profile | credentials | services | done
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft | pending | approved | rejected
    review_note: Mapped[str] = mapped_column(Text, default="")
    specialties: Mapped[list] = mapped_column(JSON, default=list)
    pmdc: Mapped[str] = mapped_column(String(20), default="")
    qualification: Mapped[str] = mapped_column(String(200), default="")
    clinic: Mapped[str] = mapped_column(String(200), default="")
    city: Mapped[str] = mapped_column(String(80), default="")
    bio: Mapped[str] = mapped_column(Text, default="")
    focus: Mapped[str] = mapped_column(String(200), default="")
    years: Mapped[int] = mapped_column(Integer, default=0)
    practising_since: Mapped[int | None] = mapped_column(Integer, nullable=True)
    languages: Mapped[list] = mapped_column(JSON, default=list)
    female: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    tone: Mapped[int] = mapped_column(Integer, default=2)
    certificate_key: Mapped[str | None] = mapped_column(String(200), nullable=True)
    certificate_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    cnic_key: Mapped[str | None] = mapped_column(String(200), nullable=True)
    cnic_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    degree_key: Mapped[str | None] = mapped_column(String(200), nullable=True)
    degree_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    services: Mapped[dict] = mapped_column(JSON, default=dict)
    availability: Mapped[dict] = mapped_column(JSON, default=dict)
    rating: Mapped[float] = mapped_column(Float, default=0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    submitted_at: Mapped[datetime | None] = mapped_column(TS, nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(TS, nullable=True)

    user: Mapped[User] = relationship(back_populates="derm")


class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = (
        # Backstop against double booking: one live visit per doctor per start time.
        Index("uq_live_slot", "derm_id", "start", unique=True, postgresql_where=text("status = 'upcoming' AND service <> 'message'")),
    )
    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("appt"))
    patient_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    derm_id: Mapped[str] = mapped_column(ForeignKey("dermatologists.id", ondelete="CASCADE"), index=True)
    case_id: Mapped[str | None] = mapped_column(String(40), nullable=True)
    service: Mapped[str] = mapped_column(String(10))
    start: Mapped[datetime] = mapped_column(TS)
    minutes: Mapped[int] = mapped_column(Integer)
    reason: Mapped[str] = mapped_column(Text, default="")
    shared_scan_ids: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(12), default="upcoming")  # upcoming | done | cancelled
    fee: Mapped[int] = mapped_column(Integer)
    payment_method: Mapped[str] = mapped_column(String(20), default="pay_at_visit")
    payment_status: Mapped[str] = mapped_column(String(20), default="unpaid")
    cancelled_by: Mapped[str | None] = mapped_column(String(12), nullable=True)
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TS, default=now)


class Share(Base):
    __tablename__ = "shares"
    __table_args__ = (UniqueConstraint("patient_id", "derm_id"),)
    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("sh"))
    patient_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    derm_id: Mapped[str] = mapped_column(ForeignKey("dermatologists.id", ondelete="CASCADE"))
    scan_ids: Mapped[list] = mapped_column(JSON, default=list)
    until: Mapped[datetime] = mapped_column(TS)


class Thread(Base):
    __tablename__ = "threads"
    __table_args__ = (UniqueConstraint("patient_id", "derm_id"),)
    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("thread"))
    patient_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    derm_id: Mapped[str] = mapped_column(ForeignKey("dermatologists.id", ondelete="CASCADE"), index=True)
    case_title: Mapped[str] = mapped_column(String(200), default="New case")
    unread_for_patient: Mapped[int] = mapped_column(Integer, default=0)
    unread_for_doctor: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(TS, default=now)

    messages: Mapped[list["Message"]] = relationship(order_by="Message.at", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"
    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("m"))
    thread_id: Mapped[str] = mapped_column(ForeignKey("threads.id", ondelete="CASCADE"), index=True)
    sender: Mapped[str] = mapped_column(String(10))  # patient | doctor
    text: Mapped[str] = mapped_column(Text, default="")
    note: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    attachment_key: Mapped[str | None] = mapped_column(String(200), nullable=True)
    at: Mapped[datetime] = mapped_column(TS, default=now)


class Case(Base):
    __tablename__ = "cases"
    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("case"))
    # Human-readable case number shown as DA-2041.
    number: Mapped[int] = mapped_column(Integer, default=0)
    derm_id: Mapped[str] = mapped_column(ForeignKey("dermatologists.id", ondelete="CASCADE"), index=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    thread_id: Mapped[str | None] = mapped_column(String(40), nullable=True)
    complaint: Mapped[str] = mapped_column(Text, default="")
    summary: Mapped[str] = mapped_column(String(300), default="")
    urgency: Mapped[str] = mapped_column(String(10), default="mild")
    # Why the case was flagged, shown in the doctor's inbox ("changed shape", "fever reported").
    flags: Mapped[list] = mapped_column(JSON, default=list)
    received_at: Mapped[datetime] = mapped_column(TS, default=now)
    status: Mapped[str] = mapped_column(String(10), default="waiting")  # waiting | replied | closed
    channel: Mapped[str] = mapped_column(String(10), default="message")
    photos: Mapped[list] = mapped_column(JSON, default=list)  # [{date, tone, scanId?}]
    ai: Mapped[dict] = mapped_column(JSON, default=dict)
    draft: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    assessment: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class Blocked(Base):
    __tablename__ = "blocked_time"
    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("blk"))
    derm_id: Mapped[str] = mapped_column(ForeignKey("dermatologists.id", ondelete="CASCADE"), index=True)
    start: Mapped[datetime] = mapped_column(TS)
    minutes: Mapped[int] = mapped_column(Integer)
    label: Mapped[str] = mapped_column(String(200), default="Blocked")


class AiLabel(Base):
    """A doctor's verdict on an AI reading, kept for retraining only when the patient opted in (FR-29)."""

    __tablename__ = "ai_labels"
    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("lbl"))
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"))
    patient_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    scan_id: Mapped[str | None] = mapped_column(String(40), nullable=True)
    rating: Mapped[str] = mapped_column(String(10))
    findings: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(TS, default=now)


class AdminLog(Base):
    """Every change an admin makes, and every time an admin opens private case messages."""

    __tablename__ = "admin_log"
    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("log"))
    # Kept when the admin account is removed, so the trail survives.
    admin_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    admin_name: Mapped[str] = mapped_column(String(120), default="")
    action: Mapped[str] = mapped_column(String(60))
    target_type: Mapped[str] = mapped_column(String(30), default="")
    target_id: Mapped[str] = mapped_column(String(40), default="")
    detail: Mapped[str] = mapped_column(Text, default="")
    at: Mapped[datetime] = mapped_column(TS, default=now, index=True)
