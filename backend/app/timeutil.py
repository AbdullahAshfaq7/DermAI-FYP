from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from app.config import get_settings


def tz() -> ZoneInfo:
    return ZoneInfo(get_settings().timezone)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def local(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(tz())


def iso(dt: datetime | None) -> str | None:
    """ISO 8601 with the clinic's offset, e.g. 2026-11-16T16:30:00+05:00."""
    if dt is None:
        return None
    return local(dt).isoformat(timespec="seconds")


def parse_iso(s: str) -> datetime:
    dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=tz())
    return dt


def today_local() -> date:
    return utcnow().astimezone(tz()).date()


def parse_clock(s: str) -> int | None:
    """'2:00 pm' -> minutes after midnight."""
    import re

    m = re.match(r"^\s*(\d{1,2}):(\d{2})\s*(am|pm)\s*$", s or "", re.I)
    if not m:
        return None
    h, mi = int(m.group(1)), int(m.group(2))
    if not (1 <= h <= 12 and 0 <= mi < 60):
        return None
    h = h % 12 + (12 if m.group(3).lower() == "pm" else 0)
    return h * 60 + mi


def clock_label(minutes: int) -> str:
    h, m = divmod(minutes, 60)
    return f"{12 if h % 12 == 0 else h % 12}:{m:02d} {'am' if h < 12 else 'pm'}"
