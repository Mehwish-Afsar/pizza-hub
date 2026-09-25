const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Checks whether Nodemailer can connect to the configured email provider.
const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log("📧 Email service connected successfully.");
    return true;
  } catch (error) {
    console.error("❌ Email service connection failed:", error.message);
    return false;
  }
};

const sendEmail = async ({ to, subject, html, text }) => {
  if (!to) {
    throw new Error("Recipient email is required.");
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent: ${info.messageId}`);
  return info;
};

const emailWrapper = (bodyHtml, maxWidth = 600) => `
  <div style="font-family: Arial, sans-serif; max-width: ${maxWidth}px; margin: auto; padding: 30px;">
    ${bodyHtml}
  </div>
`;

const button = (href, label) => `
  <a href="${href}" style="display: inline-block; padding: 12px 20px; background: #e63946; color: white; text-decoration: none; border-radius: 6px;">
    ${label}
  </a>
`;

const sendVerificationEmail = async ({ name, email, verificationUrl }) => {
  return sendEmail({
    to: email,
    subject: "🍕 Verify your Pizza Delivery account",
    text:
      `Hello ${name},\n\n` +
      `Please verify your Pizza Delivery account using this link:\n` +
      `${verificationUrl}\n\n` +
      `This link will expire soon.`,
    html: emailWrapper(`
      <h1>🍕 Pizza Delivery</h1>
      <h2>Verify your email</h2>
      <p>Hello ${name},</p>
      <p>Thank you for creating your Pizza Delivery account.</p>
      <p>Please click the button below to verify your email address.</p>
      ${button(verificationUrl, "Verify Email")}
      <p>If you did not create this account, you can safely ignore this email.</p>
    `),
  });
};

const sendPasswordResetEmail = async ({ name, email, resetUrl }) => {
  return sendEmail({
    to: email,
    subject: "🍕 Reset your Pizza Delivery password",
    text:
      `Hello ${name},\n\n` +
      `Reset your password using this link:\n` +
      `${resetUrl}\n\n` +
      `This link will expire soon.`,
    html: emailWrapper(`
      <h1>🍕 Pizza Delivery</h1>
      <h2>Password Reset</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset your password.</p>
      ${button(resetUrl, "Reset Password")}
      <p>If you did not request a password reset, please ignore this email.</p>
    `),
  });
};

const sendLowStockEmail = async ({ items }) => {
  const cell = (content, bold = false) =>
    `<td style="padding: 10px; border: 1px solid #ddd;">${bold ? `<strong>${content}</strong>` : content}</td>`;

  const rows = items
    .map(
      (item) => `
        <tr>
          ${cell(item.name)}
          ${cell(item.category)}
          ${cell(item.stock, true)}
          ${cell(item.lowStockThreshold)}
        </tr>
      `
    )
    .join("");

  const th = (label) =>
    `<th style="padding: 10px; border: 1px solid #ddd; text-align: left;">${label}</th>`;

  return sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: "⚠️ Pizza Delivery — Low Stock Alert",
    text: "Some inventory items are below their configured stock threshold.",
    html: emailWrapper(
      `
        <h1>🍕 Pizza Delivery</h1>
        <h2 style="color: #d9534f;">⚠️ Low Stock Alert</h2>
        <p>The following inventory items are below or equal to their configured threshold:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr>
              ${th("Item")}
              ${th("Category")}
              ${th("Current Stock")}
              ${th("Threshold")}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top: 25px;">Please update the inventory as soon as possible.</p>
      `,
      700
    ),
  });
};

module.exports = {
  verifyEmailConnection,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendLowStockEmail,
};
