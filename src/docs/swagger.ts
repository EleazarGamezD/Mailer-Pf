import fs from 'fs';
import path from 'path';
import swaggerAutogen from 'swagger-autogen';
import url from 'url';

import { env } from '../config/env.js';
import { contentResourceValues } from '../core/types/content.js';
import type { JsonObject, JsonValue } from '../core/interfaces/json.js';
import type { SwaggerDocument, SwaggerOperation, SwaggerPathMap } from '../core/types/swagger.js';

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
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT requerido para endpoints privados del dashboard admin.',
    },
  },
};

const contentResources = contentResourceValues;

function getFirstTag(operation: SwaggerOperation) {
  const tags = operation.tags;
  return Array.isArray(tags) && typeof tags[0] === 'string' ? tags[0] : '';
}

function addPath(
  target: SwaggerPathMap,
  fullPath: string,
  method: string,
  operation: SwaggerOperation,
) {
  if (!target[fullPath]) {
    target[fullPath] = {};
  }

  target[fullPath][method] = enrichOperation(fullPath, method, applyDynamicTag(fullPath, operation));
}

function formatResourceTag(resourceName: string) {
  return resourceName
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function applyDynamicTag(routePath: string, operation: SwaggerOperation) {
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

function withJsonRequestBody(operation: SwaggerOperation, schema: JsonObject) {
  return {
    ...operation,
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema,
        },
      },
    },
  };
}

function withJsonResponse(
  operation: SwaggerOperation,
  statusCode: string,
  schema: JsonObject,
  description: string,
) {
  const responses = (operation.responses as JsonObject | undefined) ?? {};

  return {
    ...operation,
    responses: {
      ...responses,
      [statusCode]: {
        description,
        content: {
          'application/json': {
            schema,
          },
        },
      },
    },
  };
}

function withQueryParameters(operation: SwaggerOperation, parameters: JsonObject[]) {
  return {
    ...operation,
    parameters,
  };
}

