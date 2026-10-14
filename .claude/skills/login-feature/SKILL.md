---
name: login-feature
description: Implementa el login completo de la app (frontend, backend y base de datos) lanzando 3 subagentes en paralelo. Usar cuando el usuario pida "implementar el login", "crear la autenticacion" o invoque /login-feature.
disable-model-invocation: true
---

# Skill: login-feature

Orquesta la implementacion del login lanzando **3 subagentes en paralelo**.
La fuente de verdad compartida es `docs/CONTRACT.md`.

## Pasos

1. Lee `docs/CONTRACT.md` para confirmar que existe y entender el contrato.
2. Lanza los 3 subagentes **en un solo mensaje, con tres llamadas a la herramienta Agent a la vez** (en paralelo, no uno tras otro):
   - `subagent_type: "login-database"` -> capa de base de datos
   - `subagent_type: "login-backend"` -> API de autenticacion
   - `subagent_type: "login-frontend"` -> pantallas de login y dashboard
   Cada prompt debe decir: "Implementa tu parte segun docs/CONTRACT.md y escribe solo en los archivos que te pertenecen".
3. Cuando terminen los 3, **integra y verifica**:
   - `npm start` en segundo plano.
   - Con `curl`: registrar un usuario, hacer login, llamar a `/api/auth/me` con el token, y probar un login con password incorrecta (debe dar 401).
   - Detener el servidor.
4. Si algo falla por desacuerdo con el contrato, corrige el archivo del agente responsable (o relanza solo a ese agente).
5. Entrega un resumen corto: archivos creados por cada agente y resultado de la verificacion.

## Reglas
- No escribas codigo de login tu mismo antes de lanzar los subagentes: delega.
- No modifiques `docs/CONTRACT.md` salvo que el usuario lo pida.
