# Requirements

What you need to build and run DermAI. Exact dependency versions are pinned in
[`mobile/package.json`](mobile/package.json) and [`mobile/package-lock.json`](mobile/package-lock.json);
`npm ci` installs exactly what the lock file lists.

## Development environment

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 22.13 or later | Required by Expo SDK 58 |
| npm | 10 or later (ships with Node) | Use `npm ci`, not `npm install`, for a clean install |
| Git | any recent | |
| Expo Go | build with SDK 58 support | To run on a physical phone; or use a development build |
| Xcode + iOS Simulator | latest stable | Optional, macOS only, for `npm run ios` |
| Android Studio + emulator | latest stable | Optional, for `npm run android` |

## Device requirements

- iOS or Android phone/emulator with a camera (or photo library) for the scan flow.
- Camera and photo-library permissions granted to the app.

## Mobile app dependencies (`mobile/`)

### Core

| Package | Version |
| --- | --- |
| expo | ^58.0.24 |
| expo-router | ~58.0.31 |
| react | 19.3.0 |
| react-dom | 19.3.0 |
| react-native | 0.88.1 |
| react-native-web | ^0.21.4 |

### Expo modules

| Package | Version | Used for |
| --- | --- | --- |
| expo-camera | ~58.0.14 | Face scan capture |
| expo-image-picker | ~58.0.10 | Picking a photo from the library |
| expo-image-manipulator | ~58.0.16 | Resizing/compressing scan photos |
| expo-image | ~58.0.18 | Image rendering |
| expo-blur | ~58.0.6 | Glass navigation surfaces |
| expo-linear-gradient | ~58.0.4 | Gradients |
| expo-haptics | ~58.0.8 | Haptic feedback |
| expo-font | ~58.0.12 | Fonts |
| expo-splash-screen | ~58.0.14 | Splash screen |
| expo-status-bar | ~58.0.5 | Status bar |
| expo-system-ui | ~58.0.7 | System UI colours |
| expo-symbols | ~58.0.5 | SF Symbols (iOS) |
| expo-constants | ~58.0.16 | App config |
| expo-linking | ~58.0.17 | Deep links |
| expo-web-browser | ~58.0.8 | In-app browser |
| expo-secure-store | ~58.0.3 | Keeps sign-in tokens in the device keychain |
| expo-document-picker | ~58.0.5 | PDF or photo upload for doctor credentials |
| expo-sharing | ~58.0.23 | Sharing the data export file |
| expo-notifications | ~58.1.9 | On-device reminders (routine, rescan, visits) |
| expo-calendar | ~58.0.7 | Add a visit to the calendar |
| expo-file-system | ~58.0.13 | Writing the export file |
| @expo/vector-icons | ^15.0.3 | Icons |

### React Native libraries

| Package | Version |
| --- | --- |
| @react-native-async-storage/async-storage | 2.2.0 |
| react-native-gesture-handler | ~3.3.0 |
| react-native-reanimated | 4.7.1 |
| react-native-worklets | 0.13.0 |
| react-native-safe-area-context | ~5.11.1 |
| react-native-screens | ~4.30.1 |

### Dev dependencies

| Package | Version |
| --- | --- |
| typescript | ~6.0.3 |
| @types/react | ~19.3.0 |
| eslint | ^9.25.0 |
| eslint-config-expo | ~58.0.4 |

## Backend (`backend/`)

| Tool | Version | Notes |
| --- | --- | --- |
| Python | 3.11 or later | Managed by uv |
| uv | 0.11 or later | `brew install uv`; `uv sync` installs from `uv.lock` |
| PostgreSQL | 17 | `brew install postgresql@17`; `scripts/dev.sh` runs a project-local server on port 5433 |

Main Python packages (exact versions in `backend/uv.lock`): FastAPI, Uvicorn, SQLAlchemy 2, Alembic, psycopg 3, Pydantic 2 + pydantic-settings, bcrypt, PyJWT, Pillow, NumPy, python-multipart. Tests: pytest, httpx.

## Planned components

- **ML** (`ml/`): skin-analysis model training and ONNX export.
- Integrations listed in [docs/NEXT.md](docs/NEXT.md).

## Setup

```bash
cd backend && cp .env.example .env && bash scripts/dev.sh   # API on :8000
cd mobile && npm ci && npx expo start                       # app
```
