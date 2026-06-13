# Portfolio Dynamic API 🚀

Backend de la aplicación Portfolio Dinámico. Construido con **Node.js**, **Express**, **TypeScript** y **MongoDB**. Gestiona el contenido del portfolio, el CMS administrativo, envío de correos, almacenamiento de archivos y analíticas.

> **Plataforma de despliegue recomendada: [Vercel](https://vercel.com)**. Si prefieres otra plataforma (Railway, Render, Fly.io, VPS propio), puedes adaptarlo con tus conocimientos ya que es una API Express estándar.

---

## 📋 Tabla de contenidos

1. [Requisitos previos](#-requisitos-previos)
2. [Servicios externos necesarios](#-servicios-externos-necesarios)
   - [MongoDB Atlas (base de datos)](#1-mongodb-atlas--base-de-datos)
   - [Supabase Storage (almacenamiento de archivos)](#2-supabase-storage--almacenamiento-de-archivos)
   - [Gmail (envío de correos)](#3-gmail--envío-de-correos)
   - [Google reCAPTCHA (protección del formulario de contacto)](#4-google-recaptcha--protección-del-formulario-de-contacto)
3. [Instalación y desarrollo local](#-instalación-y-desarrollo-local)
4. [Variables de entorno](#-variables-de-entorno)
5. [Despliegue en Vercel](#-despliegue-en-vercel)
6. [Seeds (datos iniciales)](#-seeds-datos-iniciales)
7. [Endpoints principales](#-endpoints-principales)

---

## 🛠️ Requisitos previos

Asegúrate de tener instalado en tu máquina:

- **Node.js 22** o superior → [Descargar aquí](https://nodejs.org/)
- **npm** (viene incluido con Node.js)
- **Git** → [Descargar aquí](https://git-scm.com/)
- Una cuenta en **GitHub** (para el despliegue con Vercel)

Para verificar que tienes Node.js instalado correctamente, abre una terminal y ejecuta:

```bash
node --version   # Debe mostrar v22.x.x o superior
npm --version    # Debe mostrar 10.x.x o superior
```

---

## 🌐 Servicios externos necesarios

Antes de configurar el proyecto necesitas crear cuentas en los siguientes servicios. Todos tienen **plan gratuito** suficiente para un portfolio personal.

### 1. MongoDB Atlas — Base de datos

MongoDB Atlas es la base de datos donde se guarda todo el contenido del portfolio.

**Pasos para crear la cuenta y obtener la URI:**

1. Ve a [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) y crea una cuenta gratuita.
2. Al registrarte, elige **"Free"** (el plan M0 Sandbox, 512 MB, es suficiente).
3. Selecciona un proveedor de nube (AWS, Google o Azure) y una región cercana a ti. Haz clic en **"Create Cluster"**.
4. Mientras se crea el cluster, ve a **"Security" → "Database Access"** y crea un usuario de base de datos:
   - Haz clic en **"Add New Database User"**
   - Elige **"Password"** como método de autenticación
   - Escribe un nombre de usuario (ej. `portfolio-admin`) y una contraseña segura. **Guarda ambos datos.**
   - En "Database User Privileges", selecciona **"Atlas admin"**
   - Haz clic en **"Add User"**
5. Ve a **"Security" → "Network Access"** y haz clic en **"Add IP Address"**:
   - Para desarrollo local: haz clic en **"Add Current IP Address"**
   - Para producción en Vercel: haz clic en **"Allow Access from Anywhere"** (`0.0.0.0/0`)
   - Haz clic en **"Confirm"**
6. Vuelve a **"Database" → "Clusters"** y haz clic en **"Connect"** junto a tu cluster.
7. Selecciona **"Connect your application"** → **"Drivers"** → Node.js.
8. Copia la cadena de conexión. Se verá así:
   ```
   mongodb+srv://<usuario>:<contraseña>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
9. Reemplaza `<usuario>` y `<contraseña>` con los datos que creaste en el paso 4.

> Esta URI va en `MONGODB_URI`. El nombre de la base de datos va en `MONGODB_DB_NAME` (puedes usar `Portfolio`).

---

### 2. Supabase Storage — Almacenamiento de archivos

Supabase Storage se usa para guardar imágenes, CVs y otros archivos del portfolio. Se conecta mediante el protocolo S3.

**Pasos:**

1. Ve a [https://supabase.com](https://supabase.com) y crea una cuenta gratuita (puedes usar tu cuenta de GitHub).
2. Haz clic en **"New Project"**, elige un nombre (ej. `portfolio`) y una contraseña de base de datos (puedes ignorarla, no la usamos). Selecciona la región más cercana y haz clic en **"Create new project"**.
3. Espera unos minutos a que el proyecto se configure.
4. En el panel lateral ve a **"Storage"** y haz clic en **"New bucket"**:
   - Nombre del bucket: `Portfolio-Images` (o el que prefieras)
   - Marca la opción **"Public bucket"** para que las imágenes sean accesibles públicamente
   - Haz clic en **"Save"**
5. Ve a **"Project Settings" → "Storage"** (en el panel de configuración) y busca la sección **"S3 Connection"**.
6. Activa la opción **"Enable S3 protocol"** si no está activada.
7. Copia los siguientes datos:
   - **Endpoint**: algo como `https://xxxxxxxxxxxx.storage.supabase.co/storage/v1/s3`
   - **Region**: `us-east-1` (suele ser este valor fijo en Supabase)
   - **Access Key ID** y **Secret Access Key**: haz clic en **"New access key"** para generarlos

> Estos datos van en `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` y `S3_BUCKET`.

> ℹ️ **¿Usas AWS S3, Cloudflare R2 o MinIO?** Cambia `BUCKET_PROVIDER` al valor correspondiente (`amazon`, `cloudflare`, `minio`) y configura las variables de ese proveedor. Ver sección de [Variables de entorno](#-variables-de-entorno).

---

### 3. Gmail — Envío de correos

Se usa para enviar los mensajes del formulario de contacto y los correos de recuperación de contraseña.

**Pasos para obtener una contraseña de aplicación de Gmail:**

> ⚠️ No se usa tu contraseña normal de Gmail. Debes crear una **contraseña de aplicación**, que es un código de 16 caracteres generado por Google específicamente para aplicaciones de terceros.

1. Necesitas tener activada la **verificación en dos pasos** en tu cuenta de Google. Si no la tienes, ve a [https://myaccount.google.com/security](https://myaccount.google.com/security) y actívala.
2. Ve a [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) (o busca "contraseñas de aplicación" en la configuración de tu cuenta de Google).
3. En el campo de texto escribe un nombre para identificarla (ej. `Portfolio CMS`) y haz clic en **"Crear"**.
4. Google generará una contraseña de 16 caracteres. **Cópiala ahora**, no podrás verla de nuevo.

> - `GMAIL_USER`: tu dirección de Gmail (ej. `tucorreo@gmail.com`)
> - `GMAIL_PASSWORD`: la contraseña de aplicación de 16 caracteres (sin espacios)
> - `FROM`: el correo remitente (ej. `"Portfolio CMS" <tucorreo@gmail.com>`)
> - `TO`: el correo donde quieres recibir los mensajes de contacto (puede ser el mismo u otro)

---

### 4. Google reCAPTCHA — Protección del formulario de contacto

reCAPTCHA evita que bots envíen spam a través del formulario de contacto.

**Pasos:**

1. Ve a [https://www.google.com/recaptcha/admin/create](https://www.google.com/recaptcha/admin/create) (necesitas una cuenta de Google).
2. Rellena el formulario:
   - **Label**: `Portfolio` (o el nombre que quieras)
   - **reCAPTCHA type**: selecciona **"reCAPTCHA v2"** → **"I'm not a robot" Checkbox**
   - **Domains**: añade `localhost` para desarrollo y el dominio de producción de tu frontend (ej. `mi-portfolio.vercel.app`)
3. Acepta los términos y haz clic en **"Submit"**.
4. Obtendrás dos claves:
   - **Site Key** (pública, va en el frontend): la guardas para configurar el frontend
   - **Secret Key** (privada, va en el backend): va en `RECAPTCHA_SECRET_KEY`

---

## 💻 Instalación y desarrollo local

```bash
# 1. Clona el repositorio
git clone <url-del-repositorio>
cd Portfolio_backend_v2

# 2. Instala las dependencias
npm install

# 3. Crea el archivo de variables de entorno
cp .env.example .env
# Edita el archivo .env con los datos obtenidos en los pasos anteriores

# 4. Inicia el servidor en modo desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:3000`.

Para verificar que funciona, abre en tu navegador: `http://localhost:3000/health`

Deberías ver una respuesta como:
```json
{ "status": "ok" }
```

### Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor con recarga automática (desarrollo) |
| `npm run build` | Compila TypeScript a JavaScript en `dist/` |
| `npm start` | Compila y ejecuta en producción |
| `npm run seed:starter` | Fuerza la recarga del seed starter en una base vacía o de pruebas |
| `npm run seed:personal` | Carga datos de ejemplo personalizados |

---

## ⚙️ Variables de entorno

Copia `.env.example` a `.env` y rellena cada variable:

```bash
cp .env.example .env
```

### General

```bash
NODE_ENV=development          # "development" en local, "production" en Vercel
APP_PORT=3000                 # Puerto donde escucha el servidor (local)
API_BASE_URL=http://localhost:3000   # URL base de la API
CORS_ORIGIN=http://localhost:4200   # URL del frontend (para CORS)
FRONTEND_URL=http://localhost:4200  # URL del frontend (para links en correos)
JSON_LIMIT=12mb               # Tamaño máximo de peticiones JSON
AUTO_TRANSLATE_TO_ENGLISH=false     # Traducción automática al inglés en seeds
```

### Seguridad

```bash
# Clave para proteger los endpoints administrativos del CMS.
# Genera una cadena aleatoria larga. Ejemplo:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ADMIN_API_KEY=pon-aqui-una-clave-larga-y-aleatoria

# Clave para firmar los tokens JWT del CMS.
# Genera otra cadena aleatoria diferente a ADMIN_API_KEY.
JWT_SECRET=otra-clave-larga-y-aleatoria-diferente
JWT_EXPIRES_IN=7d             # Duración de los tokens JWT (7 días)
```

> 💡 Para generar una clave aleatoria segura, ejecuta en tu terminal:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### Base de datos

```bash
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=Portfolio      # Nombre de la base de datos
```

### Almacenamiento (elige uno)

**Opción A — Supabase Storage (recomendado, fácil de configurar):**

```bash
BUCKET_PROVIDER=supabase
S3_ENDPOINT=https://xxxxxxxxxxxx.storage.supabase.co/storage/v1/s3
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=tu-access-key-id
S3_SECRET_ACCESS_KEY=tu-secret-access-key
S3_BUCKET=Portfolio-Images
# S3_PORT y S3_USE_SSL no son necesarios con Supabase
```

**Opción B — Amazon S3:**

```bash
BUCKET_PROVIDER=amazon
S3_ENDPOINT=s3.us-east-1.amazonaws.com   # O la región que uses
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
S3_SECRET_ACCESS_KEY=tu-secret-key
S3_BUCKET=nombre-de-tu-bucket
```

**Opción C — Cloudflare R2:**

```bash
BUCKET_PROVIDER=cloudflare
R2_ACCOUNT_ID=tu-account-id
R2_ACCESS_KEY_ID=tu-access-key
R2_SECRET_ACCESS_KEY=tu-secret-key
R2_BUCKET=nombre-de-tu-bucket
```

**Opción D — MinIO (solo para desarrollo local):**

```bash
BUCKET_PROVIDER=minio
S3_ENDPOINT=localhost
S3_PORT=9000
S3_USE_SSL=false
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=portfolio
```

### Correo electrónico

```bash
FROM="Portfolio CMS <tucorreo@gmail.com>"   # Remitente de los correos
TO=tucorreo@gmail.com                        # Destino de los mensajes de contacto
GMAIL_USER=tucorreo@gmail.com               # Tu cuenta de Gmail
GMAIL_PASSWORD=abcd efgh ijkl mnop          # Contraseña de aplicación (16 caracteres)
RECAPTCHA_SECRET_KEY=tu-secret-key-de-recaptcha
```

---

## 🚀 Despliegue en Vercel

### Paso 1 — Subir el código a GitHub

Si aún no tienes el código en GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/tu-usuario/portfolio-backend.git
git push -u origin main
```

### Paso 2 — Crear cuenta en Vercel

1. Ve a [https://vercel.com](https://vercel.com) y haz clic en **"Sign Up"**.
2. Elige **"Continue with GitHub"** para conectar tu cuenta de GitHub.
3. Autoriza a Vercel para acceder a tus repositorios.

### Paso 3 — Importar el proyecto

1. En el dashboard de Vercel, haz clic en **"Add New..." → "Project"**.
2. Busca y selecciona el repositorio del backend.
3. Vercel detectará que hay un `vercel.json` y configurará automáticamente el build.
4. **Antes de hacer clic en "Deploy"**, ve a la sección **"Environment Variables"** y añade todas las variables de entorno de producción:

   | Variable | Valor en producción |
   |---|---|
   | `NODE_ENV` | `production` |
   | `API_BASE_URL` | `https://tu-proyecto.vercel.app` (la URL que Vercel te asigne) |
   | `CORS_ORIGIN` | `https://tu-frontend.vercel.app` |
   | `FRONTEND_URL` | `https://tu-frontend.vercel.app` |
   | `MONGODB_URI` | Tu URI de MongoDB Atlas |
   | `MONGODB_DB_NAME` | `Portfolio` |
   | `ADMIN_API_KEY` | Tu clave aleatoria segura |
   | `JWT_SECRET` | Tu clave JWT secreta |
   | `JWT_EXPIRES_IN` | `7d` |
   | `JSON_LIMIT` | `12mb` |
   | `BUCKET_PROVIDER` | `supabase` (o el que uses) |
   | `S3_ENDPOINT` | URL del endpoint de Supabase |
   | `S3_REGION` | `us-east-1` |
   | `S3_ACCESS_KEY_ID` | Tu Access Key ID |
   | `S3_SECRET_ACCESS_KEY` | Tu Secret Access Key |
   | `S3_BUCKET` | `Portfolio-Images` |
   | `GMAIL_USER` | Tu Gmail |
   | `GMAIL_PASSWORD` | Contraseña de aplicación |
   | `FROM` | Remitente del correo |
   | `TO` | Correo de destino |
   | `RECAPTCHA_SECRET_KEY` | Secret Key de reCAPTCHA |
   | `AUTO_TRANSLATE_TO_ENGLISH` | `false` |

5. Haz clic en **"Deploy"**.

> ⚠️ **Importante**: Después del primer despliegue, Vercel te asignará una URL como `https://portfolio-backend-xxxx.vercel.app`. Deberás actualizar `API_BASE_URL` con esa URL real y volver a desplegar.

### Paso 4 — Verificar el despliegue

Visita `https://tu-api.vercel.app/health` — deberías ver:
```json
{ "status": "ok" }
```

### Paso 5 — Correr los seeds en producción

Una vez desplegado, necesitas cargar los datos iniciales. El seed se ejecuta a través de un endpoint protegido:

```
POST https://tu-api.vercel.app/api/admin/seed/initial
Headers:
  x-api-key: tu-ADMIN_API_KEY
```

Puedes hacerlo desde la documentación Swagger en `https://tu-api.vercel.app/docs`.

---

## 🌱 Seeds (datos iniciales)

El backend ahora valida automáticamente en el arranque si la plataforma ya fue inicializada. Revisa una bandera persistente en Mongo (`system_flags`) y además reconcilia el estado real de contenido/admins para decidir qué hacer sin intervención manual.

### Inicialización automática desde cero

Cuando levantas el backend contra una base de datos nueva:

1. Si no existe el seed base, el backend ejecuta automáticamente la inicialización starter.
2. Si no existe un admin real, el backend crea un usuario bootstrap temporal para permitir el primer acceso al dashboard.
3. En el primer login, ese usuario bootstrap queda obligado a pasar por `setup-account`.
4. Cuando se registra el usuario real, el backend elimina el usuario bootstrap y marca la plataforma como configurada.

**Credenciales bootstrap por defecto:**

- Email: `admin@portfolio.local`
- Password: `Admin@1234!`

> ⚠️ Estas credenciales solo deben existir mientras la plataforma no tenga un usuario administrador real. Después del primer `setup-account`, el backend borra automáticamente ese usuario temporal.

Los scripts de seed siguen disponibles para escenarios manuales, pero ya no son necesarios para el primer arranque normal de desarrollo.

**En desarrollo local:**

```bash
# Fuerza el seed starter sobre una base de datos fresca o de pruebas
npm run seed:starter

# Carga contenido de ejemplo personalizado (proyectos, experiencia, skills, etc.)
npm run seed:personal
```

> ⚠️ `npm run seed:starter` y `npm run seed:personal` borran y recrean contenido. No los ejecutes sobre una base con datos reales.

---

## 📡 Endpoints principales

La documentación completa está disponible en `http://localhost:3000/docs` (Swagger UI).

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Estado del servidor |
| `GET` | `/docs` | Documentación Swagger |
| `GET` | `/api/projects` | Lista de proyectos |
| `GET` | `/api/content/profile` | Datos del perfil |
| `GET` | `/api/skills` | Lista de skills |
| `GET` | `/api/experience` | Experiencia laboral |
| `POST` | `/api/contact/send` | Envío del formulario de contacto |
| `POST` | `/api/analytics/event` | Registro de eventos de analíticas |
| `POST` | `/api/admin/auth/login` | Login del CMS |

> Todos los endpoints de administración (`/api/admin/*`) requieren el header `x-api-key` o un token JWT válido.

---

## 📁 Documentación adicional

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — Arquitectura del proyecto
- [docs/CONTINUATION.md](./docs/CONTINUATION.md) — Notas de continuación
