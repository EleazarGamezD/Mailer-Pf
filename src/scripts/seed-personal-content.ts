import { seedDemoPersonalContent } from '../modules/admin/admin.service.js';
import { closeDatabaseConnection, connectToDatabase } from '../config/db.js';
const run = async () => {
  try {
      await connectToDatabase();
    await seedDemoPersonalContent();
    console.log('Personal content seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed personal content:', error);
    process.exit(1);
  } finally {
    await closeDatabaseConnection();
  }
};

run();
