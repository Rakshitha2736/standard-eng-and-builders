import nodemailer from "nodemailer";

const adminRecipients = [
  "rakshitham.23it@kongu.edu",
  "sivadurgeshk.23it@kongu.edu"
];

let transporter;

function readEnv(key) {
  return String(process.env[key] || "").trim();
}

function parseBoolean(value, fallback = false) {
  if (!value) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function getTransportConfig() {
  const smtpService = readEnv("SMTP_SERVICE");
  const smtpHost = readEnv("SMTP_HOST");
  const smtpPortRaw = readEnv("SMTP_PORT");
  const smtpUser = readEnv("SMTP_USER");
  const smtpPass = readEnv("SMTP_PASS");
  const smtpSecureRaw = readEnv("SMTP_SECURE");

  if (!smtpUser || !smtpPass) {
    return null;
  }

  if (!smtpService && (!smtpHost || !smtpPortRaw)) {
    return null;
  }

  const port = Number(smtpPortRaw || "587");
  const secure = smtpSecureRaw
    ? parseBoolean(smtpSecureRaw, false)
    : port === 465;

  const baseConfig = {
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    secure,
    connectionTimeout: Number(readEnv("SMTP_CONNECTION_TIMEOUT_MS") || 20000),
    greetingTimeout: Number(readEnv("SMTP_GREETING_TIMEOUT_MS") || 15000),
    socketTimeout: Number(readEnv("SMTP_SOCKET_TIMEOUT_MS") || 30000)
  };

  if (smtpService) {
    return {
      ...baseConfig,
      service: smtpService
    };
  }

  return {
    ...baseConfig,
    host: smtpHost,
    port,
    requireTLS: !secure
  };
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const transportConfig = getTransportConfig();

  if (!transportConfig) {
    return null;
  }

  transporter = nodemailer.createTransport(transportConfig);

  return transporter;
}

function resetTransporter() {
  transporter = null;
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
      "SMTP is not configured. Set SMTP_SERVICE or SMTP_HOST/SMTP_PORT along with SMTP_USER and SMTP_PASS.";
    console.warn(reason);
    return { sent: false, reason };
  }

  const fromAddress = readEnv("MAIL_FROM") || readEnv("SMTP_USER");

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
    resetTransporter();
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
      "SMTP is not configured. Set SMTP_SERVICE or SMTP_HOST/SMTP_PORT along with SMTP_USER and SMTP_PASS.";
    console.warn(reason);
    return { sent: false, reason };
  }

  const fromAddress = readEnv("MAIL_FROM") || readEnv("SMTP_USER");

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
    resetTransporter();
    return { sent: false, reason };
  }
}
