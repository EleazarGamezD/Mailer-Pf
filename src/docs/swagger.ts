import fs from 'fs';
import path from 'path';
import swaggerAutogen from 'swagger-autogen';
import url from 'url';

import { env } from '../config/env.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputFile = path.join(__dirname, 'swagger-output.json');
const endpointsFiles = [
  path.join(__dirname, '..', 'routes', 'projects.routes.ts'),
  path.join(__dirname, '..', 'routes', 'contact.routes.ts'),
  path.join(__dirname, '..', 'routes', 'analytics.routes.ts'),
  path.join(__dirname, '..', 'routes', 'admin.routes.ts'),
  path.join(__dirname, '..', 'routes', 'content.routes.ts'),
];

const doc = {
  info: {
    title: 'Portfolio Dynamic API',
    description: 'API para administrar el portfolio dinamico, contacto, analiticas y contenido editable.',
  },
  host: env.apiBaseUrl.replace(/^https?:\/\//, ''),
  schemes: env.apiBaseUrl.startsWith('https://') ? ['https'] : ['http'],
  securityDefinitions: {
    ApiKeyAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'x-api-key',
      description: 'API key requerida para endpoints administrativos.',
    },
  },
};

export async function ensureSwaggerDocument() {
  const generate = swaggerAutogen({ openapi: '3.0.0', autoHeaders: true, autoQuery: true });
  await generate(outputFile, endpointsFiles, doc);
}

export function readSwaggerDocument() {
  if (!fs.existsSync(outputFile)) {
    return doc;
  }

  return JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
}

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isDirectExecution) {
  ensureSwaggerDocument().catch((error) => {
    console.error('Failed to generate Swagger document:', error);
    process.exit(1);
  });
}
