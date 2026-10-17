const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { db: defaultDb } = require("../config/db");

// 1. Projects Execution Summary & Funnel
router.get("/projects", verifyToken, async (req, res) => {
  try {
    const db = req.db || defaultDb;

    // Get all projects with user name and customer info
    const [projects] = await db.query(`
      SELECT 
        p.id,
        p.project_number,
        p.customer_name,
        p.system_capacity_kw,
        p.stage,
        p.installation_start_date,
        p.created_at,
        p.updated_at,
        p.completion_date,
        u.full_name AS assigned_to_name
      FROM projects p
      LEFT JOIN users u ON p.assigned_to = u.id
      WHERE p.is_deleted = 0
      ORDER BY p.id DESC
    `);

    // Funnel stage distribution counts
    const funnelStages = [
      "Site Survey",
      "Pre-Install Inspection",
      "Installation in Progress",
      "Testing & Commissioning",
      "Final Inspection",
      "Customer Handover",
      "Subsidy Applied",
      "Handover Done",
      "Warranty Period"
    ];

    const funnelCounts = {};
    funnelStages.forEach((stg) => { funnelCounts[stg] = 0; });

    let inProgressCount = 0;
    let completedCount = 0;
    let stalledCount = 0;

    const now = new Date();

    projects.forEach((p) => {
      if (funnelCounts[p.stage] !== undefined) {
        funnelCounts[p.stage]++;
      }

      if (p.stage === "Handover Done" || p.stage === "Warranty Period") {
        completedCount++;
      } else {
        inProgressCount++;
        // If not updated for > 30 days while in progress, consider stalled
        const lastUpdated = new Date(p.updated_at || p.created_at);
        const diffDays = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));
        if (diffDays > 30) {
          stalledCount++;
        }
      }
    });

    return res.json({
      success: true,
      data: {
        total: projects.length,
        inProgress: inProgressCount,
        completed: completedCount,
        stalled: stalledCount,
        funnelCounts,
        projects,
      },
    });
  } catch (error) {
    console.error("Report projects error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Financial & Invoicing Summary
router.get("/financials", verifyToken, async (req, res) => {
  try {
    const db = req.db || defaultDb;

    const [invoices] = await db.query(`
      SELECT 
        id,
        invoice_number,
        customer_name,
        total_amount,
        paid_amount,
        balance_amount,
        payment_status,
        due_date,
        created_at
      FROM invoices
      WHERE is_deleted = 0
      ORDER BY id DESC
    `);

    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;

    const statusCounts = {
      Paid: 0,
      "Partially Paid": 0,
      Unpaid: 0,
    };

    const monthlyRevenue = {};
    const now = new Date();

    // Prepare last 6 months keys (e.g., "Nov 2025", "Dec 2025"...)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("en-IN", { month: "short", year: "numeric" });
      monthlyRevenue[key] = 0;
    }

    invoices.forEach((inv) => {
      const total = Number(inv.total_amount) || 0;
      const paid = Number(inv.paid_amount) || 0;
      const bal = Number(inv.balance_amount) || (total - paid);

      totalInvoiced += total;
      totalCollected += paid;
      totalOutstanding += bal;

      const dueDate = inv.due_date ? new Date(inv.due_date) : null;
      if (dueDate && dueDate < now && bal > 0) {
        totalOverdue += bal;
      }

      const st = inv.payment_status || (bal <= 0 ? "Paid" : paid > 0 ? "Partially Paid" : "Unpaid");
      if (st === "Paid") statusCounts.Paid++;
      else if (st === "Partially Paid") statusCounts["Partially Paid"]++;
      else statusCounts.Unpaid++;

      if (inv.created_at) {
        const d = new Date(inv.created_at);
        const monthKey = d.toLocaleString("en-IN", { month: "short", year: "numeric" });
        if (monthlyRevenue[monthKey] !== undefined) {
          monthlyRevenue[monthKey] += paid;
        }
      }
    });

    return res.json({
      success: true,
      data: {
        totalInvoiced,
        totalCollected,
        totalOutstanding,
        totalOverdue,
        statusCounts,
        monthlyRevenue: Object.entries(monthlyRevenue).map(([month, amount]) => ({
          month,
          amount,
        })),
        invoices,
      },
    });
  } catch (error) {
    console.error("Report financials error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Field Operations Reports (Inspections, Installations, Commissioning, Handovers)
router.get("/field-operations", verifyToken, async (req, res) => {
  try {
    const db = req.db || defaultDb;

    // Check project operations with left joins to modules if tables exist
    const [projects] = await db.query(`
      SELECT 
        p.id,
        p.project_number,
        p.customer_name,
        p.stage,
        p.created_at,
        u.full_name AS assigned_to_name
      FROM projects p
      LEFT JOIN users u ON p.assigned_to = u.id
      WHERE p.is_deleted = 0
      ORDER BY p.id DESC
    `);

    // Safely query module tables
    let inspectionsMap = {};
    let logsMap = {};
    let commissioningMap = {};
    let finalInspectionMap = {};
    let handoverMap = {};

    try {
      const [rows] = await db.query(`SELECT project_id, status FROM project_inspections WHERE is_deleted = 0`);
      rows.forEach(r => { inspectionsMap[r.project_id] = r.status; });
    } catch (e) {}

    try {
      const [rows] = await db.query(`
        SELECT project_id, phase, progress_percent 
        FROM installation_logs 
        WHERE is_deleted = 0 
        ORDER BY id DESC
      `);
      rows.forEach(r => {
        if (!logsMap[r.project_id]) logsMap[r.project_id] = r;
      });
    } catch (e) {}

    try {
      const [rows] = await db.query(`
        SELECT project_id, overall_status 
        FROM project_commissioning 
        WHERE is_deleted = 0
      `);
      rows.forEach(r => { commissioningMap[r.project_id] = r.overall_status || "Pass"; });
    } catch (e) {}

    try {
      const [rows] = await db.query(`
        SELECT project_id, punch_list_cleared, customer_satisfaction 
        FROM project_final_inspections 
        WHERE is_deleted = 0
      `);
      rows.forEach(r => { finalInspectionMap[r.project_id] = r.punch_list_cleared ? "Cleared" : "In Review"; });
    } catch (e) {}

    try {
      const [rows] = await db.query(`
        SELECT project_id, is_signed 
        FROM project_customer_handovers 
        WHERE is_deleted = 0
      `);
      rows.forEach(r => { handoverMap[r.project_id] = r.is_signed ? "Signed" : "Draft"; });
    } catch (e) {}

    let inspectionsDone = 0;
    let installationsActive = 0;
    let commissioningPending = 0;
    let handoversComplete = 0;

    const phaseCounts = {
      "Mounting Structure": 0,
      "Panel Installation": 0,
      "Electrical & Wiring": 0,
      "Inverter Installation": 0,
      "Final Testing & Safety": 0,
    };

    const rows = projects.map(p => {
      const inspStatus = inspectionsMap[p.id] || (p.stage === "Pre-Install Inspection" ? "In Progress" : p.stage !== "Order Closed" && p.stage !== "Site Survey" ? "Completed" : "Pending");
      if (inspStatus === "Completed" || inspStatus === "Approved") inspectionsDone++;

      const log = logsMap[p.id];
      let currentPhase = log?.phase || (p.stage === "Installation in Progress" ? "Mounting Structure" : null);
      let installPercent = log ? Number(log.progress_percent) || 0 : p.stage === "Installation in Progress" ? 45 : (p.stage === "Testing & Commissioning" || p.stage === "Final Inspection" || p.stage === "Customer Handover" || p.stage === "Handover Done" || p.stage === "Warranty Period") ? 100 : 0;

      if (p.stage === "Installation in Progress") {
        installationsActive++;
        if (currentPhase && phaseCounts[currentPhase] !== undefined) {
          phaseCounts[currentPhase]++;
        } else {
          phaseCounts["Mounting Structure"]++;
        }
      }

      const commResult = commissioningMap[p.id] || (p.stage === "Testing & Commissioning" ? "Pending Test" : (p.stage === "Final Inspection" || p.stage === "Customer Handover" || p.stage === "Handover Done" || p.stage === "Warranty Period") ? "Pass" : "Not Started");
      if (commResult === "Pending Test" || (p.stage === "Testing & Commissioning" && commResult !== "Pass")) {
        commissioningPending++;
      }

      const finalInsp = finalInspectionMap[p.id] || (p.stage === "Final Inspection" ? "In Review" : (p.stage === "Customer Handover" || p.stage === "Handover Done" || p.stage === "Warranty Period") ? "Cleared" : "Pending");

      const hoStatus = handoverMap[p.id] || (p.stage === "Handover Done" || p.stage === "Warranty Period" ? "Signed" : p.stage === "Customer Handover" ? "In Progress" : "Pending");
      if (hoStatus === "Signed" || p.stage === "Handover Done" || p.stage === "Warranty Period") {
        handoversComplete++;
      }

      return {
        id: p.id,
        project_number: p.project_number,
        customer_name: p.customer_name,
        inspection_status: inspStatus,
        installation_percent: installPercent,
        current_phase: currentPhase || "—",
        commissioning_result: commResult,
        final_inspection: finalInsp,
        handover_status: hoStatus,
        created_at: p.created_at,
      };
    });

    return res.json({
      success: true,
      data: {
        inspectionsDone,
        installationsActive,
        commissioningPending,
        handoversComplete,
        phaseCounts,
        operations: rows,
      },
    });
  } catch (error) {
    console.error("Report field operations error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 4. AMC & Warranty Reports
router.get("/warranty-amc", verifyToken, async (req, res) => {
  try {
    const db = req.db || defaultDb;

    const [projects] = await db.query(`
      SELECT 
        p.id,
        p.project_number,
        p.customer_name,
        p.system_capacity_kw,
        p.created_at
      FROM projects p
      WHERE p.is_deleted = 0
      ORDER BY p.id DESC
    `);

    let warrantyMap = {};
    let visitsMap = {};

    try {
      const [wRows] = await db.query(`SELECT * FROM project_warranty_amc WHERE is_deleted = 0`);
      wRows.forEach(w => { warrantyMap[w.project_id] = w; });
    } catch (e) {}

    try {
      const [vRows] = await db.query(`
        SELECT project_id, visit_date, status 
        FROM project_service_visits 
        WHERE is_deleted = 0 
        ORDER BY visit_date DESC
      `);
      vRows.forEach(v => {
        if (!visitsMap[v.project_id]) visitsMap[v.project_id] = [];
        visitsMap[v.project_id].push(v);
      });
    } catch (e) {}

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let activeContracts = 0;
    let expiringThisMonth = 0;
    let serviceVisitsThisMonth = 0;
    let pendingVisits = 0;

    const planCounts = {
      Basic: 0,
      Standard: 0,
      Premium: 0,
    };

    const rows = projects.map(p => {
      const w = warrantyMap[p.id];
      const visits = visitsMap[p.id] || [];

      const plan = w?.amc_plan || "Standard";
      const expiry = w?.amc_end_date ? new Date(w.amc_end_date) : null;
      const isExpired = expiry && expiry < now;
      const status = !w ? "Not Configured" : isExpired ? "Expired" : "Active";

      if (status === "Active") {
        activeContracts++;
        if (planCounts[plan] !== undefined) planCounts[plan]++;
      }

      if (expiry && expiry.getMonth() === currentMonth && expiry.getFullYear() === currentYear) {
        expiringThisMonth++;
      }

      const lastVisit = visits[0]?.visit_date || null;
      let nextDueVisit = null;
      if (lastVisit) {
        const lvDate = new Date(lastVisit);
        // Default quarterly visit if not specified
        nextDueVisit = new Date(lvDate.setMonth(lvDate.getMonth() + 3));
      } else if (w?.amc_start_date) {
        const stDate = new Date(w.amc_start_date);
        nextDueVisit = new Date(stDate.setMonth(stDate.getMonth() + 3));
      }

      visits.forEach(v => {
        const vd = new Date(v.visit_date);
        if (vd.getMonth() === currentMonth && vd.getFullYear() === currentYear) {
          serviceVisitsThisMonth++;
        }
        if (v.status === "Pending") {
          pendingVisits++;
        }
      });

      return {
        id: p.id,
        project_number: p.project_number,
        customer_name: p.customer_name,
        system_capacity_kw: p.system_capacity_kw,
        amc_plan: w ? plan : "—",
        amc_amount: w?.amc_amount || 0,
        expiry_date: w?.amc_end_date || null,
        last_visit: lastVisit,
        next_due_visit: nextDueVisit,
        status,
        created_at: p.created_at,
      };
    });

    return res.json({
      success: true,
      data: {
        activeContracts,
        expiringThisMonth,
        serviceVisitsThisMonth,
        pendingVisits,
        planCounts,
        amcList: rows,
      },
    });
  } catch (error) {
    console.error("Report warranty amc error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
