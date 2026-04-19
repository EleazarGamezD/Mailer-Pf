# Continuation Notes

## Leer primero

1. `docs/IMPLEMENTATION_STATUS.md`
2. `docs/ARCHITECTURE.md`
3. este archivo

## Estado real al retomar

- El frontend público ya consume desde API el contenido dinámico principal.
- `resumes` ya quedó cableado en frontend para descargar desde `base64`.
- El backend ya tiene base TS + Mongo + Swagger + seed.
- El backend desplegado en Vercel probablemente sigue viejo hasta nuevo redeploy.
- El dashboard admin actual del frontend no es válido como solución final:
  - usa `sessionStorage` directo
  - no usa JWT
  - rompe SSR/prerender

## Cambio de criterio ya aprobado por el usuario

La zona admin debe quedar así:

- acceso oculto en header desktop y mobile
- login admin por usuario y password
- creación de usuario admin desde Swagger con endpoint protegido por `x-api-key`
- autenticación del dashboard vía JWT
- token persistido en storage del frontend
- métricas con filtros por año, mes, día y rangos libres
- listados admin en formato tabla
- pantallas de creación/edición para todo el contenido dinámico

## Qué no hacer

- no volver a documentar el login admin como validación de `ADMIN_API_KEY`
- no usar el botón oculto como argumento de seguridad
- no leer `sessionStorage` o `localStorage` directamente en componentes SSR
- no dejar métricas solo como `totalEvents + recentEvents`

## Próximos pasos recomendados

1. Backend
- añadir dependencias para JWT
- ampliar `env` con `JWT_SECRET`, `JWT_EXPIRES_IN`
- modelar `admin_users`
- crear hash/verify de password
- crear `POST /api/admin/users` protegido por `x-api-key`
- crear `POST /api/admin/auth/login`
- crear `GET /api/admin/me`
- crear middleware `requireAdminAuth`

2. Analytics
- ampliar `GET /api/admin/dashboard/metrics`
- aceptar `year`, `month`, `day`, `from`, `to`
- devolver agregados por tipo, ruta, proyecto e idioma

3. Frontend admin
- crear servicio auth admin con storage abstraction
- agregar acceso oculto en header desktop/mobile
- separar login admin de dashboard
- rehacer dashboard con tabs o secciones:
  - resumen
  - proyectos
  - testimonials
  - resumes
  - skills
  - experience
  - social links
  - profile
  - users

## Variables de entorno necesarias

- `MONGODB_URI`
- `MONGODB_DB_NAME=Porfolio`
- `ADMIN_API_KEY`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `APP_PORT`
- `API_BASE_URL`
- `CORS_ORIGIN`
- `JSON_LIMIT`
- `GMAIL_USER`
- `GMAIL_PASSWORD`
- `FROM`
- `TO`
- `RECAPTCHA_SECRET_KEY`

## Nota crítica

- La credencial de MongoDB compartida en la conversación debe rotarse antes de despliegue.
- Si Swagger vuelve a mostrar rutas montadas incorrectas, hay que preferir spec controlada antes que fallback visual engañoso.
