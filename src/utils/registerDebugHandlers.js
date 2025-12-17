import { logger, setDebugContext } from './logger';

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch (e) {
    return String(value);
  }
}

export function registerGlobalDebugHandlers() {
  // Only set up extra handlers in dev to avoid log noise.
  const dev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
  if (!dev) return;

  // Global JS exception handler
  try {
    const ErrorUtils = global.ErrorUtils;
    if (ErrorUtils && typeof ErrorUtils.getGlobalHandler === 'function' && typeof ErrorUtils.setGlobalHandler === 'function') {
      const previous = ErrorUtils.getGlobalHandler();
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        try {
          setDebugContext({ lastFatal: !!isFatal });
          logger.error('global', 'Unhandled JS error', {
            isFatal: !!isFatal,
            name: error?.name,
            message: error?.message || String(error),
            stack: error?.stack,
          });
        } catch (e) {
          // ignore
        }
        try {
          previous && previous(error, isFatal);
        } catch (e) {
          // ignore
        }
      });
      logger.debug('global', 'Registered ErrorUtils global handler');
    }
  } catch (e) {
    // ignore
  }

  // Unhandled promise rejections (RN ships a helper; guard with try/catch)
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const rejectionTracking = require('promise/setimmediate/rejection-tracking');
    if (rejectionTracking && typeof rejectionTracking.enable === 'function') {
      rejectionTracking.enable({
        allRejections: true,
        onUnhandled: (id, error) => {
          logger.error('promise', 'Unhandled promise rejection', {
            id,
            message: error?.message || String(error),
            stack: error?.stack,
          });
        },
        onHandled: (id) => {
          logger.debug('promise', 'Promise rejection handled later', { id });
        },
      });
      logger.debug('promise', 'Enabled rejection tracking');
    }
  } catch (e) {
    logger.debug('promise', 'Rejection tracking unavailable', { error: e?.message || safeStringify(e) });
  }
}

export default registerGlobalDebugHandlers;
