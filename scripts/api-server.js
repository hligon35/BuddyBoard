#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const multer = require('multer');

const PORT = Number(process.env.PORT || 3005);
const DB_PATH = process.env.BB_DB_PATH || path.join(process.cwd(), '.data', 'buddyboard.sqlite');
const JWT_SECRET = process.env.BB_JWT_SECRET || '';
const NODE_ENV = String(process.env.NODE_ENV || '').trim().toLowerCase();
const PUBLIC_BASE_URL = (process.env.BB_PUBLIC_BASE_URL || '').trim();

function envFlag(value, defaultValue = false) {
  if (value == null) return defaultValue;
  const v = String(value).trim().toLowerCase();
  if (v === '') return defaultValue;
  if (['1', 'true', 'yes', 'y', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(v)) return false;
  return defaultValue;
}

const ALLOW_SIGNUP = envFlag(process.env.BB_ALLOW_SIGNUP, false);
// Dev compatibility: allow the mobile app's __DEV__ auto-login token.
// Default: enabled outside production, disabled in production.
const ALLOW_DEV_TOKEN = envFlag(process.env.BB_ALLOW_DEV_TOKEN, NODE_ENV !== 'production');

const ADMIN_EMAIL = process.env.BB_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.BB_ADMIN_PASSWORD || '';
const ADMIN_NAME = process.env.BB_ADMIN_NAME || 'Admin';

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function nowISO() {
  return new Date().toISOString();
}

function nanoId() {
  // simple, dependency-free id
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

ensureDir(path.dirname(DB_PATH));
const db = new Database(DB_PATH);

const UPLOAD_DIR = process.env.BB_UPLOAD_DIR
  ? String(process.env.BB_UPLOAD_DIR)
  : path.join(path.dirname(DB_PATH), 'uploads');

ensureDir(UPLOAD_DIR);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  author_json TEXT,
  title TEXT,
  body TEXT,
  image TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  comments_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT,
  body TEXT NOT NULL,
  sender_json TEXT,
  to_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS urgent_memos (
  id TEXT PRIMARY KEY,
  type TEXT,
  status TEXT,
  proposer_id TEXT,
  actor_role TEXT,
  child_id TEXT,
  update_type TEXT,
  proposed_iso TEXT,
  note TEXT,
  subject TEXT,
  title TEXT,
  body TEXT,
  recipients_json TEXT,
  meta_json TEXT,
  ack INTEGER NOT NULL DEFAULT 0,
  responded_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS time_change_proposals (
  id TEXT PRIMARY KEY,
  child_id TEXT,
  type TEXT,
  proposed_iso TEXT,
  note TEXT,
  proposer_id TEXT,
  action TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS push_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT,
  platform TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  preferences_json TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS arrival_pings (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  role TEXT,
  child_id TEXT,
  lat REAL,
  lng REAL,
  event_id TEXT,
  when_iso TEXT,
  created_at TEXT NOT NULL
);
`);

// Lightweight migrations for existing SQLite DBs.
// SQLite doesn't support ADD COLUMN IF NOT EXISTS everywhere, so we do best-effort adds.
function ensureColumn(table, columnDef) {
  try {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`).run();
  } catch (_) {
    // ignore (already exists or cannot alter)
  }
}

ensureColumn('urgent_memos', 'type TEXT');
ensureColumn('urgent_memos', 'status TEXT');
ensureColumn('urgent_memos', 'proposer_id TEXT');
ensureColumn('urgent_memos', 'actor_role TEXT');
ensureColumn('urgent_memos', 'child_id TEXT');
ensureColumn('urgent_memos', 'update_type TEXT');
ensureColumn('urgent_memos', 'proposed_iso TEXT');
ensureColumn('urgent_memos', 'note TEXT');
ensureColumn('urgent_memos', 'subject TEXT');
ensureColumn('urgent_memos', 'recipients_json TEXT');
ensureColumn('urgent_memos', 'meta_json TEXT');
ensureColumn('urgent_memos', 'responded_at TEXT');
ensureColumn('urgent_memos', 'updated_at TEXT');

function safeJsonParse(text, fallback) {
  try {
    if (!text) return fallback;
    return JSON.parse(text);
  } catch (_) {
    return fallback;
  }
}

function roleLower(u) {
  try { return String(u && u.role ? u.role : '').trim().toLowerCase(); } catch (_) { return ''; }
}

function isAdminUser(u) {
  const r = roleLower(u);
  return r === 'admin' || r === 'administrator';
}

function safeString(v) {
  try {
    if (v == null) return '';
    return String(v);
  } catch (_) {
    return '';
  }
}

function hasExpoPushToken(token) {
  const t = safeString(token).trim();
  return t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken[');
}

function pushPrefAllows(preferences, kind) {
  // Preferences are opt-in toggles stored by the mobile Settings screen.
  // If preferences are missing/empty, default to allowing pushes.
  if (!preferences || typeof preferences !== 'object') return true;
  const keys = Object.keys(preferences);
  if (!keys.length) return true;
  if (kind === 'updates') return Boolean(preferences.updates ?? preferences.other ?? true);
  if (kind === 'other') return Boolean(preferences.other ?? preferences.updates ?? true);
  // fallback
  return true;
}

async function sendExpoPush(tokens, { title, body, data } = {}) {
  try {
    if (!Array.isArray(tokens) || !tokens.length) return { ok: true, skipped: true, reason: 'no-tokens' };
    if (typeof fetch !== 'function') {
      console.warn('[api] fetch() not available; skipping push send');
      return { ok: false, skipped: true, reason: 'no-fetch' };
    }

    const unique = Array.from(new Set(tokens.map((t) => safeString(t).trim()))).filter(hasExpoPushToken);
    if (!unique.length) return { ok: true, skipped: true, reason: 'no-valid-tokens' };

    const messages = unique.map((to) => ({
      to,
      title: safeString(title || 'BuddyBoard'),
      body: safeString(body || ''),
      data: (data && typeof data === 'object') ? data : {},
      sound: 'default',
    }));

    const resp = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    const json = await resp.json().catch(() => null);

    // Best-effort cleanup for invalid/unregistered tokens.
    // Expo returns tickets in the same order as the messages array.
    try {
      const tickets = json && Array.isArray(json.data) ? json.data : null;
      if (resp.ok && tickets && tickets.length === messages.length) {
        const tokensToDelete = [];
        for (let i = 0; i < tickets.length; i += 1) {
          if (shouldDeleteTokenForExpoError(tickets[i])) tokensToDelete.push(messages[i].to);
        }
        const deleted = deletePushTokens(tokensToDelete);
        if (deleted) console.log(`[api] push cleanup: deleted ${deleted} invalid token(s)`);
      }
    } catch (_) {
      // ignore cleanup failures
    }

    return { ok: resp.ok, status: resp.status, expo: json };
  } catch (e) {
    console.warn('[api] push send failed', e && e.message ? e.message : String(e));
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}

function getAdminUserIds() {
  try {
    const rows = db.prepare('SELECT id, role FROM users').all();
    const ids = [];
    for (const r of rows) {
      const role = safeString(r.role).trim().toLowerCase();
      if (role === 'admin' || role === 'administrator') ids.push(String(r.id));
    }
    // Dev convenience: allow dev-token users to receive admin pushes.
    ids.push('dev');
    return Array.from(new Set(ids.filter(Boolean)));
  } catch (_) {
    return ['dev'];
  }
}

function getPushTokensForUsers(userIds, { kind } = {}) {
  try {
    if (!Array.isArray(userIds) || !userIds.length) return [];
    const placeholders = userIds.map(() => '?').join(',');
    const rows = db.prepare(
      `SELECT token, enabled, preferences_json FROM push_tokens WHERE enabled = 1 AND user_id IN (${placeholders})`
    ).all(...userIds.map(String));

    const out = [];
    for (const row of rows) {
      const token = safeString(row.token).trim();
      if (!token) continue;
      const prefs = safeJsonParse(row.preferences_json, {});
      if (kind && !pushPrefAllows(prefs, kind)) continue;
      out.push(token);
    }
    return Array.from(new Set(out));
  } catch (_) {
    return [];
  }
}

function deletePushTokens(tokens) {
  try {
    if (!Array.isArray(tokens) || !tokens.length) return 0;
    const unique = Array.from(new Set(tokens.map((t) => safeString(t).trim()))).filter(Boolean);
    if (!unique.length) return 0;
    const placeholders = unique.map(() => '?').join(',');
    const info = db.prepare(`DELETE FROM push_tokens WHERE token IN (${placeholders})`).run(...unique);
    return Number(info && typeof info.changes === 'number' ? info.changes : 0);
  } catch (_) {
    return 0;
  }
}

function shouldDeleteTokenForExpoError(expoTicket) {
  // Expo ticket format: { status: 'error', message, details: { error: 'DeviceNotRegistered' | ... } }
  try {
    if (!expoTicket || expoTicket.status !== 'error') return false;
    const details = expoTicket.details && typeof expoTicket.details === 'object' ? expoTicket.details : {};
    const code = safeString(details.error).trim();
    // Only delete for terminal token problems.
    return code === 'DeviceNotRegistered' || code === 'InvalidExpoPushToken';
  } catch (_) {
    return false;
  }
}

function normalizeRecipients(input) {
  if (!Array.isArray(input)) return [];
  const ids = [];
  for (const item of input) {
    if (!item) continue;
    if (typeof item === 'string' || typeof item === 'number') ids.push(String(item));
    else if (typeof item === 'object' && item.id != null) ids.push(String(item.id));
  }
  return Array.from(new Set(ids.filter(Boolean)));
}

function userToClient(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
  };
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function requireJwtConfigured() {
  if (!JWT_SECRET) {
    console.warn('[api] Missing BB_JWT_SECRET. Set this in server environment for production.');
  }
}

requireJwtConfigured();

// Seed admin user if configured
try {
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(ADMIN_EMAIL);
    if (!existing) {
      const id = nanoId();
      const hash = bcrypt.hashSync(ADMIN_PASSWORD, 12);
      const t = nowISO();
      db.prepare('INSERT INTO users (id,email,password_hash,name,role,created_at,updated_at) VALUES (?,?,?,?,?,?,?)')
        .run(id, ADMIN_EMAIL, hash, ADMIN_NAME, 'ADMIN', t, t);
      console.log('[api] Seeded admin user:', ADMIN_EMAIL);
    }
  }
} catch (e) {
  console.warn('[api] Admin seed failed:', e && e.message ? e.message : String(e));
}

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));

