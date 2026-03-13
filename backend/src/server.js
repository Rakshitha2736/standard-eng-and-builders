import "dotenv/config";
import cors from "cors";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import productsRoutes from "./routes/productsRoutes.js";
import { initializeEnquiriesStore } from "./data/enquiriesStore.js";
import { connectToMongo } from "./data/mongoClient.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"]
  })
);
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Standard Engineering & Builders API is running");
});
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/admin", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/enquiries", enquiryRoutes);

Promise.all([initializeEnquiriesStore(), connectToMongo()])
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize enquiry store", error);
    process.exit(1);
  });
