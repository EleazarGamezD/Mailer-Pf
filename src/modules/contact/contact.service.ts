import axios from 'axios';
import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import path from 'path';
import url from 'url';

import { env } from '../../config/env.js';
import { createHttpError } from '../../utils/http-error.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesPath = path.resolve(__dirname, '..', '..', 'templates');

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!env.gmailUser || !env.gmailPassword || !env.mailFrom || !env.mailTo) {
    throw createHttpError(500, 'Email service is not fully configured.');
  }

  transporter = nodemailer.createTransport({
    host: 'smtp.forwardemail.net',
    service: 'gmail',
    port: 465,
    secure: true,
    auth: {
      user: env.gmailUser,
      pass: env.gmailPassword,
    },
  });

  transporter.use(
    'compile',
    hbs({
      viewEngine: {
        extName: '.hbs',
        partialsDir: templatesPath,
        defaultLayout: false,
      },
      viewPath: templatesPath,
      extName: '.hbs',
    }),
  );

  return transporter;
}

function buildAttachments() {
  return [
    { fileName: 'Beefree-logo.png', cid: 'beefree-logo' },
    { fileName: 'facebook2x.png', cid: 'facebook2x' },
    { fileName: 'instagram2x.png', cid: 'instagram2x' },
    { fileName: 'linkedin2x.png', cid: 'linkedin2x' },
    { fileName: 'MainInvite.png', cid: 'maininvite' },
    { fileName: 'twitter2x.png', cid: 'twitter2x' },
    { fileName: 'WaveBottom.png', cid: 'wavebottom' },
    { fileName: 'WaveTop.png', cid: 'wavetop' },
  ].map(({ fileName, cid }) => ({
    filename: fileName,
    path: path.join(templatesPath, 'images', fileName),
    cid,
  }));
}

export async function sendContactEmail(payload: Record<string, unknown>) {
  const subject = typeof payload.subject === 'string' ? payload.subject : '';
  const message = typeof payload.message === 'string' ? payload.message : '';
  const contactEmail = typeof payload.contactEmail === 'string' ? payload.contactEmail : '';
  const name = typeof payload.name === 'string' ? payload.name : '';
  const phone = typeof payload.phone === 'string' ? payload.phone : '';

  if (!subject || !message || !contactEmail || !name || !phone) {
    throw createHttpError(400, 'subject, message, contactEmail, name and phone are required.');
  }

  const activeTransporter = getTransporter();
  const attachments = buildAttachments();

  const ownerMessage = {
    from: env.mailFrom,
    to: env.mailTo,
    subject,
    template: 'newMessage',
    context: {
      subject,
      message,
      contactEmail,
      name,
      phone,
      year: new Date().getFullYear(),
    },
    attachments,
  };

  const contactMessage = {
    from: env.mailFrom,
    to: contactEmail,
    subject: 'Gracias por contactarme a traves de la web / Portfolio',
    template: 'emailResponse',
    context: {
      name,
      subject,
      year: new Date().getFullYear(),
    },
    attachments,
  };

  const [ownerResult, contactResult] = await Promise.all([
    activeTransporter.sendMail(ownerMessage),
    activeTransporter.sendMail(contactMessage),
  ]);

  return {
    ownerResult,
    contactResult,
  };
}

export async function verifyCaptcha(payload: Record<string, unknown>) {
  const token = typeof payload.token === 'string' ? payload.token : '';

  if (!env.recaptchaSecretKey) {
    throw createHttpError(500, 'RECAPTCHA_SECRET_KEY is not configured.');
  }

  if (!token) {
    throw createHttpError(400, 'token is required.');
  }

  const requestUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${env.recaptchaSecretKey}&response=${token}`;
  const response = await axios.post(requestUrl);

  if (!response.data.success) {
    throw createHttpError(400, 'Captcha verification failed.', response.data['error-codes']);
  }

  return {
    success: true,
    score: response.data.score,
  };
}