// Serve uploaded media. Files are stored under the same host-mounted .data dir.
app.use('/uploads', express.static(UPLOAD_DIR));

function buildPublicUrl(req, pathname) {
  const p = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (PUBLIC_BASE_URL) return `${PUBLIC_BASE_URL.replace(/\/$/, '')}${p}`;
  const proto = (req.headers['x-forwarded-proto'] ? String(req.headers['x-forwarded-proto']).split(',')[0].trim() : '') || req.protocol;
  const host = (req.headers['x-forwarded-host'] ? String(req.headers['x-forwarded-host']).split(',')[0].trim() : '') || req.get('host');
  return `${proto}://${host}${p}`;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const orig = (file && file.originalname) ? String(file.originalname) : 'upload';
      const ext = path.extname(orig).slice(0, 12);
      const safeBase = path.basename(orig, ext).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'file';
      cb(null, `${nanoId()}_${safeBase}${ext}`);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const token = String(header).startsWith('Bearer ') ? String(header).slice(7) : '';

  if (ALLOW_DEV_TOKEN && token === 'dev-token') {
    req.user = { id: 'dev', email: 'dev@example.com', name: 'Developer', role: 'ADMIN' };
    return next();
  }

  if (!token) return res.status(401).json({ ok: false, error: 'missing auth token' });
  if (!JWT_SECRET) return res.status(500).json({ ok: false, error: 'server missing BB_JWT_SECRET' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = payload && payload.sub ? String(payload.sub) : '';
    if (!userId) return res.status(401).json({ ok: false, error: 'invalid token' });

    const row = db.prepare('SELECT id,email,name,role FROM users WHERE id = ?').get(userId);
    if (!row) return res.status(401).json({ ok: false, error: 'user not found' });
    req.user = userToClient(row);
    return next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: 'invalid token' });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Auth
app.post('/api/auth/login', (req, res) => {
  const email = (req.body && req.body.email) ? String(req.body.email).trim().toLowerCase() : '';
  const password = (req.body && req.body.password) ? String(req.body.password) : '';
  if (!email || !password) return res.status(400).json({ ok: false, error: 'email and password required' });

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!row) return res.status(401).json({ ok: false, error: 'invalid credentials' });
  const ok = bcrypt.compareSync(password, row.password_hash);
  if (!ok) return res.status(401).json({ ok: false, error: 'invalid credentials' });

  if (!JWT_SECRET) return res.status(500).json({ ok: false, error: 'server missing BB_JWT_SECRET' });

  const user = userToClient(row);
  const token = signToken(user);
  res.json({ token, user });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ ok: true, user: req.user });
});

