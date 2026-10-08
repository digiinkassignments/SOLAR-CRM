const express = require("express");
const cors = require("cors");
const path = require("path");

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
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const profileRoutes = require("./routes/profileRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const leadRoutes = require("./routes/leadRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// ── NEW: Route Imports ───────────────────────────────────────
const superAdminRoutes = require("./routes/superAdminRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const calculatorRoutes = require("./routes/calculatorRoutes");
const quotationRoutes = require("./routes/quotationRoutes");
const surveyRoutes = require("./routes/surveyRoutes");
const dealRoutes = require("./routes/dealRoutes");
const subsidyRoutes = require("./routes/subsidyRoutes");
const stockRoutes = require("./routes/stockRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const projectRoutes = require("./routes/projectRoutes");
const procurementRoutes = require("./routes/procurementRoutes");

// ── Existing API Routes ──────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/custom-fields", require("./routes/customFieldRoutes"));
app.use("/api/notifications", notificationRoutes);

// ── NEW: API Routes ──────────────────────────────────────────
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/calculator", calculatorRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/surveys", surveyRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/subsidy", subsidyRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/procurement", procurementRoutes);

// ── Base Route ───────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ success: true, message: "Solar CRM API Running" });
});

// ── Global Error Handler (File size limits & Multer) ───────────
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File size too large! Maximum allowed upload size is 5MB.",
    });
  }
  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }
  if (err.message && err.message.includes("Only JPG, JPEG, PNG and WEBP")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error.",
  });
});

module.exports = app;