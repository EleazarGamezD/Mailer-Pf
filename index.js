import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv"; // importando modulo de lectura de archivo ENV variables de entornos

dotenv.config(); // este comando llama al archivo de variable de entorno.

const app = express();

const appPort = process.env.APP_PORT || 3000;

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

app.get("/send", async (req, res, next) => {
  const { subject, text, html } = req.body;
  const msg = {
    from: process.env.FROM,
    to: process.env.TO,
    subject,
    text,
    html
  };

  try {
    const data = await transporter.sendMail(msg);
    res.status(200).json(data);
  } catch (error) {
    const messages = error;
    res.status(400).send(messages);
  }
});

app.listen(appPort, () =>
  console.log(`ejecutando la app en el puerto ${appPort}`)
);