// Optional signup (off by default)
app.post('/api/auth/signup', (req, res) => {
  if (!ALLOW_SIGNUP) return res.status(403).json({ ok: false, error: 'signup disabled' });

  const email = (req.body && req.body.email) ? String(req.body.email).trim().toLowerCase() : '';
  const password = (req.body && req.body.password) ? String(req.body.password) : '';
  const name = (req.body && req.body.name) ? String(req.body.name).trim() : '';
  const role = (req.body && req.body.role) ? String(req.body.role).trim() : 'parent';

  if (!email || !password || !name) return res.status(400).json({ ok: false, error: 'name, email, password required' });
  if (!JWT_SECRET) return res.status(500).json({ ok: false, error: 'server missing BB_JWT_SECRET' });

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ ok: false, error: 'email already exists' });

  const id = nanoId();
  const hash = bcrypt.hashSync(password, 12);
  const t = nowISO();
  db.prepare('INSERT INTO users (id,email,password_hash,name,role,created_at,updated_at) VALUES (?,?,?,?,?,?,?)')
    .run(id, email, hash, name, role, t, t);

  const user = { id, email, name, role };
  const token = signToken(user);
  res.status(201).json({ token, user });
});

// Board / Posts
app.get('/api/board', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM posts ORDER BY datetime(created_at) DESC').all();
  const out = rows.map((r) => {
    const author = safeJsonParse(r.author_json, null);
    const comments = safeJsonParse(r.comments_json, []);
    return {
      id: r.id,
      author,
      title: r.title || '',
      body: r.body || '',
      text: r.body || '',
      image: r.image || undefined,
      likes: r.likes || 0,
      shares: r.shares || 0,
      comments,
      createdAt: r.created_at,
    };
  });
  res.json(out);
});

