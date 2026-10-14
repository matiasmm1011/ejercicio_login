const db = require('./db');

const insertStmt = db.prepare(
  'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
);
const byEmailStmt = db.prepare(
  'SELECT id, name, email, password_hash FROM users WHERE email = ?'
);
const byIdStmt = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?');

function createUser({ name, email, passwordHash }) {
  const normalized = String(email).trim().toLowerCase();
  try {
    const result = insertStmt.run(name, normalized, passwordHash);
    return { id: Number(result.lastInsertRowid), name, email: normalized };
  } catch (err) {
    if (
      err &&
      (err.errcode === 2067 ||
        err.errcode === 1555 ||
        /UNIQUE constraint failed/i.test(err.message || ''))
    ) {
      const e = new Error('El email ya esta registrado');
      e.code = 'EMAIL_TAKEN';
      throw e;
    }
    throw err;
  }
}

function findByEmail(email) {
  return byEmailStmt.get(String(email).trim().toLowerCase());
}

function findById(id) {
  return byIdStmt.get(id);
}

module.exports = { createUser, findByEmail, findById };
