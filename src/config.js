// Edit this BASE_URL to point at your BuddyBoard backend API.
// Example: 'https://buddyboard.example.com' or 'http://10.0.0.5:3000'
// The mock API on the Pi is exposed on host port 3005 for development.
// Update this if your backend runs on a different host/port.
export const BASE_URL = 'http://10.0.0.187:3005';
// Use `10.0.2.2` for Android emulator when pointing to host machine
export const EMULATOR_HOST = '10.0.2.2';

// Optional: Google Places API key (enables address autocomplete in Admin -> Arrival Controls)
// Leave empty to disable autocomplete.
// Prefer setting via environment variable so it isn't committed:
//   EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=... (Expo will inline EXPO_PUBLIC_* vars)
export const GOOGLE_PLACES_API_KEY = (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY)
  ? String(process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY)
  : '';

// Debug toggles
// - DEBUG_LOGS: enables logger.debug(...) output in dev
// Keep defaults quiet in production builds.
export const DEBUG_LOGS = (typeof __DEV__ !== 'undefined' ? __DEV__ : false);

// - DEBUG_LOG_COLORS: enables ANSI color codes in logs (useful in Metro/terminal)
// Default on in dev.
export const DEBUG_LOG_COLORS = (typeof __DEV__ !== 'undefined' ? __DEV__ : false);

// - DEBUG_LOG_LEVEL: minimum level to emit.
// One of: 'debug' | 'info' | 'warn' | 'error'
// Default: 'debug' in dev, 'info' otherwise.
export const DEBUG_LOG_LEVEL = (typeof __DEV__ !== 'undefined' && __DEV__) ? 'debug' : 'info';

export default {
  BASE_URL,
  EMULATOR_HOST,
  GOOGLE_PLACES_API_KEY,
  DEBUG_LOGS,
  DEBUG_LOG_COLORS,
  DEBUG_LOG_LEVEL,
};
