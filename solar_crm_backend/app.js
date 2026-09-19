const express = require("express");
const cors    = require("cors");
const path    = require("path");

const app = express();

// ── Middlewares ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static Uploads ───────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Dynamic Client DB Middleware ─────────────────────────────
const { clientDbMiddleware } = require("./config/clientDb");
app.use(clientDbMiddleware);

// ── Fallback — req.db na ho to default db use karo ──────────
const { db: defaultDb } = require("./config/db");
app.use((req, res, next) => {
  if (!req.db) req.db = defaultDb;
  next();
});

// ── Route Imports (existing) ─────────────────────────────────
const authRoutes         = require("./routes/authRoutes");
const userRoutes         = require("./routes/userRoutes");
const profileRoutes      = require("./routes/profileRoutes");
const settingsRoutes     = require("./routes/settingsRoutes");
const leadRoutes         = require("./routes/leadRoutes");
const dashboardRoutes    = require("./routes/dashboardRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// ── NEW: Route Imports ───────────────────────────────────────
const superAdminRoutes   = require("./routes/superAdminRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");

// ── Existing API Routes ──────────────────────────────────────
app.use("/api/auth",          authRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/profile",       profileRoutes);
app.use("/api/settings",      settingsRoutes);
app.use("/api/leads",         leadRoutes);
app.use("/api/dashboard",     dashboardRoutes);
app.use("/api/custom-fields",  require("./routes/customFieldRoutes"));
app.use("/api/notifications", notificationRoutes);

// ── NEW: API Routes ──────────────────────────────────────────
app.use("/api/superadmin",    superAdminRoutes);
app.use("/api/subscription",  subscriptionRoutes);

// ── Base Route ───────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ success: true, message: "Solar CRM API Running" });
});

module.exports = app;