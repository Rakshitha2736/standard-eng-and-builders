import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getEnquiriesCollection } from "./mongoClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const enquiriesFilePath = path.join(__dirname, "enquiries.json");

let enquiries = [];
let enquiryCounter = 1;

function normalizeEnquiryDocument(entry = {}) {
  const { _id, ...cleaned } = entry;
  return cleaned;
}

async function ensureMongoIndexes(collection) {
  await Promise.all([
    collection.createIndex({ id: 1 }, { unique: true }),
    collection.createIndex({ createdAt: -1 })
  ]);
}

async function getNextEnquiryId(collection) {
  const latest = await collection
    .find({}, { projection: { id: 1 } })
    .sort({ id: -1 })
    .limit(1)
    .toArray();

  return Number(latest[0]?.id || 0) + 1;
}

async function writeEnquiriesToFile() {
  await fs.writeFile(
    enquiriesFilePath,
    JSON.stringify(enquiries, null, 2),
    "utf-8"
  );
}

export async function initializeEnquiriesStore() {
  const collection = getEnquiriesCollection();

  if (collection) {
    await ensureMongoIndexes(collection);
    return;
  }

  try {
    const raw = await fs.readFile(enquiriesFilePath, "utf-8");
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      enquiries = parsed;
      const maxId = enquiries.reduce(
        (currentMax, item) => Math.max(currentMax, Number(item.id) || 0),
        0
      );
      enquiryCounter = maxId + 1;
      return;
    }
  } catch (error) {
    // Continue with default in-memory state and create file if missing.
  }

  enquiries = [];
  enquiryCounter = 1;
  await writeEnquiriesToFile();
}

export async function listEnquiries() {
  const collection = getEnquiriesCollection();

  if (collection) {
    const mongoEnquiries = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return mongoEnquiries.map(normalizeEnquiryDocument);
  }

  return enquiries;
}

export async function getEnquiryById(id) {
  const collection = getEnquiriesCollection();
  const normalizedId = Number(id);

  if (collection) {
    const enquiry = await collection.findOne({ id: normalizedId });
    return enquiry ? normalizeEnquiryDocument(enquiry) : null;
  }

  return enquiries.find((entry) => entry.id === normalizedId) || null;
}

export async function addEnquiry(payload) {
  const collection = getEnquiriesCollection();
  const now = new Date().toISOString();
  const enquiry = {
    id: 0,
    name: payload.name,
    contactNumber: payload.contactNumber,
    email: payload.email,
    productInterest: payload.productInterest,
    message: payload.message,
    status: "new",
    adminResponse: "",
    responseEmailStatus: "not_attempted",
    responseEmailError: "",
    createdAt: now,
    updatedAt: now
  };

  if (collection) {
    enquiry.id = await getNextEnquiryId(collection);
    await collection.insertOne(enquiry);
    return enquiry;
  }

  enquiry.id = enquiryCounter++;

  enquiries.unshift(enquiry);
  await writeEnquiriesToFile();
  return enquiry;
}

export async function respondToEnquiry(
  id,
  responseText,
  responseEmailStatus = "sent",
  responseEmailError = ""
) {
  const collection = getEnquiriesCollection();
  const normalizedId = Number(id);

  if (collection) {
    const result = await collection.updateOne(
      { id: normalizedId },
      {
        $set: {
          adminResponse: responseText,
          responseEmailStatus,
          responseEmailError,
          status: responseEmailStatus === "sent" ? "responded" : "response_failed",
          updatedAt: new Date().toISOString()
        }
      }
    );

    if (!result.matchedCount) {
      return null;
    }

    const updated = await collection.findOne({ id: normalizedId });
    return updated ? normalizeEnquiryDocument(updated) : null;
  }

  const enquiry = await getEnquiryById(normalizedId);

  if (!enquiry) {
    return null;
  }

  enquiry.adminResponse = responseText;
  enquiry.responseEmailStatus = responseEmailStatus;
  enquiry.responseEmailError = responseEmailError;
  enquiry.status = responseEmailStatus === "sent" ? "responded" : "response_failed";
  enquiry.updatedAt = new Date().toISOString();
  await writeEnquiriesToFile();

  return enquiry;
}