app.post('/api/board', authMiddleware, (req, res) => {
  const title = (req.body && req.body.title) ? String(req.body.title) : '';
  const body = (req.body && (req.body.body || req.body.text)) ? String(req.body.body || req.body.text) : '';
  const image = (req.body && req.body.image) ? String(req.body.image) : null;

  const id = nanoId();
  const t = nowISO();
  const author = req.user ? { id: req.user.id, name: req.user.name } : null;
  db.prepare('INSERT INTO posts (id, author_json, title, body, image, likes, shares, comments_json, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(id, JSON.stringify(author), title, body, image, 0, 0, JSON.stringify([]), t, t);

  res.status(201).json({
    id,
    author,
    title,
    body,
    text: body,
    image: image || undefined,
    likes: 0,
    shares: 0,
    comments: [],
    createdAt: t,
  });
});

app.post('/api/board/like', authMiddleware, (req, res) => {
  const postId = (req.body && req.body.postId) ? String(req.body.postId) : '';
  if (!postId) return res.status(400).json({ ok: false, error: 'postId required' });
  db.prepare('UPDATE posts SET likes = likes + 1, updated_at = ? WHERE id = ?').run(nowISO(), postId);
  res.json({ ok: true });
});

app.post('/api/board/share', authMiddleware, (req, res) => {
  const postId = (req.body && req.body.postId) ? String(req.body.postId) : '';
  if (!postId) return res.status(400).json({ ok: false, error: 'postId required' });
  db.prepare('UPDATE posts SET shares = shares + 1, updated_at = ? WHERE id = ?').run(nowISO(), postId);
  res.json({ ok: true });
});

app.post('/api/board/comments', authMiddleware, (req, res) => {
  const postId = (req.body && req.body.postId) ? String(req.body.postId) : '';
  const comment = (req.body && req.body.comment) ? String(req.body.comment) : '';
  if (!postId || !comment) return res.status(400).json({ ok: false, error: 'postId and comment required' });

  const row = db.prepare('SELECT comments_json FROM posts WHERE id = ?').get(postId);
  if (!row) return res.status(404).json({ ok: false, error: 'post not found' });

  const comments = safeJsonParse(row.comments_json, []);
  comments.push({ id: nanoId(), body: comment, author: { id: req.user.id, name: req.user.name }, createdAt: nowISO() });
  db.prepare('UPDATE posts SET comments_json = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(comments), nowISO(), postId);

  res.json({ ok: true, comments });
});

// Messages / Chats
app.get('/api/messages', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM messages ORDER BY datetime(created_at) ASC').all();
  const out = rows.map((r) => ({
    id: r.id,
    threadId: r.thread_id || undefined,
    body: r.body,
    sender: safeJsonParse(r.sender_json, null),
    to: safeJsonParse(r.to_json, []),
    createdAt: r.created_at,
  }));
  res.json(out);
});

app.post('/api/messages', authMiddleware, (req, res) => {
  const threadId = (req.body && (req.body.threadId || req.body.thread_id)) ? String(req.body.threadId || req.body.thread_id) : null;
  const body = (req.body && req.body.body) ? String(req.body.body) : '';
  const to = (req.body && Array.isArray(req.body.to)) ? req.body.to : [];
  if (!body) return res.status(400).json({ ok: false, error: 'body required' });

  const id = nanoId();
  const t = nowISO();
  const sender = req.user ? { id: req.user.id, name: req.user.name } : null;

  db.prepare('INSERT INTO messages (id, thread_id, body, sender_json, to_json, created_at) VALUES (?,?,?,?,?,?)')
    .run(id, threadId, body, JSON.stringify(sender), JSON.stringify(to), t);

  res.status(201).json({ id, threadId: threadId || undefined, body, sender, to, createdAt: t });
});

// Urgent memos
app.get('/api/urgent-memos', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM urgent_memos ORDER BY datetime(created_at) DESC').all();
  const list = rows.map((r) => ({
    id: r.id,
    type: r.type || 'urgent_memo',
    status: r.status || null,
    proposerId: r.proposer_id || null,
    actorRole: r.actor_role || null,
    childId: r.child_id || null,
    updateType: r.update_type || null,
    proposedISO: r.proposed_iso || null,
    note: r.note || '',
    subject: r.subject || '',
    title: r.title || '',
    body: r.body || '',
    recipients: safeJsonParse(r.recipients_json, []),
    meta: safeJsonParse(r.meta_json, {}),
    ack: Boolean(r.ack),
    respondedAt: r.responded_at || null,
    date: r.created_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at || r.created_at,
  }));

  // Basic visibility rules:
  // - Admins: see all alerts.
  // - Non-admins: see broadcast urgent memos; see their own time_update requests; see admin_memos when targeted.
  if (isAdminUser(req.user)) return res.json(list);

  const userId = req.user ? String(req.user.id) : '';
  const filtered = list.filter((m) => {
    const type = String(m.type || '').toLowerCase();
    if (type === 'arrival_alert') return false;
    if (type === 'time_update') return Boolean(userId) && m.proposerId === userId;
    if (type === 'admin_memo') {
      const recips = Array.isArray(m.recipients) ? m.recipients.map(String) : [];
      return recips.length === 0 || recips.includes(userId);
    }
    // urgent_memo and everything else defaults to visible
    return true;
  });
  return res.json(filtered);
});