function enrichOperation(routePath: string, method: string, operation: SwaggerOperation) {
  if (routePath === '/api/admin/users' && method === 'post') {
    return withJsonResponse(
      withJsonRequestBody(operation, {
        type: 'object',
        required: ['email', 'username', 'displayName', 'password'],
        properties: {
          email: { type: 'string', example: 'admin@portfolio.com' },
          username: { type: 'string', example: 'eleazar-admin' },
          displayName: { type: 'string', example: 'Eleazar Gamez' },
          password: { type: 'string', example: 'MyStrongPassword123' },
          role: { type: 'string', enum: ['super_admin', 'admin', 'editor'], example: 'super_admin' },
        },
      }),
      '201',
      {
        type: 'object',
        properties: {
          created: { type: 'boolean', example: true },
          user: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '680335b5f26b2d6a6a8ed001' },
              email: { type: 'string', example: 'admin@portfolio.com' },
              username: { type: 'string', example: 'eleazar-admin' },
              displayName: { type: 'string', example: 'Eleazar Gamez' },
              role: { type: 'string', example: 'super_admin' },
              active: { type: 'boolean', example: true },
              lastLoginAt: { type: 'string', nullable: true, example: null },
            },
          },
        },
      },
      'Admin user created',
    );
  }

  if (routePath === '/api/admin/auth/login' && method === 'post') {
    return withJsonResponse(
      withJsonRequestBody(operation, {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'admin@portfolio.com' },
          password: { type: 'string', example: 'MyStrongPassword123' },
        },
      }),
      '200',
      {
        type: 'object',
        properties: {
          authenticated: { type: 'boolean', example: true },
          accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          tokenType: { type: 'string', example: 'Bearer' },
          user: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '680335b5f26b2d6a6a8ed001' },
              email: { type: 'string', example: 'admin@portfolio.com' },
              username: { type: 'string', example: 'eleazar-admin' },
              displayName: { type: 'string', example: 'Eleazar Gamez' },
              role: { type: 'string', example: 'super_admin' },
              active: { type: 'boolean', example: true },
              lastLoginAt: { type: 'string', example: '2026-04-19T15:30:00.000Z' },
            },
          },
        },
      },
      'Authenticated admin session',
    );
  }

  if (routePath === '/api/admin/dashboard/metrics' && method === 'get') {
    return withQueryParameters(operation, [
      { name: 'year', in: 'query', schema: { type: 'integer' }, example: 2026, description: 'Filter by year' },
      { name: 'month', in: 'query', schema: { type: 'integer' }, example: 4, description: 'Filter by month 1-12' },
      { name: 'day', in: 'query', schema: { type: 'integer' }, example: 19, description: 'Filter by day of month' },
      { name: 'from', in: 'query', schema: { type: 'string' }, example: '2026-04-01T00:00:00.000Z', description: 'Start ISO date' },
      { name: 'to', in: 'query', schema: { type: 'string' }, example: '2026-04-19T23:59:59.999Z', description: 'End ISO date' },
    ]);
  }

  if (routePath === '/api/projects' && method === 'post') {
    return withJsonRequestBody(operation, {
      type: 'object',
      required: ['slug', 'title', 'summary', 'description'],
      properties: {
        slug: { type: 'string', example: 'tu-bodega-api' },
        title: { type: 'object', properties: { es: { type: 'string', example: 'Tu Bodega API' }, en: { type: 'string', example: 'Tu Bodega API' } } },
        summary: { type: 'object', properties: { es: { type: 'string', example: 'API de e-commerce escalable.' }, en: { type: 'string', example: 'Scalable e-commerce API.' } } },
        description: { type: 'object', properties: { es: { type: 'string', example: 'Descripcion larga del proyecto.' }, en: { type: 'string', example: 'Long project description.' } } },
        stack: { type: 'array', items: { type: 'string' }, example: ['NestJS', 'TypeScript', 'PostgreSQL'] },
        images: { type: 'array', items: { type: 'object' }, example: [] },
        coverImage: { nullable: true, example: null },
        projectLink: { type: 'string', example: 'https://tu-bodega.vercel.app/' },
        codeLink: { type: 'string', example: 'https://github.com/user/repo' },
        featured: { type: 'boolean', example: true },
        status: { type: 'string', example: 'published' },
        publishedAt: { type: 'string', example: '2026-04-19' },
      },
    });
  }

  if (routePath === '/api/projects/{id}' && method === 'patch') {
    return withJsonRequestBody(operation, {
      type: 'object',
      properties: {
        title: { type: 'object', properties: { es: { type: 'string' }, en: { type: 'string' } } },
        summary: { type: 'object', properties: { es: { type: 'string' }, en: { type: 'string' } } },
        description: { type: 'object', properties: { es: { type: 'string' }, en: { type: 'string' } } },
        stack: { type: 'array', items: { type: 'string' } },
        projectLink: { type: 'string' },
        codeLink: { type: 'string' },
        featured: { type: 'boolean' },
        status: { type: 'string' },
        publishedAt: { type: 'string' },
      },
    });
  }

  if (routePath === '/api/content/profile' && method === 'put') {
    return withJsonRequestBody(operation, {
      type: 'object',
      required: ['key', 'slug', 'title', 'description', 'label'],
      properties: {
        key: { type: 'string', example: 'main-profile' },
        slug: { type: 'string', example: 'main-profile' },
        label: { type: 'object', properties: { es: { type: 'string', example: 'Eleazar Gamez' }, en: { type: 'string', example: 'Eleazar Gamez' } } },
        title: { type: 'object', properties: { es: { type: 'string', example: 'Desarrollador Fullstack' }, en: { type: 'string', example: 'Fullstack Developer' } } },
        description: { type: 'object', properties: { es: { type: 'string', example: 'Descripcion principal del perfil.' }, en: { type: 'string', example: 'Main profile description.' } } },
        availability: { type: 'string', example: 'Open to work' },
        location: { type: 'string', example: 'Colombia' },
        email: { type: 'string', example: 'hello@portfolio.com' },
        phone: { type: 'string', example: '+57 3000000000' },
        metadata: { type: 'object', example: { about: { es: 'Sobre mi', en: 'About me' }, heroSlides: [] } },
      },
    });
  }

  if (routePath.startsWith('/api/content/') && !routePath.endsWith('/profile') && method === 'post') {
    return withJsonRequestBody(operation, {
      type: 'object',
      required: ['slug', 'title', 'description', 'label'],
      properties: {
        slug: { type: 'string', example: 'github' },
        label: { type: 'object', properties: { es: { type: 'string', example: 'GitHub' }, en: { type: 'string', example: 'GitHub' } } },
        title: { type: 'object', properties: { es: { type: 'string', example: 'GitHub' }, en: { type: 'string', example: 'GitHub' } } },
        description: { type: 'object', properties: { es: { type: 'string', example: 'Descripcion corta' }, en: { type: 'string', example: 'Short description' } } },
        value: { example: 'https://github.com/EleazarGamezD' },
        icon: { nullable: true, example: 'fa-brands fa-github' },
        href: { type: 'string', example: 'https://github.com/EleazarGamezD' },
        order: { type: 'integer', example: 1 },
        active: { type: 'boolean', example: true },
        metadata: { type: 'object', example: {} },
        fileName: { type: 'string', example: '' },
        mimeType: { type: 'string', example: '' },
        base64: { type: 'string', example: '' },
      },
    });
  }

  if (routePath.startsWith('/api/content/') && routePath.endsWith('/{id}') && method === 'patch') {
    return withJsonRequestBody(operation, {
      type: 'object',
      properties: {
        label: { type: 'object', properties: { es: { type: 'string' }, en: { type: 'string' } } },
        title: { type: 'object', properties: { es: { type: 'string' }, en: { type: 'string' } } },
        description: { type: 'object', properties: { es: { type: 'string' }, en: { type: 'string' } } },
        value: {},
        icon: { nullable: true },
        href: { type: 'string' },
        order: { type: 'integer' },
        active: { type: 'boolean' },
        metadata: { type: 'object' },
        fileName: { type: 'string' },
        mimeType: { type: 'string' },
        base64: { type: 'string' },
      },
    });
  }

  return operation;
}

function normalizeServerUrl(rawUrl: string) {
  const parsedUrl = new URL(rawUrl);
  return `${parsedUrl.protocol}//${parsedUrl.host}`;
}

function normalizeGeneratedPaths(swaggerDocument: SwaggerDocument): SwaggerDocument {
  const sourcePaths = swaggerDocument.paths ?? {};
  const normalizedPaths: SwaggerPathMap = {};

  for (const [routePath, operations] of Object.entries(sourcePaths)) {
    for (const [method, rawOperation] of Object.entries(operations)) {
      const operation = rawOperation;
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
        const normalizedAdminPath = routePath.startsWith('/api/admin') ? routePath : `/api/admin${routePath}`;
        addPath(normalizedPaths, normalizedAdminPath, method, operation);
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

export function readSwaggerDocument(): JsonObject {
  if (!fs.existsSync(outputFile)) {
    return doc as JsonObject;
  }

  return JSON.parse(fs.readFileSync(outputFile, 'utf-8')) as JsonObject;
}

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isDirectExecution) {
  ensureSwaggerDocument().catch((error) => {
    console.error('Failed to generate Swagger document:', error);
    process.exit(1);
  });
}
