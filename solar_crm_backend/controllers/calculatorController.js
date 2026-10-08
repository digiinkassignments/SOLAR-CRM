const { calculateSolarSystem } = require("../services/solarCalculatorService");
const { db: defaultDb } = require("../config/db");

// Helper: Input Payload Validation
const validateCalculatorInput = (body = {}) => {
  const errors = [];
  const calcMode = body.calc_mode || "bill";

  if (!["bill", "units", "roof"].includes(calcMode)) {
    errors.push("Invalid calc_mode. Must be one of 'bill', 'units', or 'roof'.");
  }

  if (calcMode === "bill" && body.monthly_bill !== undefined && Number(body.monthly_bill) < 0) {
    errors.push("monthly_bill cannot be negative.");
  }

  if (calcMode === "units" && body.monthly_units !== undefined && Number(body.monthly_units) < 0) {
    errors.push("monthly_units cannot be negative.");
  }

  if (calcMode === "roof" && body.roof_area_sqft !== undefined && Number(body.roof_area_sqft) < 0) {
    errors.push("roof_area_sqft cannot be negative.");
  }

  if (body.roof_usable_percent !== undefined) {
    const usable = Number(body.roof_usable_percent);
    if (isNaN(usable) || usable < 0 || usable > 100) {
      errors.push("roof_usable_percent must be a number between 0 and 100.");
    }
  }

  return errors;
};

// ============================================================
// 1. RUN SOLAR CALCULATION (Instant algorithm execution)
// POST /api/calculator/calculate
// ============================================================
const runCalculation = async (req, res) => {
  try {
    const validationErrors = validateCalculatorInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid solar calculator request payload",
        errors: validationErrors,
      });
    }

    const result = calculateSolarSystem(req.body);
    return res.json({
      success: true,
      message: "Calculation generated successfully",
      data: result,
    });
  } catch (err) {
    console.error("runCalculation error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to perform solar calculation",
      error: err.message,
    });
  }
};

// Helper: Ensure solar_calculations table exists
const ensureCalculatorTable = async (db = defaultDb) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS solar_calculations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lead_id INT DEFAULT NULL,
      monthly_bill DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      monthly_units DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      property_type VARCHAR(50) NOT NULL DEFAULT 'Residential',
      connection_phase VARCHAR(50) NOT NULL DEFAULT 'Single Phase',
      roof_area_sqft DECIMAL(10,2) DEFAULT NULL,
      tariff_rate DECIMAL(6,2) NOT NULL DEFAULT 8.00,
      recommended_kw DECIMAL(6,2) NOT NULL DEFAULT 1.00,
      panel_count INT NOT NULL DEFAULT 1,
      panel_wattage INT NOT NULL DEFAULT 550,
      inverter_kw DECIMAL(6,2) NOT NULL DEFAULT 1.00,
      required_area_sqft DECIMAL(10,2) NOT NULL DEFAULT 100.00,
      gross_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      subsidy_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      net_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      annual_generation_kwh DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      annual_savings DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      payback_years DECIMAL(4,2) NOT NULL DEFAULT 0.00,
      twenty_five_year_savings DECIMAL(14,2) NOT NULL DEFAULT 0.00,
      co2_offset_tonnes DECIMAL(8,2) NOT NULL DEFAULT 0.00,
      calculator_version VARCHAR(20) DEFAULT '2.0.0',
      tariff_version VARCHAR(20) DEFAULT '1.0.0',
      subsidy_version VARCHAR(20) DEFAULT '2.0.0',
      generation_version VARCHAR(20) DEFAULT '1.0.0',
      pricing_version VARCHAR(20) DEFAULT '1.0.0',
      input_snapshot JSON DEFAULT NULL,
      result_snapshot JSON DEFAULT NULL,
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_calc_lead (lead_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  try {
    await db.query(sql);

    const [cols] = await db.query(`SHOW COLUMNS FROM solar_calculations`);
    const colNames = cols.map((c) => c.Field);

    const neededCols = [
      { name: "input_snapshot", def: "ADD COLUMN input_snapshot JSON DEFAULT NULL" },
      { name: "result_snapshot", def: "ADD COLUMN result_snapshot JSON DEFAULT NULL" },
      { name: "calculator_version", def: "ADD COLUMN calculator_version VARCHAR(20) DEFAULT '2.0.0'" },
      { name: "tariff_version", def: "ADD COLUMN tariff_version VARCHAR(20) DEFAULT '1.0.0'" },
      { name: "subsidy_version", def: "ADD COLUMN subsidy_version VARCHAR(20) DEFAULT '2.0.0'" },
      { name: "generation_version", def: "ADD COLUMN generation_version VARCHAR(20) DEFAULT '1.0.0'" },
      { name: "pricing_version", def: "ADD COLUMN pricing_version VARCHAR(20) DEFAULT '1.0.0'" },
    ];

    for (const item of neededCols) {
      if (!colNames.includes(item.name)) {
        await db.query(`ALTER TABLE solar_calculations ${item.def}`).catch(() => {});
      }
    }
  } catch (err) {
    console.error("ensureCalculatorTable error:", err.message);
  }
};

