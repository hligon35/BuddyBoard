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
- By default in dev (including Expo Go), the app auto-logs in with a dev token. To test the real login flow in Expo Go, set `EXPO_PUBLIC_DISABLE_DEV_AUTOLOGIN=1`.

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

API server (SQLite) settings:
- `BB_DATA_DIR` — host directory where BuddyBoard stores its SQLite DB (defaults to `./.data`).
- Uploads are stored under `${BB_DATA_DIR}/uploads` and served at `/uploads/*` from the API.
- `BB_PUBLIC_BASE_URL` — optional; forces the base URL used in uploaded media links (useful behind a reverse proxy/HTTPS).
- `BB_JWT_SECRET` — required for real logins; set a long random value.
- `BB_ADMIN_EMAIL` / `BB_ADMIN_PASSWORD` / `BB_ADMIN_NAME` — optional admin seed on first run.
- `BB_ALLOW_SIGNUP=1` (or `true`) — optional; enables `/api/auth/signup`.
- `BB_ALLOW_DEV_TOKEN=1` (or `true`) — optional; enables accepting `Bearer dev-token` for local/dev only. Default is enabled when `NODE_ENV` is not `production`.

Example `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_SERVER_IP:3005
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=
BB_DATA_DIR=/mnt/bigdrive/buddyboard
BB_JWT_SECRET=replace-with-long-random
BB_ALLOW_SIGNUP=0
BB_ALLOW_DEV_TOKEN=0
BB_ADMIN_EMAIL=
BB_ADMIN_PASSWORD=
BB_ADMIN_NAME=Admin
```

After changing `.env`, restart the `expo` service so Metro rebundles with the new values.

Production HTTPS (recommended)
------------------------------
For App Store / Play Store builds (and iOS reliability), use a stable HTTPS domain.

This repo includes a minimal Caddy reverse-proxy setup:
- [Caddyfile](Caddyfile) proxies `https://buddyboard.getsparqd.com` to the `api` service.
- [docker-compose.prod.yml](docker-compose.prod.yml) runs Caddy and prevents exposing the API port directly.

DNS / networking requirements:
- Create a DNS A record for `buddyboard.getsparqd.com` pointing to your *public/WAN* IPv4 address (not the server's `10.x.x.x` LAN IP).
- Forward ports `80` and `443` on your router/firewall to the server.

Add these to your server `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=https://buddyboard.getsparqd.com
BB_PUBLIC_BASE_URL=https://buddyboard.getsparqd.com
```

Start production services:

```sh
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build api caddy
```

Using an existing `caddy-central` (recommended if 80/443 already in use)
-----------------------------------------------------------------------
If you already run a central Caddy container that owns ports `80`/`443` (for multiple apps), do **not** start this repo's `caddy` service.

1) Start BuddyBoard services (API + web) normally:

```sh
cd /srv/apps/BuddyBoard
docker compose up -d --build BuddyBoardApp api
```

2) Attach `caddy-central` to the BuddyBoard network so it can reach `api` and `BuddyBoardApp` by service name:

```sh
docker network connect buddyboard_default caddy-central
```

3) Add BuddyBoard routing to your central Caddyfile. A ready-to-copy snippet is included here:
- [caddy-central.buddyboard.getsparqd.com.caddy](caddy-central.buddyboard.getsparqd.com.caddy)

After updating caddy-central's config, reload it and verify:

```sh
curl -i https://buddyboard.getsparqd.com/api/health
```

Server deploy: always match GitHub
-------------------------------
If you want the server checkout to **always match GitHub** (no local edits), use the server compose overrides in [docker-compose.server.yml](docker-compose.server.yml).

This avoids bind-mounting the repo into containers (which can otherwise mutate `package-lock.json` on the server).

On the server:

```sh
cd /srv/apps/BuddyBoard
git fetch origin
git checkout master || git checkout -b master origin/master
git reset --hard origin/master
git clean -fd
docker compose -f docker-compose.yml -f docker-compose.server.yml up -d --build BuddyBoardApp api
```

GitHub Actions auto-deploy (push-to-master)
------------------------------------------
This repo includes a workflow [deploy-server.yml](.github/workflows/deploy-server.yml) that can deploy on every push to `master`.

Add these repository secrets:
- `DEPLOY_HOST` (example: `1.2.3.4`)
- `DEPLOY_USER` (example: `creator`)
- `DEPLOY_SSH_KEY` (private key for SSH)
- `DEPLOY_PATH` (example: `/srv/apps/BuddyBoard`)
- `DEPLOY_PORT` (optional; default is 22)
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
