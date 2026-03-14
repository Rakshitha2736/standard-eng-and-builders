import { MongoClient } from "mongodb";
import "dotenv/config";

const DEFAULT_SOURCE_URI = "mongodb://127.0.0.1:27017";
const DEFAULT_DB_NAME = "standard-engineering";
const BATCH_SIZE = 500;

function getEnv(name, fallback = "") {
  return process.env[name] || fallback;
}

function toBool(value, fallback = true) {
  if (value === undefined) {
    return fallback;
  }

  return String(value).toLowerCase() === "true";
}

function buildIndexSpec(index) {
  const {
    key,
    name,
    v,
    ns,
    background,
    ...options
  } = index;

  return { key, options: { ...options, name } };
}

async function copyCollection(sourceDb, targetDb, collectionName, dropTarget) {
  const sourceCollection = sourceDb.collection(collectionName);
  const targetCollection = targetDb.collection(collectionName);

  if (dropTarget) {
    try {
      await targetCollection.drop();
      console.log(`Dropped target collection: ${collectionName}`);
    } catch (error) {
      if (error.codeName !== "NamespaceNotFound") {
        throw error;
      }
    }
  }

  const indexes = await sourceCollection.indexes();
  const nonDefaultIndexes = indexes
    .filter((index) => index.name !== "_id_")
    .map(buildIndexSpec);

  if (nonDefaultIndexes.length) {
    await targetCollection.createIndexes(nonDefaultIndexes);
    console.log(`Created ${nonDefaultIndexes.length} index(es) on ${collectionName}`);
  }

  const cursor = sourceCollection.find({}).batchSize(BATCH_SIZE);
  let batch = [];
  let insertedCount = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    batch.push(doc);

    if (batch.length >= BATCH_SIZE) {
      const result = await targetCollection.insertMany(batch, { ordered: false });
      insertedCount += result.insertedCount;
      batch = [];
    }
  }

  if (batch.length) {
    const result = await targetCollection.insertMany(batch, { ordered: false });
    insertedCount += result.insertedCount;
  }

  const sourceCount = await sourceCollection.countDocuments();
  const targetCount = await targetCollection.countDocuments();

  if (sourceCount !== targetCount || sourceCount !== insertedCount) {
    throw new Error(
      `Verification failed for ${collectionName}. source=${sourceCount}, inserted=${insertedCount}, target=${targetCount}`
    );
  }

  console.log(
    `Collection ${collectionName} migrated successfully. Documents: ${sourceCount}`
  );

  return sourceCount;
}

async function migrate() {
  const sourceUri = getEnv("SOURCE_MONGODB_URI", DEFAULT_SOURCE_URI);
  const sourceDbName = getEnv(
    "SOURCE_MONGODB_DB_NAME",
    getEnv("MONGODB_DB_NAME", DEFAULT_DB_NAME)
  );
  const targetUri = getEnv("TARGET_MONGODB_URI");
  const targetDbName = getEnv("TARGET_MONGODB_DB_NAME", sourceDbName);
  const dropTarget = toBool(process.env.DROP_TARGET_COLLECTIONS, true);

  if (!targetUri) {
    throw new Error(
      "TARGET_MONGODB_URI is required. Provide your Atlas connection string as this environment variable."
    );
  }

  const sourceClient = new MongoClient(sourceUri);
  const targetClient = new MongoClient(targetUri);

  try {
    await sourceClient.connect();
    await targetClient.connect();

    const sourceDb = sourceClient.db(sourceDbName);
    const targetDb = targetClient.db(targetDbName);

    const collections = await sourceDb.listCollections({}, { nameOnly: true }).toArray();

    if (!collections.length) {
      throw new Error(`No collections found in source DB: ${sourceDbName}`);
    }

    console.log(`Source DB: ${sourceDbName}`);
    console.log(`Target DB: ${targetDbName}`);
    console.log(`Collections to migrate: ${collections.map((c) => c.name).join(", ")}`);
    console.log(`Drop target collections before import: ${dropTarget}`);

    let totalDocuments = 0;
    for (const { name } of collections) {
      totalDocuments += await copyCollection(sourceDb, targetDb, name, dropTarget);
    }

    console.log("Migration completed successfully.");
    console.log(`Total collections migrated: ${collections.length}`);
    console.log(`Total documents migrated: ${totalDocuments}`);
  } finally {
    await sourceClient.close();
    await targetClient.close();
  }
}

migrate().catch((error) => {
  console.error("Mongo migration failed:", error.message);
  process.exitCode = 1;
});
