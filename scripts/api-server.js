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
const twilio = require('twilio');

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
const REQUIRE_2FA_ON_SIGNUP = envFlag(process.env.BB_REQUIRE_2FA_ON_SIGNUP, true);
const DEBUG_2FA_RETURN_CODE = envFlag(process.env.BB_DEBUG_2FA_RETURN_CODE, false);
const LOG_REQUESTS = envFlag(process.env.BB_DEBUG_REQUESTS, true);

// 2FA delivery (SMS only).
// Configure Twilio in production/TestFlight:
// - BB_TWILIO_ACCOUNT_SID
// - BB_TWILIO_AUTH_TOKEN
// - BB_TWILIO_FROM (E.164, e.g. +15551234567) OR BB_TWILIO_MESSAGING_SERVICE_SID
const TWILIO_ACCOUNT_SID = (process.env.BB_TWILIO_ACCOUNT_SID || '').trim();
const TWILIO_AUTH_TOKEN = (process.env.BB_TWILIO_AUTH_TOKEN || '').trim();
const TWILIO_FROM = (process.env.BB_TWILIO_FROM || '').trim();
const TWILIO_MESSAGING_SERVICE_SID = (process.env.BB_TWILIO_MESSAGING_SERVICE_SID || '').trim();

const slog = require('./logger');

function twilioEnabled() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return false;
  if (TWILIO_MESSAGING_SERVICE_SID) return true;
  return !!TWILIO_FROM;
}

let twilioClient = null;
function getTwilioClient() {
  if (!twilioEnabled()) return null;
  if (twilioClient) return twilioClient;
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return twilioClient;
}

function normalizeE164Phone(input) {
  const raw = String(input || '').trim();
  if (!raw) return '';
  // allow spaces/dashes/parentheses; require leading + for international safety
  const cleaned = raw.replace(/[\s\-().]/g, '');
  if (!cleaned.startsWith('+')) return '';
  const digits = cleaned.slice(1).replace(/\D/g, '');
  const out = `+${digits}`;
  if (!/^\+\d{10,15}$/.test(out)) return '';
  return out;
}

async function send2faCodeSms({ to, code }) {
  const client = getTwilioClient();
  if (!client) {
    throw new Error('2FA SMS delivery is not configured (set BB_TWILIO_ACCOUNT_SID/BB_TWILIO_AUTH_TOKEN and BB_TWILIO_FROM or BB_TWILIO_MESSAGING_SERVICE_SID)');
  }

  const body = `BuddyBoard verification code: ${code}. Expires in 5 minutes.`;
  const msg = {
    to,
    body,
  };
  if (TWILIO_MESSAGING_SERVICE_SID) msg.messagingServiceSid = TWILIO_MESSAGING_SERVICE_SID;
  else msg.from = TWILIO_FROM;

  await client.messages.create(msg);
}

// Ephemeral 2FA challenges for dev/testing.
// NOTE: This is in-memory and resets when the server restarts.
const twoFaChallenges = new Map();

const TWOFA_CODE_TTL_MS = 5 * 60 * 1000;
const TWOFA_RESEND_COOLDOWN_MS = 5 * 60 * 1000;

function nanoIdShort() {
  // nanoId() exists in this file; keep challenge IDs short/unique.
  // Avoid external deps to keep scripts self-contained.
  return `ch_${nanoId().slice(-10)}`;
}

function maskDest(method, value) {
  const v = String(value || '');
  if (!v) return '';
  if (method === 'sms') {
    const last = v.replace(/\D/g, '').slice(-4);
    return last ? `***-***-${last}` : '***';
  }
  // email
  const at = v.indexOf('@');
  if (at <= 1) return '***';
  return `${v[0]}***${v.slice(at)}`;
}

function maskEmail(email) {
  const v = String(email || '').trim().toLowerCase();
  const at = v.indexOf('@');
  if (at <= 1) return '***';
  return `${v[0]}***${v.slice(at)}`;
}

function newOtpCode() {
  // 6-digit numeric code.
  return String(Math.floor(100000 + Math.random() * 900000));
}

function create2faChallenge({ userId, method, destination }) {
  const challengeId = nanoIdShort();
  const code = newOtpCode();
  const now = Date.now();
  const expiresAt = now + TWOFA_CODE_TTL_MS;
  twoFaChallenges.set(challengeId, { userId, method, destination, code, expiresAt, attempts: 0, lastSentAt: now });
  return { challengeId, code, expiresAt };
}

