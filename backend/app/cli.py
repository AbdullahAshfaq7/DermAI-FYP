"""Admin commands.

    uv run python -m app.cli seed            # drop everything and load the demo data
    uv run python -m app.cli init-db         # create tables without demo data
    uv run python -m app.cli pending         # doctors waiting for PMDC verification
    uv run python -m app.cli approve-derm EMAIL
    uv run python -m app.cli reject-derm EMAIL "reason"
    uv run python -m app.cli create-admin EMAIL PASSWORD
    uv run python -m app.cli purge-photos
"""

import sys

from sqlalchemy import select

from app.db import Base, engine, session
from app.models import Dermatologist, User


def derm_by_email(db, email: str) -> Dermatologist:
    u = db.scalar(select(User).where(User.email == email.strip().lower()))
    if not u or not u.derm:
        sys.exit(f"No dermatologist with email {email}")
    return u.derm


def main(argv: list[str]) -> None:
    if not argv:
        sys.exit(__doc__)
    cmd, args = argv[0], argv[1:]
    from app import models  # noqa: F401  (register tables)

    if cmd == "seed":
        from app.seed import run

        print("Seeded:", run(True))
    elif cmd == "init-db":
        Base.metadata.create_all(engine())
        print("Tables ready")
    elif cmd == "pending":
        with session() as db:
            for d in db.scalars(select(Dermatologist).where(Dermatologist.status == "pending")):
                print(f"{d.user.email}\t{d.user.name}\tPMDC {d.pmdc}\t{d.clinic}")
    elif cmd in ("approve-derm", "reject-derm"):
        from app.routers.derm import approve_derm, reject_derm

        with session() as db:
            d = derm_by_email(db, args[0])
            if cmd == "approve-derm":
                approve_derm(db, d)
            else:
                reject_derm(db, d, args[1] if len(args) > 1 else "")
            db.commit()
            print(f"{d.user.name}: {d.status}")
    elif cmd == "create-admin":
        from app.security import hash_password, normalise_email, password_problem

        if len(args) != 2 or password_problem(args[1]):
            sys.exit("Usage: create-admin EMAIL PASSWORD (8+ characters with a number)")
        with session() as db:
            db.add(User(role="admin", name="Admin", email=normalise_email(args[0]), password_hash=hash_password(args[1])))
            db.commit()
            print("Admin created")
    elif cmd == "purge-photos":
        from app.routers.scans import purge_photos

        with session() as db:
            print("Photos purged:", purge_photos(db))
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
