# Contrato del login (fuente de verdad compartida)

Los tres subagentes (frontend, backend, base de datos) trabajan en paralelo
y SOLO se coordinan a traves de este contrato. No lo cambies sin avisar.

## Stack
- Node.js (CommonJS) + Express 4, servidor en `server.js` (puerto 3000)
- SQLite con el modulo nativo `node:sqlite` (`DatabaseSync`), archivo `database/app.db`
- `bcryptjs` para hashear contrasenas, `jsonwebtoken` para el token
- Frontend: HTML + CSS + JS vanilla en `frontend/`, servido de forma estatica

## Propiedad de archivos (cada agente escribe SOLO en lo suyo)
| Agente | Carpeta / archivos |
|---|---|
| login-database | `database/db.js`, `database/schema.sql`, `database/users.repository.js` |
| login-backend | `backend/auth.routes.js`, `backend/auth.middleware.js` |
| login-frontend | `frontend/login.html`, `frontend/login.js`, `frontend/dashboard.html`, `frontend/styles.css` |

## Capa de datos: `database/users.repository.js` (module.exports)
- `createUser({ name, email, passwordHash })` -> `{ id, name, email }`; lanza `Error` con `code = 'EMAIL_TAKEN'` si el email ya existe
- `findByEmail(email)` -> `{ id, name, email, password_hash } | undefined`
- `findById(id)` -> `{ id, name, email } | undefined`

Tabla `users`: `id INTEGER PK AUTOINCREMENT`, `name TEXT NOT NULL`,
`email TEXT NOT NULL UNIQUE` (guardado en minusculas), `password_hash TEXT NOT NULL`,
`created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`.

## API HTTP (JSON)
| Metodo y ruta | Body | Exito | Errores |
|---|---|---|---|
| `POST /api/auth/register` | `{ name, email, password }` | `201 { user: {id,name,email} }` | `400` datos invalidos (password < 6), `409` email ya registrado |
| `POST /api/auth/login` | `{ email, password }` | `200 { token, user: {id,name,email} }` | `400` faltan campos, `401` credenciales invalidas |
| `GET /api/auth/me` | header `Authorization: Bearer <token>` | `200 { user: {id,name,email} }` | `401` sin token / token invalido |

- Errores siempre con forma `{ "error": "mensaje legible" }`.
- Token JWT firmado con `process.env.JWT_SECRET || 'dev-secret-cambiar'`, expira en 1h.
- Nunca devolver `password_hash`.

## Frontend
- `login.html` con formulario de login y un enlace/alternador para registrarse.
- Guarda el token en `localStorage` con la clave `token`.
- Tras login exitoso redirige a `dashboard.html`, que llama a `/api/auth/me`
  y muestra el nombre del usuario + boton "Cerrar sesion" (borra el token).
- Si `/api/auth/me` devuelve 401 en el dashboard, redirige a `login.html`.
