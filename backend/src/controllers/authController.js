import jwt from "jsonwebtoken";
import { getAdminsCollection } from "../data/mongoClient.js";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "standard_engineering_secret";

export async function loginAdmin(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: "Username and password are required" });
    return;
  }

  try {
    let isValidAdmin = false;
    const adminsCollection = getAdminsCollection();

    if (adminsCollection) {
      const admin = await adminsCollection.findOne({ username });
      isValidAdmin = !!admin && admin.password === password;
    } else {
      isValidAdmin = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
    }

    if (!isValidAdmin) {
      res.status(401).json({ message: "Invalid admin credentials" });
      return;
    }

    const token = jwt.sign({ role: "admin", username }, JWT_SECRET, {
      expiresIn: "8h"
    });

    res.json({ token });
  } catch (error) {
    console.error("Failed to authenticate admin", error);
    res.status(500).json({ message: "Admin authentication failed" });
  }
}
