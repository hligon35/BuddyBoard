import * as Sentry from '@sentry/react-native';

export { Sentry };

export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  const environment = process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT;

  Sentry.init({
    dsn,
    environment: environment || undefined,
    enableNative: true,
  });
}
