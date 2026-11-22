"""Private file storage on local disk. Files are only reachable through short-lived signed URLs.
Swap for S3/R2 later: keep `save`, `delete`, `url_for` and `path_for`."""

import time
import uuid
from pathlib import Path

from app.config import get_settings
from app.security import sign

IMAGE_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic"}
DOC_TYPES = {**IMAGE_TYPES, "application/pdf": "pdf"}


def root() -> Path:
    p = get_settings().storage_dir
    p.mkdir(parents=True, exist_ok=True)
    return p


def save(folder: str, data: bytes, ext: str) -> str:
    key = f"{folder}/{uuid.uuid4().hex}.{ext}"
    path = root() / key
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return key


def path_for(key: str) -> Path | None:
    p = (root() / key).resolve()
    if root().resolve() not in p.parents or not p.is_file():
        return None
    return p


def delete(key: str | None) -> None:
    if not key:
        return
    p = path_for(key)
    if p:
        p.unlink(missing_ok=True)


def url_for(key: str | None, base_url: str) -> str | None:
    if not key:
        return None
    exp = int(time.time()) + get_settings().file_url_minutes * 60
    sig = sign(f"{key}:{exp}")
    return f"{base_url.rstrip('/')}/files/{key}?exp={exp}&sig={sig}"


def verify(key: str, exp: int, sig: str) -> bool:
    import hmac

    return exp >= time.time() and hmac.compare_digest(sign(f"{key}:{exp}"), sig)
