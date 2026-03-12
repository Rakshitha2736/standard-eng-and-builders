import nodemailer from "nodemailer";

const adminRecipients = [
  "rakshitham.23it@kongu.edu",
  "sivadurgeshk.23it@kongu.edu"
];

let transporter;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  return transporter;
}

function buildEmailHtml(enquiry) {
  return `
    <h2>New Customer Enquiry</h2>
    <p>A new enquiry was submitted on Standard Engineering and Builders website.</p>
    <table cellpadding="6" cellspacing="0" border="1" style="border-collapse: collapse;">
      <tr><td><strong>Enquiry ID</strong></td><td>${enquiry.id}</td></tr>
      <tr><td><strong>Name</strong></td><td>${enquiry.name}</td></tr>
      <tr><td><strong>Contact Number</strong></td><td>${enquiry.contactNumber}</td></tr>
      <tr><td><strong>Email</strong></td><td>${enquiry.email}</td></tr>
      <tr><td><strong>Service Interest</strong></td><td>${enquiry.productInterest}</td></tr>
      <tr><td><strong>Message</strong></td><td>${enquiry.message}</td></tr>
      <tr><td><strong>Created At</strong></td><td>${enquiry.createdAt}</td></tr>
    </table>
  `;
}

export async function sendEnquiryNotification(enquiry) {
  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    const reason =
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.";
    console.warn(reason);
    return { sent: false, reason };
  }

  const fromAddress = process.env.MAIL_FROM || process.env.SMTP_USER;

  try {
    await mailTransporter.sendMail({
      from: fromAddress,
      to: adminRecipients.join(", "),
      subject: `New Enquiry: ${enquiry.productInterest}`,
      text: [
        "New customer enquiry received",
        `Enquiry ID: ${enquiry.id}`,
        `Name: ${enquiry.name}`,
        `Contact Number: ${enquiry.contactNumber}`,
        `Email: ${enquiry.email}`,
        `Service Interest: ${enquiry.productInterest}`,
        `Message: ${enquiry.message}`,
        `Created At: ${enquiry.createdAt}`
      ].join("\n"),
      html: buildEmailHtml(enquiry)
    });

    return { sent: true };
  } catch (error) {
    const reason = error?.message || "Unknown SMTP error";
    console.error("Failed to send enquiry notification email", reason);
    return { sent: false, reason };
  }
}

function buildResponseHtml(enquiry, responseText) {
  return `
    <h2>Response to Your Enquiry</h2>
    <p>Dear ${enquiry.name},</p>
    <p>Thank you for contacting Standard Engineering and Builders.</p>
    <p><strong>Your enquiry:</strong> ${enquiry.message}</p>
    <p><strong>Our response:</strong> ${responseText}</p>
    <p>Service: ${enquiry.productInterest}</p>
    <p>Regards,<br/>Standard Engineering and Builders</p>
  `;
}

export async function sendResponseToCustomer(enquiry, responseText) {
  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    const reason =
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.";
    console.warn(reason);
    return { sent: false, reason };
  }

  const fromAddress = process.env.MAIL_FROM || process.env.SMTP_USER;

  try {
    await mailTransporter.sendMail({
      from: fromAddress,
      to: enquiry.email,
      subject: `Response to your enquiry: ${enquiry.productInterest}`,
      text: [
        `Dear ${enquiry.name},`,
        "Thank you for contacting Standard Engineering and Builders.",
        `Your enquiry: ${enquiry.message}`,
        `Our response: ${responseText}`,
        `Service: ${enquiry.productInterest}`,
        "Regards,",
        "Standard Engineering and Builders"
      ].join("\n"),
      html: buildResponseHtml(enquiry, responseText)
    });

    return { sent: true };
  } catch (error) {
    const reason = error?.message || "Unknown SMTP error";
    console.error("Failed to send response email to customer", reason);
    return { sent: false, reason };
  }
}
