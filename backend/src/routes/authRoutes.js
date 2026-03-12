import { Router } from "express";
import { loginAdmin } from "../controllers/authController.js";

const router = Router();

router.get("/login", (req, res) => {
	res.status(405).json({ message: "Use POST /api/admin/login for authentication" });
});

router.post("/login", loginAdmin);

export default router;