app.post('/api/urgent-memos', authMiddleware, (req, res) => {
  const p = req.body || {};
  const t = nowISO();
  const id = nanoId();

  const type = p.type ? String(p.type) : 'urgent_memo';
  const lowerType = type.trim().toLowerCase();
  const proposerId = p.proposerId != null ? String(p.proposerId) : (req.user ? String(req.user.id) : null);
  const actorRole = p.actorRole ? String(p.actorRole) : (p.role ? String(p.role) : (req.user ? String(req.user.role) : null));
  const childId = p.childId != null ? String(p.childId) : null;
  const updateType = p.updateType ? String(p.updateType) : null;
  const proposedISO = p.proposedISO ? String(p.proposedISO) : null;
  const note = p.note ? String(p.note) : '';
  const subject = p.subject ? String(p.subject) : '';
  const recipients = normalizeRecipients(p.recipients);

  // Authorization: only admins can broadcast urgent memos / admin memos.
  if ((lowerType === 'urgent_memo' || lowerType === 'admin_memo') && !isAdminUser(req.user)) {
    return res.status(403).json({ ok: false, error: 'admin only' });
  }
  // arrival_alert is written by the server from /api/arrival/ping to prevent spoofing.
  if (lowerType === 'arrival_alert' && !isAdminUser(req.user)) {
    return res.status(403).json({ ok: false, error: 'arrival alerts are server-generated' });
  }

  // Title/body fallbacks so legacy callers keep working.
  const title = p.title ? String(p.title) : (lowerType === 'time_update' ? 'Time Update Request' : (lowerType === 'admin_memo' ? (subject || 'Admin Memo') : 'Urgent'));
  const body = p.body ? String(p.body) : (note || '');
  const status = p.status ? String(p.status) : (lowerType === 'time_update' || lowerType === 'arrival_alert' ? 'pending' : 'sent');
  const meta = (p.meta && typeof p.meta === 'object') ? p.meta : {};

  db.prepare(`
    INSERT INTO urgent_memos (
      id, type, status, proposer_id, actor_role, child_id, update_type, proposed_iso, note, subject,
      title, body, recipients_json, meta_json, ack, responded_at, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id,
    type,
    status,
    proposerId,
    actorRole,
    childId,
    updateType,
    proposedISO,
    note,
    subject,
    title,
    body,
    JSON.stringify(recipients),
    JSON.stringify(meta),
    0,
    null,
    t,
    t
  );

  // Push notifications
  try {
    const pushKind = (lowerType === 'admin_memo') ? 'other' : 'updates';
    if (lowerType === 'time_update') {
      const adminIds = getAdminUserIds();
      const tokens = getPushTokensForUsers(adminIds, { kind: pushKind });
      setTimeout(() => {
        sendExpoPush(tokens, {
          title: 'Time Update Request',
          body: 'A parent submitted a time update request. Open Alerts.',
          data: { kind: 'time_update', memoId: id, childId },
        }).catch(() => {});
      }, 0);
    } else if (lowerType === 'admin_memo') {
      const tokens = recipients.length
        ? getPushTokensForUsers(recipients, { kind: pushKind })
        : getPushTokensForUsers(db.prepare('SELECT DISTINCT user_id as id FROM push_tokens WHERE enabled = 1').all().map((r) => String(r.id)), { kind: pushKind });
      setTimeout(() => {
        sendExpoPush(tokens, {
          title: subject || 'Admin Memo',
          body: (body || '').slice(0, 120) || 'You have a new admin message.',
          data: { kind: 'admin_memo', memoId: id, childId },
        }).catch(() => {});
      }, 0);
    }
  } catch (_) {
    // ignore push failures
  }

  res.status(201).json({
    id,
    type,
    status,
    proposerId,
    actorRole,
    childId,
    updateType,
    proposedISO,
    note,
    subject,
    title,
    body,
    recipients,
    meta,
    ack: false,
    respondedAt: null,
    date: t,
    createdAt: t,
    updatedAt: t,
  });
});

// Admin responds to an alert (time_update accept/deny/opened, arrival/opened, etc.)
app.post('/api/urgent-memos/respond', authMiddleware, (req, res) => {
  if (!isAdminUser(req.user)) return res.status(403).json({ ok: false, error: 'admin only' });
  const memoId = (req.body && req.body.memoId) ? String(req.body.memoId) : '';
  const action = (req.body && req.body.action) ? String(req.body.action) : '';
  if (!memoId || !action) return res.status(400).json({ ok: false, error: 'memoId and action required' });
  const t = nowISO();
  db.prepare('UPDATE urgent_memos SET status = ?, responded_at = ?, updated_at = ? WHERE id = ?').run(action, t, t, memoId);

  // Notify proposer for time_update decisions
  try {
    const row = db.prepare('SELECT id, type, proposer_id, update_type, child_id FROM urgent_memos WHERE id = ?').get(memoId);
    const type = row && row.type ? String(row.type).trim().toLowerCase() : '';
    const proposerId = row && row.proposer_id ? String(row.proposer_id) : '';
    if (type === 'time_update' && proposerId) {
      const tokens = getPushTokensForUsers([proposerId], { kind: 'updates' });
      const upd = row && row.update_type ? String(row.update_type) : '';
      setTimeout(() => {
        sendExpoPush(tokens, {
          title: 'Time Update',
          body: `Your ${upd || 'time'} request was ${action}.`,
          data: { kind: 'time_update_response', memoId, status: action, childId: row.child_id || null },
        }).catch(() => {});
      }, 0);
    }
  } catch (_) {
    // ignore
  }

  res.json({ ok: true, id: memoId, status: action, respondedAt: t, updatedAt: t });
});

app.post('/api/urgent-memos/read', authMiddleware, (req, res) => {
  const ids = Array.isArray(req.body && req.body.memoIds) ? req.body.memoIds.map(String) : [];
  if (!ids.length) return res.json({ ok: true });
  const t = nowISO();
  const stmt = db.prepare('UPDATE urgent_memos SET ack = 1 WHERE id = ?');
  const tx = db.transaction((arr) => { arr.forEach((id) => stmt.run(id)); });
  tx(ids);
  res.json({ ok: true, updatedAt: t });
});

// Arrival pings (stores basic history)
app.post('/api/arrival/ping', authMiddleware, (req, res) => {
  const payload = req.body || {};
  const id = nanoId();
  const createdAt = nowISO();
  db.prepare('INSERT INTO arrival_pings (id, user_id, role, child_id, lat, lng, event_id, when_iso, created_at) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(
      id,
      payload.userId ? String(payload.userId) : (req.user ? String(req.user.id) : null),
      payload.role ? String(payload.role) : (req.user ? String(req.user.role) : null),
      payload.childId ? String(payload.childId) : null,
      Number.isFinite(Number(payload.lat)) ? Number(payload.lat) : null,
      Number.isFinite(Number(payload.lng)) ? Number(payload.lng) : null,
      payload.eventId ? String(payload.eventId) : null,
      payload.when ? String(payload.when) : null,
      createdAt
    );

  // Generate an admin-facing arrival alert (deduped) when a parent/therapist arrives.
  // Client already enforces schedule window and drop-zone check; the server stores a single alert
  // per user/child/shift within a short window to avoid spamming.
  try {
    const r = String(payload.role || (req.user ? req.user.role : '') || '').trim().toLowerCase();
    if (r === 'parent' || r === 'therapist') {
      const actorId = payload.userId ? String(payload.userId) : (req.user ? String(req.user.id) : '');
      const childId = payload.childId != null ? String(payload.childId) : null;
      const shiftId = payload.shiftId != null ? String(payload.shiftId) : null;
      const withinMins = 10;

      const recent = db.prepare(`
        SELECT id FROM urgent_memos
        WHERE type = 'arrival_alert'
          AND proposer_id = ?
          AND (child_id IS ? OR child_id = ?)
          AND (json_extract(meta_json, '$.shiftId') IS ? OR json_extract(meta_json, '$.shiftId') = ?)
          AND datetime(created_at) > datetime('now', ?)
        LIMIT 1
      `).get(
        actorId,
        childId, childId,
        shiftId, shiftId,
        `-${withinMins} minutes`
      );

      if (!recent) {
        const alertId = nanoId();
        const t = nowISO();
        const meta = {
          lat: Number.isFinite(Number(payload.lat)) ? Number(payload.lat) : null,
          lng: Number.isFinite(Number(payload.lng)) ? Number(payload.lng) : null,
          distanceMiles: payload.distanceMiles != null ? Number(payload.distanceMiles) : null,
          dropZoneMiles: payload.dropZoneMiles != null ? Number(payload.dropZoneMiles) : null,
          eventId: payload.eventId ? String(payload.eventId) : null,
          shiftId: shiftId,
          when: payload.when ? String(payload.when) : null,
        };
        const title = r === 'therapist' ? 'Therapist Arrival' : 'Parent Arrival';
        const note = ''; // UI can derive display copy
        db.prepare(`
          INSERT INTO urgent_memos (
            id, type, status, proposer_id, actor_role, child_id, title, body, note, meta_json, ack, created_at, updated_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).run(
          alertId,
          'arrival_alert',
          'pending',
          actorId,
          r,
          childId,
          title,
          '',
          note,
          JSON.stringify(meta),
          0,
          t,
          t
        );

        // Push notify admins
        try {
          const adminIds = getAdminUserIds();
          const tokens = getPushTokensForUsers(adminIds, { kind: 'updates' });
          setTimeout(() => {
            sendExpoPush(tokens, {
              title,
              body: 'Arrival detected. Open Alerts.',
              data: { kind: 'arrival_alert', memoId: alertId, actorId, actorRole: r, childId },
            }).catch(() => {});
          }, 0);
        } catch (_) {
          // ignore
        }
      }
    }
  } catch (_) {
    // ignore alert generation failures
  }

  res.json({ ok: true });
});

