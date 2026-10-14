const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-cambiar';

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  try {
    const payload = jwt.verify(match[1].trim(), JWT_SECRET);
    req.userId = payload.sub !== undefined ? Number(payload.sub) : payload.id;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalido o expirado' });
  }
}

module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
module.exports.JWT_SECRET = JWT_SECRET;
