#!/usr/bin/env bash
# Starts the project-local Postgres (backend/.pgdata, port 5433) if needed, then the API on port 8000.
# First run creates the database and loads demo data.
set -euo pipefail
cd "$(dirname "$0")/.."
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
PG_BIN="${PG_BIN:-$(dirname "$(command -v pg_ctl || echo /opt/homebrew/opt/postgresql@17/bin/pg_ctl)")}"

if [ ! -d .pgdata ]; then
  "$PG_BIN/initdb" -D .pgdata -U dermai --auth=trust -E UTF8 --locale=en_US.UTF-8 >/dev/null
fi
if ! "$PG_BIN/pg_ctl" -D .pgdata status >/dev/null 2>&1; then
  "$PG_BIN/pg_ctl" -D .pgdata -l .pgdata/log.txt -o "-p 5433 -k /tmp" start >/dev/null
  sleep 1
fi
for db in dermai dermai_test; do
  "$PG_BIN/psql" -h localhost -p 5433 -U dermai -lqt | cut -d'|' -f1 | grep -qw "$db" || "$PG_BIN/createdb" -h localhost -p 5433 -U dermai "$db"
done
if ! uv run python -c "from app.db import engine; from sqlalchemy import inspect; import sys; sys.exit(0 if inspect(engine()).has_table('users') else 1)"; then
  uv run python -m app.cli seed      # creates the tables and loads demo data
  uv run alembic stamp head >/dev/null
else
  uv run alembic upgrade head        # apply any new migrations
fi
exec uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 "$@"
