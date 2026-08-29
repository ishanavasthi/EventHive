# Third-Party Notices

EventHive is distributed under the [MIT License](./LICENSE), © 2026 Team Developer Mindset
(Arjun Ojha, Ishan Avasthi, Karan Das A, Rajat Tyagi). It builds on open-source software
authored by third parties, listed here in acknowledgement of their licences. Every dependency below
is consumed **unmodified**, installed from the public npm registry, and pinned in the committed
lockfiles (`backend/package-lock.json`, `mobile-app/package-lock.json`).

No third-party source code has been copied into this repository. The `node_modules/` trees are not
part of the authored work.

*Generated 2026-08-29 from the committed lockfiles. Versions are the resolved versions, not the
semver ranges in `package.json`.*

---

## Licence summary

| Scope | Packages in dependency tree | Licences represented |
| :--- | :---: | :--- |
| `backend/` | 577 | MIT (467) · ISC (50) · Apache-2.0 (25) · BSD-3-Clause (16) · BSD-2-Clause (9) · BlueOak-1.0.0 (3) · Python-2.0 (1) · CC-BY-4.0 (1) · 0BSD (1) · MIT-or-CC0-1.0 (1) |
| `mobile-app/` | 1016 | MIT (845) · ISC (70) · Apache-2.0 (25) · BSD-2-Clause (21) · BSD-3-Clause (19) · MPL-2.0 (12) · BlueOak-1.0.0 (8) · others (16) |

All licences present are permissive (MIT, ISC, BSD, Apache-2.0, 0BSD, BlueOak, Unlicense/CC0) or
weak-copyleft at file level (MPL-2.0, in build tooling only). **No GPL/AGPL-licensed package is
linked into either distributable.** Full per-package licence text ships inside each package under
`node_modules/<package>/LICENSE`.

---

## Backend — direct dependencies