function resend2faChallenge(challengeId) {
  const ch = twoFaChallenges.get(challengeId);
  if (!ch) return { ok: false, status: 404, error: 'invalid challenge' };

  const now = Date.now();
  const last = Number(ch.lastSentAt || 0);
  const waitMs = (last + TWOFA_RESEND_COOLDOWN_MS) - now;
  if (waitMs > 0) {
    return {
      ok: false,
      status: 429,
      error: 'Too many requests; please wait before requesting another code',
      retryAfterSec: Math.ceil(waitMs / 1000),
    };
  }

  ch.code = newOtpCode();
  ch.expiresAt = now + TWOFA_CODE_TTL_MS;
  ch.attempts = 0;
  ch.lastSentAt = now;
  twoFaChallenges.set(challengeId, ch);
  return { ok: true, challengeId, code: ch.code, expiresAt: ch.expiresAt, method: ch.method, destination: ch.destination };
}

function consume2faChallenge(challengeId, code) {
  const ch = twoFaChallenges.get(challengeId);
  if (!ch) return { ok: false, error: 'invalid challenge' };
  if (Date.now() > ch.expiresAt) {
    twoFaChallenges.delete(challengeId);
    return { ok: false, error: 'challenge expired' };
  }
  ch.attempts += 1;
  if (ch.attempts > 10) {
    twoFaChallenges.delete(challengeId);
    return { ok: false, error: 'too many attempts' };
  }
  if (String(code || '').trim() !== String(ch.code)) {
    return { ok: false, error: 'invalid code' };
  }
  twoFaChallenges.delete(challengeId);
  return { ok: true, userId: ch.userId, method: ch.method };
}
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
  title TEXT,
  body TEXT,
  memo_json TEXT,
  status TEXT,
  responded_at TEXT,
  ack INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
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

// Lightweight migrations for older databases.
try {
  const cols = db.prepare("PRAGMA table_info('urgent_memos')").all().map((c) => String(c.name));
  const ensureCol = (name, ddl) => { if (!cols.includes(name)) db.exec(ddl); };
  ensureCol('memo_json', "ALTER TABLE urgent_memos ADD COLUMN memo_json TEXT");
  ensureCol('status', "ALTER TABLE urgent_memos ADD COLUMN status TEXT");
  ensureCol('responded_at', "ALTER TABLE urgent_memos ADD COLUMN responded_at TEXT");
} catch (e) {
  slog.warn('db', 'urgent_memos migration skipped', { message: e?.message || String(e) });
}

function safeJsonParse(text, fallback) {
  try {
    if (!text) return fallback;
    return JSON.parse(text);
  } catch (_) {
    return fallback;
  }
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

// Request logging (dev-friendly)
if (LOG_REQUESTS) {
  app.use((req, res, next) => {
    const startedAt = Date.now();
    const path = req.originalUrl || req.url;
    const method = (req.method || 'GET').toUpperCase();

    slog.debug('req', `${method} ${path}`, { hasAuth: !!(req.headers && req.headers.authorization) });

    res.on('finish', () => {
      const ms = Date.now() - startedAt;
      slog.info('req', `${method} ${path} -> ${res.statusCode} (${ms}ms)`);
    });

    next();
  });
}

// Auth
app.post('/api/auth/login', (req, res) => {
  const email = (req.body && req.body.email) ? String(req.body.email).trim().toLowerCase() : '';
  const password = (req.body && req.body.password) ? String(req.body.password) : '';
  if (!email || !password) return res.status(400).json({ ok: false, error: 'email and password required' });

  slog.debug('auth', 'Login attempt', { email: maskEmail(email) });

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!row) return res.status(401).json({ ok: false, error: 'invalid credentials' });
  const ok = bcrypt.compareSync(password, row.password_hash);
  if (!ok) return res.status(401).json({ ok: false, error: 'invalid credentials' });

  if (!JWT_SECRET) return res.status(500).json({ ok: false, error: 'server missing BB_JWT_SECRET' });

  const user = userToClient(row);
  const token = signToken(user);
  slog.info('auth', 'Login success', { userId: user?.id, email: maskEmail(email) });
  res.json({ token, user });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ ok: true, user: req.user });
});

