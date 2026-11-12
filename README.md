# DermAI — Your Pocket Dermatologist

AI-powered facial skin scanner and personalised skincare guide.
Final Year Project, BS Computer Science, University of Management and Technology, Lahore.
Team: Abdullah Ashfaq, Noor ul Huda, Roman Fatima · Advisor: Raybal Akhtar

> DermAI gives skincare guidance and awareness. It is not a medical device and does not diagnose or treat skin conditions.

## Project structure

```
DermAI/
├── mobile/        React Native app (Expo SDK 58, Expo Router, TypeScript)
├── docs/          FYP-I report, defence slides, UI screenshots
│   └── design/ui-screens/
├── backend/       (planned) FastAPI API, PostgreSQL
└── ml/            (planned) skin-analysis model training and export
```

## Status

| Part | Status |
| --- | --- |
| Mobile UI (scan flow, results, routine, chat, recommendations, profile, settings, light/dark) | Built, running on mock data |
| Accounts / auth | Not started |
| Backend API + database | Not started |
| Skin-analysis model | Not started |
| AI routine generator + chatbot (LLM) | Not started |

See the project analysis, PRD and roadmap doc for the full plan.

## Run the app

```bash
cd mobile
npm ci
npx expo start
```

Requires Node.js 22.13+ and Expo Go with SDK 58 support (or a development build).
