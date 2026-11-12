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

| Folder | What lives there |
| --- | --- |
| `app/` | Screens and routes. `(tabs)/` = Home, Routine, Chat, Profile; `scan/` = capture → review → analyzing → results; `recommendations/`, `settings/`, `notifications.tsx`, `pre-scan.tsx`, `skin-profile.tsx` |
| `components/` | UI grouped by feature: `ui/` (shared primitives), `home/`, `scan/`, `recommendations/`, `profile/`, `settings/`, `notifications/`, `navigation/`, `branding/`, `prescan/` |
| `theme/` | Design system: colors, tokens, `ThemeProvider` (light/dark/system, saved to device) |
| `constants/` | Route names, image map, branding, per-screen theme helpers |
| `context/` | App state: scan session, recommendations, notifications |
| `data/` | **Mock data** — to be replaced by API calls |
| `lib/` | App init and photo preparation (resize/compress before upload) |
| `hooks/` | Color-scheme hooks |
| `assets/` | App icons, splash, logos, images |

## Known gaps

- Scan analysis is simulated (5 s timer, fixed result from `data/skinScanResult.ts`).
- Chat replies are keyword-matched placeholders.
- No auth, no backend, no persistence beyond the theme setting.
