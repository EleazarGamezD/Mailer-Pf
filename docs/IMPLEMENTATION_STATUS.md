# Implementation Status

## Cómo retomar este proyecto

Si otra IA o persona retoma el trabajo, debe leer en este orden:

1. `docs/IMPLEMENTATION_STATUS.md` ← este archivo
2. `docs/ARCHITECTURE.md`
3. `docs/CONTINUATION.md`

---

## Estado general — Funcionalidades completas ✅

### Core del portfolio dinámico

- [x] Migrar `Mailer-Pf` a TypeScript con Express + MongoDB + Swagger.
- [x] Endpoints CRUD para `projects`, `profile`, `techSkills`, `experience`, `socialLinks`, `resumes`, `testimonials`, `analytics`, `contact`.
- [x] Angular 19 frontend consumiendo toda la API (sin JSONs locales).
- [x] Footer dinámico: nombre del usuario (izquierda) + "Made with ♥ by Eleazar Gámez" (derecha).
- [x] Detalle de proyectos con banner del proyecto, galería de imágenes y chips tecnológicos.
- [x] Formulario de contacto con reCAPTCHA y plantillas de correo propias.
- [x] CV dinámico generado en PDF desde los datos del portfolio (español e inglés).
- [x] Descarga de CV funcional desde el frontend.
- [x] Botón de traducción en formularios de CMS (llama a Google Translate API gratuita).

### CMS Administrativo

- [x] Autenticación admin con JWT (login, logout, guard, interceptor).
- [x] Primer login forzado: bootstrap user → setup-account wizard → eliminación del usuario provisional.
- [x] Recuperación de contraseña con magic link vía email (expira en 10 minutos).
- [x] Páginas `admin-login`, `admin-setup-account`, `admin-forgot-password`, `admin-reset-password`.
- [x] Layout CoreUI con sidebar, header, navegación por rutas reales.
- [x] CMS responsivo (dark mode, mobile, tablets).
- [x] Secciones CRUD: `projects`, `profile`, `skills`, `experience`, `testimonials`, `resumes`, `socialLinks`, `users`, `themes`, `analytics`, `danger-zone`.
- [x] Tablero de proyectos con menú de acciones (gear dropdown: editar / eliminar).
- [x] Skills management: SkillPicker reutilizable con grid 8 items + paginación.
- [x] Tech skills en experiencia laboral (almacenadas en `metadata.skillIds`, para CV dinámico).
- [x] Formularios de creación/edición de skills con foto de tamaño fijo, modo crear y modo editar unificados.
- [x] Formulario de themes con generación de paleta de colores (palette movida al backend vía `GET /api/themes/generate-palette`).
- [x] Danger Zone con acciones destructivas: seed inicial del sistema, seed demo personal, reset de themes.
- [x] Dashboard de analíticas con gráficas (Chart.js) y filtros por rango de fechas.

### Backend — Arquitectura

- [x] TypeScript compilado con `tsc`, assets copiados con `scripts/copy-assets.mjs` post-build.
- [x] Desplegable en Vercel con `vercel.json` y entrada serverless en `api/index.ts`.
- [x] Bucket configurable: Supabase Storage (S3-compatible), Amazon S3, Cloudflare R2, MinIO.
- [x] `seed.service.ts` separado de `admin.service.ts` (seeds en su propio módulo).
- [x] Seeds con `skillIds`/`primarySkillId` reales en proyectos y `metadata.skillIds` en experiencia.
- [x] Bootstrap admin creado al correr seed inicial (solo si no existen usuarios admin).
- [x] `FRONTEND_URL` en env para links en correos de recuperación de contraseña.
- [x] Colección `password_reset_tokens` en MongoDB para recuperación de contraseña.
- [x] Scripts `npm run seed:starter` y `npm run seed:personal` listos.

### Documentación

- [x] READMEs detallados para frontend y backend (pensados para usuarios junior / usuarios nuevos).
- [x] Instrucciones paso a paso: MongoDB Atlas, Supabase Storage, Gmail App Password, reCAPTCHA, Vercel, GitHub Actions.

---

## Estado por ambiente

### Backend `Portfolio_backend_v2`

- [x] TypeScript + ESM configurado.
- [x] `dist/` tratado como artefacto compilado; assets copiados post-build.
- [x] `.env.example` con todas las variables documentadas.
- [x] Vercel entry (`api/index.ts`) con lazy DB connection.
- [x] Swagger en `/docs` con `x-api-key` persistido.
- [x] Repositorios y servicios modularizados por dominio.
- [x] `admin.service.ts` — solo funciones de auth/usuarios (login, createUser, updateUser, setupAccount, requestPasswordReset, resetPasswordWithToken).
- [x] `seed.service.ts` — toda la lógica de seeds separada.
- [x] Rutas admin protegidas: `requireApiKey` (seeds, endpoints directos) y `requireAdminAuth` JWT (setup-account, me, etc.).
- [x] Analytics con filtros por `year`, `month`, `day`, `from`, `to`.
- [x] Palette generation en backend (`GET /api/themes/generate-palette`).