// Optional signup (off by default)
app.post('/api/auth/signup', async (req, res) => {
  if (!ALLOW_SIGNUP) return res.status(403).json({ ok: false, error: 'signup disabled' });

  const email = (req.body && req.body.email) ? String(req.body.email).trim().toLowerCase() : '';
  const password = (req.body && req.body.password) ? String(req.body.password) : '';
  const name = (req.body && req.body.name) ? String(req.body.name).trim() : '';
  const role = (req.body && req.body.role) ? String(req.body.role).trim() : 'parent';
  const twoFaMethod = (req.body && req.body.twoFaMethod) ? String(req.body.twoFaMethod).trim().toLowerCase() : 'sms';
  const phone = (req.body && req.body.phone) ? String(req.body.phone).trim() : '';

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

  // For end-to-end testing, default to requiring 2FA on signup.
  if (REQUIRE_2FA_ON_SIGNUP) {
    if (twoFaMethod && twoFaMethod !== 'sms') {
      return res.status(400).json({ ok: false, error: 'Only SMS 2FA is supported' });
    }

    const method = 'sms';
    const destination = normalizeE164Phone(phone);
    if (!destination) {
      return res.status(400).json({ ok: false, error: 'phone required for sms 2fa (E.164 format, e.g. +15551234567)' });
    }

    const ch = create2faChallenge({ userId: id, method, destination });
    slog.info('auth', '2FA challenge created (signup)', { method, to: maskDest(method, destination), userId: id });

    // Deliver the code (production/TestFlight). Only log/return the code when explicitly enabled.
    if (DEBUG_2FA_RETURN_CODE) {
      slog.debug('auth', '2FA code (dev)', { challengeId: ch.challengeId, code: ch.code });
    } else {
      try {
        await send2faCodeSms({ to: destination, code: ch.code });
        slog.info('auth', '2FA code delivered', { method, to: maskDest(method, destination), challengeId: ch.challengeId });
      } catch (e) {
        // Roll back created user on delivery failure to avoid orphan accounts.
        try { db.prepare('DELETE FROM users WHERE id = ?').run(id); } catch (_) {}
        try { twoFaChallenges.delete(ch.challengeId); } catch (_) {}
        slog.error('auth', '2FA delivery failed', { method, to: maskDest(method, destination), message: e?.message || String(e) });
        return res.status(500).json({ ok: false, error: '2FA delivery failed; contact support' });
      }
    }

    const payload = {
      ok: true,
      user,
      requires2fa: true,
      method,
      to: maskDest(method, destination),
      challengeId: ch.challengeId,
    };
    if (DEBUG_2FA_RETURN_CODE) payload.devCode = ch.code;
    return res.status(201).json(payload);
  }

  const token = signToken(user);
  return res.status(201).json({ token, user, requires2fa: false });
});

// Verify 2FA challenge and mint an auth token.
app.post('/api/auth/2fa/verify', (req, res) => {
  const challengeId = (req.body && req.body.challengeId) ? String(req.body.challengeId).trim() : '';
  const code = (req.body && req.body.code) ? String(req.body.code).trim() : '';
  if (!challengeId || !code) return res.status(400).json({ ok: false, error: 'challengeId and code required' });

  const result = consume2faChallenge(challengeId, code);
  if (!result.ok) return res.status(401).json({ ok: false, error: result.error || 'verification failed' });

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(result.userId);
  if (!row) return res.status(404).json({ ok: false, error: 'user not found' });
  if (!JWT_SECRET) return res.status(500).json({ ok: false, error: 'server missing BB_JWT_SECRET' });

  const user = userToClient(row);
  const token = signToken(user);
  slog.info('auth', '2FA verified; token issued', { userId: user?.id, method: result.method });
  return res.json({ ok: true, token, user });
});

