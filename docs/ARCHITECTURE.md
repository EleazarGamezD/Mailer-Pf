# Portfolio Dynamic API Architecture

## Objetivo

Convertir `Mailer-Pf` en la API principal del portfolio para que el frontend Angular deje de depender de JSON hardcodeado y consuma contenido editable desde MongoDB Atlas.

## Módulos de dominio

- `projects`: proyectos del portfolio, detalle, links, stack, imágenes y estado.
- `profile`: sobre mí, disponibilidad, ubicación, tagline y datos principales.
- `techSkills`: habilidades técnicas, categorías, orden e iconos.
- `experience`: trayectoria laboral, logros, fechas y stack.
- `socialLinks`: redes sociales y enlaces externos.
- `resumes`: CVs activos e históricos.
- `testimonials`: comentarios o referencias.
- `analytics`: eventos de interacción y métricas para dashboard.
- `contact`: envío de correo y verificación de captcha.

## Reglas de seguridad

- `GET` públicos.
- `POST`, `PUT`, `PATCH`, `DELETE` protegidos con `x-api-key`.
- `POST /api/admin/login` solo valida la llave para habilitar el panel oculto.
- La ocultación del login en frontend es UX, no seguridad.

## Almacenamiento

- Base de datos: `Porfolio`.
- Motor: MongoDB Atlas.
- Sin bucket externo inicialmente.
- Imágenes:
  - el frontend las comprimirá a WebP antes de enviarlas
  - se enviarán como base64
  - el backend almacenará metadatos y el base64
- CVs:
  - inicialmente se guardarán en Mongo
  - si el volumen crece, el contrato puede migrar a GridFS

## Estrategia de i18n dinámica

- Mantener i18n estática de interfaz en Angular.
- Guardar el contenido editable como objetos localizados:
  - `title.es`
  - `title.en`
  - `description.es`
  - `description.en`
- Si `en` no llega, el backend replica temporalmente `es` como fallback.

## Endpoints actuales de esta fase

- `GET /health`
- `GET /docs`
- `GET /api/projects`
- `GET /api/projects/:idOrSlug`
- `POST /api/projects`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id`
- `GET /api/content/profile`
- `PUT /api/content/profile`
- `GET|POST|PATCH|DELETE /api/content/techSkills`
- `GET|POST|PATCH|DELETE /api/content/experience`
- `GET|POST|PATCH|DELETE /api/content/socialLinks`
- `GET|POST|PATCH|DELETE /api/content/resumes`
- `GET|POST|PATCH|DELETE /api/content/testimonials`
- `POST /api/contact/send`
- `POST /api/contact/verify-captcha`
- `POST /api/analytics/event`
- `GET /api/analytics/dashboard`
- `POST /api/admin/login`

## Siguiente integración con frontend

1. Crear rutas y servicios Angular para `projects`, `profile`, `techSkills`, `experience`, `socialLinks`, `resumes`, `testimonials`.
2. Reemplazar los JSON locales actuales.
3. Completar la vista `projectDetails/:idOrSlug`.
4. Agregar tracking de vistas, clics y descargas.
5. Construir el login oculto y dashboard admin.
