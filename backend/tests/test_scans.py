import io
from datetime import timedelta

from PIL import Image

from app.analysis.heuristic import HeuristicAnalyzer
from app.db import session
from app.models import ScanUpload
from app.routers.scans import purge_photos
from app.timeutil import utcnow
from tests.conftest import blank, blurry, dark, face_bytes, register


def check(api, data: bytes, name="face.jpg", ctype="image/jpeg", expect=200):
    return api.post("/scans/check", expect, files={"photo": (name, data, ctype)})


def test_full_scan_flow(client, ayesha):
    before = len(ayesha.state["scans"])
    up = check(ayesha, face_bytes())
    assert {c["key"] for c in up["checks"]} == {"face", "focus", "light"}
    j = ayesha.post("/scans", json={"uploadId": up["uploadId"]})
    s = ayesha.state["scans"][0]
    assert j["scanId"] == s["id"] and len(ayesha.state["scans"]) == before + 1
    assert set(s["concerns"]) == {"acne", "dryness", "redness", "darkSpots", "sensitivity", "pores"}
    assert set(s["zones"]) == {"forehead", "nose", "leftCheek", "rightCheek", "chin"}
    assert all(0 <= c["pct"] <= 100 and c["level"] in ("Clear", "Mild", "Moderate", "High") for c in s["concerns"].values())
    # Phone-first: the server keeps the scores, not the photo.
    assert 20 <= s["score"] <= 98 and s["photoUri"] is None
    from app import storage

    assert not list(storage.root().rglob("scans/*"))
    assert ayesha.state["notifications"][0]["href"] == f"/scan/results/{s['id']}"
    # An upload can only be analysed once.
    ayesha.post("/scans", 404, json={"uploadId": up["uploadId"]})


def test_analysis_is_deterministic():
    a = HeuristicAnalyzer()
    data = face_bytes()
    r1, r2 = a.analyse(data, False), a.analyse(data, False)
    assert r1 == r2


def test_bad_photos_rejected_with_reason(client, ayesha):
    for t, word in ((dark, "dark"), (blurry, "blurry"), (blank, "face")):
        r = check(ayesha, face_bytes(t), expect=422)
        assert r["error"]["code"] == "photo_unusable" and word in r["error"]["message"].lower()
        assert any(not c["ok"] for c in r["error"]["checks"])
    with session() as db:
        assert db.query(ScanUpload).count() == 0


def test_file_validation(client, ayesha):
    assert check(ayesha, b"%PDF-1.4 hello", "x.pdf", "application/pdf", 415)["error"]["code"] == "file_type"
    assert check(ayesha, b"hello world", "x.jpg", "image/jpeg", 415)["error"]["code"] == "file_type"
    assert check(ayesha, b"", "x.jpg", "image/jpeg", 400)["error"]["code"] == "file_empty"
    tiny = io.BytesIO()
    Image.new("RGB", (120, 160), (200, 160, 140)).save(tiny, "JPEG")
    r = check(ayesha, tiny.getvalue(), expect=422)
    assert "too small" in r["error"]["message"]
    big = b"\xff\xd8\xff" + b"0" * (11 * 1024 * 1024)
    assert check(ayesha, big, expect=413)["error"]["code"] == "file_too_large"
    # A corrupt JPEG header with junk body is unreadable, not a crash.
    assert check(ayesha, b"\xff\xd8\xff" + b"junk" * 100, expect=422)["error"]["code"] == "photo_unusable"


def test_png_and_rotated_photo_work(client, ayesha):
    im = Image.open(io.BytesIO(face_bytes())).rotate(0)
    b = io.BytesIO()
    im.save(b, "PNG")
    up = check(ayesha, b.getvalue(), "face.png", "image/png")
    ayesha.post("/scans", json={"uploadId": up["uploadId"]})


def test_cannot_analyse_someone_elses_upload(client, ayesha):
    other = register(client)
    other.post("/me/consent", json={"adult": True})
    up = check(other, face_bytes())
    ayesha.post("/scans", 404, json={"uploadId": up["uploadId"]})


