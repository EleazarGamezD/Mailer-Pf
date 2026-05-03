import dotenv from 'dotenv';

dotenv.config();

function readEnv(name: string, fallback = ''): string {
  const value = process.env[name];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function readBooleanEnv(name: string, fallback = false): boolean {
  const value = readEnv(name);
  if (!value) {
    return fallback;
  }

  return value.toLowerCase() === 'true';
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
  fileStorageMode: readEnv('FILE_STORAGE_MODE', 'db').toLowerCase(),
  mongoUri: readRequiredEnv('MONGODB_URI'),
  mongoDbName: readEnv('MONGODB_DB_NAME', 'Porfolio'),
  adminApiKey: readRequiredEnv('ADMIN_API_KEY'),
  jwtSecret: readEnv('JWT_SECRET', 'dev-jwt-secret'),
  jwtExpiresIn: readEnv('JWT_EXPIRES_IN', '7d'),
  gmailUser: readEnv('GMAIL_USER'),
  gmailPassword: readEnv('GMAIL_PASSWORD'),
  mailFrom: readEnv('FROM'),
  mailTo: readEnv('TO'),
  recaptchaSecretKey: readEnv('RECAPTCHA_SECRET_KEY'),
  autoTranslateToEnglish: readEnv('AUTO_TRANSLATE_TO_ENGLISH', 'false') === 'true',
  minioEndpoint: readEnv('MINIO_ENDPOINT'),
  minioPort: Number(readEnv('MINIO_PORT', '0')),
  minioUseSSL: readBooleanEnv('MINIO_USE_SSL', false),
  minioUser: readEnv('MINIO_USER'),
  minioPassword: readEnv('MINIO_PASSWORD'),
  minioRegion: readEnv('MINIO_REGION'),
  minioBucket: readEnv('MINIO_BUCKET'),
};
