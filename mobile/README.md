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

The app follows the Lumen storyboard (v3): one app, two roles (patient and dermatologist), 44 screens.

**Lumen design in short:** Lamp violet `#5B3DF5` on pearl for patients, Emerald `#0B8A63` for dermatologists (`withRole` swaps the brand colour, so the same components serve both), and Night `#150E26` for the camera, review, analysing and results screens (`NightTheme`). Type is Bricolage Grotesque (display) and Instrument Sans (text). The logo is an aperture of six Fitzpatrick skin tones around a violet lens; the face map is a glowing dot grid. Patient and doctor tabs sit in a floating dock.

| Folder | What lives there |
| --- | --- |
| `app/` | Routes. Getting started: `welcome`, `role`, `sign-up`, `consent`, `log-in`. Skin profile: `setup/`. Patient tabs: `(patient)/` (home, routine, care, me). Scan flow: `scan/` (guide, camera, review, analyzing, results, concern, concerns). Care: `ai-chat`, `doctors/`, `book/`, `booked/`, `thread/`. Me: `notifications`, `settings`, `privacy`, `personal`, `history`, `saved`, `routine-preferences`, `appointments`, `skin-profile`, `about`, `progress`, `step/`. Dermatologist: `derm-setup/`, `(derm)/` (today, cases, schedule, messages, account), `case/`, `assess/`, `availability`, `inbox/`, `earnings` |
| `components/` | `ui/kit.tsx` (buttons, cards, lists, fields, pills, chips), `ui/Icon.tsx`, `visual.tsx` (logo, face map, trend line, photo compare), `chat.tsx`, `derm.tsx`, `TabBar.tsx` |
| `theme/` | Design tokens from `design.md` (colours, type, spacing) and `ThemeProvider` (light/dark/system, saved on device) |
| `store/` | App state from the API (`AppStore.tsx`): async actions, optimistic toggles with rollback, 15-second refresh, offline cache |
| `data/` | Shared types and static content (concerns, routine library, tones, pickers) |
| `lib/` | `api.ts` (API client, tokens, refresh), `localPhotos.ts` (scan photos kept on the phone), `reminders.ts` (on-device notifications), `routine.ts` (routine builder incl. doctor steps and pauses, mirrored in `backend/app/routine.py`), formatting, photo and export helpers |
| `assets/` | Icons, splash, images. Redraw the icon and splash with `cd ../backend && uv run python scripts/make_brand_assets.py` |

## Backend

The app needs the API in `../backend` running (see its README). In development the app finds it on the same machine as Metro, port 8000; set `EXPO_PUBLIC_API_URL` to use another address.

## Demo accounts

Seeded by the backend, password `demo1234` (the log-in screen has shortcuts in development builds):

- Patient: `ayesha@mail.com` (five scans, a booked visit, a doctor thread)
- Dermatologist: `sana@clinic.pk` (verified, with a case inbox and schedule)

Signing up creates a real account; new doctors appear to patients after an admin approves them (`uv run python -m app.cli approve-derm EMAIL`).

## How some features work

- **Phone-first photos.** The server scores a photo and deletes its copy straight away. The phone keeps the photo (`lib/localPhotos.ts`, app documents folder) for history and progress, for as long as the person chose in Privacy (3 months, 1 year or always). A photo goes back to the server only when that scan is shared with a doctor, and the server deletes it when the share stops or expires.
- **Live camera checks.** The camera sends a small frame to `POST /scans/precheck` about once a second and shows Light, Steady and Framing. When all three pass for 1.5 seconds it takes the photo itself; the shutter button still works.
- **Doctor prescriptions.** In an assessment a dermatologist can add a product, pause a step for 1–12 weeks, stop a step and ask for a new scan. The patient's routine changes straight away (doctor steps carry a Doctor pill; paused steps come back by themselves), the thread shows the note with the changes, and Home shows the requested scan date.
- **Suggested slots.** When Ask DermAI recommends seeing a dermatologist, it offers the first free slot with the patient's own doctor (or the best-rated one in their city). "Book this slot" opens booking with that time already picked.
- **Cases.** Each case has a number (DA-2041…) and the reasons it was flagged (for example "changed shape", "painful"), shown in the doctor's lists.

## Known gaps

- Skin analysis is a stand-in that reads the real photo on the server; the trained model comes later.
- The live camera checks need the native camera; on web the shutter and photo upload still work.
- Not connected yet, see `../docs/NEXT.md`: LLM chat, remote push, password-reset email (the code is in the server log; development builds show it), Google sign-in, payments (the choice is saved, nothing is charged), video calls, Urdu.
- On the web build, `react-native-svg` logs "Unknown event handler" warnings for the tappable face map; native builds are unaffected.