// Resend SMS 2FA code with a cooldown.
app.post('/api/auth/2fa/resend', async (req, res) => {
  const challengeId = (req.body && req.body.challengeId) ? String(req.body.challengeId).trim() : '';
  if (!challengeId) return res.status(400).json({ ok: false, error: 'challengeId required' });

  const updated = resend2faChallenge(challengeId);
  if (!updated.ok) {
    const status = updated.status || 400;
    const payload = { ok: false, error: updated.error || 'resend failed' };
    if (updated.retryAfterSec) payload.retryAfterSec = updated.retryAfterSec;
    return res.status(status).json(payload);
  }

  if (updated.method !== 'sms') {
    return res.status(400).json({ ok: false, error: 'Only SMS 2FA is supported' });
  }

  if (DEBUG_2FA_RETURN_CODE) {
    slog.debug('auth', '2FA code resent (dev)', { challengeId, code: updated.code });
    return res.json({ ok: true, method: 'sms', to: maskDest('sms', updated.destination), challengeId, devCode: updated.code });
  }

  try {
    await send2faCodeSms({ to: updated.destination, code: updated.code });
    slog.info('auth', '2FA code resent', { method: 'sms', to: maskDest('sms', updated.destination), challengeId });
    return res.json({ ok: true, method: 'sms', to: maskDest('sms', updated.destination), challengeId });
  } catch (e) {
    slog.error('auth', '2FA resend failed', { method: 'sms', to: maskDest('sms', updated.destination), message: e?.message || String(e) });
    return res.status(500).json({ ok: false, error: '2FA delivery failed; contact support' });
  }
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
  const row = db.prepare('SELECT likes, shares FROM posts WHERE id = ?').get(postId);
  return res.json({ id: postId, likes: Number(row?.likes) || 0, shares: Number(row?.shares) || 0 });
});

app.post('/api/board/share', authMiddleware, (req, res) => {
  const postId = (req.body && req.body.postId) ? String(req.body.postId) : '';
  if (!postId) return res.status(400).json({ ok: false, error: 'postId required' });
  db.prepare('UPDATE posts SET shares = shares + 1, updated_at = ? WHERE id = ?').run(nowISO(), postId);
  const row = db.prepare('SELECT likes, shares FROM posts WHERE id = ?').get(postId);
  return res.json({ id: postId, likes: Number(row?.likes) || 0, shares: Number(row?.shares) || 0 });
});

