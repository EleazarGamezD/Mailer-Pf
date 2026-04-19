# Implementation Status

## Cómo retomar este proyecto

Si otra IA o persona retoma el trabajo, debe leer en este orden:

1. `docs/IMPLEMENTATION_STATUS.md`
2. `docs/ARCHITECTURE.md`
3. `docs/CONTINUATION.md`

## Estado general

- [x] Auditar frontend y backend existentes.
- [x] Definir el dominio del portfolio dinámico.
- [x] Migrar `Mailer-Pf` a TypeScript.
- [x] Montar Express + MongoDB + Swagger.
- [x] Dejar seguridad por `x-api-key` en mutaciones.
- [x] Exponer endpoints base para `projects`, `profile`, `techSkills`, `experience`, `socialLinks`, `resumes`, `testimonials`, `analytics`, `contact`, `admin`.
- [x] Verificar compilación TypeScript.
- [x] Verificar arranque real del backend con `GET /health`.
- [x] Corregir compatibilidad de mail templates para Node 20+ con `express-handlebars@7.1.3` y `nodemailer-express-handlebars@6.1.2`.
- [x] Documentar arquitectura y continuidad.
- [x] Documentar un tablero persistente de progreso para continuidad entre IAs.
- [x] Crear script de seed inicial del contenido hardcodeado.
- [x] Exponer endpoint admin para ejecutar el seed inicial.
- [ ] Sembrar Mongo con el contenido inicial hardcodeado.
- [x] Conectar Angular al backend para dejar de usar JSON local de forma progresiva.
- [x] Iniciar migración del frontend en el bloque de `projects` del home.
- [x] Migrar `about`, `skills`, `experience`, `socialLinks`, `projects` y `testimonials` a consumo real desde API.
- [ ] Migrar `resumes` a consumo real desde API.
- [ ] Terminar detalle de proyecto por id/slug.
- [ ] Terminar bloque CV dinámico.
- [ ] Terminar tarjetas dinámicas de proyectos.
- [ ] Crear util frontend para compresión WebP + base64.
- [ ] Implementar tracking más completo: project views, CV downloads, CTA clicks.
- [ ] Crear login oculto y dashboard admin.
- [ ] Crear CRUD admin en Angular.
- [ ] Implementar traducción automática real al inglés para contenido dinámico.

## Estado por ambiente

### Backend `Mailer-Pf`

- [x] TypeScript configurado.
- [x] `dist/` tratado como artefacto compilado.
- [x] `.env.example` actualizado.
- [x] Swagger generado desde código.
- [x] Swagger normalizado para exponer rutas montadas reales bajo `/api/*`.
- [x] Swagger configurado para persistir `x-api-key` en la UI.
- [x] Repositorios y servicios modularizados.
- [x] Endpoints CRUD iniciales listos.
- [x] Endpoint admin `POST /api/admin/seed-initial` agregado para correr el seed sin CLI.
- [ ] Seed inicial ejecutado en Mongo.
- [ ] Validaciones fuertes por payload.
- [ ] Dashboard metrics agregadas avanzadas.

### Frontend `My-Portfolio`

- [x] Auditados los bloques hardcodeados.
- [x] Detectados los orígenes de contenido a migrar.
- [x] Servicio HTTP inicial para `projects`.
- [x] Reemplazo del hardcode del slider de proyectos.
- [x] Servicio HTTP para `profile`, `techSkills`, `experience`, `socialLinks` y `testimonials`.
- [x] Reemplazo del hardcode en `home banner`, `about`, `skills`, `experience`, `socialLinks` y `testimonials` con fallback local.
- [x] Refactor de `projects` y `content` para consumir DTOs directos del backend sin mapeos intermedios en servicios.
- [x] Interfaces movidas a `src/app/core/interfaces/<modulo>/...`.
- [x] Eliminados los archivos `shared/Json/*` usados como fallback de contenido dinámico.
- [ ] Servicio HTTP para `resumes`.
- [ ] Reemplazo del hardcode restante en CVs y detalles.
- [ ] `projectDetails` terminado.
- [ ] Dashboard oculto.

## Hardcode detectado y pendiente de migración

- textos auxiliares de UI e i18n en `src/app/core/services/i18n/i18n.service.ts`

## Comandos validados

```bash
npm install
npm run build
npm run docs:generate
npm run seed:initial
node dist/index.js
```

## Verificaciones reales ya hechas

- `GET /health` responde `200`.
- El backend compila en TypeScript.
- Swagger se genera correctamente.
- El endpoint `POST /api/admin/seed-initial` quedó creado y documentado.
- El frontend Angular compila tras migrar `projects`, `home banner`, `about`, `skills`, `experience`, `socialLinks` y `testimonials`.
- `projectDetails` ahora consulta `/api/projects/:idOrSlug` sin fallback local.

## Observaciones actuales

- El slider de proyectos ya consulta la API sin fallback local.
- `profile`, `heroSlides`, `techSkills`, `experience`, `socialLinks` y `testimonials` ya consultan API sin fallback local.
- Los servicios de `projects` y `content` ya no hacen shaping de respuesta; los componentes públicos leen DTOs backend de forma directa.
- El build de Angular sigue pasando, pero el prerender registra `404` contra `https://mailer-pf.vercel.app/api/*` porque el backend desplegado aún no expone esas rutas nuevas.
- Quedan warnings de CSS legacy en el build de Angular; no son bloqueantes y no vienen de esta migración.
- `swagger-autogen` sigue mostrando varios paths relativos sin prefijo montado de Express. Para el seed, la ruta real es `POST /api/admin/seed-initial`, aunque Swagger UI pueda mostrar `/seed-initial`.
- Se agregó postproceso del `swagger-output.json` para corregir los prefijos de rutas y evitar llamadas erróneas desde Swagger UI.

## Siguiente paso recomendado

1. Ejecutar seed inicial del contenido.
2. Conectar Angular a `/api/projects` y `/api/content/*`.
3. Retirar el hardcode progresivamente.
