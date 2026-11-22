from datetime import timedelta

from fastapi import APIRouter, Depends, File, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import storage
from app.analysis import get_analyzer
from app.common import In, notify, respond
from app.db import get_db
from app.errors import ApiError, not_found
from app.models import Appointment, Scan, ScanUpload, Share, User, new_id
from app.security import patient_user
from app.state import profile_of
from app.timeutil import iso, local, utcnow
from app.uploads import read_upload, store

router = APIRouter(prefix="/scans", tags=["scans"])


def need_consent(user: User) -> None:
    if not user.consent or not user.consent.get("adult"):
        raise ApiError(403, "consent_required", "Agree to photo processing before your first scan.")


@router.post("/precheck")
async def precheck(photo: UploadFile = File(...), user: User = Depends(patient_user)):
    """Live camera checks on a small preview frame. Nothing is stored. The camera captures once
    light, steadiness and framing all pass (C2)."""
    data, _ = await read_upload(photo)
    q = get_analyzer().check(data)
    by = {c.key: c for c in q.checks}
    m = q.metrics
    ratio = m.get("skinRatio", 0)
    light = by.get("light")
    light_ok = bool(light and (light.ok or light.note))
    steady = bool(by.get("focus") and by["focus"].ok)
    framing = bool(by.get("face") and by["face"].ok)
    if not by.get("face"):
        hint = "Point the camera at your face"
    elif not light_ok:
        hint = "Face a window or a brighter light"
    elif not framing:
        hint = "Move a little closer" if ratio < 0.3 else "Fit your face in the oval"
    elif not steady:
        hint = "Hold still"
    else:
        hint = "Hold still"
    return {
        "checks": [
            {"key": "light", "label": "Light", "ok": light_ok},
            {"key": "steady", "label": "Steady", "ok": steady},
            {"key": "framing", "label": "Framing" if framing else ("Move closer" if ratio < 0.3 else "Centre your face"), "ok": framing},
        ],
        "ready": light_ok and steady and framing,
        "hint": hint,
    }


@router.post("/check")
async def check(request: Request, photo: UploadFile = File(...), user: User = Depends(patient_user), db: Session = Depends(get_db)):
    """Quality checks before analysis (FR-3, FR-5). Unusable photos are rejected with a reason and not kept."""
    need_consent(user)
    data, ext = await read_upload(photo)
    q = get_analyzer().check(data)
    checks = [c.as_dict() for c in q.checks]
    if not q.usable:
        raise ApiError(422, "photo_unusable", q.reason or "We can't read this photo.", {"checks": checks})
    up = ScanUpload(user_id=user.id, photo_key=store("scans", data, ext), checks=checks, usable=True, dim=q.dim)
    db.add(up)
    db.commit()
    return {"uploadId": up.id, "checks": checks, "dim": q.dim, "photoUri": storage.url_for(up.photo_key, str(request.base_url))}


class AnalyseIn(In):
    upload_id: str


@router.post("")
def analyse(body: AnalyseIn, request: Request, user: User = Depends(patient_user), db: Session = Depends(get_db)):
    need_consent(user)
    up = db.get(ScanUpload, body.upload_id)
    if not up or up.user_id != user.id:
        raise not_found("That photo")
    if up.created_at < utcnow() - timedelta(hours=1):
        raise ApiError(410, "upload_expired", "That photo expired. Take a new one.")
    path = storage.path_for(up.photo_key)
    if not path:
        raise ApiError(410, "upload_expired", "That photo expired. Take a new one.")
    result = get_analyzer().analyse(path.read_bytes(), up.dim)
    user = db.merge(user)
    tone = profile_of(user).get("tone")
    scan = Scan(
        id=new_id("scan"),
        user_id=user.id,
        score=result.score,
        concerns=result.concerns,
        zones=result.zones,
        where=result.where,
        quality="dim" if up.dim else "good",
        confidence=result.confidence,
        photo_key=None,
        photo_tone=tone if isinstance(tone, int) else 2,
    )
    db.add(scan)
    # Phone-first: the photo stays on the phone. The server keeps only the scores and drops its copy now;
    # it gets the photo again only if the person shares this scan with a doctor.
    storage.delete(up.photo_key)
    db.delete(up)
    user.guide_seen += 1
    d = local(utcnow())
    notify(db, user.id, "insights", "Your results are ready", f"Scan from {d.day} {d.strftime('%b')} scored {scan.score}", f"/scan/results/{scan.id}")
    db.flush()
    return respond(db, user, request, scanId=scan.id)


@router.post("/{scan_id}/photo")
async def share_photo(scan_id: str, request: Request, photo: UploadFile = File(...), user: User = Depends(patient_user), db: Session = Depends(get_db)):
    """Upload the phone's copy of a scan photo so a doctor it is shared with can see it."""
    scan = db.get(Scan, scan_id)
    if not scan or scan.user_id != user.id:
        raise not_found("That scan")
    if not any(scan_id in sh.scan_ids for sh in db.scalars(select(Share).where(Share.patient_id == user.id, Share.until > utcnow()))):
        raise ApiError(409, "not_shared", "Share this scan with a doctor first.")
    data, ext = await read_upload(photo)
    storage.delete(scan.photo_key)
    scan.photo_key = store("shared", data, ext)
    return respond(db, db.merge(user), request)


def drop_unshared_photos(db, patient_id: str) -> None:
    """Delete server copies of photos no doctor can see any more."""
    shared = set()
    for sh in db.scalars(select(Share).where(Share.patient_id == patient_id, Share.until > utcnow())):
        shared.update(sh.scan_ids)
    for scan in db.scalars(select(Scan).where(Scan.user_id == patient_id, Scan.photo_key.is_not(None))):
        if scan.id not in shared:
            storage.delete(scan.photo_key)
            scan.photo_key = None


@router.delete("/{scan_id}")
def delete_scan(scan_id: str, request: Request, user: User = Depends(patient_user), db: Session = Depends(get_db)):
    scan = db.get(Scan, scan_id)
    if not scan or scan.user_id != user.id:
        raise not_found("That scan")
    storage.delete(scan.photo_key)
    for sh in db.scalars(select(Share).where(Share.patient_id == user.id)):
        if scan_id in sh.scan_ids:
            sh.scan_ids = [x for x in sh.scan_ids if x != scan_id]
    for a in db.scalars(select(Appointment).where(Appointment.patient_id == user.id)):
        if scan_id in (a.shared_scan_ids or []):
            a.shared_scan_ids = [x for x in a.shared_scan_ids if x != scan_id]
    db.delete(scan)
    return respond(db, db.merge(user), request)


def purge_photos(db) -> int:
    """Server copies of photos exist only while a doctor can see them (phone-first, FR-23).
    Drop copies whose share ended, and pending uploads nobody analysed."""
    n = 0
    for scan in db.scalars(select(Scan).where(Scan.photo_key.is_not(None))):
        active = db.scalars(select(Share).where(Share.patient_id == scan.user_id, Share.until > utcnow()))
        if not any(scan.id in sh.scan_ids for sh in active):
            storage.delete(scan.photo_key)
            scan.photo_key = None
            n += 1
    for up in db.scalars(select(ScanUpload).where(ScanUpload.created_at < utcnow() - timedelta(hours=2))):
        storage.delete(up.photo_key)
        db.delete(up)
    db.commit()
    return n


__all__ = ["router", "purge_photos", "iso"]
