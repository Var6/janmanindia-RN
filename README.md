# Janmanindia Community — React Native (Expo)

Mobile app for **community members only**. Hits the live API at
`https://app.janmanindia.org`. Staff roles are not supported in this app.

## Features

- Login (email + password) with the same accounts as the web app
- Dashboard with quick actions
- My Cases (list + detail with documents, court history, diary)
- Appointments (list + book a meeting with your assigned social worker)
- File a Case (text intake — facts, FIR, police station, etc.)
- Speak to Us (text + voice note recording)
- Emergency SOS
- Profile + sign out
- **Auto-localised UI** — picks **English / Hindi / Marathi** based on the
  phone's system language. Users can override the language any time from
  Profile (choice persists in `AsyncStorage`).

## Adding a language

1. Add the locale code to `SUPPORTED` in `src/lib/i18n.ts`
2. Add the translated string bundle to `STRINGS`
3. Add a display name to `LOCALE_NAMES`
4. The Profile picker, dashboard and stack titles update automatically.

## Run locally

```bash
cd react-native
npm install
npm start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the
QR code with the **Expo Go** app on your phone.

## How auth works

The web app issues an httpOnly `auth-token` cookie. The RN client captures
the `Set-Cookie` header from `/api/auth/login`, persists the cookie value
in `AsyncStorage`, and replays it as a `Cookie` header on every subsequent
request. The cookie key is hard-coded to `auth-token` in
`src/lib/api.ts`.

## Pointing at a different backend

Change `extra.apiBase` in `app.json` (default: `https://app.janmanindia.org`).
For local development against `http://localhost:3000`, use your machine's
LAN IP (e.g. `http://192.168.1.5:3000`) so the device/emulator can reach
it. Note: HTTPS-only cookies will not flow over plain HTTP — point at the
deployed app for end-to-end testing.

## Build a standalone APK / IPA

```bash
npx eas build --profile preview --platform android   # APK
npx eas build --profile production --platform ios    # IPA
```

(Requires an Expo account: `npx eas login`.)

## File layout

```
App.tsx                       Root: auth gate + bottom tabs + stack
src/lib/api.ts                Cookie-aware fetch wrapper
src/lib/theme.ts              Colours, spacing, radius
src/components/Card.tsx       Card wrapper
src/components/StatusBadge.tsx Coloured status pill
src/screens/
  LoginScreen.tsx
  DashboardScreen.tsx
  CaseTrackerScreen.tsx
  CaseDetailScreen.tsx
  AppointmentsScreen.tsx
  FileCaseScreen.tsx
  SpeakToUsScreen.tsx
  SOSScreen.tsx
  ProfileScreen.tsx
assets/icon.png               App icon (copied from web app's logo.png)
```

## Endpoints used

- `POST /api/auth/login` — login
- `POST /api/auth/logout` — logout
- `GET  /api/users/me` — current session
- `GET  /api/users/:id` — fetch SW for booking
- `GET  /api/cases` — community sees only their own cases
- `GET  /api/cases/:id` — case detail
- `POST /api/cases` — file a new case
- `GET  /api/appointments` — my appointments
- `POST /api/appointments` — book one
- `POST /api/sos` — emergency alert
- `POST /api/community/voice-message` — voice / text message to SW
- `POST /api/upload` — voice file upload (returns `{ url }`)
# janmanindia-RN
# janmanindia-RN