def test_expired_upload(client, ayesha):
    up = check(ayesha, face_bytes())
    with session() as db:
        db.get(ScanUpload, up["uploadId"]).created_at = utcnow() - timedelta(hours=2)
        db.commit()
    ayesha.post("/scans", 410, json={"uploadId": up["uploadId"]})


def test_delete_scan_cleans_shares_and_bookings(client, ayesha, sana):
    ayesha.delete("/scans/scan-1102")
    assert all(s["id"] != "scan-1102" for s in ayesha.state["scans"])
    assert "scan-1102" not in ayesha.state["shares"][0]["scanIds"]
    appt = next(a for a in ayesha.state["appointments"] if a["id"] == "appt-1")
    assert "scan-1102" not in appt["sharedScanIds"]
    ayesha.delete("/scans/scan-1102", 404)
    sana.delete("/scans/scan-1029", 403)
    ayesha.delete("/scans/does-not-exist", 404)


def share_scan(api, scan_id):
    api.post("/appointments", json={"doctorId": "dr-sana", "service": "message", "reason": "Please look", "shareScanIds": [scan_id]})
    return api.post(f"/scans/{scan_id}/photo", files={"photo": ("p.jpg", face_bytes(), "image/jpeg")})


def test_photo_uploaded_only_when_shared(client, ayesha, sana):
    sid = ayesha.scan()
    ayesha.post(f"/scans/{sid}/photo", 409, files={"photo": ("p.jpg", face_bytes(), "image/jpeg")})
    share_scan(ayesha, sid)
    scan = next(s for s in ayesha.state["scans"] if s["id"] == sid)
    assert scan["photoUri"].startswith("http")
    sana.get("/me/state")
    case = next(c for c in sana.state["derm"]["cases"] if c["id"] == "case-ayesha")
    assert any(p.get("uri") for p in case["photos"])
    other = register(client)
    other.post(f"/scans/{sid}/photo", 404, files={"photo": ("p.jpg", face_bytes(), "image/jpeg")})
    # Stopping the share deletes the server copy.
    ayesha.delete("/me/shares/dr-sana")
    assert next(s for s in ayesha.state["scans"] if s["id"] == sid)["photoUri"] is None


def test_signed_photo_links(client, ayesha):
    sid = ayesha.scan()
    share_scan(ayesha, sid)
    url = next(s for s in ayesha.state["scans"] if s["id"] == sid)["photoUri"].replace("http://testserver", "")
    assert client.get(url).status_code == 200
    assert client.get(url.split("?")[0]).status_code == 403
    assert client.get(url[:-2] + "00").status_code == 403
    assert client.get("/files/../../etc/passwd?exp=9999999999&sig=x").status_code in (403, 404)


def test_shared_photo_purged_when_share_expires(client, ayesha):
    from app.models import Share

    sid = ayesha.scan()
    share_scan(ayesha, sid)
    with session() as db:
        assert purge_photos(db) == 0
        for sh in db.query(Share).all():
            sh.until = utcnow() - timedelta(minutes=1)
        db.commit()
        assert purge_photos(db) == 1
    ayesha.get("/me/state")
    assert next(s for s in ayesha.state["scans"] if s["id"] == sid)["photoUri"] is None


def test_live_precheck(client, ayesha):
    ok = ayesha.post("/scans/precheck", files={"photo": ("f.jpg", face_bytes(), "image/jpeg")})
    assert {c["key"] for c in ok["checks"]} == {"light", "steady", "framing"} and ok["ready"] is True
    dim = ayesha.post("/scans/precheck", files={"photo": ("f.jpg", face_bytes(dark), "image/jpeg")})
    assert dim["ready"] is False and "light" in dim["hint"].lower()
    far = ayesha.post("/scans/precheck", files={"photo": ("f.jpg", face_bytes(blank), "image/jpeg")})
    assert far["ready"] is False
