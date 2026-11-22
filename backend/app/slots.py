"""Bookable slots from a doctor's real weekly hours, visit gap, minimum notice, time off,
booked visits and blocked time (PRD FR-20, FR-30)."""

from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Appointment, Blocked, Dermatologist
from app.timeutil import clock_label, parse_clock, today_local, tz, utcnow

DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
DURATION = {"video": 20, "clinic": 30, "message": 0}
STEP = 30


def busy_intervals(db: Session, derm_id: str, exclude_appt: str | None = None) -> list[tuple[datetime, datetime]]:
    out = []
    for a in db.scalars(select(Appointment).where(Appointment.derm_id == derm_id, Appointment.status == "upcoming", Appointment.service != "message")):
        if a.id != exclude_appt:
            out.append((a.start, a.start + timedelta(minutes=a.minutes)))
    for b in db.scalars(select(Blocked).where(Blocked.derm_id == derm_id)):
        out.append((b.start, b.start + timedelta(minutes=b.minutes)))
    return out


def on_time_off(avail: dict, d: date) -> bool:
    off = avail.get("timeOff")
    if not off:
        return False
    try:
        return date.fromisoformat(off["from"]) <= d <= date.fromisoformat(off["to"])
    except (KeyError, ValueError, TypeError):
        return False


def day_rule(avail: dict, d: date) -> dict | None:
    name = DAY_NAMES[d.weekday()]
    rule = next((x for x in avail.get("days", []) if x.get("day") == name), None)
    if not rule or not rule.get("open"):
        return None
    return rule


def slots_for(derm: Dermatologist, d: date, service: str, busy: list[tuple[datetime, datetime]], now: datetime | None = None) -> list[dict]:
    if service not in ("video", "clinic"):
        return []
    avail = derm.availability or {}
    rule = day_rule(avail, d)
    if not rule or on_time_off(avail, d):
        return []
    start, end = parse_clock(rule.get("from", "")), parse_clock(rule.get("to", ""))
    if start is None or end is None or end <= start:
        return []
    now = now or utcnow()
    earliest = now + timedelta(hours=int(avail.get("noticeHours", 0)))
    gap = timedelta(minutes=int(avail.get("gapMinutes", 0)))
    dur = timedelta(minutes=DURATION[service])
    out = []
    m = start
    while m + DURATION[service] <= end:
        t = datetime(d.year, d.month, d.day, m // 60, m % 60, tzinfo=tz())
        clash = any(t < e + gap and t + dur > s - gap for s, e in busy)
        out.append({"iso": t.isoformat(timespec="seconds"), "label": clock_label(m), "taken": t < earliest or clash})
        m += STEP
    return out


def is_bookable(derm: Dermatologist, start: datetime, service: str, busy) -> bool:
    d = start.astimezone(tz()).date()
    target = start.astimezone(tz()).isoformat(timespec="seconds")
    return any(s["iso"] == target and not s["taken"] for s in slots_for(derm, d, service, busy))


def first_free(db: Session, derm: Dermatologist, services: tuple[str, ...] = ("video", "clinic"), days: int = 14) -> dict | None:
    """The earliest open slot across the given visit types: {iso, label, service}."""
    offered = [k for k in services if (derm.services or {}).get(k, {}).get("on")]
    if not offered:
        return None
    busy = busy_intervals(db, derm.id)
    today = today_local()
    for i in range(days):
        d = today + timedelta(days=i)
        best = None
        for svc in offered:
            free = next((s for s in slots_for(derm, d, svc, busy) if not s["taken"]), None)
            if free and (best is None or free["iso"] < best["iso"]):
                best = {**free, "service": svc}
        if best:
            return best
    return None


def next_free(db: Session, derm: Dermatologist) -> str:
    services = [k for k in ("video", "clinic") if (derm.services or {}).get(k, {}).get("on")]
    if not services:
        return "Replies in 24 hrs" if (derm.services or {}).get("message", {}).get("on") else "Not taking bookings"
    busy = busy_intervals(db, derm.id)
    today = today_local()
    for i in range(14):
        d = today + timedelta(days=i)
        for svc in services:
            if any(not s["taken"] for s in slots_for(derm, d, svc, busy)):
                return "Free today" if i == 0 else "Free tomorrow" if i == 1 else f"Next: {DAY_NAMES[d.weekday()]}"
    return "Fully booked"


def validate_availability(a: dict) -> str | None:
    days = a.get("days")
    if not isinstance(days, list) or sorted(x.get("day") for x in days) != sorted(DAY_NAMES):
        return "Set hours for each day of the week."
    for x in days:
        if x.get("open"):
            f, t = parse_clock(x.get("from", "")), parse_clock(x.get("to", ""))
            if f is None or t is None:
                return f"Pick opening hours for {x['day']}."
            if t <= f:
                return f"{x['day']}: closing time must be after opening time."
    gap = a.get("gapMinutes")
    if not isinstance(gap, int) or not 0 <= gap <= 60:
        return "Gap between visits must be 0 to 60 minutes."
    notice = a.get("noticeHours")
    if not isinstance(notice, int) or not 0 <= notice <= 72:
        return "Minimum notice must be 0 to 72 hours."
    off = a.get("timeOff")
    if off is not None:
        try:
            f, t = date.fromisoformat(off["from"]), date.fromisoformat(off["to"])
        except (KeyError, ValueError, TypeError):
            return "Pick a start and end date for time off."
        if t < f:
            return "Time off must end on or after the day it starts."
    return None
