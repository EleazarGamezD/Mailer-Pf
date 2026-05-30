import dns from 'dns';

// Fix for querySrv ECONNREFUSED with MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);

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
