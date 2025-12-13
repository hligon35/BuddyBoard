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
  const id = urgentMemos.length ? urgentMemos[urgentMemos.length-1].id + 1 : 1;
  const m = { id, title: req.body.title || 'Urgent', body: req.body.body || '', date: new Date().toISOString(), ack: false };
  urgentMemos.unshift(m);
  res.status(201).json(m);
});

app.post('/api/urgent-memos/read', (req, res) => {
  const ids = Array.isArray(req.body.memoIds) ? req.body.memoIds : [];
  urgentMemos.forEach(u => { if (ids.includes(u.id)) u.ack = true; });
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

app.listen(3005, '0.0.0.0', () => console.log('API mock listening on port 3005'));
