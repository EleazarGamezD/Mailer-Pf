# Continuation Notes

## Estado actual

Se modularizó el backend para soportar el portfolio dinámico. La base ya tiene:

- configuración por entorno
- conexión MongoDB
- middleware de `x-api-key`
- Swagger en `/docs`
- rutas para proyectos, contenido general, analytics, contacto y admin

## Qué falta después de esta fase

1. Migrar seed inicial desde el frontend hardcodeado.
2. Mejorar validación de payloads por módulo.
3. Añadir traducción automática real al inglés.
4. Añadir contadores agregados por proyecto y por ruta.
5. Construir dashboard y login oculto en Angular.
6. Crear util frontend para compresión WebP + base64.
7. Reemplazar consumo hardcodeado en Angular.
8. Terminar diseño de detalle de proyecto y bloque CV.

## Variables de entorno necesarias

- `MONGODB_URI`
- `MONGODB_DB_NAME=Porfolio`
- `ADMIN_API_KEY`
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

La credencial de MongoDB usada para el cluster debe rotarse antes de despliegue porque ya fue expuesta fuera del `.env`.
