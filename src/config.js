const getExpoPublicEnv = (key) => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key] != null) {
      return String(process.env[key]);
    }
  } catch (_) {
    // no-op
  }
  return '';
};

// API base URL
// Prefer environment-driven config so dev/staging/prod can be swapped without code edits:
//   EXPO_PUBLIC_API_BASE_URL=https://buddyboard.example.com
// In production builds, this should be set via EAS/CI secrets.
const fallbackDevBaseUrl = 'http://localhost:3005';
export const BASE_URL =
  getExpoPublicEnv('EXPO_PUBLIC_API_BASE_URL') ||
  ((typeof __DEV__ !== 'undefined' && __DEV__) ? fallbackDevBaseUrl : '');

try {
  if (!BASE_URL && !(typeof __DEV__ !== 'undefined' && __DEV__)) {
    console.warn('[config] Missing EXPO_PUBLIC_API_BASE_URL for production build');
  }
} catch (_) {
  // no-op
}
// Use `10.0.2.2` for Android emulator when pointing to host machine
export const EMULATOR_HOST = '10.0.2.2';

// Optional: Google Places API key (enables address autocomplete in Admin -> Arrival Controls)
// Leave empty to disable autocomplete.
// Prefer setting via environment variable so it isn't committed:
//   EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=... (Expo will inline EXPO_PUBLIC_* vars)
export const GOOGLE_PLACES_API_KEY = getExpoPublicEnv('EXPO_PUBLIC_GOOGLE_PLACES_API_KEY');

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
