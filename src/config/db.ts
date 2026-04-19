import { MongoClient } from 'mongodb';

import { env } from './env.js';

let client: MongoClient | null = null;
let database: ReturnType<MongoClient['db']> | null = null;

export async function connectToDatabase() {
  if (database) {
    return database;
  }

  client = new MongoClient(env.mongoUri);
  await client.connect();
  database = client.db(env.mongoDbName);

  await Promise.all([
    database.collection('projects').createIndex({ slug: 1 }, { unique: true }),
    database.collection('profile').createIndex({ key: 1 }, { unique: true }),
    database.collection('tech_skills').createIndex({ slug: 1 }, { unique: true, sparse: true }),
    database.collection('experience').createIndex({ slug: 1 }, { unique: true, sparse: true }),
    database.collection('social_links').createIndex({ slug: 1 }, { unique: true, sparse: true }),
    database.collection('resumes').createIndex({ active: 1 }),
    database.collection('analytics_events').createIndex({ createdAt: -1 }),
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
