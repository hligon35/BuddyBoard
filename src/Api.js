import axios from 'axios';
import { BASE_URL, EMULATOR_HOST } from './config';
import { Platform } from 'react-native';
import { logger } from './utils/logger';

function isPhysicalDevice() {
  try {
    // Lazy require to avoid hard dependency in non-Expo runtimes.
    // eslint-disable-next-line global-require
    const DeviceModule = require('expo-device');
    const Device = DeviceModule?.default || DeviceModule;
    return Boolean(Device?.isDevice);
  } catch (e) {
    return false;
  }
}

function looksLikeIpLiteralUrl(url) {
  try {
    const u = new URL(String(url || ''));
    const host = String(u.hostname || '');
    // Simple IPv4 check; this is enough to catch the common "https://1.2.3.4" misconfig.
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return true;
  } catch (e) {
    // ignore
  }
  return false;
}

// Support Android emulator host mapping: if BASE_URL points to localhost
// convert it to the emulator host (10.0.2.2) so requests from the
// Android emulator reach the local machine. This saves editing config
// when testing on emulator.
let effectiveBase = BASE_URL;
try {
  if (Platform.OS === 'android' && BASE_URL && BASE_URL.includes('localhost')) {
    effectiveBase = BASE_URL.replace('localhost', EMULATOR_HOST);
    logger.info('api', 'Rewriting BASE_URL for Android emulator', { baseURL: effectiveBase });
  }
} catch (e) {
  // ignore
}

// Useful for debugging "Network Error" cases from screens.
export const API_BASE_URL = effectiveBase;

try {
  logger.info('api', 'API base URL configured', { baseURL: effectiveBase || '', envBaseURL: BASE_URL || '' });
} catch (e) {
  // ignore
}

const client = axios.create({
  baseURL: effectiveBase,
  timeout: 20000,
  headers: { Accept: 'application/json' },
});

// Fail fast with an actionable message for the most common device-only issues.
client.interceptors.request.use((config) => {
  const base = (config && (config.baseURL ?? client.defaults.baseURL)) || '';
  const baseStr = String(base || '').trim();

  // In React Native (native), an empty base URL makes relative requests fail with
  // a generic axios "Network Error". Surface a clearer error.
  if (!baseStr) {
    const err = new Error(
      'API base URL is not configured. Set EXPO_PUBLIC_API_BASE_URL to a reachable URL (LAN IP or HTTPS domain), then rebuild/restart the app.'
    );
    // Tag for debugging/logging.
    err.code = 'BB_NO_API_BASE_URL';
    throw err;
  }

  // Physical devices cannot reach your development machine via localhost.
  // (Android emulator is handled separately via 10.0.2.2 rewrite above.)
  if (
    isPhysicalDevice() &&
    (baseStr.includes('localhost') || baseStr.includes('127.0.0.1'))
  ) {
    const err = new Error(
      `API base URL points to localhost (${baseStr}), which is not reachable from a physical device. Use your computer's LAN IP (e.g. http://192.168.x.x:3005) or a public HTTPS domain (e.g. https://buddyboard.getsparqd.com).`
    );
    err.code = 'BB_LOCALHOST_ON_DEVICE';
    throw err;
  }

  // TestFlight / App Store builds on iOS are subject to App Transport Security.
  // If the API base URL is accidentally set to http://, axios often reports a generic "Network Error".
  if (
    isPhysicalDevice() &&
    Platform.OS === 'ios' &&
    (typeof __DEV__ === 'undefined' || !__DEV__) &&
    baseStr.startsWith('http://')
  ) {
    const err = new Error(
      `API base URL is HTTP (${baseStr}). iOS TestFlight/App Store builds require HTTPS. Set EXPO_PUBLIC_API_BASE_URL to https://buddyboard.getsparqd.com (or another valid HTTPS domain) and rebuild.`
    );
    err.code = 'BB_IOS_HTTP_BLOCKED';
    throw err;
  }

  // Avoid pointing iOS builds at a raw IP over HTTPS; certificate hostname mismatch will fail the TLS handshake.
  if (
    isPhysicalDevice() &&
    Platform.OS === 'ios' &&
    (typeof __DEV__ === 'undefined' || !__DEV__) &&
    looksLikeIpLiteralUrl(baseStr)
  ) {
    const err = new Error(
      `API base URL appears to use an IP address (${baseStr}). Use a proper HTTPS domain (e.g. https://buddyboard.getsparqd.com) to avoid TLS certificate hostname mismatch, then rebuild.`
    );
    err.code = 'BB_IOS_IP_BASE_URL';
    throw err;
  }

  return config;
});

