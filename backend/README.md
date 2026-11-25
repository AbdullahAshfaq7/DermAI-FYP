# DermAI API

FastAPI + PostgreSQL backend for the DermAI app (`../mobile`). It owns accounts, scans and photos, routines, bookings, patient–doctor messaging, doctor verification and notifications.

## Run it

Needs Python 3.11+, [uv](https://docs.astral.sh/uv/) and PostgreSQL 17 (`brew install uv postgresql@17`).

```bash
cd backend
cp .env.example .env        # then set DERMAI_SECRET_KEY to a long random string
bash scripts/dev.sh         # starts a project-local Postgres on port 5433, seeds demo data on first run, serves on :8000
```

API docs: http://localhost:8000/docs

The phone reaches the API through the dev machine's address on port 8000 (worked out from Expo's host). To point the app somewhere else, set `EXPO_PUBLIC_API_URL` in `mobile/.env`.

### Demo accounts (password `demo1234`)

| Role | Email |
| --- | --- |
| Patient with five scans, a booked visit and a doctor thread | `ayesha@mail.com` |
| Verified dermatologist with an inbox and schedule | `sana@clinic.pk` |
| Other verified doctors | `umar@clinic.pk`, `hira@clinic.pk` |
| Patients in Dr. Sana's inbox | `bilal@ / zara@ / omar@ / nida@ / hassan@ / farah@demo.dermai.pk` |
| Admin (password `admin1234`) | `admin@dermai.pk` |

## Admin portal

Admins sign in from the app (Welcome → **Log in as admin**, or the regular log in) and land on `/admin`. The portal covers: an overview (accounts, doctors, bookings, cases, scans, revenue), every account (search, filter, edit details, create, set password, sign out everywhere, suspend/restore, delete), PMDC verification (documents, verify, send back, revoke, edit profile and fees), bookings (cancel any time, mark paid/refunded/due), cases with their messages, scan scores (photos stay on phones), announcements to patients/doctors/everyone, and an audit log of every admin change. Opening a case's messages is itself logged. Guards: an admin can't suspend or delete themself or the last active admin; suspending or revoking a doctor cancels their upcoming visits and tells patients. Endpoints live under `/admin` (see `app/routers/admin.py`); tests in `tests/test_admin.py`.

## Admin commands

```bash
uv run python -m app.cli seed                   # wipe and reload demo data
uv run python -m app.cli pending                # doctors waiting for PMDC verification
uv run python -m app.cli approve-derm EMAIL
uv run python -m app.cli reject-derm EMAIL "reason"
uv run python -m app.cli create-admin EMAIL PASSWORD
uv run python -m app.cli purge-photos           # also runs daily inside the API
```

## Tests

```bash
uv run pytest
```

The tests use the `dermai_test` database (created by `scripts/dev.sh`) and cover every endpoint plus edge cases: auth and tokens, password reset limits, access control between accounts, photo validation and quality rejection, live prechecks, slot rules (hours, notice, gap, time off, blocked time), double booking under concurrency, cancellation (not within 2 hours), assessments and prescriptions (add, pause, stop, rescan) changing the patient's routine, case numbers and flag reasons, AI-suggested slots, training-label opt-in, account deletion, and phone-first photo handling (server copy deleted after analysis, re-upload only while shared, purge when a share ends).

## Photos

Photos are phone-first. `POST /scans` analyses the upload and deletes the file; only scores are stored. `POST /scans/{id}/photo` accepts the photo again only while that scan is shared with a doctor (otherwise `409 not_shared`), and the copy is removed when the share is stopped or expires (`purge_photos`, daily and on startup). `POST /scans/precheck` scores a small camera frame for light, steadiness and framing without storing anything.

## Layout

| Path | What it does |
| --- | --- |
| `app/main.py` | App, error format, signed file links, daily photo purge |
| `app/models.py` | Tables |
| `app/state.py` | Builds the `AppState` the app renders (same shape as `mobile/store/state.ts`) |
| `app/routers/` | `auth`, `me` (profile, settings, routine, saved, notifications, AI chat, export), `scans`, `booking` (directory, slots, appointments, threads), `derm` (onboarding, cases, assessments, schedule), `admin` (admin portal) |
| `app/analysis/` | Photo quality checks, the pixel heuristic, and the ONNX skin models (`model.py`). Run `scripts/fetch_models.sh` once to download them into `models/`; without them the heuristic is used |
| `app/slots.py` | Bookable slots from a doctor's real availability |
| `app/routine.py` | Routine builder, mirrored from the app, used for streaks and doctor changes |
| `app/ai_rules.py` | Ask DermAI replies (rules; the LLM is a next step) |
| `app/seed.py`, `app/seed_data.json` | Demo data. `scripts/export_seed.mts` copies the app's content (concerns, routine library) into the JSON |
| `migrations/` | Alembic migrations (`uv run alembic upgrade head`) |
| `scripts/make_brand_assets.py` | Redraws the app icon, Android foreground, favicon and splash from the logo in `mobile/assets/logo.json` |

Deferred integrations (LLM, push, email, Google, payments, video) are listed in [`../docs/NEXT.md`](../docs/NEXT.md).
