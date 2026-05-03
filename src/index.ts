import { createApp } from './app.js';
import { connectToDatabase } from './config/db.js';
import { env } from './config/env.js';
import { ensureSwaggerDocument } from './docs/swagger.js';

async function bootstrap() {
  await ensureSwaggerDocument();
  await connectToDatabase();

  const app = createApp();

  app.listen(env.appPort, () => {
    console.log(`Portfolio API running on port ${env.appPort}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start Portfolio API:', error);
  process.exit(1);
});