let unauthorizedHandler = null;
let lastUnauthorizedAt = 0;

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = typeof fn === 'function' ? fn : null;
}

// Debugging interceptors: log requests and responses to help diagnose 401/404s
client.interceptors.request.use((req) => {
  try {
    const auth = req.headers && (req.headers.Authorization || req.headers.authorization);
    const base = req.baseURL || client.defaults.baseURL || '';
    const full = base + (req.url || '');
    logger.debug('api', 'Request', {
      method: req.method && req.method.toUpperCase(),
      url: full,
      auth: !!auth,
    });
  } catch (e) {}
  return req;
}, (err) => {
  logger.warn('api', 'Request error', { message: err && err.message });
  return Promise.reject(err);
});

client.interceptors.response.use((res) => {
  try {
    logger.debug('api', 'Response', {
      status: res.status,
      url: res.config && res.config.url,
    });
  } catch (e) {}
  return res;
}, (err) => {
    try {
      if (err && err.response) {
        const base = err.response.config && (err.response.config.baseURL || client.defaults.baseURL) || '';
        const url = (err.response.config && err.response.config.url) || '';
        logger.warn('api', 'Response error', {
          status: err.response.status,
          url: base + url,
        });
      } else {
        logger.warn('api', 'Network or other error', { message: err && err.message });
      }
    } catch (e) {}
  return Promise.reject(err);
});
// Request/response instrumentation (dev-friendly; redacts auth)
try {
  client.interceptors.request.use((config) => {
    const startedAt = Date.now();
    config.metadata = { startedAt };
    const method = (config.method || 'get').toUpperCase();
    const url = config.url || '';
    logger.debug('api', 'HTTP request', { method, url });
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      const cfg = response.config || {};
      const method = (cfg.method || 'get').toUpperCase();
      const url = cfg.url || '';
      const ms = cfg.metadata?.startedAt ? (Date.now() - cfg.metadata.startedAt) : undefined;
      logger.debug('api', 'HTTP response', { method, url, status: response.status, ms });
      return response;
    },
    (error) => {
      const cfg = error?.config || {};
      const method = (cfg.method || 'get').toUpperCase();
      const url = cfg.url || '';
      const ms = cfg.metadata?.startedAt ? (Date.now() - cfg.metadata.startedAt) : undefined;
      const status = error?.response?.status;
      const dataType = error?.response?.data ? typeof error.response.data : undefined;
      logger.error('api', 'HTTP error', {
        method,
        url,
        status,
        ms,
        message: error?.message,
        responseType: dataType,
      });

      // If auth is missing/expired/invalid, force the app to re-auth.
      // Avoid loops on the login endpoint and avoid spamming.
      try {
        if (status === 401 && url && !String(url).includes('/api/auth/login')) {
          const now = Date.now();
          if (unauthorizedHandler && (now - lastUnauthorizedAt) > 1500) {
            lastUnauthorizedAt = now;
            unauthorizedHandler({ method, url, status });
          }
        }
      } catch (e) {
        // ignore
      }
      return Promise.reject(error);
    }
  );
} catch (e) {
  // ignore
}

export function setAuthToken(token) {
  if (token) {
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    try { logger.info('auth', 'Auth token set', { hasToken: true }); } catch (e) {}
  } else {
    delete client.defaults.headers.common['Authorization'];
    logger.info('auth', 'Auth token cleared', { hasToken: false });
  }
}

// Official axios-backed methods
export async function login(email, password) {
  const res = await client.post('/api/auth/login', { email, password });
  return res.data;
}

export async function signup(payload) {
  const res = await client.post('/api/auth/signup', payload);
  return res.data;
}

export async function verify2fa(payload) {
  const res = await client.post('/api/auth/2fa/verify', payload);
  return res.data;
}

export async function resend2fa(payload) {
  const res = await client.post('/api/auth/2fa/resend', payload);
  return res.data;
}

export async function me() {
  const res = await client.get('/api/auth/me');
  return res.data;
}

export async function getPosts() {
  const res = await client.get('/api/board');
  return res.data;
}

export async function createPost(payload) {
  const send = { ...(payload || {}) };
  // Some dev backends (api-mock) expect `text` instead of `body`.
  if (send.body && !send.text) send.text = send.body;
  const res = await client.post('/api/board', send);
  return res.data;
}

export async function likePost(postId) {
  const res = await client.post('/api/board/like', { postId });
  return res.data;
}

