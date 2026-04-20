# Portfolio Dynamic API Architecture

## Objetivo

Convertir `Mailer-Pf` en la API principal y en el mini CMS del portfolio para que `My-Portfolio` consuma contenido totalmente dinámico desde MongoDB y para que exista una zona admin real con autenticación por usuario y token.

## Módulos de dominio

- `projects`: proyectos, detalle, stack, imágenes, links, estado y destacados.
- `profile`: nombre público, tagline, disponibilidad, ubicación, textos de hero y about.
- `techSkills`: skills técnicas, categoría, nivel, orden, icono y estado.
- `experience`: experiencia laboral, logros, fechas, stack y orden.
- `socialLinks`: redes, enlaces externos, iconos y orden.
- `resumes`: CVs activos e históricos.
- `testimonials`: recomendaciones o comentarios profesionales.
- `analytics`: eventos de interacción y agregados del dashboard.
- `contact`: captcha y envío de correos.
- `adminUsers`: usuarios administradores con credenciales propias.

## Reglas de seguridad

- `GET` públicos para contenido visible del portfolio.
- `POST /api/analytics/event` público para registrar interacción.
- Mutaciones de contenido protegidas con `x-api-key`.
- Creación de usuarios admin protegida con `x-api-key`.
- Login admin por credenciales de usuario, no por `x-api-key`.
- Dashboard y rutas admin funcionales protegidas por JWT Bearer.
- El botón oculto del header solo es una puerta de entrada UX; la seguridad real vive en backend.

## Flujo de autenticación admin

1. El header público tendrá un acceso oculto en desktop y mobile.
2. Ese acceso lleva a una vista de login admin.
3. El frontend envía credenciales a `POST /api/admin/auth/login`.
4. El backend valida usuario admin y responde JWT + metadatos mínimos de sesión.
5. Angular guardará el token en storage con el mecanismo que el usuario defina.
6. Las vistas admin envían `Authorization: Bearer <token>`.
7. El backend validará JWT antes de permitir acceso al dashboard, tablas y operaciones admin.

## Dashboard admin esperado

### Acceso

- Botón oculto en header desktop.
- Botón oculto equivalente en menú mobile.
- Vista de login separada de la vista dashboard.
- Guard SSR-safe en frontend para no tocar `sessionStorage` o `localStorage` directamente desde componentes en render del servidor.

### Métricas

El dashboard debe soportar filtros por:

- año
- mes
- día
- rango libre `from/to`

Las consultas admin de analytics deben permitir:

- resumen general de eventos
- agrupación por tipo de evento
- agrupación por ruta
- agrupación por proyecto
- agrupación por idioma
- top interacciones
- eventos recientes

Eventos esperados a trackear:

- page views
- project detail views
- project CTA clicks
- social link clicks
- CV downloads
- contact form submits
- testimonial/admin interactions si luego se necesitan

## Vistas admin esperadas

Habrá dos tipos de pantallas por módulo dinámico:

- vista de listado tipo tabla
- vista de edición/creación

Módulos mínimos del panel:

- `projects`
- `profile`
- `techSkills`
- `experience`
- `socialLinks`
- `resumes`
- `testimonials`
- `analytics`
- `adminUsers`

Cada listado deberá permitir al menos:

- ver registros
- buscar o filtrar
- abrir edición desde menú de acciones contextual
- eliminar
- cambiar estado activo/publicado cuando aplique

### Patrón visual y de navegación del dashboard

- La referencia correcta para el dashboard admin es `BookingAgency_Frontend_V2/src/app/ui`, no `template`.
- `template` solo sirve como fuente de formatos de ejemplo y documentación visual de CoreUI.
- Los módulos admin del portfolio deben seguir el patrón real de Booking:
  - una vista de listado por módulo
  - una vista de formulario separada para crear
  - una vista de formulario separada para editar
  - acciones por fila desde menú contextual con iconografía, no botones inline de edición masiva dentro de la tabla
