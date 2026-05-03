# Portfolio Dynamic API

Backend Express para el portfolio dinámico. Esta app ahora centraliza:

- contenido editable del portfolio
- envío de correos de contacto
- verificación de captcha
- analíticas para dashboard
- documentación Swagger

## Scripts

```bash
npm install
npm run docs:generate
npm run dev
npm start
```

## Variables de entorno

Usa `.env.example` como plantilla.

Variables principales:

```bash
NODE_ENV=development
APP_PORT=3000
API_BASE_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:4200
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=Porfolio
ADMIN_API_KEY=...
```

Variables de correo:

```bash
FROM=
TO=
GMAIL_USER=
GMAIL_PASSWORD=
RECAPTCHA_SECRET_KEY=
```

## Endpoints clave

- `GET /health`
- `GET /docs`
- `GET /api/projects`
- `GET /api/content/profile`
- `POST /api/contact/send`
- `POST /api/analytics/event`

Todos los `POST`, `PUT`, `PATCH` y `DELETE` administrativos usan `x-api-key`.

## Documentación interna

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/CONTINUATION.md](./docs/CONTINUATION.md)
