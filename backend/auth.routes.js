const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const users = require('../database/users.repository');
const requireAuth = require('./auth.middleware');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-cambiar';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVALID_CREDENTIALS = 'Credenciales invalidas';

const router = Router();

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!isNonEmptyString(name) || !isNonEmptyString(email) || typeof password !== 'string' || password === '') {
      return res.status(400).json({ error: 'Nombre, email y password son obligatorios' });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail)) {
      return res.status(400).json({ error: 'El email no tiene un formato valido' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La password debe tener al menos 6 caracteres' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await users.createUser({ name: name.trim(), email: cleanEmail, passwordHash });
    return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    if (err && err.code === 'EMAIL_TAKEN') {
      return res.status(409).json({ error: 'El email ya esta registrado' });
    }
    console.error('Error en register:', err && err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!isNonEmptyString(email) || typeof password !== 'string' || password === '') {
      return res.status(400).json({ error: 'Email y password son obligatorios' });
    }
    const user = await users.findByEmail(email.trim().toLowerCase());
    const ok = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!ok) {
      return res.status(401).json({ error: INVALID_CREDENTIALS });
    }
    const token = jwt.sign({ sub: String(user.id) }, JWT_SECRET, { expiresIn: '1h' });
    return res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Error en login:', err && err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await users.findById(req.userId);
    if (!user) {
      return res.status(401).json({ error: 'Token invalido o expirado' });
    }
    return res.status(200).json({ user: { id: user.id, name: user.name, email: user.email, createdAt: user.created_at } });
  } catch (err) {
    console.error('Error en me:', err && err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
