import express from 'express';
import path from 'path'; //importando modulo de path "directorios"
import { Resend } from 'resend';
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'; // importando modulo de lectura de archivo ENV variables de entornos
import url from 'url';

dotenv.config (); // este comando llama al archivo de variable de entorno.
const app = express ();

const resend = new Resend(process.env.Resend_API_KEY);
const appPort = process.env.APP_PORT || 3000;
console.log(process.env.Resend_API_KEY);


const transporter = nodemailer.createTransport({
  host: "smtp.forwardemail.net",
  service: 'gmail',
  port: 465,
  secure: true,
  auth: {   
    user:  process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});





const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use(express.static(path.join(__dirname,)));
app.use(express.json());

 app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
}); 


app.get ('/send', async (req, res,next) => {
  console.log(req);
  const { subject, html } = req.body;
  const msg = {
    from: process.env.FROM,
    to:   process.env.TO,
    subject,
    text: "Hello world?",
    html,
   
  };

  try {
   
    const data = await transporter.sendMail(msg);
    console.log('data es',{data})
    res.status(200).json(data);
  } catch (error) {
    
    const messages = error
    res.status (400).send (messages);
  }
});



app.listen(appPort, () => console.log(`ejecutando la app en el puerto ${ appPort }`));
