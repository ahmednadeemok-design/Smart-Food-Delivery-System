let nodemailer = null;

try {
  nodemailer = require("nodemailer");
} catch (error) {
  nodemailer = null;
}

const emailEnabled = () => String(process.env.EMAIL_ENABLED ?? "false").toLowerCase() === "true";

const getTransporter = () => {
  if (!nodemailer) return null;
  if (!emailEnabled()) return null;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const logFallbackEmail = ({ to, subject, text }) => {
  if (process.env.NODE_ENV === "production" && emailEnabled()) return;
  console.log("[email:fallback]", {
    to,
    subject,
    preview: String(text || "").slice(0, 240),
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = getTransporter();
    const fromName = process.env.MAIL_FROM_NAME || "SmartFood Narowal";
    const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER || "no-reply@smartfood.local";
    const payload = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      text,
    };

    if (!transporter) {
      logFallbackEmail(payload);
      return { sent: false, fallback: true };
    }

    await transporter.sendMail(payload);
    return { sent: true, fallback: false };
  } catch (error) {
    console.error("[email] send failed:", error.message);
    logFallbackEmail({ to, subject, text });
    return { sent: false, fallback: true, error: error.message };
  }
};

const baseTemplate = ({ title, body, ctaLabel, ctaUrl }) => `
  <div style="font-family:Inter,Arial,sans-serif;background:#fff7f2;padding:28px;color:#18181b">
    <div style="max-width:560px;margin:auto;background:#fff;border:1px solid #ffe1d3;border-radius:18px;padding:26px;box-shadow:0 16px 40px rgba(242,74,29,.12)">
      <div style="font-size:22px;font-weight:900;color:#f24a1d;margin-bottom:16px">SmartFood Narowal</div>
      <h1 style="font-size:24px;margin:0 0 12px">${title}</h1>
      <div style="font-size:15px;line-height:1.7;color:#3f3f46">${body}</div>
      ${ctaUrl ? `<a href="${ctaUrl}" style="display:inline-block;margin-top:20px;background:#f24a1d;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:800">${ctaLabel || "Open SmartFood"}</a>` : ""}
      <p style="margin-top:22px;color:#71717a;font-size:12px">Narowal-only local delivery operations.</p>
    </div>
  </div>
`;

const panelUrl = (fallbackPath = "") => {
  const first = String(process.env.CLIENT_URL || "http://localhost:5173").split(",")[0];
  return `${first}${fallbackPath}`;
};

const sendPasswordResetCode = (user, code) =>
  sendEmail({
    to: user.email,
    subject: "Your SmartFood Narowal reset code",
    text: `Your SmartFood Narowal reset code is ${code}. It expires in 15 minutes.`,
    html: baseTemplate({
      title: "Reset your password",
      body: `<p>Use this reset code to set a new password:</p><p style="font-size:28px;font-weight:900;letter-spacing:4px;color:#f24a1d">${code}</p><p>This code expires in 15 minutes. If you did not request it, you can ignore this email.</p>`,
    }),
  });

const sendTemporaryPassword = (user, temporaryPassword) =>
  sendEmail({
    to: user.email,
    subject: "Your SmartFood Narowal temporary password",
    text: `Your temporary password is ${temporaryPassword}. Please login and change it.`,
    html: baseTemplate({
      title: "Temporary password issued",
      body: `<p>An admin issued a temporary password for your SmartFood account.</p><p style="font-size:22px;font-weight:900;color:#f24a1d">${temporaryPassword}</p><p>Please login and reset your password immediately.</p>`,
      ctaLabel: "Login",
      ctaUrl: panelUrl("/login"),
    }),
  });

const sendRestaurantApproval = (restaurant) => {
  if (!restaurant?.owner?.email || restaurant.approvalStatus !== "approved") return Promise.resolve({ skipped: true });
  return sendEmail({
    to: restaurant.owner.email,
    subject: `${restaurant.name} approved on SmartFood Narowal`,
    text: `${restaurant.name} has been approved. Login to the restaurant panel.`,
    html: baseTemplate({
      title: "Restaurant approved",
      body: `<p>${restaurant.name} is approved and can receive Narowal orders.</p><p>Login with your owner email: <b>${restaurant.owner.email}</b></p>`,
      ctaLabel: "Open restaurant panel",
      ctaUrl: process.env.RESTAURANT_PANEL_URL || "http://localhost:5175/login",
    }),
  });
};

const sendRiderApproval = (rider) => {
  if (!rider?.user?.email || rider.approvalStatus !== "approved") return Promise.resolve({ skipped: true });
  return sendEmail({
    to: rider.user.email,
    subject: "Your SmartFood Rider profile is approved",
    text: "Your rider profile is approved. You can now go online in Narowal.",
    html: baseTemplate({
      title: "Rider profile approved",
      body: "<p>Your rider profile has been approved. You can now go online and accept ready Narowal deliveries.</p>",
      ctaLabel: "Open rider app",
      ctaUrl: process.env.RIDER_APP_URL || "http://localhost:5174/login",
    }),
  });
};

const sendOrderUpdate = (order, subject, message) => {
  const customer = order?.customer;
  if (!customer?.email) return Promise.resolve({ skipped: true });
  return sendEmail({
    to: customer.email,
    subject,
    text: message,
    html: baseTemplate({
      title: subject,
      body: `<p>${message}</p><p><b>Status:</b> ${order.status}</p><p><b>Total:</b> PKR ${order.totalAmount || 0}</p>`,
      ctaLabel: "Track order",
      ctaUrl: panelUrl("/orders"),
    }),
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetCode,
  sendTemporaryPassword,
  sendRestaurantApproval,
  sendRiderApproval,
  sendOrderUpdate,
};
