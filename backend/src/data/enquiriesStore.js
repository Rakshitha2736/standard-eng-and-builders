import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const enquiriesFilePath = path.join(__dirname, "enquiries.json");

let enquiries = [];
let enquiryCounter = 1;

async function writeEnquiriesToFile() {
  await fs.writeFile(
    enquiriesFilePath,
    JSON.stringify(enquiries, null, 2),
    "utf-8"
  );
}

export async function initializeEnquiriesStore() {
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

export function listEnquiries() {
  return enquiries;
}

export async function addEnquiry(payload) {
  const enquiry = {
    id: enquiryCounter++,
    name: payload.name,
    contactNumber: payload.contactNumber,
    email: payload.email,
    productInterest: payload.productInterest,
    message: payload.message,
    status: "new",
    adminResponse: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  enquiries.unshift(enquiry);
  await writeEnquiriesToFile();
  return enquiry;
}

export async function respondToEnquiry(id, responseText) {
  const enquiry = enquiries.find((entry) => entry.id === Number(id));

  if (!enquiry) {
    return null;
  }

  enquiry.adminResponse = responseText;
  enquiry.status = "responded";
  enquiry.updatedAt = new Date().toISOString();
  await writeEnquiriesToFile();

  return enquiry;
}
