import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv'; // importando modulo de lectura de archivo ENV variables de entornos
import express from 'express';
import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import path from 'path';
import url from 'url';

dotenv.config(); // este comando llama al archivo de variable de entorno.

const app = express();
const appPort = process.env.APP_PORT || 3000;

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.use(cors());

const transporter = nodemailer.createTransport({
  host: 'smtp.forwardemail.net',
  service: 'gmail',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

const handlebarOptions = {
  viewEngine: {
    extName: '.hbs',
    partialsDir: path.resolve(__dirname, 'templates'),
    defaultLayout: false,
  },
  viewPath: path.resolve(__dirname, 'templates'),
  extName: '.hbs',
};

transporter.use('compile', hbs(handlebarOptions));

app.post('/send', async (req, res) => {
  const { subject, message, contactEmail, name } = req.body;
  const attachments = [
    {
      filename: 'Beefree-logo.png',
      path: path.join(__dirname, 'templates', 'images', 'Beefree-logo.png'),
      cid: 'beefree-logo',
    },
    {
      filename: 'facebook2x.png',
      path: path.join(__dirname, 'templates', 'images', 'facebook2x.png'),
      cid: 'facebook2x',
    },
    {
      filename: 'instagram2x.png',
      path: path.join(__dirname, 'templates', 'images', 'instagram2x.png'),
      cid: 'instagram2x',
    },
    {
      filename: 'linkedin2x.png',
      path: path.join(__dirname, 'templates', 'images', 'linkedin2x.png'),
      cid: 'linkedin2x',
    },
    {
      filename: 'MainInvite.png',
      path: path.join(__dirname, 'templates', 'images', 'MainInvite.png'),
      cid: 'maininvite',
    },
    {
      filename: 'twitter2x.png',
      path: path.join(__dirname, 'templates', 'images', 'twitter2x.png'),
      cid: 'twitter2x',
    },
    {
      filename: 'WaveBottom.png',
      path: path.join(__dirname, 'templates', 'images', 'WaveBottom.png'),
      cid: 'wavebottom',
    },
    {
      filename: 'WaveTop.png',
      path: path.join(__dirname, 'templates', 'images', 'WaveTop.png'),
      cid: 'wavetop',
    },
  ];
  const msg = {
    from: process.env.FROM,
    to: process.env.TO,
    subject,
    template: 'newMessage',
    context: {
      subject,
      message,
      contactEmail,
      year: new Date().getFullYear(),
    },
    attachments: attachments,
  };
  const toMsg = {
    from: process.env.FROM,
    to: contactEmail,
    subject: 'Gracias por contactarme a traves de la web / Porfolio',
    template: 'emailResponse',
    context: {
      name,
      year: new Date().getFullYear(),
    },
    attachments: attachments,
  };

  try {
    const data = await transporter.sendMail(msg);
    const dataTO = await transporter.sendMail(toMsg);
    res.status(200).json({ data, dataTO });
  } catch (error) {
    const messages = error;
    res.status(400).send(messages);
  }
});

app.post('/verifyCaptcha', async (req, res) => {
  const { token } = req.body;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
  try {
    const response = await axios.post(url);
    if (response.data.success) {
      res.status(200).json({ success: true, score: response.data.score });
    } else {
      res.status(400).json({ success: false, 'error-codes': response.data['error-codes'] });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.listen(appPort, () => console.log(`ejecutando la app en el puerto ${appPort}`));
