import { createApp } from '../src/app.js';
import { connectToDatabase } from '../src/config/db.js';
import { ensureSwaggerDocument } from '../src/docs/swagger.js';

let appPromise: Promise<ReturnType<typeof createApp>> | null = null;

type AppRequest = Parameters<ReturnType<typeof createApp>>[0];
type AppResponse = Parameters<ReturnType<typeof createApp>>[1];

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      await ensureSwaggerDocument();
      await connectToDatabase();
      return createApp();
    })();
  }

  return appPromise;
}

export default async function handler(req: AppRequest, res: AppResponse) {
  const app = await getApp();
  return app(req, res);
}
