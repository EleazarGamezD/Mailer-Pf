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
  const swaggerUiDistVersion = '5.10.5';
  const swaggerJsVersion = '5.10.5';
  const allowedOrigins = env.corsOrigin === '*'
    ? []
    : env.corsOrigin
      .split(',')
      .map((item) => normalizeCorsOrigin(item))
      .filter(Boolean);

  app.set('trust proxy', 1);
  app.use(helmet());
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
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get('/health', (_req, res) => {
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
      customCssUrl: `https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/${swaggerUiDistVersion}/swagger-ui.min.css`,
      customJs: [
        `https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/${swaggerJsVersion}/swagger-ui-bundle.js`,
        `https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/${swaggerJsVersion}/swagger-ui-standalone-preset.js`,
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
