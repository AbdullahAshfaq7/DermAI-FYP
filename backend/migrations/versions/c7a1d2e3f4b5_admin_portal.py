"""admin portal: suspensions, last login, admin log

Revision ID: c7a1d2e3f4b5
Revises: b94e6359f83d
Create Date: 2026-11-23 10:00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c7a1d2e3f4b5"
down_revision: Union[str, Sequence[str], None] = "b94e6359f83d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("suspended", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("users", sa.Column("suspended_reason", sa.String(length=300), nullable=False, server_default=""))
    op.add_column("users", sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True))
    op.create_table(
        "admin_log",
        sa.Column("id", sa.String(length=40), primary_key=True),
        sa.Column("admin_id", sa.String(length=40), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("admin_name", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("action", sa.String(length=60), nullable=False),
        sa.Column("target_type", sa.String(length=30), nullable=False, server_default=""),
        sa.Column("target_id", sa.String(length=40), nullable=False, server_default=""),
        sa.Column("detail", sa.Text(), nullable=False, server_default=""),
        sa.Column("at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_admin_log_admin_id", "admin_log", ["admin_id"])
    op.create_index("ix_admin_log_at", "admin_log", ["at"])


def downgrade() -> None:
    op.drop_index("ix_admin_log_at", table_name="admin_log")
    op.drop_index("ix_admin_log_admin_id", table_name="admin_log")
    op.drop_table("admin_log")
    op.drop_column("users", "last_login_at")
    op.drop_column("users", "suspended_reason")
    op.drop_column("users", "suspended")
