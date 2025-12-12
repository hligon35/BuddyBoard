#!/usr/bin/env node
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

let pendingClear = false;

app.post('/clear', (req, res) => {
  pendingClear = true;
  console.log('Dev clear queued');
  res.json({ queued: true });
});

app.get('/clear-status', (req, res) => {
  res.json({ clear: pendingClear });
});

app.post('/ack', (req, res) => {
  pendingClear = false;
  console.log('Dev clear acknowledged');
  res.json({ ok: true });
});

const port = process.env.DEV_CLEAR_PORT || 4001;
app.listen(port, '0.0.0.0', () => {
  console.log(`Dev clear server listening on port ${port}`);
});

// keep process alive
process.on('uncaughtException', (e) => {
  console.error('Uncaught', e);
});
