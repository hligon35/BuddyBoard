# BuddyBoard (Expo)

This Expo React Native app reproduces the BuddyBoard web app UX with Home, Chats, Urgent Memos, media uploads, auth, and persistence.

Setup

```powershell
cd BuddyBoard
npm install
npm start
# Android emulator: npm run android
# iOS (mac): npm run ios
# Web: npm run web
```

If you see `PluginError: Failed to resolve plugin for module "expo-notifications"`, install deps then restart Metro:

```powershell
npx expo install expo-notifications expo-device
npx expo start -c
```

Configuration

- Set `EXPO_PUBLIC_API_BASE_URL` in your environment to change the API base URL (recommended).
- On Android emulator, if your backend runs on localhost, use `10.0.2.2` as the host.
- (Optional) For address autocomplete in Admin → Arrival Detection Controls, set `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` in your environment.

Notes

- Auth uses token-based approach persisted in `AsyncStorage`.
- DataContext persists posts and messages in `AsyncStorage` and performs optimistic updates.
- Media uploads POST to `/api/media/upload`; S3 signing available via `/api/media/sign` in `src/Api.js`.
- Link previews use `/api/link/preview?url=`.
- Urgent memos are fetched on app start and acknowledged via `/api/urgent-memos/read`.

Docker note

- The `expo` service in `docker-compose.yml` installs project dependencies at container startup. If you customize the image/compose, keep that install step or Expo plugins (like `expo-notifications`) may fail to resolve.

Docker env vars (server)
-----------------------
When running via Docker Compose, put runtime config in a `.env` file next to `docker-compose.yml` on your server (do not commit it). Compose will substitute those values into the containers.

Required (recommended):
- `EXPO_PUBLIC_API_BASE_URL` — API base URL the mobile app will call.
	- For a physical device, this must be reachable from the device (LAN IP or public URL), not `localhost`.

Optional:
- `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` — enables address autocomplete.

Example `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_SERVER_IP:3005
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=
```

After changing `.env`, restart the `expo` service so Metro rebundles with the new values.
# BuddyBoard (React Native scaffold)

This folder contains a scaffolded React Native (Expo) version of the BuddyBoard web app. It's an approximate, hybrid-native shell with placeholder screens and navigation mirroring the web app structure. This scaffold is not installed — run the included `setup.sh` or `setup.ps1` scripts after moving the directory to your target machine to install dependencies and initialize the project.

Files included:
- `App.js` — entry point with navigation
- `/screens` — placeholder screens (Home, Login, Messages, Calendar, Settings, Admin)
- `package.json` — scripts and minimal dependencies
- `setup.sh` / `setup.ps1` — install & bootstrap scripts

Backend integration
-------------------
This scaffold can be wired to your BuddyBoard backend. Prefer setting `EXPO_PUBLIC_API_BASE_URL` to the base URL for your API (example: `https://buddyboard.example.com` or `http://10.0.0.5:3000`) rather than editing code. The mobile app expects the following endpoints (examples):

- `GET  /api/messages` -> returns an array of messages: [{id,title,body,date,sender,read}]
- `POST /api/messages` -> accepts {title,body,sender}, returns the created message with `id` and `date`.
- `GET  /api/urgent-memos` -> returns an array of urgent memos: [{id,title,body,date,ack}]
- `POST /api/urgent-memos` -> accepts {title,body}, returns the created memo with `id` and `date`.
- `POST /api/urgent-memos/:id/ack` -> acknowledge an urgent memo.
- `POST /api/auth/login` -> accepts {email,password}, returns user/session info (optional for demo).

The client implementation is in `src/Api.js`. The `DataContext` uses these methods to hydrate data on startup and to forward created messages/memos to the backend. If the backend is unreachable the app will continue to run using its in-memory seed data.

Run the app
----------
After setting your environment variables:
1. Run `./setup.sh` or `.\setup.ps1` to install dependencies.
2. Run `npm start` or `expo start`.


How to install (on target machine):
1. Move this directory to the desired location.
2. Run `./setup.sh` (Linux/macOS) or `.\setup.ps1` (Windows PowerShell) to install dependencies and initialize Expo.
3. Run `npm start` or `expo start` to launch the app.
