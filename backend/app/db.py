from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    pass


_engine = None
_Session: sessionmaker | None = None


def configure(url: str | None = None) -> None:
    global _engine, _Session
    _engine = create_engine(url or get_settings().database_url, pool_pre_ping=True, future=True)
    _Session = sessionmaker(bind=_engine, expire_on_commit=False, autoflush=True)


def engine():
    if _engine is None:
        configure()
    return _engine


def session() -> Session:
    if _Session is None:
        configure()
    assert _Session is not None
    return _Session()


def get_db() -> Iterator[Session]:
    db = session()
    try:
        yield db
    finally:
        db.close()
