import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from app import db as dbmod
from app import storage
from app.config import get_settings
from app.errors import ApiError
from app.routers import admin, auth, booking, derm, me, scans

log = logging.getLogger("dermai")


async def housekeeping():
    while True:
        try:
            with dbmod.session() as db:
                n = scans.purge_photos(db)
                if n:
                    log.info("Purged %d old scan photos", n)
        except Exception:  # noqa: BLE001 - keep the loop alive; the next run retries
            log.exception("Photo purge failed")
        await asyncio.sleep(24 * 3600)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(housekeeping())
    yield
    task.cancel()


def create_app(run_housekeeping: bool = True) -> FastAPI:
    app = FastAPI(title="DermAI API", version="1.0.0", lifespan=lifespan if run_housekeeping else None)
    origins = [o.strip() for o in get_settings().cors_origins.split(",") if o.strip()]
    app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["*"], allow_headers=["*"])

    @app.exception_handler(ApiError)
    async def api_error(_: Request, e: ApiError):
        return JSONResponse({"error": {"code": e.code, "message": e.message, **e.extra}}, status_code=e.status)

    @app.exception_handler(RequestValidationError)
    async def validation_error(_: Request, e: RequestValidationError):
        first = e.errors()[0] if e.errors() else {}
        field = ".".join(str(x) for x in first.get("loc", [])[1:]) or "request"
        return JSONResponse({"error": {"code": "invalid", "message": f"Check {field}: {first.get('msg', 'invalid value')}."}}, status_code=422)

    @app.get("/health")
    def health():
        return {"ok": True}

    @app.get("/files/{key:path}")
    def files(key: str, exp: int = 0, sig: str = ""):
        if not storage.verify(key, exp, sig):
            raise ApiError(403, "link_expired", "This link has expired.")
        path = storage.path_for(key)
        if not path:
            raise ApiError(404, "not_found", "That file wasn't found.")
        return FileResponse(path, headers={"Cache-Control": "private, max-age=3600"})

    for r in (auth.router, me.router, scans.router, booking.router, derm.router, admin.router):
        app.include_router(r)
    return app


app = create_app()
