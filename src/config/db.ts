import { MongoClient } from 'mongodb';

import { ContentCollectionEnum } from '../core/enums/content-collection.enum.js';
import { DatabaseCollectionEnum } from '../core/enums/database-collection.enum.js';
import { env } from './env.js';

let client: MongoClient | null = null;
let database: ReturnType<MongoClient['db']> | null = null;

export async function connectToDatabase() {
  if (database) {
    return database;
  }

  if (!env.mongoUri) {
    throw new Error('Missing required environment variable: MONGODB_URI');
  }

  client = new MongoClient(env.mongoUri);
  await client.connect();
  database = client.db(env.mongoDbName);

  await Promise.all([
    database.collection(DatabaseCollectionEnum.PROJECTS).createIndex({ slug: 1 }, { unique: true }),
    database.collection(DatabaseCollectionEnum.PROFILE).createIndex({ key: 1 }, { unique: true }),
    database.collection(ContentCollectionEnum.TECH_SKILLS).createIndex({ slug: 1 }, { unique: true, sparse: true }),
    database.collection(ContentCollectionEnum.EXPERIENCE).createIndex({ slug: 1 }, { unique: true, sparse: true }),
    database.collection(ContentCollectionEnum.SOCIAL_LINKS).createIndex({ slug: 1 }, { unique: true, sparse: true }),
    database.collection(ContentCollectionEnum.RESUMES).createIndex({ active: 1 }),
    database.collection(DatabaseCollectionEnum.ANALYTICS_EVENTS).createIndex({ createdAt: -1 }),
  ]);

  return database;
}

export function getDatabase() {
  if (!database) {
    throw new Error('Database connection has not been initialized');
  }

  return database;
}

export async function closeDatabaseConnection() {
  if (client) {
    await client.close();
  }
}
