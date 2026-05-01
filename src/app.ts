import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import url from 'url';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { readSwaggerDocument } from './docs/swagger.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { assetsRouter } from './routes/assets.routes.js';
import { apiRoutes } from './routes/index.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();
  const swaggerDocument = readSwaggerDocument();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((item) => item.trim()),
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
      swaggerOptions: {
        persistAuthorization: true,
      },
    }),
  );
  app.use('/api', apiRoutes);
  app.use('/assets', assetsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
