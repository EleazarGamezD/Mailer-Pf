import dotenv from 'dotenv';
import { BucketProviderEnum } from '../core/enums/bucket-provider.enum.js';
import { parseEnumValue } from '../utils/enum.js';

dotenv.config();

function readEnv(name: string, fallback = ''): string {
  const value = process.env[name];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function readRequiredEnv(name: string): string {
  const value = process.env[name];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

function readBooleanEnv(name: string, fallback = false): boolean {
  const value = readEnv(name);
  if (!value) {
    return fallback;
  }

  return value.toLowerCase() === 'true';
}

function parseS3Endpoint(rawEndpoint: string, fallbackPort: number, fallbackUseSSL: boolean) {
  const endpoint = rawEndpoint.trim();
  if (!endpoint) {
    return {
      host: '',
      port: fallbackPort,
      useSSL: fallbackUseSSL,
      basePath: '',
    };
  }

  if (!/^https?:\/\//iu.test(endpoint)) {
    return {
      host: endpoint,
      port: fallbackPort,
      useSSL: fallbackUseSSL,
      basePath: '',
    };
  }

  const parsed = new URL(endpoint);

  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : parsed.protocol === 'https:' ? 443 : 80,
    useSSL: parsed.protocol === 'https:',
    basePath: parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/u, ''),
  };
}

const rawS3Endpoint = readEnv('S3_ENDPOINT');
const rawS3Port = Number(readEnv('S3_PORT', '0'));
const rawS3UseSSL = readBooleanEnv('S3_USE_SSL', false);
const normalizedS3Endpoint = parseS3Endpoint(rawS3Endpoint, rawS3Port, rawS3UseSSL);

export const env = {
  nodeEnv: readEnv('NODE_ENV', 'development'),
  appPort: Number(readEnv('APP_PORT', '3000')),
  apiBaseUrl: readRequiredEnv('API_BASE_URL'),
  corsOrigin: readEnv('CORS_ORIGIN', '*'),
  jsonLimit: readEnv('JSON_LIMIT', '12mb'),
  bucketProvider: parseEnumValue(BucketProviderEnum, readEnv('BUCKET_PROVIDER', BucketProviderEnum.MINIO).toLowerCase(), BucketProviderEnum.MINIO),
  mongoUri: readRequiredEnv('MONGODB_URI'),
  mongoDbName: readEnv('MONGODB_DB_NAME', 'Porfolio'),
  adminApiKey: readEnv('ADMIN_API_KEY'),
  jwtSecret: readRequiredEnv('JWT_SECRET'),
  jwtExpiresIn: readEnv('JWT_EXPIRES_IN', '7d'),
  gmailUser: readEnv('GMAIL_USER'),
  gmailPassword: readEnv('GMAIL_PASSWORD'),
  mailFrom: readEnv('FROM'),
  mailTo: readEnv('TO'),
  recaptchaSecretKey: readEnv('RECAPTCHA_SECRET_KEY'),
  frontendUrl: readEnv('FRONTEND_URL', 'http://localhost:4200'),
  autoTranslateToEnglish: readEnv('AUTO_TRANSLATE_TO_ENGLISH', 'false') === 'true',
  s3EndpointRaw: rawS3Endpoint,
  s3Endpoint: normalizedS3Endpoint.host,
  s3Port: normalizedS3Endpoint.port,
  s3UseSSL: normalizedS3Endpoint.useSSL,
  s3BasePath: normalizedS3Endpoint.basePath,
  s3AccessKeyId: readEnv('S3_ACCESS_KEY_ID'),
  s3SecretAccessKey: readEnv('S3_SECRET_ACCESS_KEY'),
  s3Region: readEnv('S3_REGION'),
  s3Bucket: readEnv('S3_BUCKET'),
  r2AccountId: readEnv('R2_ACCOUNT_ID'),
  r2AccessKeyId: readEnv('R2_ACCESS_KEY_ID'),
  r2SecretAccessKey: readEnv('R2_SECRET_ACCESS_KEY'),
  r2Bucket: readEnv('R2_BUCKET'),
};
