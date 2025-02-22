# Mailer-Portfolio

## Descripción

Este proyecto, llamado Mailer-Portfolio, es una aplicación basada en Express.js que proporciona funcionalidades de correo electrónico y otros aspectos relacionados con el portafolio. El objetivo principal es permitir a los usuarios enviar mensajes desde un formulario de contacto.

## Instalación

1. **Clona el repositorio:**

   ```bash
   git clone https://github.com/EleazarGamezD/Mailer-Pf.git

2. **Instala las Dependencias:**

   ```bash
   npm install


3. **Renombra el Archivo .env_template:**

   ```bash
   GMAIL_USER=usuario_Gmail
   GMAIL_PASSWORD=Clave_Gmail  # (Esta debe ser la clave para Apps)
   FROM=Email_que_envía
   TO=Email_que_recibe  # (si se quiere hardcodear)
   APP_PORT=3000  # Puerto de la App por defecto
   RECAPTCHA_SECRET_KEY=Recaptcha_secret # clave secreta del recaptcha v3 
4. **Modo de Desarrollo:**

   ```bash
      npm run dev

5. **Modo de Producción:**

   ```bash
      npm start

6. **Tecnologías Utilizadas:**

   ```bash
      Node.js
      Express.js
      Nodemailer
      Dotenv
      Nodemon

**Autor**

Elezar Gamez
