import json
import re
from typing import Any

from fastapi import APIRouter, Depends, File, Request, UploadFile
from fastapi.responses import Response
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app import storage
from app.ai_rules import reply as ai_reply
from app.common import In, base_url, respond
from app.content import concern_order, routine_library
from app.db import get_db
from app.errors import ApiError, not_found
from app.models import AiMessage, Appointment, Dermatologist, Favorite, Notification, RoutineLog, Saved, Scan, Share, Thread, User
from app.security import current_user, normalise_email, patient_user, valid_email
from app.state import DEFAULT_PREFS, DEFAULT_SETTINGS, build_state, prefs_of, profile_of, settings_of
from app.timeutil import parse_clock
from app.uploads import read_upload, store

router = APIRouter(tags=["me"])

SKIN_TYPES = {"Oily", "Combination", "Dry", "Normal"}
PRODUCTS = {"Cleanser", "Moisturiser", "Sunscreen", "Serum or treatment"}


def bad(msg: str, code: str = "invalid") -> ApiError:
    return ApiError(400, code, msg)


def str_list(v: Any, field: str, max_items: int = 30, max_len: int = 40) -> list[str]:
    if not isinstance(v, list) or not all(isinstance(x, str) for x in v):
        raise bad(f"{field} must be a list of words.")
    out: list[str] = []
    for x in v:
        x = " ".join(x.split())
        if not x:
            continue
        if len(x) > max_len:
            raise bad(f"Keep each {field} item under {max_len} characters.")
        if x.lower() not in (y.lower() for y in out):
            out.append(x)
    if len(out) > max_items:
        raise bad(f"Up to {max_items} {field} items.")
    return out


def short_text(v: Any, field: str, max_len: int = 60, allow_none: bool = False) -> str | None:
    if v is None and allow_none:
        return None
    if not isinstance(v, str):
        raise bad(f"{field} must be text.")
    v = " ".join(v.split())
    if len(v) > max_len:
        raise bad(f"{field} is too long.")
    return v


def clean_profile(patch: dict) -> dict:
    out: dict = {}
    for k, v in patch.items():
        if k == "tone":
            if v is not None and (not isinstance(v, int) or isinstance(v, bool) or not 0 <= v <= 5):
                raise bad("Pick one of the six skin tones.")
            out[k] = v
        elif k == "feel":
            if v is not None and v not in SKIN_TYPES:
                raise bad("Pick oily, combination, dry or normal.")
            out[k] = v
        elif k == "concerns":
            vals = str_list(v, "concerns", 6)
            if any(x not in concern_order() for x in vals):
                raise bad("Unknown concern.")
            out[k] = vals
        elif k == "otherConcerns":
            out[k] = str_list(v, "concerns", 5)
        elif k == "avoid":
            out[k] = str_list(v, "avoid list", 30)
        elif k == "current":
            out[k] = short_text(v, "Current routine", 200, allow_none=True)
        elif k == "currentProducts":
            vals = str_list(v, "products", 6)
            if any(x not in PRODUCTS for x in vals):
                raise bad("Unknown product type.")
            out[k] = vals
        elif k == "done":
            if not isinstance(v, bool):
                raise bad("done must be true or false.")
            out[k] = v
        elif k == "phone":
            v = short_text(v, "Phone", 20) or ""
            if v and not re.fullmatch(r"\+?[\d\s\-()]{7,20}", v):
                raise bad("Enter a valid phone number, for example +92 300 1234567.")
            out[k] = v
        elif k in ("dob", "gender", "city"):
            out[k] = short_text(v, k.capitalize(), 40) or ""
        else:
            raise bad(f"Unknown field {k}.")
    if "dob" in out and out["dob"]:
        from app.state import age_from

        if age_from(out["dob"]) == 0 and not re.search(r"\d{4}", out["dob"]):
            raise bad("Enter your date of birth like 14 Mar 2001.")
    return out


