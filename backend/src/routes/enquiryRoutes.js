import { Router } from "express";
import {
  createEnquiry,
  getEnquiries,
  updateEnquiryResponse
} from "../controllers/enquiryController.js";
import { requireAdminAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAdminAuth, getEnquiries);
router.post("/", createEnquiry);
router.patch("/:id/respond", requireAdminAuth, updateEnquiryResponse);

export default router;
