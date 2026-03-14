import "dotenv/config";
import cors from "cors";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import productsRoutes from "./routes/productsRoutes.js";
import { initializeEnquiriesStore } from "./data/enquiriesStore.js";
import { connectToMongo } from "./data/mongoClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");
const hasFrontendBuild = fs.existsSync(frontendIndexPath);

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://standard-eng-and-builders.onrender.com",
  "https://standard-eng-and-builders.vercel.app",
  "https://www.standardengineering.me",
  "https://standardengineering.me"
];

const envAllowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients and same-origin calls without an Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      // Allow Render-hosted frontend origins when app is deployed as a single service.
      if (/^https:\/\/[a-z0-9-]+\.onrender\.com$/i.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    }
  })
);
app.use(express.json());
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});
app.get("/api", (req, res) => {
  res.send("Standard Engineering & Builders API is running");
});

app.use("/api/admin", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/enquiries", enquiryRoutes);

if (hasFrontendBuild) {
  app.use(express.static(frontendDistPath));

  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(frontendIndexPath);
  });
} else {
  // Local fallback when frontend build is not present.
  app.get("/", (req, res) => {
    res.send("Standard Engineering & Builders API is running");
  });
}

Promise.all([initializeEnquiriesStore(), connectToMongo()])
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
      console.log(`Allowed CORS origins: ${allowedOrigins.join(", ")}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize enquiry store", error);
    process.exit(1);
  });
