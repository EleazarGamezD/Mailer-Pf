import { seedStarterContent } from '../modules/admin/seed.service.js';
import { closeDatabaseConnection, connectToDatabase } from '../config/db.js';

const run = async () => {
  try {
    await connectToDatabase();
    await seedStarterContent();
    console.log('Starter content seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed starter content:', error);
    process.exit(1);
  } finally {
    await closeDatabaseConnection();
  }
};

run();
