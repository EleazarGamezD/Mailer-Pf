import { closeDatabaseConnection } from '../config/db.js';
import { connectToDatabase } from '../config/db.js';
import { seedInitialContent } from '../modules/admin/admin.service.js';

async function seed() {
  await connectToDatabase();
  await seedInitialContent();
  console.log('Initial content seeded successfully.');
}

seed()
  .catch((error) => {
    console.error('Failed to seed initial content:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabaseConnection();
  });
