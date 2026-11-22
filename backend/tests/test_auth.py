from datetime import timedelta

import jwt

from app.config import get_settings
from app.db import session
from app.models import PasswordReset, User
from app.timeutil import utcnow
from tests.conftest import Api, register


def test_register_patient_and_state_shape(client):
    api = register(client, email="Fresh@Mail.com ")
    s = api.state
    assert s["session"]["email"] == "fresh@mail.com"
    assert s["session"]["role"] == "patient"
    assert s["consent"] is None and s["profile"]["done"] is False
    assert s["scans"] == [] and s["threads"] == [] and len(s["doctors"]) == 3


def test_register_doctor_gets_dr_prefix_and_draft_profile(client):
    api = register(client, role="dermatologist", name="Ali Hamid", email="ali@clinic.pk")
    assert api.state["session"]["name"] == "Dr. Ali Hamid"
    assert api.state["derm"]["step"] == "profile" and api.state["derm"]["status"] == "draft"


def test_register_rejects_bad_input(client):
    cases = [
        ({"role": "admin", "name": "X Y", "email": "a@b.co", "password": "secret123"}, "bad_role"),
        ({"role": "patient", "name": "A", "email": "a@b.co", "password": "secret123"}, "bad_name"),
        ({"role": "patient", "name": "Al Bo", "email": "not-an-email", "password": "secret123"}, "bad_email"),
        ({"role": "patient", "name": "Al Bo", "email": "a@b.co", "password": "short1"}, "weak_password"),
        ({"role": "patient", "name": "Al Bo", "email": "a@b.co", "password": "nodigitshere"}, "weak_password"),
        ({"role": "patient", "name": "Al Bo", "email": "AYESHA@mail.com", "password": "secret123"}, "email_taken"),
    ]
    for body, code in cases:
        r = client.post("/auth/register", json=body)
        assert r.status_code in (400, 409), body
        assert r.json()["error"]["code"] == code


def test_register_rejects_unknown_fields(client):
    r = client.post("/auth/register", json={"role": "patient", "name": "Al Bo", "email": "a@b.co", "password": "secret123", "admin": True})
    assert r.status_code == 422


def test_login_wrong_password_and_unknown_email_same_error(client):
    a = client.post("/auth/login", json={"email": "ayesha@mail.com", "password": "nope12345"})
    b = client.post("/auth/login", json={"email": "ghost@mail.com", "password": "nope12345"})
    assert a.status_code == b.status_code == 401
    assert a.json() == b.json()
    assert client.post("/auth/login", json={"email": "", "password": ""}).status_code == 400


def test_protected_routes_need_valid_token(client, ayesha):
    assert client.get("/me/state").status_code == 401
    assert client.get("/me/state", headers={"Authorization": "Bearer junk"}).status_code == 401
    expired = jwt.encode({"sub": "u-ayesha", "typ": "access", "tv": 0, "exp": utcnow() - timedelta(minutes=1)}, get_settings().secret_key, algorithm="HS256")
    r = client.get("/me/state", headers={"Authorization": f"Bearer {expired}"})
    assert r.status_code == 401 and r.json()["error"]["code"] == "token_expired"
    forged = jwt.encode({"sub": "u-ayesha", "typ": "access", "tv": 0, "exp": utcnow() + timedelta(hours=1)}, "wrong-key", algorithm="HS256")
    assert client.get("/me/state", headers={"Authorization": f"Bearer {forged}"}).status_code == 401
    refresh_as_access = jwt.encode({"sub": "u-ayesha", "typ": "refresh", "tv": 0, "exp": utcnow() + timedelta(hours=1)}, get_settings().secret_key, algorithm="HS256")
    assert client.get("/me/state", headers={"Authorization": f"Bearer {refresh_as_access}"}).status_code == 401


def test_refresh_rotates_and_old_token_dies(client, ayesha):
    r = client.post("/auth/refresh", json={"refreshToken": ayesha.refresh})
    assert r.status_code == 200
    new = r.json()
    assert client.get("/me/state", headers={"Authorization": f"Bearer {new['accessToken']}"}).status_code == 200
    assert client.post("/auth/refresh", json={"refreshToken": ayesha.refresh}).status_code == 401
    assert client.post("/auth/logout", json={"refreshToken": new["refreshToken"]}).status_code == 200
    assert client.post("/auth/refresh", json={"refreshToken": new["refreshToken"]}).status_code == 401


