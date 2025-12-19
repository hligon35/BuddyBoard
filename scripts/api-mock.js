const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory mock data
let posts = [
  { id: 1, author: 'Teacher', text: 'Welcome to BuddyBoard!', likes: 0, createdAt: new Date().toISOString() }
];
let messages = [];
let urgentMemos = [];
let timeChangeProposals = [];
let pushTokens = []; // { token, userId, platform, enabled, preferences, updatedAt }

function nanoId() {
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

app.get('/api/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

app.get('/api/board', (req, res) => res.json(posts));
app.post('/api/board', (req, res) => {
  const id = posts.length ? posts[posts.length-1].id + 1 : 1;
  const item = { id, author: req.body.author || 'Dev', text: req.body.text || '', likes: 0, createdAt: new Date().toISOString() };
  posts.unshift(item);
  res.status(201).json(item);
});

app.post('/api/board/like', (req, res) => {
  const { postId } = req.body;
  const p = posts.find(x => x.id === postId);
  if (p) p.likes++;
  res.json({ ok: true });
});

app.get('/api/messages', (req, res) => res.json(messages));
app.post('/api/messages', (req, res) => {
  const id = messages.length ? messages[messages.length-1].id + 1 : 1;
  const m = { id, title: req.body.title || '', body: req.body.body || '', sender: req.body.sender || 'Dev', date: new Date().toISOString(), read: false };
  messages.unshift(m);
  res.status(201).json(m);
});

app.get('/api/urgent-memos', (req, res) => res.json(urgentMemos));
app.post('/api/urgent-memos', (req, res) => {
  const p = req.body || {};
  const type = p.type || 'urgent_memo';
  const createdAt = new Date().toISOString();
  const m = {
    id: nanoId(),
    type,
    status: p.status || (type === 'time_update' || type === 'arrival_alert' ? 'pending' : 'sent'),
    proposerId: p.proposerId || null,
    actorRole: p.actorRole || p.role || null,
    childId: p.childId || null,
    updateType: p.updateType || null,
    proposedISO: p.proposedISO || null,
    note: p.note || '',
    subject: p.subject || '',
    title: p.title || (type === 'arrival_alert' ? 'Arrival' : (type === 'admin_memo' ? (p.subject || 'Admin Memo') : 'Urgent')),
    body: p.body || p.note || '',
    recipients: Array.isArray(p.recipients) ? p.recipients : [],
    meta: (p.meta && typeof p.meta === 'object') ? p.meta : {},
    ack: false,
    respondedAt: null,
    date: createdAt,
    createdAt,
    updatedAt: createdAt,
  };
  urgentMemos.unshift(m);
  res.status(201).json(m);
});

app.post('/api/urgent-memos/read', (req, res) => {
  const ids = Array.isArray(req.body.memoIds) ? req.body.memoIds : [];
  urgentMemos.forEach(u => { if (ids.includes(u.id)) u.ack = true; });
  res.json({ ok: true });
});

// Admin responds to a memo/alert
app.post('/api/urgent-memos/respond', (req, res) => {
  const memoId = req.body && req.body.memoId ? String(req.body.memoId) : '';
  const action = req.body && req.body.action ? String(req.body.action) : '';
  if (!memoId || !action) return res.status(400).json({ ok: false, error: 'memoId and action required' });
  const idx = urgentMemos.findIndex((m) => String(m.id) === memoId);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'not found' });
  const t = new Date().toISOString();
  urgentMemos[idx] = { ...urgentMemos[idx], status: action, respondedAt: t, updatedAt: t };
  res.json({ ok: true, id: memoId, status: action, respondedAt: t, updatedAt: t });
});

