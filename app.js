const path = require('node:path');
const express = require('express');
const authRoutes = require('./backend/auth.routes');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);

module.exports = app;