// Time change proposals
app.get('/api/children/time-change-proposals', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM time_change_proposals ORDER BY datetime(created_at) DESC').all();
  res.json(rows.map((r) => ({
    id: r.id,
    childId: r.child_id,
    type: r.type,
    proposedISO: r.proposed_iso,
    note: r.note,
    proposerId: r.proposer_id,
    action: r.action,
    createdAt: r.created_at,
  })));
});

app.post('/api/children/propose-time-change', authMiddleware, (req, res) => {
  const id = nanoId();
  const p = req.body || {};
  const createdAt = nowISO();
  db.prepare('INSERT INTO time_change_proposals (id, child_id, type, proposed_iso, note, proposer_id, action, created_at) VALUES (?,?,?,?,?,?,?,?)')
    .run(
      id,
      p.childId != null ? String(p.childId) : null,
      p.type ? String(p.type) : 'pickup',
      p.proposedISO ? String(p.proposedISO) : createdAt,
      p.note ? String(p.note) : '',
      p.proposerId != null ? String(p.proposerId) : (req.user ? String(req.user.id) : null),
      null,
      createdAt
    );
  res.status(201).json({ id, ...p, proposerId: p.proposerId != null ? String(p.proposerId) : (req.user ? String(req.user.id) : null), createdAt });
});

