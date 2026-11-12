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

## Planned components

Not built yet; requirements will be added when work starts.

- **Backend** (`backend/`): Python, FastAPI, PostgreSQL.
- **ML** (`ml/`): skin-analysis model training and export.

## Setup

```bash
cd mobile
npm ci
npx expo start
```
