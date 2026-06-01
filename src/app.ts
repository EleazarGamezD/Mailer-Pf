import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import url from 'url';
import { env } from './config/env.js';
import { readSwaggerDocument } from './docs/swagger.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { apiRoutes } from './routes/index.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function normalizeCorsOrigin(origin: string) {
  return origin.trim().replace(/\/+$/u, '');
}

export function createApp() {
  const app = express();
  const swaggerDocument = readSwaggerDocument();
  const swaggerUiVersion = '5.32.4';
  const swaggerCdnBase = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${swaggerUiVersion}`;
  const allowedOrigins = env.corsOrigin === '*'
    ? []
    : env.corsOrigin
      .split(',')
      .map((item) => normalizeCorsOrigin(item))
      .filter(Boolean);

  app.set('trust proxy', 1);
  app.use(compression());
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'", 'data:', 'https://cdn.jsdelivr.net'],
          connectSrc: ["'self'", 'https:'],
        },
      },
    }),
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (env.corsOrigin === '*' || !origin) {
          callback(null, true);
          return;
        }

        const normalizedOrigin = normalizeCorsOrigin(origin);
        callback(null, allowedOrigins.includes(normalizedOrigin));
      },
    }),
  );
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: env.jsonLimit }));
  app.use(express.urlencoded({ extended: true, limit: env.jsonLimit }));
  app.use(express.static(path.join(__dirname, 'templates')));
  if (env.nodeEnv === 'production') {
    app.use(
      rateLimit({
        windowMs: 60 * 1000,
        max: 120,
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );
  } else {
    app.use(
      rateLimit({
        windowMs: 60 * 1000,
        max: 2000,
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );
  }

  app.get('/health', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.status(200).json({
      ok: true,
      service: 'portfolio-api',
      timestamp: new Date().toISOString(),
    });
  });

  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      explorer: true,
      customCssUrl: `${swaggerCdnBase}/swagger-ui.css`,
      customJs: [
        `${swaggerCdnBase}/swagger-ui-bundle.js`,
        `${swaggerCdnBase}/swagger-ui-standalone-preset.js`,
      ],
      swaggerOptions: {
        persistAuthorization: true,
      },
    }),
  );
  app.use('/api', apiRoutes);
  app.use('/', (_req, res) => {
    res.status(200).json({ message: 'Portfolio API Running 🚀', corsOrigin: env.corsOrigin });
  } );
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
