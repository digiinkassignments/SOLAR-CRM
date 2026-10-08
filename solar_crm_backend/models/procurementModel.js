const dbConfig = require("../config/db");
const defaultDb = dbConfig.db || dbConfig.defaultDb;

// Auto-ensure purchase_orders table exists
let procurementTableEnsured = false;
let ensuringProcurementPromise = null;

const ensureProcurementTables = async (db = defaultDb) => {
  if (procurementTableEnsured) return;
  if (ensuringProcurementPromise) return ensuringProcurementPromise;

  ensuringProcurementPromise = (async () => {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS purchase_orders (
          id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
          po_number VARCHAR(30) NOT NULL UNIQUE,
          project_id INT(11) DEFAULT NULL,
          vendor_name VARCHAR(150) NOT NULL,
          vendor_phone VARCHAR(20) DEFAULT NULL,
          vendor_email VARCHAR(150) DEFAULT NULL,
          items JSON NOT NULL,
          total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
          status ENUM(
            'Draft',
            'Sent',
            'Confirmed',
            'Partial Delivery',
            'Delivered',
            'Cancelled'
          ) NOT NULL DEFAULT 'Draft',
          expected_delivery_date DATE DEFAULT NULL,
          actual_delivery_date DATE DEFAULT NULL,
          notes TEXT DEFAULT NULL,
          is_deleted TINYINT(1) NOT NULL DEFAULT 0,
          created_by INT(11) DEFAULT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY idx_po_project (project_id),
          KEY idx_po_status (status),
          KEY idx_po_is_deleted (is_deleted),
          KEY idx_po_created_by (created_by)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      procurementTableEnsured = true;
    } catch (err) {
      console.error("ensureProcurementTables error:", err.message);
    } finally {
      ensuringProcurementPromise = null;
    }
  })();

  return ensuringProcurementPromise;
};

// Auto-run on module load
ensureProcurementTables().catch(() => {});

const safeParseItems = (items) => {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (typeof items === "object") return items;
  try {
    return JSON.parse(items);
  } catch (e) {
    return [];
  }
};

/**
 * 1. Get All Purchase Orders with dynamic filters, pagination & project info
 */
const getAllPurchaseOrders = async (
  db = defaultDb,
  { project_id, status, search, page = 1, limit = 15 } = {}
) => {
  await ensureProcurementTables(db);

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 15);
  const offset = (pageNum - 1) * limitNum;

  const whereConditions = ["po.is_deleted = 0"];
  const params = [];

  if (project_id && project_id !== "All") {
    whereConditions.push("po.project_id = ?");
    params.push(Number(project_id));
  }

  if (status && status !== "All") {
    if (status === "Pending") {
      whereConditions.push("po.status IN ('Draft', 'Sent', 'Confirmed')");
    } else if (status === "In Transit") {
      whereConditions.push("po.status = 'Partial Delivery'");
    } else {
      whereConditions.push("po.status = ?");
      params.push(status);
    }
  }

  if (search && search.trim() !== "") {
    const term = `%${search.trim()}%`;
    whereConditions.push(
      "(po.po_number LIKE ? OR po.vendor_name LIKE ? OR po.vendor_email LIKE ? OR p.project_number LIKE ? OR p.customer_name LIKE ?)"
    );
    params.push(term, term, term, term, term);
  }

  const whereSql = whereConditions.join(" AND ");

  // Count total matching records
  const countSql = `
    SELECT COUNT(*) AS total 
    FROM purchase_orders po
    LEFT JOIN projects p ON po.project_id = p.id
    WHERE ${whereSql}
  `;
  const [countRows] = await db.query(countSql, params);
  const total = countRows[0]?.total || 0;

  // Fetch paginated purchase orders with JOIN on projects & users
  const selectSql = `
    SELECT 
      po.*,
      p.project_number,
      p.customer_name,
      p.system_capacity_kw,
      COALESCE(u.full_name, u.username) AS created_by_name
    FROM purchase_orders po
    LEFT JOIN projects p ON po.project_id = p.id
    LEFT JOIN users u ON po.created_by = u.id
    WHERE ${whereSql}
    ORDER BY po.id DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await db.query(selectSql, [...params, limitNum, offset]);

  const orders = rows.map((row) => ({
    ...row,
    items: safeParseItems(row.items),
  }));

  return {
    orders,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
};

/**
 * 2. Get Single Purchase Order By ID with full project info
 */
const getPurchaseOrderById = async (db = defaultDb, id) => {
  await ensureProcurementTables(db);

  const sql = `
    SELECT 
      po.*,
      p.project_number,
      p.customer_name,
      p.customer_phone,
      p.customer_address,
      p.city,
      p.state,
      p.system_capacity_kw,
      p.stage AS project_stage,
      COALESCE(u.full_name, u.username) AS created_by_name
    FROM purchase_orders po
    LEFT JOIN projects p ON po.project_id = p.id
    LEFT JOIN users u ON po.created_by = u.id
    WHERE po.id = ? AND po.is_deleted = 0
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [id]);
  if (!rows || rows.length === 0) return null;

  const order = rows[0];
  order.items = safeParseItems(order.items);

  return order;
};

