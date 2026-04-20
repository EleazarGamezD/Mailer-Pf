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
- La base admin real ya quedó operativa:
  - acceso oculto en header desktop y mobile
  - login admin separado en `admin/login`
  - dashboard ahora en shell CoreUI con rutas `admin/dashboard/:section` protegido con guard
  - autenticación JWT en frontend mediante storage abstraction SSR-safe
  - métricas admin con filtros por `year`, `month`, `day`, `from`, `to`
  - CRUD visible para `projects`, `profile`, `techSkills`, `experience`, `testimonials`, `resumes` y `socialLinks`
  - tabla admin para `adminUsers` con edición base de nombre, rol y estado
  - edición de `projects` con `coverImage` y galería por URL
  - `resumes` con creación y reemplazo de archivo vía `base64`
  - dashboard ya dividido en subcomponentes standalone por sección
  - shell CoreUI ya montado con sidebar/header/footer y páginas hijas reales por sección
  - el dashboard monolítico anterior ya fue eliminado del frontend
  - utilidad frontend reservada para imágenes `base64/webp` orientadas a persistencia en Mongo

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

1. Frontend admin
- terminar la migración del dashboard al lenguaje visual CoreUI a nivel de tablas, cards, formularios y navegación
- conectar `projects` y luego `profile.heroSlides` al nuevo contrato de imágenes embebidas

2. Backend
- separar con más claridad rutas `x-api-key` de rutas `Bearer`
- refinar Swagger para reflejar `ApiKeyAuth` y `BearerAuth`
- evaluar endpoints específicos de admin users si el frontend va a administrarlos
- definir contrato final para `coverImage`, `images` y otros assets como objetos persistidos en Mongo

3. Despliegue
- redeployar `Mailer-Pf` en Vercel para alinear el prerender del frontend con el backend real
- volver a validar `docs` y métricas sobre el entorno desplegado

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
