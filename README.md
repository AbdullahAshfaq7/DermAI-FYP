# DermAI — Your Pocket Dermatologist

AI-powered facial skin scanner and personalised skincare guide.
Final Year Project, BS Computer Science, University of Management and Technology, Lahore.
Team: Abdullah Ashfaq, Noor ul Huda, Roman Fatima · Advisor: Raybal Akhtar

> DermAI gives skincare guidance and awareness. It is not a medical device and does not diagnose or treat skin conditions.

## Project structure

```
DermAI/
├── mobile/        React Native app (Expo SDK 58, Expo Router, TypeScript)
├── backend/       FastAPI API, PostgreSQL, tests
├── docs/          FYP-I report, defence slides, UI screenshots, NEXT.md
│   └── design/ui-screens/
└── ml/            (planned) skin-analysis model training and export
```

## Status

| Part | Status |
| --- | --- |
| Mobile UI: Lumen design (storyboard v3, 44 screens), patient and dermatologist roles, light/dark, Night scan screens | Built and connected to the API |
| Accounts / auth (email + password, reset code, change password, delete account) | Built |
| Backend API + database (FastAPI, PostgreSQL, Alembic, pytest suite) | Built |
| Bookings, patient–doctor messaging, doctor verification (PMDC certificate + degree), assessments | Built |
| Doctor prescriptions: add, pause or stop routine steps, request a rescan | Built |
| Phone-first photos: kept on the phone, uploaded only when shared with a doctor | Built |
| Live camera checks (light, steady, framing) with auto-capture | Built (native camera; not testable on web) |
| Skin analysis | Stand-in analyzer that reads the real photo (quality checks + per-zone scores). Trained model not started |
| Ask DermAI | Rule-based replies; a referral suggests a real bookable slot |
| AI chatbot (LLM), push, email, Google sign-in, payments, video | Deferred, see [docs/NEXT.md](docs/NEXT.md) |

## Run it

Start the API first (details in [backend/README.md](backend/README.md)):

```bash
cd backend && cp .env.example .env && bash scripts/dev.sh
```

Then the app:

```bash
cd mobile && npm ci && npx expo start
```

Demo accounts: `ayesha@mail.com` (patient) and `sana@clinic.pk` (dermatologist), password `demo1234`.

Requires Node.js 22.13+ and Expo Go with SDK 58 support (or a development build). Full list in [REQUIREMENTS.md](REQUIREMENTS.md).
