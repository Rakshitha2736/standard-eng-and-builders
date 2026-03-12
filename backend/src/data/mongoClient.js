import { MongoClient } from "mongodb";

let client;
let db;
let isMongoReady = false;

export async function connectToMongo() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || "standard-engineering";

  if (!uri) {
    console.warn("MONGODB_URI not set. Products API will use local file data.");
    return null;
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    isMongoReady = true;
    console.log(`MongoDB connected (db: ${dbName})`);
    return db;
  } catch (error) {
    console.error("MongoDB connection failed. Falling back to local file data.", error);
    isMongoReady = false;
    db = null;
    return null;
  }
}

export function getProductsCollection() {
  if (!isMongoReady || !db) {
    return null;
  }

  const collectionName = process.env.MONGODB_PRODUCTS_COLLECTION || "products";
  return db.collection(collectionName);
}

export async function closeMongoConnection() {
  if (client) {
    await client.close();
  }
}
