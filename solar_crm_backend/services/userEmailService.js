// ============================================================
// USER EMAIL SERVICE
// Dispatches branded credentials & welcome email to new users
// ============================================================

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.MAIL_PORT || "587", 10),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function sendUserWelcomeCredentialsEmail({
  toEmail,
  fullName,
  username,
  password,
  roleName,
  loginUrl,
  companyName = "Solar CRM",
}) {
  try {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      console.warn("Mail credentials not configured. Skipping welcome email.");
      return false;
    }

    const appLoginUrl = loginUrl || process.env.FRONTEND_URL || "https://solarcrm.digiinksolutions.com";

    const mailOptions = {
      from: process.env.MAIL_FROM || `"Solar CRM Platform" <${process.env.MAIL_USER}>`,
      to: toEmail,
      subject: `Welcome to ${companyName} - Your Staff Account Credentials`,
      html: `
        <div style="background:#F8FAFC; padding:32px 16px; font-family:'Segoe UI', Arial, sans-serif;">
          <div style="max-width:580px; margin:0 auto; background:#ffffff; border-radius:12px; border:1px solid #E2E8F0; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
            <!-- Header -->
            <div style="background:#0F172A; padding:28px 32px; text-align:center;">
              <h1 style="color:#ffffff; margin:0; font-size:22px; font-weight:700; letter-spacing:-0.02em;">
                ${companyName}
              </h1>
              <p style="color:#F59E0B; margin:6px 0 0; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em;">
                Enterprise Solar Platform
              </p>
            </div>

            <!-- Body -->
            <div style="padding:32px;">
              <h2 style="color:#1E293B; font-size:18px; margin:0 0 12px; font-weight:600;">
                Hello ${fullName},
              </h2>
              <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 20px;">
                An account has been created for you on the <strong>${companyName}</strong> portal with the role of 
                <span style="display:inline-block; background:#EFF6FF; color:#1D4ED8; font-weight:600; padding:2px 8px; border-radius:4px;">
                  ${roleName}
                </span>.
              </p>

              <!-- Credentials Box -->
              <div style="background:#F1F5F9; border-radius:8px; padding:20px; border-left:4px solid #F59E0B; margin-bottom:24px;">
                <p style="margin:0 0 8px; font-size:13px; color:#64748B; font-weight:600; text-transform:uppercase;">
                  Your Login Credentials
                </p>
                <div style="font-size:14px; color:#1E293B; line-height:1.8;">
                  <div><strong>Portal URL:</strong> <a href="${appLoginUrl}" style="color:#2563EB; text-decoration:none;">${appLoginUrl}</a></div>
                  <div><strong>Username / Email:</strong> <code style="background:#E2E8F0; padding:2px 6px; border-radius:4px; font-size:13px;">${username}</code> / ${toEmail}</div>
                  <div><strong>Temporary Password:</strong> <code style="background:#E2E8F0; padding:2px 6px; border-radius:4px; font-size:14px; font-weight:bold; color:#D97706;">${password}</code></div>
                </div>
              </div>

              <div style="text-align:center; margin:30px 0 16px;">
                <a href="${appLoginUrl}" style="display:inline-block; background:#2563EB; color:#ffffff; font-weight:600; font-size:14px; padding:12px 28px; border-radius:8px; text-decoration:none; box-shadow:0 2px 6px rgba(37,99,235,0.3);">
                  Log In To Your Dashboard &rarr;
                </a>
              </div>

              <p style="color:#94A3B8; font-size:12px; line-height:1.5; margin:20px 0 0; text-align:center;">
                For security reasons, we strongly recommend changing your password after logging in for the first time.
              </p>
            </div>

            <!-- Footer -->
            <div style="padding:16px 32px; background:#F8FAFC; border-top:1px solid #E2E8F0; text-align:center;">
              <p style="color:#94A3B8; font-size:12px; margin:0;">
                &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${toEmail}: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error("Failed to send welcome credentials email:", err.message);
    return false;
  }
}

module.exports = { sendUserWelcomeCredentialsEmail };
