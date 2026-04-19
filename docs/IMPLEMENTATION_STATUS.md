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
- [ ] Reemplazar autenticación admin provisional por `admin users + JWT`.
- [ ] Crear acceso oculto en header desktop y mobile.
- [ ] Construir login admin SSR-safe.
- [ ] Construir dashboard admin con tablas y vistas de edición.
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
- [ ] Agregar acceso oculto al dashboard en header desktop.
- [ ] Agregar acceso oculto al dashboard en menú mobile.
- [ ] Crear vista `admin-login`.
- [ ] Rehacer `admin-dashboard` con auth JWT y sin acceso directo a storage en SSR.
- [ ] Crear tablas admin para `projects`, `testimonials`, `resumes`, `skills`, `experience`, `socialLinks`, `adminUsers`.
- [ ] Crear formularios admin para CRUD de todos los módulos dinámicos.

## Hallazgos importantes

- El dashboard actual del frontend usa `sessionStorage` directo y no sirve como diseño final.
- El backend actual solo tiene un login admin placeholder por `ADMIN_API_KEY`; debe eliminarse como contrato final.
- `GET /api/analytics/dashboard` hoy solo devuelve agregados simples; falta la capa admin real con filtros.
- El backend desplegado en Vercel debe redeployarse para exponer las rutas nuevas.
- El prerender de Angular sigue registrando `404` contra `https://mailer-pf.vercel.app/api/...` mientras Vercel sirva la versión vieja del backend.

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

## Próxima fase en curso

### Fase admin/auth

- [x] Documentación corregida al nuevo criterio
- [x] Dependencias/env para JWT
- [x] Modelo y repositorio `admin_users`
- [x] Endpoints `create admin user`, `login`, `me`
- [x] Middleware Bearer
- [ ] Header oculto desktop/mobile
- [ ] Login admin SSR-safe

### Fase dashboard

- [ ] Métricas con filtros por rango
- [ ] Tablas admin por módulo
- [ ] Formularios CRUD por módulo
- [ ] Integración Angular con token Bearer
