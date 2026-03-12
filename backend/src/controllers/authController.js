import jwt from "jsonwebtoken";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "standard_engineering_secret";

export function loginAdmin(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: "Username and password are required" });
    return;
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    res.status(401).json({ message: "Invalid admin credentials" });
    return;
  }

  const token = jwt.sign({ role: "admin", username }, JWT_SECRET, {
    expiresIn: "8h"
  });

  res.json({ token });
}
