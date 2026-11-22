import io
import os
import shutil
import tempfile
from pathlib import Path

STORAGE = Path(tempfile.mkdtemp(prefix="dermai-test-"))
os.environ["DERMAI_DATABASE_URL"] = os.environ.get("DERMAI_TEST_DATABASE_URL", "postgresql+psycopg://dermai@localhost:5433/dermai_test")
os.environ["DERMAI_STORAGE_DIR"] = str(STORAGE)
os.environ["DERMAI_DEV_MODE"] = "true"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from PIL import Image, ImageEnhance, ImageFilter  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app import models  # noqa: E402,F401
from app.db import Base, engine, session  # noqa: E402
from app.main import create_app  # noqa: E402
from app.seed import seed  # noqa: E402

FIXTURES = Path(__file__).parent / "fixtures"
PW = "demo1234"


@pytest.fixture(scope="session", autouse=True)
def _schema():
    Base.metadata.drop_all(engine())
    Base.metadata.create_all(engine())
    yield
    shutil.rmtree(STORAGE, ignore_errors=True)


@pytest.fixture()
def db_reset():
    names = ", ".join(t.name for t in Base.metadata.sorted_tables)
    with engine().begin() as conn:
        conn.execute(text(f"TRUNCATE {names} CASCADE"))
    with session() as db:
        seed(db)


@pytest.fixture()
def client(db_reset):
    return TestClient(create_app(run_housekeeping=False))


class Api:
    def __init__(self, client: TestClient, email: str, password: str = PW):
        self.c = client
        r = client.post("/auth/login", json={"email": email, "password": password})
        assert r.status_code == 200, r.text
        j = r.json()
        self.token, self.refresh, self.state = j["accessToken"], j["refreshToken"], j["state"]

    @property
    def h(self):
        return {"Authorization": f"Bearer {self.token}"}

    def req(self, method: str, path: str, expect: int = 200, **kw):
        r = self.c.request(method, path, headers=self.h, **kw)
        assert r.status_code == expect, f"{method} {path} -> {r.status_code}: {r.text}"
        j = r.json()
        if isinstance(j, dict) and "state" in j:
            self.state = j["state"]
        return j

    def get(self, path, expect=200, **kw):
        return self.req("GET", path, expect, **kw)

    def post(self, path, expect=200, **kw):
        return self.req("POST", path, expect, **kw)

    def put(self, path, expect=200, **kw):
        return self.req("PUT", path, expect, **kw)

    def patch(self, path, expect=200, **kw):
        return self.req("PATCH", path, expect, **kw)

    def delete(self, path, expect=200, **kw):
        return self.req("DELETE", path, expect, **kw)

    def scan(self, image: bytes | None = None) -> str:
        up = self.post("/scans/check", files={"photo": ("face.jpg", image or face_bytes(), "image/jpeg")})
        return self.post("/scans", json={"uploadId": up["uploadId"]})["scanId"]


@pytest.fixture()
def ayesha(client):
    return Api(client, "ayesha@mail.com")


@pytest.fixture()
def sana(client):
    return Api(client, "sana@clinic.pk")


@pytest.fixture()
def admin(client):
    return Api(client, "admin@dermai.pk", "admin1234")


def register(client: TestClient, role="patient", email="new@mail.com", name="New Person", password="secret123") -> Api:
    r = client.post("/auth/register", json={"role": role, "name": name, "email": email, "password": password})
    assert r.status_code == 200, r.text
    return Api(client, email, password)


def face_bytes(transform=None) -> bytes:
    im = Image.open(FIXTURES / "face.jpg").convert("RGB")
    if transform:
        im = transform(im)
    b = io.BytesIO()
    im.save(b, "JPEG", quality=90)
    return b.getvalue()


def dark(im):
    return ImageEnhance.Brightness(im).enhance(0.2)


def blurry(im):
    return im.filter(ImageFilter.GaussianBlur(8))


def blank(im):
    return Image.new("RGB", im.size, (225, 200, 180))
