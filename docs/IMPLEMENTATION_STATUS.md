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
- [x] Dejar seguridad por `x-api-key` en mutaciones públicas de CMS.
- [x] Exponer endpoints base para `projects`, `profile`, `techSkills`, `experience`, `socialLinks`, `resumes`, `testimonials`, `analytics`, `contact`.
- [x] Verificar compilación TypeScript.
- [x] Verificar arranque real del backend con `GET /health`.
- [x] Corregir compatibilidad de mail templates para Node 20+.
- [x] Documentar arquitectura y continuidad.
- [x] Crear script de seed inicial del contenido hardcodeado.
- [x] Exponer endpoint admin para ejecutar el seed inicial.
- [x] Conectar Angular al backend para retirar JSON locales.
- [x] Migrar `projects`, `about`, `skills`, `experience`, `socialLinks`, `testimonials`, `hero` y `resumes` a consumo real desde API.
- [x] Eliminar fallbacks `shared/Json/*` del contenido dinámico.
- [x] Mover interfaces a `src/app/core/interfaces/<modulo>/...`.
- [x] Eliminar mapeos intermedios en `projects` y `content` services.
- [ ] Ejecutar seed inicial en el ambiente que se vaya a usar.
- [x] Terminar detalle de proyecto por `id/slug`.
- [ ] Terminar diseño final de tarjetas dinámicas de proyectos.
- [ ] Crear util frontend para compresión WebP + base64.
- [ ] Implementar tracking más completo de interacciones.
- [x] Reemplazar autenticación admin provisional por `admin users + JWT`.
- [x] Crear acceso oculto en header desktop y mobile.
- [x] Construir login admin SSR-safe.
- [x] Construir dashboard admin con tablas y vistas de edición.
- [x] Migrar el shell visual del admin a CoreUI manteniendo intacta la UI pública.
- [ ] Implementar traducción automática real al inglés para contenido dinámico.

## Estado por ambiente

### Backend `Mailer-Pf`

- [x] TypeScript configurado.
- [x] `dist/` tratado como artefacto compilado.
- [x] `.env.example` iniciado.
- [x] Entrada serverless de Vercel corregida para la app Express actual.
- [x] Swagger configurado y visible en `/docs`.
- [x] Swagger configurado para persistir `x-api-key`.
- [x] Repositorios y servicios modularizados.
- [x] Endpoints CRUD iniciales listos para contenido.
- [x] Endpoint `POST /api/admin/seed-initial` agregado.
- [x] Crear colección lógica `admin_users`.
- [x] Añadir `JWT_SECRET` y expiración configurable.
- [x] Crear endpoint `POST /api/admin/users` protegido por `x-api-key`.
- [x] Crear endpoint `POST /api/admin/auth/login`.
- [x] Crear endpoint `GET /api/admin/me`.
- [x] Crear middleware Bearer para admin.
- [ ] Separar claramente rutas `x-api-key` de rutas `JWT`.
- [ ] Mejorar analytics admin con filtros por `year`, `month`, `day`, `from`, `to`.
- [ ] Exponer endpoints admin de listados/tablas para contenido dinámico.
- [ ] Refinar Swagger para reflejar `ApiKeyAuth` y `BearerAuth`.

### Frontend `My-Portfolio`

- [x] Auditados los bloques hardcodeados.
- [x] Detectados los orígenes de contenido a migrar.
- [x] Servicios HTTP para `projects`, `profile`, `techSkills`, `experience`, `socialLinks`, `testimonials` y `resumes`.
- [x] Reemplazo del hardcode del home público por consumo real de API.
- [x] `x-api-key` agregado globalmente para mutaciones HTTP.
- [x] Rutas de `contact` y `verify-captcha` alineadas con backend.
- [x] CVs descargando desde datos devueltos por API.
- [x] Ajustar `projectDetails` con layout más rico y galería.
- [x] Enviar `phone` del contacto de frontend a backend.
- [x] Maquetar correos de contacto con templates reales de portfolio.
- [ ] Ajustar detalles visuales restantes del home público.
- [x] Agregar acceso oculto al dashboard en header desktop.
- [x] Agregar acceso oculto al dashboard en menú mobile.
- [x] Crear vista `admin-login`.
- [x] Rehacer `admin-dashboard` con auth JWT y sin acceso directo a storage en SSR.
- [x] Crear tablas admin para `projects`, `testimonials`, `resumes`, `skills`, `experience`, `socialLinks` y `adminUsers`.
- [x] Crear formularios admin para CRUD de `projects`, `profile`, `testimonials`, `resumes`, `skills`, `experience`, `socialLinks` y gestión base de `adminUsers`.
- [x] Montar layout admin CoreUI con sidebar/header y navegación por secciones.