### Frontend `Portfolio_frontend_v2`

- [x] Angular 19 + SSR (server-side rendering).
- [x] Consumo de API 100% dinámico (sin fallbacks a JSONs locales).
- [x] Entornos configurados: `environment.local.ts`, `environment.ts`, `environment.prod.ts`.
- [x] Script `npm run config` genera los environments desde variables del sistema (usado en CI/CD).
- [x] GitHub Actions workflow (`.github/workflows/build-prod.yml`) despliega a Vercel en push a `master`.
- [x] CMS con layout CoreUI: sidebar, header, rutas por sección.
- [x] Todas las secciones del CMS tienen lista separada + formulario create/edit por ruta.
- [x] `SkillPickerComponent` reutilizable (usado en projects y experience).
- [x] `AdminAuthService` con `login`, `setupAccount`, `forgotPassword`, `resetPassword`.
- [x] Guard `adminAuthGuard` protege el dashboard; rutas de setup/recovery son públicas.

---

## Pendientes conocidos

- [ ] `Ejecutar seed inicial en el ambiente de producción` — acción manual, hacerlo vía Danger Zone del CMS o endpoint `POST /api/admin/seed-initial`.
- [ ] `Implementar tracking más completo de interacciones` — actualmente se registra visita a la página; clicks en CTAs, tiempo en sección, etc. no están implementados.
- [ ] `Ajustar detalles visuales restantes del home público` — pequeños detalles de animaciones/transiciones en el portfolio público.
- [ ] `Refinar Swagger para documentar ApiKeyAuth vs BearerAuth` — el Swagger actual no diferencia claramente qué endpoints usan API key vs JWT.
- [ ] `TTL index en password_reset_tokens` — crear índice TTL en MongoDB para limpiar tokens expirados automáticamente (actualmente se validan en código pero no se borran solos).

---

## Hallazgos importantes

- **Seed assets**: Los assets del seed están en `src/assets/seed-media/`. El script `scripts/copy-assets.mjs` los copia a `dist/assets/` después del build (TypeScript no copia archivos no-TS). En Vercel, el deploy incluye `dist/` completo.
- **SkillIds en experience**: Los tech skills de una experiencia se almacenan en `metadata.skillIds: string[]` (NOT campo top-level) porque `ContentDocument.metadata` es el campo flexible de ese modelo. El backend no necesita cambios para esto — `ContentPayload.metadata` fluye sin transformación para el tipo EXPERIENCE.
- **Primer login flow**: El seed `starter` crea un usuario bootstrap con `mustChangePassword: true`. Al loguearse, el backend devuelve `mustChangePassword: true` en la respuesta. El frontend detecta eso y redirige a `/admin/setup-account`. Al completar setup, se crea el usuario real, se borra el bootstrap y se emite un nuevo JWT.
- **Paleta de colores**: La generación de paleta se movió al backend para consumir `thecolorapi.com`. URL: `GET /api/themes/generate-palette?hex=XXXXXX&mode=analogic-complement`. El frontend llama a `ThemeService.generatePalette()` que internamente usa `GlobalHttpService`.
- **Builds**: Siempre verificar que backend (`npm run build`) y frontend (`ng build`) pasen antes de hacer deploy. El frontend tiene warnings esperados de SSR/Bootstrap que son normales.
- **CoreUI theming**: Los estilos de tema globales van en `_custom.scss`. NUNCA en los SCSS de componentes. Esta regla es crítica para mantener la consistencia del dark/light mode.

---

## Comandos validados

```bash
# Backend
cd Portfolio_backend_v2
npm install
npm run build        # tsc + copy-assets
npm run dev          # servidor con hot reload
npm run seed:starter # seed inicial del sistema
npm run seed:personal # seed con contenido demo personal

# Frontend
cd Portfolio_frontend_v2
npm install --legacy-peer-deps
npm run local   # serve con environment local
npm run build   # build de producción
npm run config  # genera environments desde vars del sistema (usado en CI)
```

## Verificaciones reales ya hechas

- `GET /health` responde `200`.
- Backend y frontend compilan sin errores TypeScript.
- Swagger abre en `/docs` y persiste `x-api-key`.
- Login admin con JWT funciona end-to-end.
- CMS CRUD completo para todas las secciones.
- CV PDF generado dinámicamente desde datos del portfolio.
- Formulario de contacto con reCAPTCHA envía correos reales.
- Seeds corren correctamente con skillIds resueltos.
- `seed.service.ts` separado; backend compila con la separación (`npm run build` ✅ exit 0).
- READMEs actualizados con instrucciones de despliegue paso a paso.
