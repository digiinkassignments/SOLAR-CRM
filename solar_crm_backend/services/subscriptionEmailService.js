// ============================================================
// SUBSCRIPTION EMAIL SERVICE
// Sabhi subscription related emails yahan se jaate hain
// Nodemailer use karta hai (existing .env MAIL_ variables)
// ============================================================

const nodemailer = require("nodemailer");
const { masterDb } = require("../config/masterDb");

// ============================================================
// Transporter (existing .env variables use karta hai)
// ============================================================
const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST,
  port:   process.env.MAIL_PORT,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// ============================================================
// Get Master Settings (bank details, support contacts)
// ============================================================
async function getMasterSettings() {
  const [rows] = await masterDb.query(`SELECT * FROM master_settings LIMIT 1`);
  return rows[0] || {};
}

// ============================================================
// Standard Layout Wrapper
// ============================================================
function emailLayout(heading, bodyContent, settings = {}) {
  const supportEmail = settings.support_email || "support@digiinksolutions.com";
  return `
    <div style="background:#F8FAFC; padding:32px 0; font-family:Arial,sans-serif;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; border:1px solid #E2E8F0; overflow:hidden;">
        <!-- Header -->
        <div style="background:#0B3A63; padding:28px 32px;">
          <h1 style="color:#ffffff; margin:0; font-size:20px; font-weight:600;">
            Solar CRM
          </h1>
          <p style="color:#93C5FD; margin:4px 0 0; font-size:13px;">
            Powered by Digiink Solutions
          </p>
        </div>

        <!-- Body -->
        <div style="padding:32px;">
          <h2 style="color:#1E293B; font-size:18px; margin:0 0 16px;">
            ${heading}
          </h2>
          ${bodyContent}
        </div>

        <!-- Footer -->
        <div style="padding:20px 32px; border-top:1px solid #E2E8F0;">
          <p style="color:#94A3B8; font-size:12px; margin:0;">
            Solar CRM by Digiink Solutions | ${supportEmail}
          </p>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// Reusable Blocks
// ============================================================
function paymentDetailsBlock(settings) {
  return `
    <div style="background:#F1F5F9; border-radius:6px; padding:16px; margin:20px 0;">
      <h3 style="margin:0 0 12px; color:#1E293B; font-size:14px; font-weight:600;">Payment Details</h3>
      ${settings.bank_account_name ? `<p style="margin:0 0 6px; color:#475569; font-size:13px;"><strong>Account Name:</strong> ${settings.bank_account_name}</p>` : ""}
      ${settings.bank_account_number ? `<p style="margin:0 0 6px; color:#475569; font-size:13px;"><strong>Account Number:</strong> ${settings.bank_account_number}</p>` : ""}
      ${settings.bank_ifsc ? `<p style="margin:0 0 6px; color:#475569; font-size:13px;"><strong>IFSC:</strong> ${settings.bank_ifsc}</p>` : ""}
      ${settings.bank_name ? `<p style="margin:0 0 6px; color:#475569; font-size:13px;"><strong>Bank:</strong> ${settings.bank_name}</p>` : ""}
      ${settings.upi_id ? `<p style="margin:0; color:#475569; font-size:13px;"><strong>UPI ID:</strong> ${settings.upi_id}</p>` : ""}
    </div>
  `;
}

function supportBlock(settings) {
  return `
    <div style="margin-top:24px; padding-top:16px; border-top:1px solid #E2E8F0;">
      <p style="color:#64748B; font-size:13px; margin:0; line-height:1.5;">
        Need help? Contact support:<br>
        Phone: ${settings.support_phone || "—"} &nbsp;|&nbsp;
        Email: ${settings.support_email || "—"} &nbsp;|&nbsp;
        WhatsApp: ${settings.support_whatsapp || "—"}
      </p>
    </div>
  `;
}

// ============================================================
// Email Templates (8 Types)
// ============================================================

function welcomeEmailTemplate(client, tempPassword, settings) {
  const loginUrl = `https://${client.subdomain}.digiinksolutions.com`;
  const bodyContent = `
    <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
      Welcome to your <strong>${client.plan_name}</strong> plan! Your <strong>7-day free trial</strong> has been activated.<br>Trial Start: <strong>${new Date().toLocaleDateString("en-IN")}</strong> | Trial End: <strong>${new Date(client.subscription_end).toLocaleDateString("en-IN")}</strong><br>Below are your login credentials:
    </p>

    <div style="background:#F1F5F9; border-radius:6px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 8px; color:#1E293B; font-size:13px;">
        <strong>Login URL:</strong> <a href="${loginUrl}" style="color:#0B3A63; text-decoration:underline;">${loginUrl}</a>
      </p>
      <p style="margin:0 0 8px; color:#1E293B; font-size:13px;">
        <strong>Username:</strong> ${client.email}
      </p>
      <p style="margin:0; color:#1E293B; font-size:13px;">
        <strong>Temporary Password:</strong> <code style="background:#E2E8F0; padding:2px 6px; border-radius:4px; font-family:monospace;">${tempPassword}</code>
      </p>
    </div>

    <p style="color:#64748B; font-size:13px; line-height:1.5; margin:0 0 20px;">
      Please change your password immediately after logging in for the first time.
    </p>

    <a href="${loginUrl}" style="display:inline-block; background:#0B3A63; color:#ffffff; padding:12px 24px; border-radius:6px; text-decoration:none; font-size:14px; font-weight:600;">
      Login to Dashboard
    </a>

    ${supportBlock(settings)}
  `;

  return {
    subject: `Welcome to ${settings.company_name || "Solar CRM"} — Your Account is Ready`,
    html: emailLayout(`Welcome, ${client.owner_name}!`, bodyContent, settings),
  };
}