def clean_settings(patch: dict) -> dict:
    out: dict = {}
    for k, v in patch.items():
        if k not in DEFAULT_SETTINGS:
            raise bad(f"Unknown setting {k}.")
        default = DEFAULT_SETTINGS[k]
        if isinstance(default, bool) and k not in ("rescanDue",):
            if not isinstance(v, bool):
                raise bad(f"{k} must be on or off.")
        elif k == "rescanDays":
            if not isinstance(v, int) or isinstance(v, bool) or not 3 <= v <= 60:
                raise bad("Rescan reminder must be 3 to 60 days.")
        elif k in ("quietFrom", "quietTo"):
            if not isinstance(v, str) or not re.fullmatch(r"\d{1,2}(:\d{2})?\s?(am|pm)", v.strip(), re.I):
                raise bad("Pick a time like 11 pm.")
        elif k == "language":
            if v not in ("English", "Urdu"):
                raise bad("Pick English or Urdu.")
        elif k == "photoRetention":
            if v not in ("3m", "1y", "always"):
                raise bad("Keep photos for 3 months, 1 year or always.")
        elif k == "rescanDue":
            if v is not None and (not isinstance(v, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", v)):
                raise bad("Bad date.")
        out[k] = v
    return out


def clean_prefs(patch: dict) -> dict:
    out: dict = {}
    ids = {s["id"] for s in routine_library()}
    for k, v in patch.items():
        if k in ("amTime", "pmTime"):
            if not isinstance(v, str) or parse_clock(v) is None:
                raise bad("Pick a time like 7:30 am.")
        elif k == "length":
            if v not in (2, 3, 4, 5):
                raise bad("A routine has 2 to 5 steps.")
        elif k == "budget":
            if v not in ("Low", "Medium", "Any"):
                raise bad("Budget is low, medium or any.")
        elif k == "rebuild":
            if not isinstance(v, bool):
                raise bad("rebuild must be on or off.")
        elif k == "removed":
            v = str_list(v, "removed steps", 20)
            if any(x not in ids and not x.startswith("rx-") for x in v):
                raise bad("Unknown routine step.")
        elif k == "paused":
            if not isinstance(v, dict) or any(not isinstance(x, str) for x in v.values()):
                raise bad("Bad paused steps.")
        elif k == "doctorSteps":
            raise bad("Only your dermatologist can add steps.")
        else:
            raise bad(f"Unknown preference {k}.")
        out[k] = v
    return out


@router.get("/me/state")
def get_state(request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return {"state": build_state(db, db.merge(user), base_url(request))}


class ConsentIn(In):
    adult: bool
    train: bool = False


@router.post("/me/consent")
def consent(body: ConsentIn, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not body.adult:
        raise bad("You need to confirm you're 18 or older, or have a parent's consent.", "consent_required")
    from app.timeutil import iso, utcnow

    user = db.merge(user)
    user.consent = {"adult": True, "train": body.train, "at": iso(utcnow()), "policy": "2026-11"}
    user.settings = {**settings_of(user), "train": body.train}
    return respond(db, user, request)


@router.patch("/me/profile")
def patch_profile(patch: dict, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    user = db.merge(user)
    user.profile = {**profile_of(user), **clean_profile(patch)}
    return respond(db, user, request)


class PersonalIn(In):
    name: str
    email: str
    phone: str = ""
    dob: str = ""
    gender: str = ""
    city: str = ""


@router.put("/me/personal")
def put_personal(body: PersonalIn, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    user = db.merge(user)
    name = " ".join(body.name.split())
    if not 2 <= len(name) <= 80:
        raise bad("Enter your full name.")
    if user.role == "dermatologist" and not re.match(r"^dr\.?\s", name, re.I):
        name = f"Dr. {name}"
    email = normalise_email(body.email)
    if not valid_email(email):
        raise bad("Enter a valid email address.", "bad_email")
    if email != user.email and db.scalar(select(User).where(User.email == email)):
        raise ApiError(409, "email_taken", "Another account already uses this email.")
    user.profile = {**profile_of(user), **clean_profile({"phone": body.phone, "dob": body.dob, "gender": body.gender, "city": body.city})}
    user.name, user.email = name, email
    return respond(db, user, request)


@router.post("/me/avatar")
async def put_avatar(request: Request, photo: UploadFile = File(...), user: User = Depends(current_user), db: Session = Depends(get_db)):
    data, ext = await read_upload(photo)
    user = db.merge(user)
    storage.delete(user.avatar_key)
    user.avatar_key = store("avatars", data, ext)
    return respond(db, user, request)


@router.delete("/me/avatar")
def delete_avatar(request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    user = db.merge(user)
    storage.delete(user.avatar_key)
    user.avatar_key = None
    return respond(db, user, request)


@router.patch("/me/settings")
def patch_settings(patch: dict, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    user = db.merge(user)
    clean = clean_settings(patch)
    user.settings = {**settings_of(user), **clean}
    if "train" in clean and user.consent:
        user.consent = {**user.consent, "train": clean["train"]}
    return respond(db, user, request)


@router.patch("/me/routine-prefs")
def patch_prefs(patch: dict, request: Request, user: User = Depends(patient_user), db: Session = Depends(get_db)):
    user = db.merge(user)
    user.routine_prefs = {**DEFAULT_PREFS, **prefs_of(user), **clean_prefs(patch)}
    return respond(db, user, request)


class ToggleStepIn(In):
    day: str
    step_id: str


@router.post("/me/routine/toggle")
def toggle_step(body: ToggleStepIn, request: Request, user: User = Depends(patient_user), db: Session = Depends(get_db)):
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", body.day):
        raise bad("Bad day.")
    if body.step_id not in {s["id"] for s in routine_library()}:
        raise not_found("That routine step")
    user = db.merge(user)
    row = db.get(RoutineLog, (user.id, body.day)) or RoutineLog(user_id=user.id, day=body.day, steps=[])
    steps = list(row.steps or [])
    row.steps = [x for x in steps if x != body.step_id] if body.step_id in steps else [*steps, body.step_id]
    db.add(row)
    return respond(db, user, request)


@router.post("/me/guide-seen")
def guide_seen(request: Request, user: User = Depends(patient_user), db: Session = Depends(get_db)):
    user = db.merge(user)
    user.guide_seen += 1
    return respond(db, user, request)


class SavedIn(In):
    kind: str
    title: str
    subtitle: str = ""
    icon: str = "bookmark"
    routine_step_id: str | None = None
    source: str = ""
    id: str | None = None


@router.post("/me/saved/toggle")
def toggle_saved(body: SavedIn, request: Request, user: User = Depends(patient_user), db: Session = Depends(get_db)):
    if body.kind not in ("ingredient", "tip", "doctor"):
        raise bad("Unknown kind.")
    if not body.title or len(body.title) > 200:
        raise bad("Saved items need a title.")
    user = db.merge(user)
    existing = db.scalar(select(Saved).where(Saved.user_id == user.id, Saved.title == body.title))
    if existing:
        db.delete(existing)
    else:
        db.add(
            Saved(
                user_id=user.id,
                kind=body.kind,
                title=body.title,
                subtitle=body.subtitle[:300],
                icon=body.icon[:60],
                routine_step_id=body.routine_step_id,
                source=body.source[:60],
            )
        )
    return respond(db, user, request)


@router.post("/me/favorites/{derm_id}/toggle")
def toggle_favorite(derm_id: str, request: Request, user: User = Depends(patient_user), db: Session = Depends(get_db)):
    d = db.get(Dermatologist, derm_id)
    if not d or d.status != "approved":
        raise not_found("That doctor")
    user = db.merge(user)
    fav = db.get(Favorite, (user.id, derm_id))
    if fav:
        db.delete(fav)
    else:
        db.add(Favorite(user_id=user.id, derm_id=derm_id))
    return respond(db, user, request)


@router.post("/me/notifications/{nid}/read")
def read_notification(nid: str, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    n = db.get(Notification, nid)
    if not n or n.user_id != user.id:
        raise not_found("That notification")
    n.read = True
    return respond(db, db.merge(user), request)


@router.post("/me/notifications/read-all")
def read_all(request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.execute(update(Notification).where(Notification.user_id == user.id).values(read=True))
    return respond(db, db.merge(user), request)


@router.delete("/me/shares/{derm_id}")
def stop_sharing(derm_id: str, request: Request, user: User = Depends(patient_user), db: Session = Depends(get_db)):
    share = db.scalar(select(Share).where(Share.patient_id == user.id, Share.derm_id == derm_id))
    if not share:
        raise not_found("That share")
    db.delete(share)
    db.flush()
    from app.routers.scans import drop_unshared_photos

    drop_unshared_photos(db, user.id)
    return respond(db, db.merge(user), request)


class ChatIn(In):
    text: str


@router.post("/ai/chat")
def ai_chat(body: ChatIn, request: Request, user: User = Depends(patient_user), db: Session = Depends(get_db)):
    text = body.text.strip()
    if not text:
        raise bad("Type a question first.")
    if len(text) > 1000:
        raise bad("Keep your question under 1,000 characters.")
    user = db.merge(user)
    latest = db.scalar(select(Scan).where(Scan.user_id == user.id).order_by(Scan.date.desc()))
    scan = None
    day = None
    if latest:
        from app.timeutil import local

        scan = {"score": latest.score, "concerns": latest.concerns, "where": latest.where}
        ld = local(latest.date)
        day = f"{ld.day} {ld.strftime('%b')}"
    from datetime import timedelta

    from app.timeutil import utcnow

    t = utcnow()
    db.add(AiMessage(user_id=user.id, sender="patient", text=text, at=t))
    answer, referral = ai_reply(text, scan, profile_of(user), day)
    suggest = suggest_slot(db, user) if referral else None
    db.add(AiMessage(user_id=user.id, sender="ai", text=answer, referral=referral, suggest=suggest, at=t + timedelta(milliseconds=1)))
    return respond(db, user, request)


def suggest_slot(db: Session, user: User) -> dict | None:
    """For a red-flag reply: the patient's own doctor's next free slot, else the best-rated verified
    doctor's, so the referral ends with something bookable (E2)."""
    from app.slots import first_free

    candidates: list[Dermatologist] = []
    for t in db.scalars(select(Thread).where(Thread.patient_id == user.id).order_by(Thread.created_at.desc())):
        d = db.get(Dermatologist, t.derm_id)
        if d and d.status == "approved" and d not in candidates:
            candidates.append(d)
    city = (profile_of(user).get("city") or "").lower()
    others = list(db.scalars(select(Dermatologist).where(Dermatologist.status == "approved").order_by(Dermatologist.rating.desc())))
    others.sort(key=lambda d: (d.city.lower() != city, -d.rating))
    candidates += [d for d in others if d not in candidates]
    for d in candidates:
        slot = first_free(db, d, ("video", "clinic"))
        if slot:
            return {"doctorId": d.id, "doctorName": d.user.name, "start": slot["iso"], "service": slot["service"]}
    return None


@router.delete("/ai/chat")
def clear_chat(request: Request, user: User = Depends(patient_user), db: Session = Depends(get_db)):
    db.execute(AiMessage.__table__.delete().where(AiMessage.user_id == user.id))
    return respond(db, db.merge(user), request)


@router.get("/me/export")
def export(request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Everything we hold about the person, as one JSON file (FR-10). Photo links expire in 24 hours."""
    state = build_state(db, db.merge(user), base_url(request))
    for k in ("doctors", "pendingRole", "version"):
        state.pop(k, None)
    if user.role != "dermatologist":
        state.pop("derm", None)
    body = json.dumps({"exportedBy": "DermAI", "account": state}, indent=2)
    return Response(body, media_type="application/json", headers={"Content-Disposition": 'attachment; filename="dermai-export.json"'})


__all__ = ["router", "Appointment", "Thread"]