app.post('/api/children/respond-time-change', authMiddleware, (req, res) => {
  const proposalId = (req.body && req.body.proposalId) ? String(req.body.proposalId) : '';
  const action = (req.body && req.body.action) ? String(req.body.action) : '';
  if (!proposalId || !action) return res.status(400).json({ ok: false, error: 'proposalId and action required' });
  db.prepare('UPDATE time_change_proposals SET action = ? WHERE id = ?').run(action, proposalId);
  const row = db.prepare('SELECT * FROM time_change_proposals WHERE id = ?').get(proposalId);
  if (!row) return res.status(404).json({ ok: false, error: 'not found' });
  res.json({ ok: true, item: row });
});

// Push tokens
app.post('/api/push/register', authMiddleware, (req, res) => {
  const token = (req.body && req.body.token) ? String(req.body.token) : '';
  const userId = (req.body && req.body.userId) ? String(req.body.userId) : (req.user ? String(req.user.id) : '');
  const platform = (req.body && req.body.platform) ? String(req.body.platform) : '';
  const enabled = (req.body && typeof req.body.enabled === 'boolean') ? (req.body.enabled ? 1 : 0) : 1;
  const preferences = (req.body && typeof req.body.preferences === 'object') ? req.body.preferences : {};

  if (!token) return res.status(400).json({ ok: false, error: 'token required' });

  const t = nowISO();
  db.prepare(`
    INSERT INTO push_tokens (token, user_id, platform, enabled, preferences_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(token) DO UPDATE SET
      user_id=excluded.user_id,
      platform=excluded.platform,
      enabled=excluded.enabled,
      preferences_json=excluded.preferences_json,
      updated_at=excluded.updated_at
  `).run(token, userId, platform, enabled, JSON.stringify(preferences), t);

  res.json({ ok: true, stored: true });
});

