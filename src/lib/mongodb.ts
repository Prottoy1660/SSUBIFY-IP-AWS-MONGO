import { MongoClient, type Db, type Collection, type Document, type ObjectId } from 'mongodb';
import type { Plan, Submission, User } from '@/types';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}
if (!dbName) {
  throw new Error('Please define the MONGODB_DB_NAME environment variable inside .env');
}

// Extend the NodeJS.Global interface to include _mongoClientPromise
// This is used to cache the client promise in development to avoid multiple connections during HMR.
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}

// Define collection names
export const USERS_COLLECTION = 'users';
export const PLANS_COLLECTION = 'plans';
export const SUBMISSIONS_COLLECTION = 'submissions';


export async function getUsersCollection(): Promise<Collection<User>> {
  const db = await getDb();
  return db.collection<User>(USERS_COLLECTION);
}

export async function getPlansCollection(): Promise<Collection<Plan>> {
  const db = await getDb();
  return db.collection<Plan>(PLANS_COLLECTION);
}

export async function getSubmissionsCollection(): Promise<Collection<Submission>> {
  const db = await getDb();
  return db.collection<Submission>(SUBMISSIONS_COLLECTION);
}

// Helper to map MongoDB document to our types (handle _id)
// Ensures that the 'id' field in our application types is populated from MongoDB's '_id'.
export function mapMongoDocument<T extends { id: string; _id?: ObjectId } & Document>(doc: any): T {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  const result: any = { ...rest };
  if (_id) {
    result.id = _id.toString();
  } else if (rest.id) {
    result.id = rest.id;
  }
  // Do NOT add _id to result, so it is never sent to the client
  return result as T;
}

export function mapMongoDocuments<T extends { id: string; _id?: ObjectId } & Document>(docs: any[]): T[] {
    return docs.map(doc => mapMongoDocument<T>(doc));
}

export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}

export async function testConnection(): Promise<boolean> {
  try {
    const client = await getMongoClient();
    // Ping the database to verify connection
    await client.db(dbName).command({ ping: 1 });
    console.log('Successfully connected to MongoDB.');
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    return false;
  }
}

