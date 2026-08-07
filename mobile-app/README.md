# EventHive — Mobile App

The React Native (Expo SDK 54) client for **[EventHive](../README.md)**. This is the only client;
it talks to the [backend](../backend) exclusively over a JSON REST API.

📖 **Full documentation: [docs/mobile-app.md](../docs/mobile-app.md)**

---

## Quick start

```bash
npm install
```

Create `.env` in this directory:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<google places key>
EXPO_PUBLIC_GOOGLE_CLIENT_ID=<google oauth client id>    # optional
```

```bash
npx expo start          # scan the QR code with Expo Go
```

`localhost` works even on a physical device — the API client detects that it is running on a device
and substitutes your development machine's LAN IP, which Expo already knows from
`Constants.expoConfig.hostUri`. See [docs/mobile-app.md §5.5](../docs/mobile-app.md#55-api-client).

The backend must be running first — see [backend setup](../docs/setup-and-deployment.md#73-running-locally).

## Scripts

| Command | Purpose |
| :--- | :--- |
| `npm start` | Metro bundler + QR code |
| `npm run android` | Android emulator or connected device |
| `npm run ios` | iOS simulator |
| `npm run web` | Browser build |
| `npm run lint` | ESLint via `expo lint` |

## Structure

```
src/
├── screens/          13 screens — discovery, hosting, booking, ticketing, check-in, profile
├── navigation/       AppNavigator.js — auth-gated stack + tab graph
├── context/          AuthContext (session), NotificationContext (currently stubbed)
├── components/       CustomTabBar + ui/ (GlassCard, GradientButton, CustomInput)
├── constants/        theme.js — "Aurora" design tokens; config.js
└── services/api.js   Axios instance with dynamic base-URL resolution
```

> The directories `components/`, `hooks/`, and `constants/` at the root of `mobile-app/` are
> leftover TypeScript scaffolding from `create-expo-app`. The application uses only `src/`.

## Notes

- **Environment variables prefixed `EXPO_PUBLIC_` are inlined into the app bundle** and are not
  secret. Only referrer-restricted or public-scope keys belong there.
- `newArchEnabled` (Fabric/TurboModules) and `experiments.reactCompiler` are both on in `app.json`.
- The notification bell always shows zero: `NotificationContext` is intentionally stubbed to remove
  a 10-second polling loop. The backend notification API is complete and covered by tests. See
  [Architecture §1.8](../docs/architecture.md#18-known-limitations--future-work).
