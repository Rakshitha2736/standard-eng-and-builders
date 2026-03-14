import { Router } from "express";
import {
	createProduct,
	deleteProduct,
	getProductById,
	getProducts,
	updateProduct
} from "../controllers/productsController.js";
import { requireAdminAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", requireAdminAuth, createProduct);
router.put("/:id", requireAdminAuth, updateProduct);
router.delete("/:id", requireAdminAuth, deleteProduct);

export default router;
