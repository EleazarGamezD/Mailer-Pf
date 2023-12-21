import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv"; // importando modulo de lectura de archivo ENV variables de entornos
import path from "path";
import url from "url";
import cors from "cors"

dotenv.config(); // este comando llama al archivo de variable de entorno.

const app = express();
const appPort = process.env.APP_PORT || 3000;

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname,)));
app.use(express.json());
app.use(cors())

const transporter = nodemailer.createTransport({
  host: "smtp.forwardemail.net",
  service: "gmail",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  }
});

app.post("/send", async (req, res) => {

  const { subject,  message , contactEmail, name } = req.body;
  const msg = {
    from: process.env.FROM,
    to: process.env.TO,
    subject,
    html : `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nuevo mensaje desde el sitio web</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          background-color: #f4f4f4;
          color: #333;
          margin: 0;
          padding: 0;
        }

        .container {
          max-width: 600px;
          margin: 20px auto;
          padding: 20px;
          background-color: #fff;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }

        h1 {
          color: #007BFF;
          margin-bottom: 20px;
        }

        .info-item {
          margin-bottom: 15px;
        }

        .info-label {
          font-weight: bold;
        }

        .footer {
          background-color: #000;
          color: #fff;
          text-align: center;
          padding: 10px;
          margin-top: 20px;
        }

        /* Add more styles as needed */
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Nuevo mensaje desde el sitio web</h1>
        
        <div class="info-item">
          <span class="info-label">Asunto:</span>
          <p>${subject}</p>
        </div>

        <div class="info-item">
          <span class="info-label">Mensaje:</span>
          <p>${message}</p>
        </div>

        <div class="info-item">
          <span class="info-label">Contacto Email:</span>
          <p>${contactEmail}</p>
        </div>
        
      </div>

      <div class="footer">
        &copy; ${new Date().getFullYear()} Eleazar Gamez
      </div>
    </body>
    </html>
  `
  };
  const toMsg = {
    from: process.env.FROM,
    to:contactEmail,
    subject: "Gracias por contactarme a traves de la web / Porfolio",
      html: `
    <!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Response</title>
  <style>
    /* Reset some default styles */
    body,
    p {
      margin: 0;
      padding: 0;
    }

    /* Add your custom styles here */
    body {
      font-family: 'Arial', sans-serif;
      background-color: #f4f4f4;
      color: #333;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #fff;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    h1 {
      color: #007BFF;
    }

    /* Add more styles as needed */

    .footer {
      background-color: #000;
      color: #fff;
      text-align: center;
      padding: 10px;
      margin-top: 20px;
    }
  </style>
</head>

<body>
  <div class="container">
    <h1>Gracias por contactarme a través de la web</h1>
    <p>Estimado/a ${name},</p>
    <p>Gracias por contactarme a través de mi sitio web. Su mensaje ha sido recibido y será procesado pronto.</p>
    <!-- You can dynamically include content based on your application logic -->
    <p>Para cualquier consulta adicional, no dude en ponerse en contacto conmigo.</p>
    <p>Atentamente,<br />Eleazar Gámez</p>
  </div>
  <div class="footer">
    &copy; ${new Date().getFullYear()} Eleazar Gamez
  </div>
</body>

</html>
  `
   };

  try {
    const data = await transporter.sendMail(msg);
    const dataTO = await transporter.sendMail(toMsg);
    res.status(200).json({data, dataTO});
  } catch (error) {
    const messages = error;
    res.status(400).send(messages);
  }
});

app.listen(appPort, () =>
  console.log(`ejecutando la app en el puerto ${appPort}`)
);
