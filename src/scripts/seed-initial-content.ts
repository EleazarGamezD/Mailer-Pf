import { closeDatabaseConnection } from '../config/db.js';
import { connectToDatabase } from '../config/db.js';
import { seedStarterContent } from '../modules/admin/admin.service.js';

async function seed() {
  await connectToDatabase();
  await seedStarterContent();
  console.log('Starter content seeded successfully.');
}

seed()
  .catch((error) => {
    console.error('Failed to seed initial content:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabaseConnection();
  });