function expiringSoonTemplate(client, settings) {
  const daysLeft = Math.ceil(
    (new Date(client.subscription_end) - new Date()) / (1000 * 60 * 60 * 24)
  );
  const bodyContent = `
    <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
      Dear <strong>${client.owner_name}</strong>,
    </p>
    <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
      Your <strong>${client.plan_name}</strong> plan for <strong>${client.business_name}</strong> is set to expire in <strong>${daysLeft} day(s)</strong> on <strong>${new Date(client.subscription_end).toLocaleDateString("en-IN")}</strong>.
    </p>
    <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
      To avoid service interruption, please renew your subscription using the payment details below:
    </p>

    ${paymentDetailsBlock(settings)}

    <p style="color:#64748B; font-size:13px; line-height:1.5; margin:0 0 20px;">
      After completing the transfer, click "I have made the payment" in your portal or contact support.
    </p>

    <a href="https://${client.subdomain}.digiinksolutions.com" style="display:inline-block; background:#0B3A63; color:#ffffff; padding:12px 24px; border-radius:6px; text-decoration:none; font-size:14px; font-weight:600;">
      Renew Subscription
    </a>

    ${supportBlock(settings)}
  `;

  return {
    subject: `Action Required — Your Solar CRM plan expires in ${daysLeft} days`,
    html: emailLayout(`Plan Expiring Soon`, bodyContent, settings),
  };
}

function gracePeriodTemplate(client, settings) {
  const graceDays = Math.ceil(
    (new Date(client.grace_end_date) - new Date()) / (1000 * 60 * 60 * 24)
  );
  const bodyContent = `
    <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
      Dear <strong>${client.owner_name}</strong>,
    </p>
    <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
      Your <strong>${client.plan_name}</strong> plan has expired. Your account is currently in a 3-day grace period with <strong>${graceDays} day(s) left</strong> before system lock.
    </p>
    <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
      Please submit payment to maintain uninterrupted access:
    </p>

    ${paymentDetailsBlock(settings)}

    <a href="https://${client.subdomain}.digiinksolutions.com" style="display:inline-block; background:#0B3A63; color:#ffffff; padding:12px 24px; border-radius:6px; text-decoration:none; font-size:14px; font-weight:600;">
      Renew Subscription
    </a>

    ${supportBlock(settings)}
  `;

  return {
    subject: `Solar CRM Plan Expired — ${graceDays} Days Grace Period Active`,
    html: emailLayout(`Grace Period Active`, bodyContent, settings),
  };
}

function accountLockedTemplate(client, settings) {
  const bodyContent = `
    <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
      Dear <strong>${client.owner_name}</strong>,
    </p>
    <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
      Your <strong>${client.plan_name}</strong> subscription has expired and your account for <strong>${client.business_name}</strong> has been locked.
    </p>
    <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
      Your data remains completely safe. To unlock your account, please complete payment:
    </p>

    ${paymentDetailsBlock(settings)}

    <p style="color:#64748B; font-size:13px; line-height:1.5; margin:0 0 20px;">
      Note: Unpaid accounts may be scheduled for data deletion after 17 days.
    </p>

    ${supportBlock(settings)}
  `;

  return {
    subject: `Your Solar CRM Account Has Been Locked`,
    html: emailLayout(`Account Locked`, bodyContent, settings),
  };
}

