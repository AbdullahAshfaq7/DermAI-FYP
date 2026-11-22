from fastapi import UploadFile

from app import storage
from app.config import get_settings
from app.errors import ApiError

MAGIC = {b"\xff\xd8\xff": "jpg", b"\x89PNG\r\n\x1a\n": "png", b"%PDF-": "pdf"}


def sniff(data: bytes) -> str | None:
    for sig, ext in MAGIC.items():
        if data.startswith(sig):
            return ext
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    if data[4:12] in (b"ftypheic", b"ftypheix", b"ftypmif1", b"ftypmsf1"):
        return "heic"
    return None


async def read_upload(f: UploadFile | None, allow_pdf: bool = False, what: str = "photo") -> tuple[bytes, str]:
    if f is None:
        raise ApiError(400, "file_missing", f"Add a {what}.")
    limit = get_settings().max_upload_mb * 1024 * 1024
    data = await f.read(limit + 1)
    if len(data) > limit:
        raise ApiError(413, "file_too_large", f"That file is over {get_settings().max_upload_mb} MB. Choose a smaller one.")
    if not data:
        raise ApiError(400, "file_empty", "That file is empty.")
    ext = sniff(data)
    allowed = {"jpg", "png", "webp", "heic"} | ({"pdf"} if allow_pdf else set())
    if ext not in allowed:
        kinds = "a JPEG, PNG or PDF" if allow_pdf else "a JPEG or PNG photo"
        raise ApiError(415, "file_type", f"That file type isn't supported. Use {kinds}.")
    return data, ext


def store(folder: str, data: bytes, ext: str) -> str:
    return storage.save(folder, data, ext)
