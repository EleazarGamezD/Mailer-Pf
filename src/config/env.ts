import dotenv from 'dotenv';

dotenv.config();

function readEnv(name: string, fallback = ''): string {
  const value = process.env[name];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function readRequiredEnv(name: string): string {
  const value = readEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: readEnv('NODE_ENV', 'development'),
  appPort: Number(readEnv('APP_PORT', '3000')),
  apiBaseUrl: readEnv('API_BASE_URL', 'http://localhost:3000'),
  corsOrigin: readEnv('CORS_ORIGIN', '*'),
  jsonLimit: readEnv('JSON_LIMIT', '12mb'),
  mongoUri: readRequiredEnv('MONGODB_URI'),
  mongoDbName: readEnv('MONGODB_DB_NAME', 'Porfolio'),
  adminApiKey: readRequiredEnv('ADMIN_API_KEY'),
  gmailUser: readEnv('GMAIL_USER'),
  gmailPassword: readEnv('GMAIL_PASSWORD'),
  mailFrom: readEnv('FROM'),
  mailTo: readEnv('TO'),
  recaptchaSecretKey: readEnv('RECAPTCHA_SECRET_KEY'),
  autoTranslateToEnglish: readEnv('AUTO_TRANSLATE_TO_ENGLISH', 'false') === 'true',
};
