import { MongoClient } from "mongodb";
import { products as seedProducts } from "./products.js";

let client;
let db;
let isMongoReady = false;

const DEFAULT_DB_NAME = "standard-engineering";
const DEFAULT_PRODUCTS_COLLECTION = "products";
const DEFAULT_ENQUIRIES_COLLECTION = "enquiries";
const DEFAULT_ADMINS_COLLECTION = "admins";

function getDbName() {
  return process.env.MONGODB_DB_NAME || DEFAULT_DB_NAME;
}

function getCollectionName(envKey, fallback) {
  return process.env[envKey] || fallback;
}

export async function connectToMongo() {
  const uri = process.env.MONGODB_URI;
  const dbName = getDbName();

  if (!uri) {
    console.warn("MONGODB_URI not set. Products API will use local file data.");
    return null;
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    isMongoReady = true;
    await Promise.all([syncSeedProducts(), syncDefaultAdmin()]);
    console.log(`MongoDB connected (db: ${dbName})`);
    return db;
  } catch (error) {
    console.error("MongoDB connection failed. Falling back to local file data.", error);
    isMongoReady = false;
    db = null;
    return null;
  }
}

async function syncSeedProducts() {
  if (!db) {
    return;
  }

  const collection = getProductsCollection();

  if (!collection) {
    return;
  }

  const existingIds = await collection.distinct("id");
  const missingProducts = seedProducts.filter((product) => !existingIds.includes(product.id));

  if (!missingProducts.length) {
    return;
  }

  await collection.insertMany(missingProducts);
  console.log(`Seeded ${missingProducts.length} missing products into MongoDB`);
}

async function syncDefaultAdmin() {
  const collection = getAdminsCollection();

  if (!collection) {
    return;
  }

  const defaultUsername = process.env.ADMIN_USERNAME || "admin";
  const defaultPassword = process.env.ADMIN_PASSWORD || "admin123";
  const existingAdmin = await collection.findOne({ username: defaultUsername });

  if (existingAdmin) {
    return;
  }

  await collection.insertOne({
    username: defaultUsername,
    password: defaultPassword,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  console.log(`Seeded default admin user \"${defaultUsername}\" into MongoDB`);
}

export function getProductsCollection() {
  if (!isMongoReady || !db) {
    return null;
  }

  const collectionName = getCollectionName(
    "MONGODB_PRODUCTS_COLLECTION",
    DEFAULT_PRODUCTS_COLLECTION
  );
  return db.collection(collectionName);
}

export function getEnquiriesCollection() {
  if (!isMongoReady || !db) {
    return null;
  }

  const collectionName = getCollectionName(
    "MONGODB_ENQUIRIES_COLLECTION",
    DEFAULT_ENQUIRIES_COLLECTION
  );
  return db.collection(collectionName);
}

export function getAdminsCollection() {
  if (!isMongoReady || !db) {
    return null;
  }

  const collectionName = getCollectionName(
    "MONGODB_ADMINS_COLLECTION",
    DEFAULT_ADMINS_COLLECTION
  );
  return db.collection(collectionName);
}

export async function closeMongoConnection() {
  if (client) {
    await client.close();
  }
}
