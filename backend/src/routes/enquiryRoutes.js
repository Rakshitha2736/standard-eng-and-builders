import { Router } from "express";
import {
  createEnquiry,
  getEnquiries,
  sendTestCustomerEmail,
  updateEnquiryResponse
} from "../controllers/enquiryController.js";
import { requireAdminAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAdminAuth, getEnquiries);
router.post("/", createEnquiry);
router.post("/test-email", requireAdminAuth, sendTestCustomerEmail);
router.patch("/:id/respond", requireAdminAuth, updateEnquiryResponse);

export default router;
