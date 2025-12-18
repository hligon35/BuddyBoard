import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Read EAS projectId from app.json so getExpoPushTokenAsync works reliably in EAS builds.
const EAS_PROJECT_ID = (() => {
  try {
    const cfg = require('../../app.json');
    return cfg?.expo?.extra?.eas?.projectId || '';
  } catch (e) {
    return '';
  }
})();

export function configureNotificationHandling() {
  // Show alerts by default when a notification arrives.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function registerForExpoPushTokenAsync() {
  if (!Device.isDevice) {
    return { ok: false, reason: 'not-device' };
  }

  // iOS will prompt; Android depends on OS version.
  const existing = await Notifications.getPermissionsAsync();
  let status = existing?.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested?.status;
  }

  if (status !== 'granted') {
    return { ok: false, reason: 'permission-denied' };
  }

  // Android: channel required for visible notifications.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync(EAS_PROJECT_ID ? { projectId: EAS_PROJECT_ID } : undefined);
    return { ok: true, token: token?.data || '' };
  } catch (e) {
    return { ok: false, reason: 'token-failed', message: e?.message || String(e) };
  }
}

export default {
  configureNotificationHandling,
  registerForExpoPushTokenAsync,
};