function deletionWarningTemplate(client, settings) {
  const bodyContent = `
    <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
      Dear <strong>${client.owner_name}</strong>,
    </p>
    <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
      This is a final notice regarding your <strong>${client.business_name}</strong> account. Data for this account is scheduled for permanent deletion on <strong>${new Date(client.delete_date).toLocaleDateString("en-IN")}</strong> due to non-payment.
    </p>
    <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
      To preserve your data and restore access, please complete payment immediately:
    </p>

    ${paymentDetailsBlock(settings)}

    ${supportBlock(settings)}
  `;

  return {
    subject: `URGENT — Solar CRM Account Data Deletion Warning`,
    html: emailLayout(`Final Warning — Data Deletion Pending`, bodyContent, settings),
  };
}

function accountDeletedTemplate(client, settings) {
  const bodyContent = `
    <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
      Dear <strong>${client.owner_name}</strong>,
    </p>
    <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
      Your account for <strong>${client.business_name}</strong> and all associated data has been permanently deleted from our servers due to non-payment.
    </p>
    <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
      If you wish to create a new account or have questions, please reach out to our team.
    </p>

    ${supportBlock(settings)}
  `;

  return {
    subject: `Your Solar CRM Account Has Been Deleted`,
    html: emailLayout(`Account Deleted`, bodyContent, settings),
  };
}

function paymentConfirmedTemplate(client, settings) {
  const loginUrl = `https://${client.subdomain}.digiinksolutions.com`;
  const bodyContent = `
    <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
      Dear <strong>${client.owner_name}</strong>,
    </p>
    <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
      Your payment has been successfully confirmed, and your <strong>${client.plan_name}</strong> subscription for <strong>${client.business_name}</strong> is now active.
    </p>

    <div style="background:#F1F5F9; border-radius:6px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 8px; color:#1E293B; font-size:13px;">
        <strong>Subscription Plan:</strong> ${client.plan_name}
      </p>
      <p style="margin:0; color:#1E293B; font-size:13px;">
        <strong>Login URL:</strong> <a href="${loginUrl}" style="color:#0B3A63; text-decoration:underline;">${loginUrl}</a>
      </p>
    </div>

    <a href="${loginUrl}" style="display:inline-block; background:#0B3A63; color:#ffffff; padding:12px 24px; border-radius:6px; text-decoration:none; font-size:14px; font-weight:600;">
      Login to Dashboard
    </a>

    ${supportBlock(settings)}
  `;

  return {
    subject: `Payment Confirmed — Solar CRM Access Restored`,
    html: emailLayout(`Payment Confirmed`, bodyContent, settings),
  };
}

function paymentRejectedTemplate(client, rejectionNote, settings) {
  const bodyContent = `
    <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
      Dear <strong>${client.owner_name}</strong>,
    </p>
    <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
      We were unable to verify your payment for <strong>${client.business_name}</strong>.
    </p>

    ${rejectionNote ? `
      <div style="background:#F1F5F9; border-radius:6px; padding:16px; margin:20px 0;">
        <p style="margin:0; color:#1E293B; font-size:13px;">
          <strong>Reason:</strong> ${rejectionNote}
        </p>
      </div>
    ` : ""}

    <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
      Please review the payment details below and contact support if you need assistance:
    </p>

    ${paymentDetailsBlock(settings)}

    ${supportBlock(settings)}
  `;

  return {
    subject: `Payment Verification Failed — Action Required`,
    html: emailLayout(`Payment Verification Issue`, bodyContent, settings),
  };
}

// ============================================================
// MAIN SEND FUNCTION
// ============================================================
async function sendSubscriptionEmail(emailType, client, extras = {}) {
  const settings = await getMasterSettings();

  let template;

  switch (emailType) {
    case "Welcome":
      template = welcomeEmailTemplate(client, extras.tempPassword, settings);
      break;
    case "Expiring Soon":
      template = expiringSoonTemplate(client, settings);
      break;
    case "Grace Period Started":
      template = gracePeriodTemplate(client, settings);
      break;
    case "Account Locked":
      template = accountLockedTemplate(client, settings);
      break;
    case "Deletion Warning":
      template = deletionWarningTemplate(client, settings);
      break;
    case "Account Deleted":
      template = accountDeletedTemplate(client, settings);
      break;
    case "Payment Confirmed":
      template = paymentConfirmedTemplate(client, settings);
      break;
    case "Payment Rejected":
      template = paymentRejectedTemplate(client, extras.rejectionNote, settings);
      break;
    default:
      throw new Error(`Unknown email type: ${emailType}`);
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to:   client.email,
    subject: template.subject,
    html: template.html,
  });
}

module.exports = { sendSubscriptionEmail };