| Package | Version | Licence | Used for |
| :--- | :--- | :--- | :--- |
| `bcryptjs` | 3.0.3 | BSD-3-Clause | Password hashing (10 salt rounds) |
| `cloudinary` | 2.9.0 | MIT | Media hosting SDK (installed, not yet wired — see Known Limitations #3) |
| `cors` | 2.8.5 | MIT | Cross-origin policy |
| `dotenv` | 17.2.3 | BSD-2-Clause | Environment-variable loading |
| `express` | 5.2.1 | MIT | HTTP application framework |
| `express-validator` | 7.3.1 | MIT | Request-body validation |
| `google-auth-library` | 10.5.0 | Apache-2.0 | Google ID-token verification |
| `helmet` | 8.1.0 | MIT | Security response headers |
| `jsonwebtoken` | 9.0.3 | MIT | JWT signing and verification |
| `jwks-rsa` | 3.2.2 | MIT | Apple public-key retrieval for Sign in with Apple |
| `mongoose` | 8.21.0 | MIT | MongoDB ODM and schema layer |
| `morgan` | 1.10.1 | MIT | HTTP request logging |
| `multer` | 2.0.2 | MIT | Multipart form parsing |
| `razorpay` | 2.9.6 | MIT | Payment-gateway SDK |

### Backend — development dependencies

| Package | Version | Licence | Used for |
| :--- | :--- | :--- | :--- |
| `@eslint/js` | 9.39.2 | MIT | ESLint recommended rule set |
| `eslint` | 9.39.2 | MIT | Static analysis |
| `globals` | 17.0.0 | MIT | Environment globals for the ESLint flat config |
| `jest` | 30.2.0 | MIT | Test runner and coverage instrumentation |
| `nodemon` | 3.1.11 | MIT | Development auto-reload |
| `supertest` | 7.2.2 | MIT | In-process HTTP assertions |

---

## Mobile app — direct dependencies

| Package | Version | Licence |
| :--- | :--- | :--- |
| `@expo-google-fonts/plus-jakarta-sans` | 0.4.2 | MIT AND OFL-1.1 |
| `@expo/vector-icons` | 15.0.3 | MIT |
| `@react-native-async-storage/async-storage` | 2.2.0 | MIT |
| `@react-native-community/datetimepicker` | 8.4.4 | MIT |
| `@react-navigation/bottom-tabs` | 7.10.0 | MIT |
| `@react-navigation/elements` | 2.9.5 | MIT |
| `@react-navigation/native` | 7.1.28 | MIT |
| `@react-navigation/native-stack` | 7.10.0 | MIT |
| `axios` | 1.13.2 | MIT |
| `expo` | 54.0.31 | MIT |
| `expo-apple-authentication` | 8.0.8 | MIT |
| `expo-auth-session` | 7.0.10 | MIT |
| `expo-blur` | 15.0.8 | MIT |
| `expo-build-properties` | 1.0.10 | MIT |
| `expo-camera` | 17.0.10 | MIT |
| `expo-constants` | 18.0.13 | MIT |
| `expo-crypto` | 15.0.8 | MIT |
| `expo-font` | 14.0.10 | MIT |
| `expo-haptics` | 15.0.8 | MIT |
| `expo-image` | 3.0.11 | MIT |
| `expo-image-picker` | 17.0.10 | MIT |
| `expo-linear-gradient` | 15.0.8 | MIT |
| `expo-linking` | 8.0.11 | MIT |
| `expo-location` | 19.0.8 | MIT |
| `expo-notifications` | 0.32.17 | MIT |
| `expo-router` | 6.0.21 | MIT |
| `expo-splash-screen` | 31.0.13 | MIT |
| `expo-status-bar` | 3.0.9 | MIT |
| `expo-symbols` | 1.0.8 | MIT |
| `expo-system-ui` | 6.0.9 | MIT |
| `expo-web-browser` | 15.0.10 | MIT |
| `lucide-react-native` | 0.563.0 | ISC |
| `react` | 19.1.0 | MIT |
| `react-dom` | 19.1.0 | MIT |
| `react-native` | 0.81.5 | MIT |
| `react-native-gesture-handler` | 2.28.0 | MIT |
| `react-native-qrcode-svg` | 6.3.21 | MIT |
| `react-native-reanimated` | 4.1.6 | MIT |
| `react-native-safe-area-context` | 5.6.2 | MIT |
| `react-native-screens` | 4.16.0 | MIT |
| `react-native-svg` | 15.15.1 | MIT |
| `react-native-web` | 0.21.2 | MIT |
| `react-native-webview` | 13.15.0 | MIT |
| `react-native-worklets` | 0.5.1 | MIT |

### Mobile app — development dependencies

| Package | Version | Licence |
| :--- | :--- | :--- |
| `@types/react` | 19.1.17 | MIT |
| `eslint` | 9.39.2 | MIT |
| `eslint-config-expo` | 10.0.0 | MIT |
| `typescript` | 5.9.3 | Apache-2.0 |

---

## Fonts, assets and external services

| Asset / service | Provider | Terms |
| :--- | :--- | :--- |
| **Plus Jakarta Sans** typeface | Tokotype, via Google Fonts | SIL Open Font License 1.1 — free for commercial and personal use, bundled via `@expo-google-fonts` |
| **Lucide** icon set | Lucide contributors (fork of Feather) | ISC |
| **MongoDB Atlas** | MongoDB Inc. | Hosted database service, free tier |
| **Cloudinary** | Cloudinary Ltd. | Media hosting service (SDK installed, not yet wired) |
| **Razorpay** | Razorpay Software Pvt. Ltd. | Payment gateway, test mode |
| **Google Places / Maps Platform** | Google LLC | Location autocomplete in `CreateEventScreen` |
| **Google Sign-In / Sign in with Apple** | Google LLC / Apple Inc. | Federated identity providers |
| **Render** | Render Services Inc. | Backend hosting, free tier |
| **GitHub Actions** | GitHub Inc. | CI runner |

Event posters and seed content in `backend/seedEvents.js` are placeholder demo data authored for
this project; no third-party copyrighted imagery is committed to the repository.

---

## Regenerating this file

```bash
cd backend    && npm ls --all --json > /dev/null   # verify tree resolves
cd mobile-app && npm install                        # lockfile carries the licence field
```

Per-package licences are read from the `license` field of each entry in `package-lock.json`
(`packages["node_modules/<name>"].license`).
