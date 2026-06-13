import { createApp } from '../src/app.js';
import { connectToDatabase } from '../src/config/db.js';

type StartupContext = {
  app: ReturnType<typeof createApp>;
  databaseReadyPromise: Promise<unknown>;
};

let startupPromise: Promise<StartupContext> | null = null;

type AppRequest = Parameters<ReturnType<typeof createApp>>[0];
type AppResponse = Parameters<ReturnType<typeof createApp>>[1];

async function getStartupContext() {
  if (!startupPromise) {
    startupPromise = (async () => {
      const app = createApp();
      const databaseReadyPromise = connectToDatabase();

      return {
        app,
        databaseReadyPromise,
      };
    })();
  }

  return startupPromise;
}

export default async function handler(req: AppRequest, res: AppResponse) {
  try {
    const { app, databaseReadyPromise } = await getStartupContext();
    const requestPath = typeof req.url === 'string' ? req.url : '/';
    const requiresDatabase = !(requestPath.startsWith('/health') || requestPath.startsWith('/docs'));

    if (requiresDatabase) {
      await databaseReadyPromise;
    }

    return app(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected startup error';
    res.status(500).json({
      message: 'API startup failed',
      error: message,
    });
  }
}