app.post('/api/push/unregister', authMiddleware, (req, res) => {
  const token = (req.body && req.body.token) ? String(req.body.token) : '';
  if (!token) return res.status(400).json({ ok: false, error: 'token required' });
  db.prepare('DELETE FROM push_tokens WHERE token = ?').run(token);
  res.json({ ok: true, removed: true });
});

// Minimal compatibility endpoints for features not yet backed
app.post('/api/media/sign', authMiddleware, (req, res) => {
  const key = (req.body && req.body.key) ? String(req.body.key) : `uploads/${Date.now()}`;
  res.json({ url: `http://localhost:9000/${key}`, fields: {}, key });
});

app.get('/api/link/preview', authMiddleware, (req, res) => {
  const url = (req.query && req.query.url) ? String(req.query.url) : '';
  res.json({ ok: true, url, title: url, description: '', image: '' });
});

// Media upload (local disk). The mobile app uses this when attaching an image to a post.
// Expects multipart/form-data with a `file` field.
app.post('/api/media/upload', authMiddleware, upload.single('file'), (req, res) => {
  const f = req.file;
  if (!f) return res.status(400).json({ ok: false, error: 'file required' });

  const relPath = `/uploads/${encodeURIComponent(f.filename)}`;
  const url = buildPublicUrl(req, relPath);

  res.status(201).json({
    ok: true,
    url,
    path: relPath,
    filename: f.filename,
    mimetype: f.mimetype,
    size: f.size,
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[api] BuddyBoard API listening on :${PORT}`);
  console.log(`[api] DB: ${DB_PATH}`);
});

process.on('uncaughtException', (e) => {
  console.error('[api] Uncaught', e);
});
