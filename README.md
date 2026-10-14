# Ejercicio subagentes: login

Proyecto base sencillo (Express + SQLite + HTML) para practicar una skill de proyecto
que lanza 3 subagentes (frontend, backend, base de datos) en paralelo.

- Contrato compartido: [docs/CONTRACT.md](docs/CONTRACT.md)
- Skill: `.claude/skills/login-feature/SKILL.md` (invocar con `/login-feature`)
- Subagentes: `.claude/agents/`

```
npm install
npm start   # http://localhost:3000
```

## Tests

```
npm test    # node:test, usa una BD temporal
```

Se ejecutan en GitHub Actions (`.github/workflows/tests.yaml`) y, localmente, un hook de
Claude Code (`.claude/settings.json`) los corre tras cada Edit/Write y pide arreglar los fallos.
