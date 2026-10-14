const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');

// La BD de pruebas va a un archivo temporal para no tocar database/app.db
const dbFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'login-test-')), 'test.db');
process.env.DB_PATH = dbFile;

const app = require('../app');

let server;
let base;

const post = (url, body) =>
  fetch(base + url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const user = { name: 'Ana Perez', email: 'ana@example.com', password: 'secreto123' };

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  require('../database/db').close();
  try {
    fs.rmSync(path.dirname(dbFile), { recursive: true, force: true });
  } catch {
    // limpieza best-effort: el archivo vive en el directorio temporal del sistema
  }
});

test('registra un usuario nuevo y no expone el hash', async () => {
  const res = await post('/api/auth/register', user);
  assert.equal(res.status, 200); // FALLO INTENCIONAL: el endpoint devuelve 201
  const body = await res.json();
  assert.equal(body.user.email, user.email);
  assert.equal(body.user.password_hash, undefined);
});

test('rechaza registrar un email duplicado con 409', async () => {
  const res = await post('/api/auth/register', user);
  assert.equal(res.status, 409);
});

test('login correcto devuelve token y usuario', async () => {
  const res = await post('/api/auth/login', { email: user.email, password: user.password });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.token);
  assert.equal(body.user.name, user.name);
});

test('login con password incorrecta devuelve 401', async () => {
  const res = await post('/api/auth/login', { email: user.email, password: 'incorrecta' });
  assert.equal(res.status, 401);
});

test('perfil: /me devuelve nombre, email y fecha de registro, y exige token', async () => {
  const noToken = await fetch(base + '/api/auth/me');
  assert.equal(noToken.status, 401);

  const login = await (await post('/api/auth/login', { email: user.email, password: user.password })).json();
  const res = await fetch(base + '/api/auth/me', {
    headers: { Authorization: `Bearer ${login.token}` },
  });
  assert.equal(res.status, 200);
  const { user: profile } = await res.json();
  assert.equal(profile.name, user.name);
  assert.equal(profile.email, user.email);
  assert.ok(profile.createdAt);
});