// ============================================================
// 2. SAVE CALCULATION TO DATABASE WITH AUDIT SNAPSHOTS
// POST /api/calculator/save
// ============================================================
const saveCalculation = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    await ensureCalculatorTable(db);
    const userId = req.user?.id || null;
    const { lead_id, roof_area_sqft } = req.body;

    const validationErrors = validateCalculatorInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid solar calculator payload for saving",
        errors: validationErrors,
      });
    }

    // Run engine logic
    const calc = calculateSolarSystem(req.body);

    const sql = `
      INSERT INTO solar_calculations (
        lead_id, monthly_bill, monthly_units, property_type, connection_phase,
        roof_area_sqft, tariff_rate, recommended_kw, panel_count, panel_wattage,
        inverter_kw, required_area_sqft, gross_cost, subsidy_amount, net_cost,
        annual_generation_kwh, annual_savings, payback_years, twenty_five_year_savings,
        co2_offset_tonnes, calculator_version, tariff_version, subsidy_version,
        generation_version, pricing_version, input_snapshot, result_snapshot, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      lead_id || null,
      calc.monthly_bill || 0,
      calc.monthly_units || 0,
      calc.property_type || "Residential",
      calc.connection_phase || "Single Phase",
      roof_area_sqft || calc.roof_area_sqft || null,
      calc.tariff_rate || 8.0,
      calc.recommended_kw || 1.0,
      calc.panel_count || 1,
      calc.panel_wattage || 550,
      calc.inverter_kw || 1.0,
      calc.required_area_sqft || 70,
      calc.gross_cost || 0,
      calc.subsidy_amount || 0,
      calc.net_cost || 0,
      calc.annual_generation_kwh || 0,
      calc.annual_savings || 0,
      calc.payback_years || 0,
      calc.twenty_five_year_savings || calc.thirty_year_savings || 0,
      calc.co2_offset_tonnes || 0,
      "2.0.0", // calculator_version
      "1.0.0", // tariff_version
      "2.0.0", // subsidy_version
      "1.0.0", // generation_version
      "1.0.0", // pricing_version
      JSON.stringify(req.body),
      JSON.stringify(calc.structured || calc),
      userId,
    ];

    const [result] = await db.query(sql, values);

    return res.status(201).json({
      success: true,
      message: "Solar calculation saved successfully with audit snapshot",
      data: {
        id: result.insertId,
        ...calc,
        lead_id: lead_id || null,
        roof_area_sqft: roof_area_sqft || null,
      },
    });
  } catch (err) {
    console.error("saveCalculation error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to save calculation",
      error: err.message,
    });
  }
};

// ============================================================
// 3. GET SAVED CALCULATIONS
// GET /api/calculator
// ============================================================
const getCalculations = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    await ensureCalculatorTable(db);

    let rows = [];
    try {
      const [data] = await db.query(`
        SELECT sc.*, l.customer_name, l.phone, l.city
        FROM solar_calculations sc
        LEFT JOIN leads l ON sc.lead_id = l.id
        ORDER BY sc.created_at DESC
        LIMIT 100
      `);
      rows = data;
    } catch (joinErr) {
      console.warn("getCalculations join fallback:", joinErr.message);
      const [plain] = await db.query(`
        SELECT * FROM solar_calculations ORDER BY created_at DESC LIMIT 100
      `);
      rows = plain;
    }

    return res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("getCalculations error:", err);
    return res.json({
      success: true,
      data: [],
    });
  }
};

// ============================================================
// 4. GET SINGLE CALCULATION BY ID
// GET /api/calculator/:id
// ============================================================
const getCalculationById = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    await ensureCalculatorTable(db);
    const { id } = req.params;
    const [rows] = await db.query(
      `
      SELECT sc.*, l.customer_name, l.phone, l.email, l.address, l.city, l.state
      FROM solar_calculations sc
      LEFT JOIN leads l ON sc.lead_id = l.id
      WHERE sc.id = ?
    `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Solar calculation not found",
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (err) {
    console.error("getCalculationById error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch calculation details",
      error: err.message,
    });
  }
};

// ============================================================
// 5. MASTER DATA QUERY ENDPOINTS (For Admin & Dynamic Frontends)
// ============================================================
const getMasterTariffs = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const [rows] = await db.query("SELECT * FROM tariff_master WHERE is_active = 1 ORDER BY state, discom");
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const getMasterPanels = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const [rows] = await db.query("SELECT * FROM solar_panels WHERE is_active = 1 ORDER BY wattage DESC");
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const getMasterInverters = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const [rows] = await db.query("SELECT * FROM solar_inverters WHERE is_active = 1 ORDER BY rated_ac_kw ASC");
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  runCalculation,
  saveCalculation,
  getCalculations,
  getCalculationById,
  getMasterTariffs,
  getMasterPanels,
  getMasterInverters,
};