// Arrival ping: store an arrival alert for admins (deduped)
app.post('/api/arrival/ping', (req, res) => {
  const p = req.body || {};
  const role = (p.role || '').toString().toLowerCase();
  if (role !== 'parent' && role !== 'therapist') return res.json({ ok: true });
  const actorId = p.userId ? String(p.userId) : 'unknown';
  const childId = p.childId != null ? String(p.childId) : null;

  const recent = urgentMemos.find((m) => m.type === 'arrival_alert' && m.proposerId === actorId && String(m.childId || '') === String(childId || '') && (Date.now() - new Date(m.createdAt).getTime()) < 10 * 60 * 1000);
  if (!recent) {
    const createdAt = new Date().toISOString();
    urgentMemos.unshift({
      id: nanoId(),
      type: 'arrival_alert',
      status: 'pending',
      proposerId: actorId,
      actorRole: role,
      childId,
      title: role === 'therapist' ? 'Therapist Arrival' : 'Parent Arrival',
      body: '',
      note: '',
      meta: {
        lat: p.lat != null ? Number(p.lat) : null,
        lng: p.lng != null ? Number(p.lng) : null,
        distanceMiles: p.distanceMiles != null ? Number(p.distanceMiles) : null,
        dropZoneMiles: p.dropZoneMiles != null ? Number(p.dropZoneMiles) : null,
        when: p.when || createdAt,
      },
      recipients: [],
      ack: false,
      respondedAt: null,
      date: createdAt,
      createdAt,
      updatedAt: createdAt,
    });
  }
  res.json({ ok: true });
});

app.get('/api/children/time-change-proposals', (req, res) => res.json(timeChangeProposals));
app.post('/api/children/propose-time-change', (req, res) => {
  const id = timeChangeProposals.length ? timeChangeProposals[timeChangeProposals.length-1].id + 1 : 1;
  const p = { id, childId: req.body.childId || 1, type: req.body.type || 'pickup', proposedISO: req.body.proposedISO || new Date().toISOString(), note: req.body.note || '', proposerId: req.body.proposerId || 0 };
  timeChangeProposals.unshift(p);
  res.status(201).json(p);
});

app.post('/api/children/respond-time-change', (req, res) => {
  const { proposalId, action } = req.body;
  const idx = timeChangeProposals.findIndex(t => t.id === proposalId);
  if (idx !== -1) {
    const item = timeChangeProposals[idx];
    item.action = action;
    res.json({ ok: true, item });
  } else res.status(404).json({ error: 'not found' });
});

app.post('/api/media/sign', (req, res) => {
  // return fake presign info
  const key = req.body.key || `uploads/${Date.now()}`;
  res.json({ url: `http://minio:9000/${key}`, fields: {}, key });
});

// Push notifications (Expo)
app.post('/api/push/register', (req, res) => {
  const token = (req.body && req.body.token) ? String(req.body.token) : '';
  const userId = (req.body && req.body.userId) ? String(req.body.userId) : '';
  const platform = (req.body && req.body.platform) ? String(req.body.platform) : '';
  const enabled = (req.body && typeof req.body.enabled === 'boolean') ? req.body.enabled : true;
  const preferences = (req.body && typeof req.body.preferences === 'object') ? req.body.preferences : {};

  if (!token) return res.status(400).json({ ok: false, error: 'token required' });

  const now = new Date().toISOString();
  const idx = pushTokens.findIndex((t) => t.token === token);
  const record = { token, userId, platform, enabled, preferences, updatedAt: now };
  if (idx === -1) pushTokens.push(record);
  else pushTokens[idx] = record;

  res.json({ ok: true, stored: true });
});

app.post('/api/push/unregister', (req, res) => {
  const token = (req.body && req.body.token) ? String(req.body.token) : '';
  if (!token) return res.status(400).json({ ok: false, error: 'token required' });
  pushTokens = pushTokens.filter((t) => t.token !== token);
  res.json({ ok: true, removed: true });
});

app.get('/api/push/tokens', (req, res) => {
  res.json({ ok: true, tokens: pushTokens });
});

// Send a test push via Expo push service.
app.post('/api/push/send-test', async (req, res) => {
  const to = (req.body && req.body.to) ? String(req.body.to) : (pushTokens[0] ? pushTokens[0].token : '');
  if (!to) return res.status(400).json({ ok: false, error: 'no token available; register first' });

  const title = (req.body && req.body.title) ? String(req.body.title) : 'BuddyBoard Test';
  const body = (req.body && req.body.body) ? String(req.body.body) : 'This is a test push notification.';
  const data = (req.body && typeof req.body.data === 'object') ? req.body.data : { kind: 'test' };

  try {
    if (typeof fetch !== 'function') {
      return res.status(500).json({ ok: false, error: 'Node fetch() is not available. Use Node 18+ or add a fetch polyfill.' });
    }
    const payload = [{ to, title, body, data, sound: 'default' }];
    const resp = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await resp.json();
    res.json({ ok: true, expo: json });
  } catch (e) {
    res.status(500).json({ ok: false, error: e && e.message ? e.message : String(e) });
  }
});

app.listen(3005, '0.0.0.0', () => console.log('API mock listening on port 3005'));