app.post('/api/board/comments', authMiddleware, (req, res) => {
  const postId = (req.body && req.body.postId) ? String(req.body.postId) : '';
  const raw = (req.body && req.body.comment) ? req.body.comment : null;
  if (!postId || raw == null) return res.status(400).json({ ok: false, error: 'postId and comment required' });

  const row = db.prepare('SELECT comments_json FROM posts WHERE id = ?').get(postId);
  if (!row) return res.status(404).json({ ok: false, error: 'post not found' });

  const comments = safeJsonParse(row.comments_json, []);

  const author = { id: req.user.id, name: req.user.name };
  const createdAt = nowISO();

  let body = '';
  let parentId = null;
  let clientId = null;
  if (typeof raw === 'string') {
    body = raw;
  } else if (raw && typeof raw === 'object') {
    if (raw.body != null) body = String(raw.body);
    else if (raw.text != null) body = String(raw.text);
    parentId = raw.parentId ? String(raw.parentId) : null;
    clientId = raw.id ? String(raw.id) : null;
  }
  if (!body) return res.status(400).json({ ok: false, error: 'comment body required' });

  const makeBase = (id) => ({
    id,
    body,
    author,
    createdAt,
    reactions: {},
    userReactions: {},
  });

  let created = null;
  if (!parentId) {
    const id = clientId || nanoId();
    created = { ...makeBase(id), replies: [] };
    comments.push(created);
  } else {
    const parent = comments.find((c) => c && String(c.id) === String(parentId));
    if (!parent) return res.status(404).json({ ok: false, error: 'parent comment not found' });
    const id = clientId || nanoId();
    created = makeBase(id);
    parent.replies = Array.isArray(parent.replies) ? parent.replies : [];
    parent.replies.push(created);
  }

  db.prepare('UPDATE posts SET comments_json = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(comments), nowISO(), postId);
  slog.debug('api', 'Comment created', { postId, parentId: parentId || undefined, commentId: created?.id });
  return res.status(201).json(created);
});

// React to a comment (toggle per-user reactions)
app.post('/api/board/comments/react', authMiddleware, (req, res) => {
  const postId = (req.body && req.body.postId) ? String(req.body.postId) : '';
  const commentId = (req.body && req.body.commentId) ? String(req.body.commentId) : '';
  const emoji = (req.body && req.body.emoji) ? String(req.body.emoji) : '';
  if (!postId || !commentId || !emoji) return res.status(400).json({ ok: false, error: 'postId, commentId, emoji required' });

  const row = db.prepare('SELECT comments_json FROM posts WHERE id = ?').get(postId);
  if (!row) return res.status(404).json({ ok: false, error: 'post not found' });

  const comments = safeJsonParse(row.comments_json, []);
  const uid = req.user?.id ? String(req.user.id) : 'anonymous';

  const applyReaction = (c) => {
    if (!c || String(c.id) !== String(commentId)) return false;
    c.reactions = (c.reactions && typeof c.reactions === 'object') ? c.reactions : {};
    c.userReactions = (c.userReactions && typeof c.userReactions === 'object') ? c.userReactions : {};
    const prev = c.userReactions[uid];
    if (prev === emoji) {
      c.reactions[emoji] = Math.max(0, Number(c.reactions[emoji] || 1) - 1);
      delete c.userReactions[uid];
    } else {
      if (prev) c.reactions[prev] = Math.max(0, Number(c.reactions[prev] || 1) - 1);
      c.reactions[emoji] = Number(c.reactions[emoji] || 0) + 1;
      c.userReactions[uid] = emoji;
    }
    return true;
  };

  let updated = null;
  for (const c of comments) {
    if (applyReaction(c)) { updated = c; break; }
    if (Array.isArray(c?.replies)) {
      for (const r of c.replies) {
        if (applyReaction(r)) { updated = r; break; }
      }
      if (updated) break;
    }
  }
  if (!updated) return res.status(404).json({ ok: false, error: 'comment not found' });

  db.prepare('UPDATE posts SET comments_json = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(comments), nowISO(), postId);
  slog.debug('api', 'Comment reacted', { postId, commentId, emoji });
  return res.json(updated);
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
  res.json(rows.map((r) => {
    const memo = safeJsonParse(r.memo_json, null);
    const base = (memo && typeof memo === 'object') ? memo : {};
    const createdAt = r.created_at;
    const title = r.title || base.title || base.subject || 'Urgent';
    const body = r.body || base.body || base.note || '';
    return {
      ...base,
      id: r.id,
      title,
      body,
      ack: Boolean(r.ack),
      status: r.status || base.status || undefined,
      respondedAt: r.responded_at || base.respondedAt || undefined,
      date: base.date || createdAt,
      createdAt,
    };
  }));
});

app.post('/api/urgent-memos', authMiddleware, (req, res) => {
  const payload = (req.body && typeof req.body === 'object') ? req.body : {};
  const id = payload.id ? String(payload.id) : nanoId();
  const t = nowISO();
  const title = payload.title ? String(payload.title) : (payload.subject ? String(payload.subject) : 'Urgent');
  const body = payload.body ? String(payload.body) : (payload.note ? String(payload.note) : '');
  const status = payload.status ? String(payload.status) : (payload.type === 'time_update' ? 'pending' : (payload.type ? 'sent' : null));
  const memoObj = { ...payload, id, title, body, createdAt: t, date: t, status: status || payload.status };

  db.prepare('INSERT OR REPLACE INTO urgent_memos (id, title, body, memo_json, status, responded_at, ack, created_at) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, title, body, JSON.stringify(memoObj), status, null, 0, t);
  slog.info('api', 'Urgent memo created', { memoId: id, type: memoObj.type, status: status || undefined });
  res.status(201).json(memoObj);
});

app.post('/api/urgent-memos/respond', authMiddleware, (req, res) => {
  const memoId = (req.body && (req.body.memoId || req.body.id)) ? String(req.body.memoId || req.body.id) : '';
  const action = (req.body && (req.body.action || req.body.status)) ? String(req.body.action || req.body.status) : '';
  if (!memoId || !action) return res.status(400).json({ ok: false, error: 'memoId and action required' });

  const row = db.prepare('SELECT * FROM urgent_memos WHERE id = ?').get(memoId);
  if (!row) return res.status(404).json({ ok: false, error: 'memo not found' });

  const t = nowISO();
  const memo = safeJsonParse(row.memo_json, null);
  const base = (memo && typeof memo === 'object') ? memo : {};
  const next = { ...base, id: memoId, status: action, respondedAt: t };

  db.prepare('UPDATE urgent_memos SET status = ?, responded_at = ?, memo_json = ? WHERE id = ?')
    .run(action, t, JSON.stringify(next), memoId);
  slog.info('api', 'Urgent memo responded', { memoId, action });
  return res.json({ ok: true, memo: next });
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
  res.json({
    ok: true,
    item: {
      id: row.id,
      childId: row.child_id,
      type: row.type,
      proposedISO: row.proposed_iso,
      note: row.note,
      proposerId: row.proposer_id,
      action: row.action,
      createdAt: row.created_at,
    },
  });
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