export async function commentPost(postId, comment) {
  const res = await client.post('/api/board/comments', { postId, comment });
  return res.data;
}

export async function reactComment(postId, commentId, emoji) {
  const normalizedEmoji = (emoji && typeof emoji === 'object') ? (emoji.emoji || emoji.reaction || emoji.value) : emoji;
  const res = await client.post('/api/board/comments/react', { postId, commentId, emoji: normalizedEmoji });
  return res.data;
}

export async function uploadMedia(formData) {
  const res = await client.post('/api/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function signS3(key) {
  const res = await client.post('/api/media/sign', { key });
  return res.data;
}

export async function getLinkPreview(url) {
  const res = await client.get('/api/link/preview', { params: { url } });
  return res.data;
}

export async function getUrgentMemos() {
  const res = await client.get('/api/urgent-memos');
  return res.data;
}

// Convenience health check to verify API availability and help debug 404s
export async function health() {
  const res = await client.get('/api/health');
  return res.data;
}

export async function ackUrgentMemo(memoIds) {
  const res = await client.post('/api/urgent-memos/read', { memoIds });
  return res.data;
}

export async function sendUrgentMemo(memo) {
  const res = await client.post('/api/urgent-memos', memo);
  return res.data;
}

export async function respondUrgentMemo(memoId, action) {
  const res = await client.post('/api/urgent-memos/respond', { memoId, action });
  return res.data;
}

export async function getMessages() {
  try {
    const res = await client.get('/api/messages');
    return res.data;
  } catch (err) {
    // Treat 401 as empty messages for dev/test clients that use a fake token
    if (err && err.response && err.response.status === 401) return [];
    throw err;
  }
}

export async function sendMessage(payload) {
  const res = await client.post('/api/messages', payload);
  return res.data;
}

export async function pingArrival(payload) {
  // payload: { lat, lng, userId, role, childId?, eventId?, when? }
  const res = await client.post('/api/arrival/ping', payload);
  return res.data;
}

// Time change proposals: parents propose pickup/dropoff changes, admins accept/reject
export async function proposeTimeChange(payload) {
  // payload: { childId, type: 'pickup'|'dropoff', proposedISO, note, proposerId }
  const res = await client.post('/api/children/propose-time-change', payload);
  return res.data;
}

export async function getTimeChangeProposals() {
  try {
    const res = await client.get('/api/children/time-change-proposals');
    return res.data;
  } catch (err) {
    // If the backend doesn't implement this route yet, treat as empty list
    if (err && err.response && err.response.status === 404) return [];
    throw err;
  }
}

export async function respondTimeChange(proposalId, action) {
  // action: 'accept'|'reject'
  const res = await client.post('/api/children/respond-time-change', { proposalId, action });
  return res.data;
}

export async function sharePost(postId) {
  const res = await client.post('/api/board/share', { postId });
  return res.data;
}

// Push notifications
// Server should store the Expo push token and user preferences.
export async function registerPushToken(payload) {
  try {
    const res = await client.post('/api/push/register', payload);
    return res.data;
  } catch (err) {
    // Allow older backends to function without push support.
    if (err && err.response && err.response.status === 404) return { ok: false, skipped: true };
    throw err;
  }
}

export async function unregisterPushToken(payload) {
  try {
    const res = await client.post('/api/push/unregister', payload);
    return res.data;
  } catch (err) {
    if (err && err.response && err.response.status === 404) return { ok: false, skipped: true };
    throw err;
  }
}

// Backwards-compatible wrappers used by some components
export async function sendMessageApi(payload) {
  return sendMessage(payload);
}

export async function createUrgentMemoApi(payload) {
  const res = await client.post('/api/urgent-memos', payload);
  return res.data;
}

export async function ackUrgentMemoApi(id) {
  // Keep compatibility: ack single id
  const res = await client.post('/api/urgent-memos/read', { memoIds: Array.isArray(id) ? id : [id] });
  return res.data;
}

export default {
  setAuthToken,
  login,
  signup,
  verify2fa,
  me,
  getPosts,
  createPost,
  likePost,
  commentPost,
  uploadMedia,
  signS3,
  getLinkPreview,
  getUrgentMemos,
  ackUrgentMemo,
  sendUrgentMemo,
  respondUrgentMemo,
  getMessages,
  sendMessage,
  sharePost,
  registerPushToken,
  unregisterPushToken,
  // legacy
  sendMessageApi,
  createUrgentMemoApi,
  ackUrgentMemoApi,
};
