// Edit this BASE_URL to point at your BuddyBoard backend API.
// Example: 'https://buddyboard.example.com' or 'http://10.0.0.5:3000'
// The mock API on the Pi is exposed on host port 3005 for development.
// Update this if your backend runs on a different host/port.
export const BASE_URL = 'http://10.0.0.187:3005';
// Use `10.0.2.2` for Android emulator when pointing to host machine
export const EMULATOR_HOST = '10.0.2.2';

export default {
  BASE_URL,
  EMULATOR_HOST,
};
