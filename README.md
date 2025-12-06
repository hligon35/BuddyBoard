# BuddyBoard (React Native scaffold)

This folder contains a scaffolded React Native (Expo) version of the BuddyBoard web app. It's an approximate, hybrid-native shell with placeholder screens and navigation mirroring the web app structure. This scaffold is not installed — run the included `setup.sh` or `setup.ps1` scripts after moving the directory to your target machine to install dependencies and initialize the project.

Files included:
- `App.js` — entry point with navigation
- `/screens` — placeholder screens (Home, Login, Messages, Calendar, Settings, Admin)
- `package.json` — scripts and minimal dependencies
- `setup.sh` / `setup.ps1` — install & bootstrap scripts

Backend integration
-------------------
This scaffold can be wired to your BuddyBoard backend. Edit `src/config.js` and set `BASE_URL` to the base URL for your API (example: `https://buddyboard.example.com` or `http://10.0.0.5:3000`). The mobile app expects the following endpoints (examples):

- `GET  /api/messages` -> returns an array of messages: [{id,title,body,date,sender,read}]
- `POST /api/messages` -> accepts {title,body,sender}, returns the created message with `id` and `date`.
- `GET  /api/urgent-memos` -> returns an array of urgent memos: [{id,title,body,date,ack}]
- `POST /api/urgent-memos` -> accepts {title,body}, returns the created memo with `id` and `date`.
- `POST /api/urgent-memos/:id/ack` -> acknowledge an urgent memo.
- `POST /api/auth/login` -> accepts {email,password}, returns user/session info (optional for demo).

The client implementation is in `src/Api.js`. The `DataContext` uses these methods to hydrate data on startup and to forward created messages/memos to the backend. If the backend is unreachable the app will continue to run using its in-memory seed data.

Run the app
----------
After editing `src/config.js`:
1. Run `./setup.sh` or `.\setup.ps1` to install dependencies.
2. Run `npm start` or `expo start`.


How to install (on target machine):
1. Move this directory to the desired location.
2. Run `./setup.sh` (Linux/macOS) or `.\setup.ps1` (Windows PowerShell) to install dependencies and initialize Expo.
3. Run `npm start` or `expo start` to launch the app.
