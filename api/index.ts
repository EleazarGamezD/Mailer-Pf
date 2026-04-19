import { createApp } from '../src/app.js';
import { connectToDatabase } from '../src/config/db.js';
import { ensureSwaggerDocument } from '../src/docs/swagger.js';

let appPromise: Promise<ReturnType<typeof createApp>> | null = null;

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

export default async function handler(req: unknown, res: unknown) {
  const app = await getApp();
  return app(req, res);
}