/**
 * 3. Create Purchase Order & return insertId
 */
const createPurchaseOrder = async (db = defaultDb, data, created_by = null) => {
  await ensureProcurementTables(db);

  const poNumber =
    data.po_number ||
    "PO-" + Date.now().toString().slice(-8);

  const itemsString =
    typeof data.items === "string"
      ? data.items
      : JSON.stringify(data.items || []);

  // Calculate total amount if not explicitly provided
  let totalAmount = 0.0;
  if (data.total_amount !== undefined && data.total_amount !== null) {
    totalAmount = parseFloat(data.total_amount) || 0.0;
  } else if (Array.isArray(data.items)) {
    totalAmount = data.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity || item.qty) || 0;
      const rate = parseFloat(item.unit_price || item.rate || item.price) || 0;
      return sum + qty * rate;
    }, 0);
  }

  const initialStatus = data.status || "Draft";

  const sql = `
    INSERT INTO purchase_orders (
      po_number,
      project_id,
      vendor_name,
      vendor_phone,
      vendor_email,
      items,
      total_amount,
      status,
      expected_delivery_date,
      actual_delivery_date,
      notes,
      created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    poNumber,
    data.project_id ? Number(data.project_id) : null,
    data.vendor_name,
    data.vendor_phone || null,
    data.vendor_email || null,
    itemsString,
    totalAmount,
    initialStatus,
    data.expected_delivery_date || null,
    data.actual_delivery_date || null,
    data.notes || null,
    created_by || null,
  ];

  const [result] = await db.query(sql, values);
  return result.insertId;
};

/**
 * 4. Dynamic Update Purchase Order (whitelisted fields)
 */
const updatePurchaseOrder = async (db = defaultDb, id, data) => {
  await ensureProcurementTables(db);

  const allowedFields = [
    "project_id",
    "vendor_name",
    "vendor_phone",
    "vendor_email",
    "items",
    "total_amount",
    "status",
    "expected_delivery_date",
    "actual_delivery_date",
    "notes",
  ];

  const updates = [];
  const values = [];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      if (field === "items") {
        const itemsVal =
          typeof data.items === "string"
            ? data.items
            : JSON.stringify(data.items || []);
        updates.push("items = ?");
        values.push(itemsVal);
      } else if (field === "total_amount") {
        updates.push("total_amount = ?");
        values.push(parseFloat(data[field]) || 0.0);
      } else if (field === "project_id") {
        updates.push("project_id = ?");
        values.push(data[field] ? Number(data[field]) : null);
      } else {
        updates.push(`${field} = ?`);
        values.push(data[field] === "" ? null : data[field]);
      }
    }
  }

  if (updates.length === 0) {
    return false;
  }

  values.push(id);
  const sql = `UPDATE purchase_orders SET ${updates.join(", ")} WHERE id = ? AND is_deleted = 0`;
  const [result] = await db.query(sql, values);
  return result.affectedRows > 0;
};

/**
 * 5. Update PO Status & optional actual_delivery_date
 */
const updatePOStatus = async (
  db = defaultDb,
  id,
  status,
  actual_delivery_date = null
) => {
  await ensureProcurementTables(db);

  let sql = "";
  let values = [];

  if (actual_delivery_date) {
    sql = `UPDATE purchase_orders SET status = ?, actual_delivery_date = ? WHERE id = ? AND is_deleted = 0`;
    values = [status, actual_delivery_date, id];
  } else if (status === "Delivered") {
    sql = `UPDATE purchase_orders SET status = ?, actual_delivery_date = COALESCE(actual_delivery_date, CURDATE()) WHERE id = ? AND is_deleted = 0`;
    values = [status, id];
  } else {
    sql = `UPDATE purchase_orders SET status = ? WHERE id = ? AND is_deleted = 0`;
    values = [status, id];
  }

  const [result] = await db.query(sql, values);
  return result.affectedRows > 0;
};

/**
 * 6. Soft Delete Purchase Order
 */
const softDeletePO = async (db = defaultDb, id) => {
  await ensureProcurementTables(db);
  const [result] = await db.query(
    `UPDATE purchase_orders SET is_deleted = 1 WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
};

/**
 * 7. Get Procurement Status Statistics
 */
const getProcurementStats = async (db = defaultDb) => {
  await ensureProcurementTables(db);
  const [rows] = await db.query(
    `SELECT status, COUNT(*) AS count 
     FROM purchase_orders 
     WHERE is_deleted = 0 
     GROUP BY status`
  );
  return rows;
};

module.exports = {
  ensureProcurementTables,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  updatePOStatus,
  softDeletePO,
  getProcurementStats,
};