def test_password_reset_flow(client):
    r = client.post("/auth/forgot", json={"email": "ayesha@mail.com"})
    code = r.json()["devCode"]
    ghost = client.post("/auth/forgot", json={"email": "ghost@mail.com"}).json()
    assert ghost == {"ok": True}
    wrong = "000000" if code != "000000" else "111111"
    assert client.post("/auth/reset", json={"email": "ayesha@mail.com", "code": wrong, "password": "newpass123"}).status_code == 400
    assert client.post("/auth/reset", json={"email": "ayesha@mail.com", "code": code, "password": "weak"}).status_code == 400
    assert client.post("/auth/reset", json={"email": "ayesha@mail.com", "code": code, "password": "newpass123"}).status_code == 200
    # Code is single-use; old password is gone, new one works.
    assert client.post("/auth/reset", json={"email": "ayesha@mail.com", "code": code, "password": "other1234"}).status_code == 400
    assert client.post("/auth/login", json={"email": "ayesha@mail.com", "password": "demo1234"}).status_code == 401
    Api(client, "ayesha@mail.com", "newpass123")


def test_reset_code_attempt_limit_and_expiry(client):
    code = client.post("/auth/forgot", json={"email": "ayesha@mail.com"}).json()["devCode"]
    wrong = "999999" if code != "999999" else "888888"
    for _ in range(5):
        client.post("/auth/reset", json={"email": "ayesha@mail.com", "code": wrong, "password": "newpass123"})
    assert client.post("/auth/reset", json={"email": "ayesha@mail.com", "code": code, "password": "newpass123"}).status_code == 400
    code = client.post("/auth/forgot", json={"email": "ayesha@mail.com"}).json()["devCode"]
    with session() as db:
        for row in db.query(PasswordReset).all():
            row.expires_at = utcnow() - timedelta(seconds=1)
        db.commit()
    assert client.post("/auth/reset", json={"email": "ayesha@mail.com", "code": code, "password": "newpass123"}).status_code == 400


def test_new_reset_code_invalidates_previous(client):
    first = client.post("/auth/forgot", json={"email": "ayesha@mail.com"}).json()["devCode"]
    second = client.post("/auth/forgot", json={"email": "ayesha@mail.com"}).json()["devCode"]
    if first != second:
        assert client.post("/auth/reset", json={"email": "ayesha@mail.com", "code": first, "password": "newpass123"}).status_code == 400
    assert client.post("/auth/reset", json={"email": "ayesha@mail.com", "code": second, "password": "newpass123"}).status_code == 200


def test_change_password_signs_out_other_sessions(client, ayesha):
    other = Api(client, "ayesha@mail.com")
    ayesha.post("/auth/change-password", 400, json={"current": "wrong", "password": "newpass123"})
    ayesha.post("/auth/change-password", 400, json={"current": "demo1234", "password": "demo1234"})
    j = ayesha.post("/auth/change-password", json={"current": "demo1234", "password": "newpass123"})
    assert client.get("/me/state", headers=other.h).status_code == 401
    assert client.get("/me/state", headers={"Authorization": f"Bearer {j['accessToken']}"}).status_code == 200


def test_delete_account_removes_everything(client):
    from app import storage

    api = register(client)
    api.post("/me/consent", json={"adult": True})
    sid = api.scan()
    api.post("/appointments", json={"doctorId": "dr-sana", "service": "message", "reason": "Look please", "shareScanIds": [sid]})
    from tests.conftest import face_bytes

    api.post(f"/scans/{sid}/photo", files={"photo": ("p.jpg", face_bytes(), "image/jpeg")})
    key = api.state["scans"][0]["photoUri"].split("/files/")[1].split("?")[0]
    assert storage.path_for(key) is not None
    api.delete("/auth/account", 400, json={"password": "wrong"})
    api.delete("/auth/account", json={"password": "secret123"})
    with session() as db:
        assert db.query(User).filter_by(email="new@mail.com").first() is None
    assert storage.path_for(key) is None
    assert client.post("/auth/login", json={"email": "new@mail.com", "password": "secret123"}).status_code == 401
    assert client.get("/me/state", headers=api.h).status_code == 401
