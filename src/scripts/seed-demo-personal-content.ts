import { closeDatabaseConnection, connectToDatabase } from '../config/db.js';
import { seedDemoPersonalContent } from '../modules/admin/admin.service.js';

async function seed() {
  await connectToDatabase();
  await seedDemoPersonalContent();
  console.log('Personal demo content seeded successfully.');
}

seed()
  .catch((error) => {
    console.error('Failed to seed personal demo content:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabaseConnection();
  });