- El primer módulo a usar como patrón operativo es `projects`, y luego ese mismo flujo debe replicarse en `profile`, `techSkills`, `experience`, `testimonials`, `resumes`, `socialLinks` y `adminUsers`.
- Las tablas, espaciados, jerarquía visual, botones de alta y menús de acciones deben converger al lenguaje usado en los componentes reales de Booking bajo `ui/shared`.

Cada editor deberá permitir:

- crear
- editar
- activar/desactivar
- guardar traducciones `es/en`
- subir assets base64 cuando aplique

## Almacenamiento

- Base de datos: `Porfolio`.
- Motor: MongoDB Atlas.
- Sin bucket externo inicialmente.

### Assets

- Imágenes:
  - el frontend las comprimirá a WebP
  - se enviarán como base64
  - el backend usará un servicio global de archivos para normalizar cualquier imagen antes de persistirla
  - el backend guardará `file + mimeType + fileName + extension` en MongoDB
  - ningún módulo debe depender de bucket externo o MinIO en esta etapa
- CVs:
  - se almacenarán en Mongo como base64 con `mimeType` y `fileName`
  - si el volumen crece, se podrá migrar a GridFS sin romper el contrato público

## Estrategia de i18n dinámica

- La UI estática sigue en Angular.
- El contenido editable se guarda como objetos localizados:
  - `title.es`, `title.en`
  - `description.es`, `description.en`
  - `label.es`, `label.en`
- Si `en` no llega, el backend puede copiar temporalmente `es` hasta que exista traducción real.

## Endpoints objetivo

### Públicos

- `GET /health`
- `GET /docs`
- `GET /api/projects`
- `GET /api/projects/:idOrSlug`
- `GET /api/content/profile`
- `GET /api/content/techSkills`
- `GET /api/content/experience`
- `GET /api/content/socialLinks`
- `GET /api/content/resumes`
- `GET /api/content/testimonials`
- `POST /api/contact/send`
- `POST /api/contact/verify-captcha`
- `POST /api/analytics/event`

### Privados por `x-api-key`

- `POST /api/projects`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id`
- `PUT /api/content/profile`
- `POST|PATCH|DELETE /api/content/techSkills`
- `POST|PATCH|DELETE /api/content/experience`
- `POST|PATCH|DELETE /api/content/socialLinks`
- `POST|PATCH|DELETE /api/content/resumes`
- `POST|PATCH|DELETE /api/content/testimonials`
- `POST /api/admin/seed-initial`
- `POST /api/admin/users`

### Privados por JWT admin

- `POST /api/admin/auth/login`
- `GET /api/admin/me`
- `GET /api/admin/dashboard/metrics`
- `GET /api/admin/dashboard/activity`
- `GET /api/admin/projects`
- `GET /api/admin/testimonials`
- `GET /api/admin/resumes`
- `GET /api/admin/techSkills`
- `GET /api/admin/experience`
- `GET /api/admin/socialLinks`
- `GET /api/admin/users`

Nota:
- para evitar duplicar lógica, varios listados admin pueden reutilizar repositorios de contenido y exponer filtros/metadata extra
- el Swagger debe reflejar qué rutas usan `x-api-key` y cuáles usan `BearerAuth`

## Estado actual real

- Backend compilando en TypeScript.
- Seguridad por `x-api-key` ya existe para mutaciones.
- Seed inicial existe.
- Swagger existe, pero el área admin todavía no está alineada con JWT.
- El frontend público ya consume contenido desde API.
- El dashboard frontend actual es provisional y debe migrarse a JWT + storage abstraction SSR-safe.

## Siguiente implementación prioritaria

1. Crear `adminUsers` en backend.
2. Añadir hash de password y JWT.
3. Exponer endpoint protegido para crear usuario admin desde Swagger.
4. Exponer login admin real con JWT.
5. Proteger dashboard admin con middleware Bearer.
6. Ampliar analytics para filtros por fecha y rango.
7. Construir acceso oculto en header desktop/mobile.
8. Rehacer dashboard Angular con login, tablas estilo Booking UI y vistas de edición separadas por ruta.
