// ============================================================
// SUBSCRIPTION MIDDLEWARE
// JWT verify hone ke BAAD chalta hai
// Client ka subscription status check karta hai
//
// Active      → next() — full access
// Expiring    → next() — banner frontend dikhayega
// Grace       → next() — warning banner, sab kuch kaam karta hai
// Locked      → 403 with locked payload — frontend payment page dikhata hai
// Deleted     → 410 Gone
// ============================================================

const checkSubscription = (req, res, next) => {
  // clientInfo clientDbMiddleware ne set kiya hai
  const client = req.clientInfo;

  // Agar clientInfo nahi hai (Super Admin console request) — skip
  if (!client) return next();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const status = client.status;

  // ── Deleted ─────────────────────────────────────────────
  if (status === "Deleted") {
    return res.status(410).json({
      success: false,
      subscription_status: "Deleted",
      message: "This account has been permanently deleted due to non-payment.",
    });
  }

  // ── Locked ──────────────────────────────────────────────
  if (status === "Locked") {
    return res.status(403).json({
      success: false,
      subscription_status: "Locked",
      message: "Your subscription has expired. Please renew to continue.",
      // Frontend in info se payment page render karega
      action_required: "payment",
    });
  }

  // ── Grace Period ─────────────────────────────────────────
  if (status === "Grace Period") {
    const graceEnd = new Date(client.grace_end_date);
    const daysLeft = Math.ceil((graceEnd - today) / (1000 * 60 * 60 * 24));

    // Request par banner info attach karo
    req.subscriptionWarning = {
      type: "grace",
      message: `Your plan has expired. You have ${daysLeft} day(s) left before your account is locked.`,
      days_left: daysLeft,
    };
    return next();
  }

  // ── Expiring Soon (7 din) ────────────────────────────────
  if (status === "Expiring Soon") {
    const expiry = new Date(client.subscription_end);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    req.subscriptionWarning = {
      type: "expiring",
      message: `Your plan is expiring in ${daysLeft} day(s). Renew now to avoid interruption.`,
      days_left: daysLeft,
    };
    return next();
  }

  // ── Active — full access ──────────────────────────────────
  next();
};

// ============================================================
// Plan Feature Guard
// Specific feature ke liye check karo — plan mein hai ya nahi
// Usage: router.get("/reports", verifyToken, requireFeature("has_reports"), ...)
// ============================================================
const requireFeature = (featureKey) => {
  return (req, res, next) => {
    const plan = req.planFeatures;

    if (!plan) {
      return res.status(403).json({
        success: false,
        message: "Plan information not found.",
      });
    }

    if (!plan[featureKey]) {
      return res.status(403).json({
        success: false,
        feature_blocked: true,
        feature: featureKey,
        message: "This feature is not included in your current plan. Please upgrade to access it.",
      });
    }

    next();
  };
};

// ============================================================
// User Limit Guard
// Naya user create karte waqt check karo limit exceed to nahi
// Usage: router.post("/users", verifyToken, checkUserLimit, createUser)
// ============================================================
const checkUserLimit = async (req, res, next) => {
  try {
    const plan = req.planFeatures;
    const db   = req.db;

    // Enterprise — unlimited (max_users = 0 means unlimited)
    if (!plan || plan.max_users === 0) return next();

    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM users WHERE is_deleted = 0 AND status = 'Active'`
    );
    const currentUsers = rows[0].total;

    if (currentUsers >= plan.max_users) {
      return res.status(403).json({
        success: false,
        limit_exceeded: true,
        message: `Your plan allows a maximum of ${plan.max_users} users. Please upgrade your plan to add more users.`,
        current: currentUsers,
        limit: plan.max_users,
      });
    }

    next();
  } catch (err) {
    console.error("checkUserLimit error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ============================================================
// Monthly Lead Limit Guard
// Naya lead create karte waqt check karo
// ============================================================
const checkLeadLimit = async (req, res, next) => {
  try {
    const plan = req.planFeatures;
    const db   = req.db;

    // Enterprise — unlimited
    if (!plan || plan.max_leads_per_month === 0) return next();

    // Is mahine kitne leads bane
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM leads
       WHERE is_deleted = 0
         AND MONTH(created_at) = MONTH(CURDATE())
         AND YEAR(created_at)  = YEAR(CURDATE())`
    );
    const thisMonthLeads = rows[0].total;

    if (thisMonthLeads >= plan.max_leads_per_month) {
      return res.status(403).json({
        success: false,
        limit_exceeded: true,
        message: `You have reached your monthly lead limit of ${plan.max_leads_per_month}. Upgrade your plan for more leads.`,
        current: thisMonthLeads,
        limit: plan.max_leads_per_month,
      });
    }

    next();
  } catch (err) {
    console.error("checkLeadLimit error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

module.exports = {
  checkSubscription,
  requireFeature,
  checkUserLimit,
  checkLeadLimit,
};
