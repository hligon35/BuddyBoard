import axios from 'axios';
import { BASE_URL, EMULATOR_HOST } from './config';
import { Platform } from 'react-native';

// Support Android emulator host mapping: if BASE_URL points to localhost
// convert it to the emulator host (10.0.2.2) so requests from the
// Android emulator reach the local machine. This saves editing config
// when testing on emulator.
let effectiveBase = BASE_URL;
try {
  if (Platform.OS === 'android' && BASE_URL && BASE_URL.includes('localhost')) {
    effectiveBase = BASE_URL.replace('localhost', EMULATOR_HOST);
    console.log('Api: Rewriting BASE_URL for Android emulator ->', effectiveBase);
  }
} catch (e) {
  // ignore
}

const client = axios.create({
  baseURL: effectiveBase,
  timeout: 20000,
  headers: { Accept: 'application/json' },
});

// Debugging interceptors: log requests and responses to help diagnose 401/404s
client.interceptors.request.use((req) => {
  try {
    const auth = req.headers && (req.headers.Authorization || req.headers.authorization);
    console.log('[Api] Request:', req.method && req.method.toUpperCase(), req.url, auth ? '[auth]' : '[no-auth]');
  } catch (e) {}
  return req;
}, (err) => {
  console.warn('[Api] Request error', err && err.message);
  return Promise.reject(err);
});

client.interceptors.response.use((res) => {
  try { console.log('[Api] Response:', res.status, res.config && res.config.url); } catch (e) {}
  return res;
}, (err) => {
  try {
    if (err && err.response) {
      console.warn('[Api] Response error:', err.response.status, err.response.config && err.response.config.url, err.response.data);
    } else {
      console.warn('[Api] Network or other error:', err && err.message);
    }
  } catch (e) {}
  return Promise.reject(err);
});

export function setAuthToken(token) {
  if (token) {
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    try { console.log('[Api] Auth token set:', (token || '').toString().slice(0,8) + '...'); } catch (e) {}
  } else {
    delete client.defaults.headers.common['Authorization'];
    console.log('[Api] Auth token cleared');
  }
}

// Official axios-backed methods
export async function login(email, password) {
  const res = await client.post('/api/auth/login', { email, password });
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
  const res = await client.post('/api/board', payload);
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

export async function getMessages() {
  const res = await client.get('/api/messages');
  return res.data;
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
  const res = await client.get('/api/children/time-change-proposals');
  return res.data;
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
  getMessages,
  sendMessage,
  // legacy
  sendMessageApi,
  createUrgentMemoApi,
  ackUrgentMemoApi,
};
