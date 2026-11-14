# DermAI mobile app

Expo SDK 58 · React Native 0.88 · Expo Router (file-based routing) · TypeScript (strict)

## Commands

```bash
npm ci              # install dependencies
npx expo start      # start dev server (scan QR with Expo Go)
npm run ios         # iOS simulator
npm run android     # Android emulator
npm run lint        # ESLint
npm run typecheck   # TypeScript check
```

After upgrading Expo, restart with a cleared cache: `npx expo start --clear`.

## Folder guide

The app follows `Claude outputs/storyboard.html` and `design.md`: one app, two roles (patient and dermatologist), 44 screens.

| Folder | What lives there |
| --- | --- |
| `app/` | Routes. Getting started: `welcome`, `role`, `sign-up`, `consent`, `log-in`. Skin profile: `setup/`. Patient tabs: `(patient)/` (home, routine, care, me). Scan flow: `scan/` (guide, camera, review, analyzing, results, concern, concerns). Care: `ai-chat`, `doctors/`, `book/`, `booked/`, `thread/`. Me: `notifications`, `settings`, `privacy`, `personal`, `history`, `saved`, `routine-preferences`, `appointments`, `skin-profile`, `about`, `progress`, `step/`. Dermatologist: `derm-setup/`, `(derm)/` (today, cases, schedule, messages, account), `case/`, `assess/`, `availability`, `inbox/`, `earnings` |
| `components/` | `ui/kit.tsx` (buttons, cards, lists, fields, pills, chips), `ui/Icon.tsx`, `visual.tsx` (logo, face map, trend line, photo compare), `chat.tsx`, `derm.tsx`, `TabBar.tsx` |
| `theme/` | Design tokens from `design.md` (colours, type, spacing) and `ThemeProvider` (light/dark/system, saved on device) |
| `store/` | App state, saved on device with AsyncStorage; seeded demo accounts |
| `data/` | Shared types and **demo content** (scans, routine library, doctors, cases) |
| `lib/` | Stand-ins for back-end services (`analysis.ts`, `ai.ts`, `routine.ts`, `slots.ts`) plus formatting and photo helpers |
| `assets/` | Icons, splash, images |

## Demo accounts

There is no auth server yet. On the log-in screen, tap a demo account:

- Patient: `ayesha@mail.com` (five scans, a booked visit, a doctor thread)
- Dermatologist: `sana@clinic.pk` (verified, with a case inbox and schedule)

Signing up creates a fresh account on the device and goes through onboarding.

## Known gaps

Everything runs on the device; nothing talks to a server yet.

- Skin analysis is simulated in `lib/analysis.ts` (plausible scores from the last scan); camera and review quality checks are simulated too.
- Ask DermAI replies come from rules in `lib/ai.ts`, grounded in the latest scan, with red-flag referral. Swap for an LLM API.
- Google sign-in, password reset, payments, video visits, push notifications and PMDC verification need back-end services.
- The native splash image and app icon are still the old blue artwork; the new logo is drawn in code (`components/visual.tsx`).
