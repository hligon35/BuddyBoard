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

export function setAuthToken(token) {
  if (token) {
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common['Authorization'];
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
