from fastapi import Request
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from sqlalchemy.orm import Session

from app.models import Notification, User
from app.state import build_state


class In(BaseModel):
    """Request bodies use the app's camelCase names."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="forbid", str_strip_whitespace=True)


def base_url(request: Request) -> str:
    return str(request.base_url)


def respond(db: Session, user: User, request: Request, **extra) -> dict:
    db.commit()
    return {"state": build_state(db, user, base_url(request)), **extra}


def notify(db: Session, user_id: str, icon: str, title: str, body: str, href: str) -> None:
    db.add(Notification(user_id=user_id, icon=icon, title=title, body=body[:300], href=href))
