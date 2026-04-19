import fs from 'fs';
import path from 'path';
import swaggerAutogen from 'swagger-autogen';
import url from 'url';

import { env } from '../config/env.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..', '..');
const outputFile = path.join(projectRoot, 'dist', 'docs', 'swagger-output.json');
const endpointsFiles = [
  path.join(projectRoot, 'dist', 'routes', 'projects.routes.js'),
  path.join(projectRoot, 'dist', 'routes', 'contact.routes.js'),
  path.join(projectRoot, 'dist', 'routes', 'analytics.routes.js'),
  path.join(projectRoot, 'dist', 'routes', 'admin.routes.js'),
  path.join(projectRoot, 'dist', 'routes', 'content.routes.js'),
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

const contentResources = ['techSkills', 'experience', 'socialLinks', 'resumes', 'testimonials'] as const;

type SwaggerDocument = {
  paths?: Record<string, Record<string, unknown>>;
  [key: string]: unknown;
};

function getFirstTag(operation: Record<string, unknown>) {
  const tags = operation.tags;
  return Array.isArray(tags) && typeof tags[0] === 'string' ? tags[0] : '';
}

function addPath(
  target: Record<string, Record<string, unknown>>,
  fullPath: string,
  method: string,
  operation: Record<string, unknown>,
) {
  if (!target[fullPath]) {
    target[fullPath] = {};
  }

  target[fullPath][method] = applyDynamicTag(fullPath, operation);
}

function formatResourceTag(resourceName: string) {
  return resourceName
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function applyDynamicTag(routePath: string, operation: Record<string, unknown>) {
  if (!routePath.startsWith('/api/content/')) {
    return operation;
  }

  const resourceName = routePath.split('/')[3];
  if (!resourceName || resourceName.startsWith('{')) {
    return operation;
  }

  return {
    ...operation,
    tags: [formatResourceTag(resourceName)],
  };
}

function normalizeServerUrl(rawUrl: string) {
  const parsedUrl = new URL(rawUrl);
  return `${parsedUrl.protocol}//${parsedUrl.host}`;
}

function normalizeGeneratedPaths(swaggerDocument: SwaggerDocument): SwaggerDocument {
  const sourcePaths = swaggerDocument.paths ?? {};
  const normalizedPaths: Record<string, Record<string, unknown>> = {};

  for (const [routePath, operations] of Object.entries(sourcePaths)) {
    for (const [method, rawOperation] of Object.entries(operations)) {
      const operation = rawOperation as Record<string, unknown>;
      const tag = getFirstTag(operation);

      if (tag === 'Projects') {
        if (routePath === '/') addPath(normalizedPaths, '/api/projects', method, operation);
        else if (routePath === '/{idOrSlug}') addPath(normalizedPaths, '/api/projects/{idOrSlug}', method, operation);
        else if (routePath === '/{id}') addPath(normalizedPaths, '/api/projects/{id}', method, operation);
        continue;
      }

      if (tag === 'Contact') {
        addPath(normalizedPaths, `/api/contact${routePath}`, method, operation);
        continue;
      }

      if (tag === 'Analytics') {
        addPath(normalizedPaths, `/api/analytics${routePath}`, method, operation);
        continue;
      }

      if (tag === 'Admin') {
        addPath(normalizedPaths, `/api/admin${routePath}`, method, operation);
        continue;
      }

      if (tag === 'Content') {
        if (routePath === '/profile') {
          addPath(normalizedPaths, '/api/content/profile', method, operation);
          continue;
        }

        if (routePath === '/${resourceName}') {
          for (const resourceName of contentResources) {
            addPath(normalizedPaths, `/api/content/${resourceName}`, method, operation);
          }
          continue;
        }

        if (routePath === '/${resourceName}/{id}') {
          for (const resourceName of contentResources) {
            addPath(normalizedPaths, `/api/content/${resourceName}/{id}`, method, operation);
          }
          continue;
        }
      }
    }
  }

  return {
    ...swaggerDocument,
    servers: [
      {
        url: normalizeServerUrl(env.apiBaseUrl),
      },
    ],
    paths: normalizedPaths,
  };
}

export async function ensureSwaggerDocument() {
  const generate = swaggerAutogen({ openapi: '3.0.0', autoHeaders: true, autoQuery: true });
  await generate(outputFile, endpointsFiles, doc);

  const generatedDocument = JSON.parse(fs.readFileSync(outputFile, 'utf-8')) as SwaggerDocument;
  const normalizedDocument = normalizeGeneratedPaths(generatedDocument);
  fs.writeFileSync(outputFile, JSON.stringify(normalizedDocument, null, 2));
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
