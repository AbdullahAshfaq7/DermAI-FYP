from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", env_prefix="DERMAI_", extra="ignore")

    database_url: str = "postgresql+psycopg://dermai@localhost:5433/dermai"
    secret_key: str = "dev-only-change-me-please-0123456789abcdef"
    access_minutes: int = 60
    refresh_days: int = 30
    storage_dir: Path = BACKEND_DIR / "storage"
    file_url_minutes: int = 60 * 24
    max_upload_mb: int = 10
    timezone: str = "Asia/Karachi"
    commission_pct: int = 10
    dev_mode: bool = True
    demo_password: str = "demo1234"
    admin_email: str = "admin@dermai.pk"
    admin_password: str = "admin1234"
    cors_origins: str = "*"
    purge_after_days: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()
