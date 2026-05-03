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
  - edición de `projects` ya no debe quedarse en tabla inline; el criterio aprobado es listado + formulario separado por ruta
  - `resumes` con creación y reemplazo de archivo vía `base64`
  - dashboard ya dividido en subcomponentes standalone por sección
  - shell CoreUI ya montado con sidebar/header/footer y páginas hijas reales por sección
  - el dashboard monolítico anterior ya fue eliminado del frontend
  - utilidad frontend reservada para imágenes `base64/webp` orientadas a persistencia en Mongo
  - el backend ya debe consolidarse alrededor de un file service global para normalizar imágenes hacia MongoDB en vez de bucket externo
  - `My-Portfolio` ya quedó alineado a Angular 21 y al builder moderno (`@angular/build`) igual que la referencia `BookingAgency_Frontend_V2`
  - SSR/prerender ya fue ajustado al API nueva (`provideServerRendering(withRoutes(...))` y `BootstrapContext` en `main.server.ts`)
  - la deuda técnica inmediata de compatibilidad quedó concentrada en `ng-recaptcha`
  - el shell admin ya tiene breadcrumb dinámico por sección y header contextual
  - las páginas contenedoras del admin ya empezaron a usar wrappers CoreUI reales (`c-alert`, `c-card`, `c-spinner`, `cButton`) en lugar de markup Bootstrap genérico

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
- maquetación basada en los componentes reales de `BookingAgency_Frontend_V2/src/app/ui`
- acciones por fila desde un menú contextual con iconografía tipo Booking
- formularios separados del listado para create/edit, empezando por `projects`

## Qué no hacer

- no volver a documentar el login admin como validación de `ADMIN_API_KEY`
- no usar el botón oculto como argumento de seguridad
- no leer `sessionStorage` o `localStorage` directamente en componentes SSR
- no dejar métricas solo como `totalEvents + recentEvents`

## Próximos pasos recomendados

1. Frontend admin
- terminar la migración del dashboard tomando como referencia `BookingAgency_Frontend_V2/src/app/ui` y no `template`
- convertir cada módulo admin al patrón `list route + create route + edit route`
- mover `projects` por completo al flujo Booking-style y luego replicar el patrón en `content`, `profile`, `resumes` y `users`
- reemplazar o encapsular `ng-recaptcha` para eliminar la única dependencia que sigue fuera de la línea Angular 21
- conectar `projects` y `profile.heroSlides` al nuevo contrato de imágenes embebidas y al uploader reutilizable inspirado en Booking

2. Backend
- separar con más claridad rutas `x-api-key` de rutas `Bearer`
- refinar Swagger para reflejar `ApiKeyAuth` y `BearerAuth`
- evaluar endpoints específicos de admin users si el frontend va a administrarlos
- consolidar un file service global para cualquier imagen del CMS y persistir assets como objetos Mongo normalizados

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
- Si una futura migración del dashboard vuelve a mirar `template` como referencia principal, se estaría retomando desde el criterio equivocado: la fuente válida para UX admin es `BookingAgency_Frontend_V2/src/app/ui`.