## Hallazgos importantes

- El login admin real ya usa JWT y el dashboard Angular ya no depende de `sessionStorage`/`localStorage` directos.
- `GET /api/admin/dashboard/metrics` ya soporta filtros por `year`, `month`, `day`, `from`, `to` y el dashboard los consume.
- El backend desplegado en Vercel debe redeployarse para exponer las rutas nuevas.
- El prerender de Angular sigue registrando `404` contra `https://mailer-pf.vercel.app/api/...` mientras Vercel sirva la versión vieja del backend.
- La migración visual del admin cambió de criterio: la UI pública sigue igual y solo el admin debe converger al dashboard CoreUI.
- Ya existe una base frontend para el pipeline de imágenes embebidas (`base64/webp`) inspirada en `BookingAgency_Frontend_V2`, pero aún no está conectada a los formularios de `projects` y `profile`.
- El dashboard admin viejo fue eliminado y reemplazado por páginas hijas reales bajo el shell CoreUI con un facade compartido.

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
- Swagger abre y persiste `x-api-key`.
- El endpoint `POST /api/admin/seed-initial` existe.
- El frontend Angular compila tras migrar el contenido dinámico público.
- El detalle de proyecto ya renderiza media, chips tecnológicos, CTAs y galería desde DTO real.
- El flujo de contacto ya envía `phone` de extremo a extremo y usa plantillas de correo propias.
- El admin Angular ya separa `admin/login` de `admin/dashboard`, protege el dashboard con guard y consume métricas admin con filtros.
- El dashboard admin ya permite CRUD para `projects`, `profile`, `techSkills`, `experience`, `testimonials`, `resumes` y `socialLinks`.
- La sección `resumes` ya soporta alta con archivo y reemplazo de archivo existente mediante `base64`, `fileName` y `mimeType`.
- El dashboard admin ya incluye tabla de `adminUsers` con edición base de `displayName`, `role` y `active` usando Bearer auth.
- La sección `projects` ya permite editar `coverImage` y galería (`images`) por URL desde el dashboard admin.
- El `admin-dashboard` ya quedó dividido en subcomponentes standalone para `overview`, `projects`, `profile`, `skills`, `experience`, `testimonials`, `resumes`, `socialLinks` y `users`.

## Próxima fase en curso

### Fase admin/auth

- [x] Documentación corregida al nuevo criterio
- [x] Dependencias/env para JWT
- [x] Modelo y repositorio `admin_users`
- [x] Endpoints `create admin user`, `login`, `me`
- [x] Middleware Bearer
- [x] Header oculto desktop/mobile
- [x] Login admin SSR-safe

### Fase dashboard

- [x] Métricas con filtros por rango
- [x] Tablas admin por módulo
- [x] Formularios CRUD por módulo
- [x] Integración Angular con token Bearer
- [x] Mejorar edición avanzada de proyectos e imágenes
- [x] Dividir el dashboard en subcomponentes para reducir el tamaño del componente monolítico
- [x] Reemplazar el shell del admin por layout CoreUI y mover la navegación a rutas reales por sección

Estado actual de esa división:
- [x] `overview`
- [x] `profile`
- [x] `users`
- [x] `projects`
- [x] `skills`
- [x] `experience`
- [x] `testimonials`
- [x] `resumes`
- [x] `socialLinks`
