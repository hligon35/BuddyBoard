import { BASE_URL } from './config';

let authToken = null;

export function setAuthToken(token){
  authToken = token;
}

async function request(path, opts = {}){
  const url = `${BASE_URL.replace(/\/$/, '')}${path}`;
  const baseHeaders = { 'Content-Type': 'application/json' };
  if (authToken) baseHeaders['Authorization'] = `Bearer ${authToken}`;
  try{
    const res = await fetch(url, { headers: baseHeaders, ...opts });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Request failed ${res.status}: ${text}`);
    }
    const content = await res.text();
    return content ? JSON.parse(content) : null;
  }catch(e){
    throw e;
  }
}

export async function login(email, password){
  return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function getMessages(){
  return request('/api/messages');
}

export async function sendMessageApi({ title, body, sender }){
  return request('/api/messages', { method: 'POST', body: JSON.stringify({ title, body, sender }) });
}

export async function getUrgentMemos(){
  return request('/api/urgent-memos');
}

export async function createUrgentMemoApi({ title, body }){
  return request('/api/urgent-memos', { method: 'POST', body: JSON.stringify({ title, body }) });
}

export async function ackUrgentMemoApi(id){
  return request(`/api/urgent-memos/${encodeURIComponent(id)}/ack`, { method: 'POST' });
}

export default { login, getMessages, sendMessageApi, getUrgentMemos, createUrgentMemoApi, ackUrgentMemoApi };
