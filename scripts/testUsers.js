#!/usr/bin/env node
/*
 Simple test users seeder for server integration.

 Usage:
  - Dry run (print payload):
      node scripts/testUsers.js
  - Post to server:
      SERVER_URL=https://your-server.com node scripts/testUsers.js --endpoint /api/users
  - Options:
      --endpoint PATH   default: /api/users
      --dry             print payload only

 This script reads the local seed data at src/seed/directorySeed_v2 and prepares
 an array of users (parents and therapists). It then POSTs each user to the
 configured server endpoint. If SERVER_URL is not provided or --dry is used,
 the script only prints the payload to the console.
*/

const { seededParents = [], seededTherapists = [] } = require('../src/seed/directorySeed_v2');
const { URL } = require('url');
const http = require('http');
const https = require('https');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { endpoint: '/api/users', dry: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--endpoint' && args[i+1]) { out.endpoint = args[++i]; }
    else if (a === '--dry') out.dry = true;
    else if (a === '--help' || a === '-h') { out.help = true; }
  }
  return out;
}

function normalizeUser(u, role) {
  return {
    id: u.id || `${role}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    role: role,
    name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Unknown',
    firstName: u.firstName || null,
    lastName: u.lastName || null,
    email: u.email || null,
    phone: u.phone || null,
    avatar: u.avatar || null,
  };
}

function buildPayload() {
  const parents = (seededParents || []).map(p => normalizeUser(p, 'parent'));
  const therapists = (seededTherapists || []).map(t => normalizeUser(t, 'therapist'));
  const users = [...parents, ...therapists];
  return { users, meta: { generatedAt: new Date().toISOString(), count: users.length } };
}

function postJson(fullUrl, data) {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(fullUrl);
      const body = JSON.stringify(data);
      const opts = {
        hostname: url.hostname,
        path: url.pathname + (url.search || ''),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };
      const lib = url.protocol === 'https:' ? https : http;
      const req = lib.request(opts, (res) => {
        let resp = '';
        res.on('data', (c) => resp += c.toString());
        res.on('end', () => {
          try { const parsed = JSON.parse(resp || '{}'); resolve({ status: res.statusCode, body: parsed }); }
          catch (e) { resolve({ status: res.statusCode, body: resp }); }
        });
      });
      req.on('error', (err) => reject(err));
      req.write(body);
      req.end();
    } catch (e) { reject(e); }
  });
}

async function run() {
  const args = parseArgs();
  if (args.help) {
    console.log('Usage: SERVER_URL=https://api.example.com node scripts/testUsers.js --endpoint /api/users [--dry]');
    return;
  }

  const serverUrl = process.env.SERVER_URL;
  const payload = buildPayload();

  if (!serverUrl || args.dry) {
    console.log('Dry run. Payload prepared (first 2 users):');
    console.log(JSON.stringify({ meta: payload.meta, sample: payload.users.slice(0,2) }, null, 2));
    if (!serverUrl) console.log('\nTo post to your server set SERVER_URL env var and re-run.');
    return;
  }

  const endpoint = args.endpoint || '/api/users';
  const base = serverUrl.replace(/\/+$/, '');
  const fullUrl = base + endpoint;

  console.log(`Posting ${payload.users.length} users to ${fullUrl}`);
  for (const u of payload.users) {
    try {
      const res = await postJson(fullUrl, u);
      console.log(`-> ${u.id} -> ${res.status}`);
    } catch (e) {
      console.error('Post failed for', u.id, e.message || e);
    }
  }
  console.log('Done.');
}

if (require.main === module) run().catch((e) => { console.error('Seeder failed', e); process.exit(1); });
