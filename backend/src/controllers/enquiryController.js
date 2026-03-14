import {
  addEnquiry,
  getEnquiryById,
  listEnquiries,
  respondToEnquiry
} from "../data/enquiriesStore.js";
import {
  sendEnquiryNotification,
  sendResponseToCustomer
} from "../services/enquiryMailer.js";

function isInvalidEmail(email) {
  return !/^\S+@\S+\.\S+$/.test(email);
}

export async function createEnquiry(req, res) {
  try {
    const { name, contactNumber, email, productInterest, message } = req.body;

    if (!name || !contactNumber || !email || !productInterest || !message) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    if (isInvalidEmail(email)) {
      res.status(400).json({ message: "Invalid email address" });
      return;
    }

    const enquiry = await addEnquiry({
      name,
      contactNumber,
      email,
      productInterest,
      message
    });

    const emailResult = await sendEnquiryNotification(enquiry);

    if (!emailResult.sent) {
      res.status(201).json({
        message:
          "Enquiry saved, but email notification could not be sent. Please check server SMTP settings.",
        enquiry,
        emailStatus: emailResult
      });
      return;
    }

    res.status(201).json({
      message: "Enquiry submitted successfully and email sent to admins.",
      enquiry,
      emailStatus: emailResult
    });
  } catch (error) {
    console.error("Failed to create enquiry", error);
    res.status(500).json({ message: "Failed to save enquiry" });
  }
}

export async function getEnquiries(req, res) {
  try {
    const enquiries = await listEnquiries();
    res.json(enquiries);
  } catch (error) {
    console.error("Failed to fetch enquiries", error);
    res.status(500).json({ message: "Failed to fetch enquiries" });
  }
}

export async function updateEnquiryResponse(req, res) {
  try {
    const responseText = String(
      req.body?.response ?? req.body?.adminResponse ?? req.body?.message ?? ""
    ).trim();

    if (!responseText) {
      res.status(400).json({ message: "Response message is required" });
      return;
    }

    const enquiry = await getEnquiryById(req.params.id);

    if (!enquiry) {
      res.status(404).json({ message: "Enquiry not found" });
      return;
    }

    const emailResult = await sendResponseToCustomer(enquiry, responseText);
    const updated = await respondToEnquiry(
      req.params.id,
      responseText,
      emailResult.sent ? "sent" : "failed",
      emailResult.sent ? "" : emailResult.reason || "Unknown SMTP error"
    );

    if (!emailResult.sent) {
      res.json({
        message:
          "Response saved, but customer email could not be sent. Please check SMTP settings.",
        enquiry: updated,
        emailStatus: emailResult
      });
      return;
    }

    res.json({
      message: "Response saved and email sent to customer.",
      enquiry: updated,
      emailStatus: emailResult
    });
  } catch (error) {
    console.error("Failed to respond to enquiry", error);
    res.status(500).json({ message: "Failed to update enquiry response" });
  }
}
