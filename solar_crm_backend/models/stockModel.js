let stockTablesEnsured = false;
let ensuringStockPromise = null;

// Auto-ensure stock tables exist
const ensureStockTables = async (db = defaultDb) => {
  if (stockTablesEnsured) return;
  if (ensuringStockPromise) return ensuringStockPromise;

  ensuringStockPromise = (async () => {
    try {
    // 1. stock_categories
    await db.query(`
      CREATE TABLE IF NOT EXISTS stock_categories (
        id INT(11) NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL,
        description TEXT DEFAULT NULL,
        icon VARCHAR(50) DEFAULT NULL,
        sort_order INT(11) DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_category_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Insert Default Categories
    await db.query(`
      INSERT IGNORE INTO stock_categories (name, slug, description, icon, sort_order) VALUES
      ('Solar Panels', 'solar-panels', 'Mono PERC, Bifacial, Poly panels', 'solar_power', 1),
      ('Inverters', 'inverters', 'On-Grid, Off-Grid, Hybrid inverters', 'electric_meter', 2),
      ('Mounting Structure', 'mounting-structure', 'GI, Aluminium mounting structures', 'architecture', 3),
      ('DC Cables & Connectors', 'dc-cables', 'DC cables, MC4 connectors, junction boxes', 'cable', 4),
      ('AC Cables & Switchgear', 'ac-cables', 'AC cables, MCB, ACDB, DCDB panels', 'power', 5),
      ('Earthing & Lightning', 'earthing', 'Earthing kits, lightning arrestors', 'bolt', 6),
      ('Battery & Storage', 'battery', 'Lithium, Lead-acid batteries', 'battery_charging_full', 7),
      ('Tools & Consumables', 'tools', 'Installation tools, lugs, conduit pipes', 'build', 8),
      ('Monitoring & Others', 'monitoring', 'Data loggers, wi-fi dongles, others', 'monitoring', 9);
    `);

    // 2. stock_items
    await db.query(`
      CREATE TABLE IF NOT EXISTS stock_items (
        id INT(11) NOT NULL AUTO_INCREMENT,
        category_id INT(11) NOT NULL,
        item_code VARCHAR(50) NOT NULL,
        barcode VARCHAR(100) DEFAULT NULL,
        name VARCHAR(200) NOT NULL,
        brand VARCHAR(100) DEFAULT NULL,
        model VARCHAR(100) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        specifications JSON DEFAULT NULL,
        image_url VARCHAR(500) DEFAULT NULL,
        unit ENUM('Piece','Set','Meter','Kg','Litre','Roll','Pair','Box') NOT NULL DEFAULT 'Piece',
        unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        gst_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
        hsn_code VARCHAR(20) DEFAULT NULL,
        min_stock_level INT(11) NOT NULL DEFAULT 5,
        reorder_level INT(11) NOT NULL DEFAULT 10,
        current_stock INT(11) NOT NULL DEFAULT 0,
        reserved_stock INT(11) NOT NULL DEFAULT 0,
        available_stock INT(11) GENERATED ALWAYS AS (current_stock - reserved_stock) STORED,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_by INT(11) DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_item_code (item_code),
        KEY idx_item_barcode (barcode),
        KEY idx_item_category (category_id),
        KEY idx_item_brand (brand),
        KEY idx_item_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure barcode column exists for existing tables
    try {
      const [colRows] = await db.query("SHOW COLUMNS FROM stock_items LIKE 'barcode'");
      if (colRows.length === 0) {
        await db.query("ALTER TABLE stock_items ADD COLUMN barcode VARCHAR(100) DEFAULT NULL AFTER item_code");
        await db.query("ALTER TABLE stock_items ADD KEY idx_item_barcode (barcode)");
      }
    } catch (colErr) {
      // Ignore if table doesn't exist yet
    }

    // 3. stock_transactions
    await db.query(`
      CREATE TABLE IF NOT EXISTS stock_transactions (
        id INT(11) NOT NULL AUTO_INCREMENT,
        transaction_number VARCHAR(50) NOT NULL,
        item_id INT(11) NOT NULL,
        transaction_type ENUM('IN','OUT','ADJUSTMENT','RESERVED','RELEASED') NOT NULL,
        quantity INT(11) NOT NULL,
        quantity_before INT(11) NOT NULL DEFAULT 0,
        quantity_after INT(11) NOT NULL DEFAULT 0,
        unit_price DECIMAL(12,2) DEFAULT NULL,
        total_value DECIMAL(14,2) DEFAULT NULL,
        reference_type ENUM('PURCHASE','LEAD','PROJECT','ADJUSTMENT','RETURN','DAMAGE') DEFAULT NULL,
        reference_id INT(11) DEFAULT NULL,
        reference_number VARCHAR(100) DEFAULT NULL,
        vendor_name VARCHAR(200) DEFAULT NULL,
        vendor_invoice VARCHAR(100) DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        created_by INT(11) DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_transaction_number (transaction_number),
        KEY idx_txn_item (item_id),
        KEY idx_txn_type (transaction_type),
        KEY idx_txn_ref (reference_type, reference_id),
        KEY idx_txn_created_by (created_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. stock_alerts
    await db.query(`
      CREATE TABLE IF NOT EXISTS stock_alerts (
        id INT(11) NOT NULL AUTO_INCREMENT,
        item_id INT(11) NOT NULL,
        alert_type ENUM('LOW_STOCK','OUT_OF_STOCK','REORDER') NOT NULL,
        current_stock INT(11) NOT NULL,
        min_stock_level INT(11) NOT NULL,
        is_resolved TINYINT(1) NOT NULL DEFAULT 0,
        resolved_at DATETIME DEFAULT NULL,
        resolved_by INT(11) DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_alert_item (item_id),
        KEY idx_alert_type (alert_type),
        KEY idx_alert_resolved (is_resolved)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    stockTablesEnsured = true;
  } catch (err) {
    console.error("ensureStockTables error:", err.message);
  } finally {
    ensuringStockPromise = null;
  }
  })();

  return ensuringStockPromise;
};

ensureStockTables().catch(() => {});

// Generate unique Item Code: STK-[CAT]-1001
const generateItemCode = async (db, categoryId) => {
  let prefix = "STK";
  if (categoryId) {
    const [catRows] = await db.query("SELECT slug FROM stock_categories WHERE id = ?", [categoryId]);
    if (catRows.length > 0) {
      const parts = catRows[0].slug.split("-");
      prefix = ("STK-" + parts.map(p => p.substring(0, 3).toUpperCase()).join("")).substring(0, 10);
    }
  }
  const [rows] = await db.query("SELECT COUNT(*) AS total FROM stock_items");
  const nextNum = (rows[0]?.total || 0) + 1001;
  let code = `${prefix}-${nextNum}`;
  
  // Check uniqueness
  const [existing] = await db.query("SELECT id FROM stock_items WHERE item_code = ?", [code]);
  if (existing.length > 0) {
    code = `${prefix}-${Date.now().toString().slice(-6)}`;
  }
  return code;
};

// Generate unique Transaction Number: TXN-YYYYMMDD-XXXX
const generateTransactionNumber = async (db) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `TXN-${dateStr}-${randomSuffix}`;
};

// Check & Create Stock Alerts
const checkAndCreateStockAlerts = async (db, itemId, currentStock, minStockLevel, reorderLevel) => {
  try {
    const curStock = Number(currentStock);
    const minStock = Number(minStockLevel);
    const reorder = Number(reorderLevel);

    if (curStock <= 0) {
      // Create OUT_OF_STOCK alert
      const [existing] = await db.query(
        "SELECT id FROM stock_alerts WHERE item_id = ? AND alert_type = 'OUT_OF_STOCK' AND is_resolved = 0",
        [itemId]
      );
      if (existing.length === 0) {
        await db.query(
          "INSERT INTO stock_alerts (item_id, alert_type, current_stock, min_stock_level) VALUES (?, 'OUT_OF_STOCK', ?, ?)",
          [itemId, curStock, minStock]
        );
      } else {
        await db.query(
          "UPDATE stock_alerts SET current_stock = ?, min_stock_level = ? WHERE id = ?",
          [curStock, minStock, existing[0].id]
        );
      }
    } else if (curStock <= minStock) {
      // Create LOW_STOCK alert
      const [existing] = await db.query(
        "SELECT id FROM stock_alerts WHERE item_id = ? AND alert_type = 'LOW_STOCK' AND is_resolved = 0",
        [itemId]
      );
      if (existing.length === 0) {
        await db.query(
          "INSERT INTO stock_alerts (item_id, alert_type, current_stock, min_stock_level) VALUES (?, 'LOW_STOCK', ?, ?)",
          [itemId, curStock, minStock]
        );
      } else {
        await db.query(
          "UPDATE stock_alerts SET current_stock = ?, min_stock_level = ? WHERE id = ?",
          [curStock, minStock, existing[0].id]
        );
      }
    } else if (curStock <= reorder) {
      // Create REORDER alert
      const [existing] = await db.query(
        "SELECT id FROM stock_alerts WHERE item_id = ? AND alert_type = 'REORDER' AND is_resolved = 0",
        [itemId]
      );
      if (existing.length === 0) {
        await db.query(
          "INSERT INTO stock_alerts (item_id, alert_type, current_stock, min_stock_level) VALUES (?, 'REORDER', ?, ?)",
          [itemId, curStock, minStock]
        );
      }
    } else {
      // Stock is healthy — auto resolve unresolved alerts for this item
      await db.query(
        "UPDATE stock_alerts SET is_resolved = 1, resolved_at = NOW() WHERE item_id = ? AND is_resolved = 0",
        [itemId]
      );
    }
  } catch (err) {
    console.error("checkAndCreateStockAlerts error:", err);
  }
};

// ======================================
// MODEL METHODS
// ======================================

const getCategories = async (db = defaultDb) => {
  await ensureStockTables(db);
  const [rows] = await db.query(
    "SELECT * FROM stock_categories WHERE is_active = 1 ORDER BY sort_order ASC, name ASC"
  );
  return rows;
};

const getItems = async (db = defaultDb, filters = {}) => {
  await ensureStockTables(db);
  const {
    category_id,
    brand,
    status,
    search,
    sort_by = "updated_at",
    sort_order = "DESC",
    page = 1,
    limit = 50,
  } = filters;

  let whereClauses = ["i.is_active = 1"];
  let queryParams = [];

  if (category_id) {
    whereClauses.push("i.category_id = ?");
    queryParams.push(category_id);
  }

  if (brand) {
    whereClauses.push("i.brand = ?");
    queryParams.push(brand);
  }

  if (status) {
    if (status === "low_stock") {
      whereClauses.push("i.current_stock > 0 AND i.current_stock <= i.min_stock_level");
    } else if (status === "out_of_stock") {
      whereClauses.push("i.current_stock <= 0");
    } else if (status === "reorder") {
      whereClauses.push("i.current_stock > i.min_stock_level AND i.current_stock <= i.reorder_level");
    } else if (status === "healthy") {
      whereClauses.push("i.current_stock > i.reorder_level");
    }
  }

  if (search && search.trim()) {
    const s = `%${search.trim()}%`;
    whereClauses.push("(i.name LIKE ? OR i.brand LIKE ? OR i.model LIKE ? OR i.item_code LIKE ? OR i.barcode LIKE ?)");
    queryParams.push(s, s, s, s, s);
  }

  const whereSql = whereClauses.join(" AND ");

  // Allowed sort columns
  const allowedSorts = {
    name: "i.name",
    current_stock: "i.current_stock",
    unit_price: "i.unit_price",
    updated_at: "i.updated_at",
    category_id: "i.category_id",
  };
  const sortCol = allowedSorts[sort_by] || "i.updated_at";
  const orderDir = sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC";

  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  queryParams.push(parseInt(limit), offset);

  const sql = `
    SELECT 
      i.*,
      c.name AS category_name,
      c.slug AS category_slug,
      c.icon AS category_icon,
      u.full_name AS created_by_name
    FROM stock_items i
    LEFT JOIN stock_categories c ON i.category_id = c.id
    LEFT JOIN users u ON i.created_by = u.id
    WHERE ${whereSql}
    ORDER BY ${sortCol} ${orderDir}
    LIMIT ? OFFSET ?
  `;

  const [items] = await db.query(sql, queryParams);

  // Count total matching
  const countSql = `
    SELECT COUNT(*) AS total
    FROM stock_items i
    WHERE ${whereSql}
  `;
  const [countRows] = await db.query(countSql, queryParams.slice(0, -2));

  // Parse specifications JSON if needed
  const formattedItems = items.map((item) => {
    let specs = item.specifications;
    if (typeof specs === "string") {
      try { specs = JSON.parse(specs); } catch (e) { specs = {}; }
    }
    return { ...item, specifications: specs || {} };
  });

  return {
    items: formattedItems,
    total: countRows[0]?.total || 0,
    page: parseInt(page),
    limit: parseInt(limit),
  };
};

const getItemById = async (db = defaultDb, id) => {
  await ensureStockTables(db);
  const sql = `
    SELECT 
      i.*,
      c.name AS category_name,
      c.slug AS category_slug,
      c.icon AS category_icon,
      u.full_name AS created_by_name
    FROM stock_items i
    LEFT JOIN stock_categories c ON i.category_id = c.id
    LEFT JOIN users u ON i.created_by = u.id
    WHERE i.id = ?
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [id]);
  if (rows.length === 0) return null;

  const item = rows[0];
  let specs = item.specifications;
  if (typeof specs === "string") {
    try { specs = JSON.parse(specs); } catch (e) { specs = {}; }
  }
  item.specifications = specs || {};

  // Fetch recent transactions for this item
  const [transactions] = await db.query(
    `SELECT t.*, u.full_name AS user_name 
     FROM stock_transactions t
     LEFT JOIN users u ON t.created_by = u.id
     WHERE t.item_id = ?
     ORDER BY t.created_at DESC
     LIMIT 20`,
    [id]
  );

  // Fetch active alerts for this item
  const [alerts] = await db.query(
    `SELECT * FROM stock_alerts WHERE item_id = ? AND is_resolved = 0 ORDER BY created_at DESC`,
    [id]
  );

  return {
    ...item,
    transactions,
    active_alerts: alerts,
  };
};

// Find Single Item by exact or partial Barcode / Item Code / QR text
const getItemByCodeOrBarcode = async (db = defaultDb, rawCode) => {
  await ensureStockTables(db);
  if (!rawCode || !String(rawCode).trim()) return null;
  const clean = String(rawCode).trim();
  const upper = clean.toUpperCase();

  // 1. Exact match on item_code or barcode (case-insensitive)
  const exactSql = `
    SELECT 
      i.*,
      c.name AS category_name,
      c.slug AS category_slug,
      c.icon AS category_icon,
      u.full_name AS created_by_name
    FROM stock_items i
    LEFT JOIN stock_categories c ON i.category_id = c.id
    LEFT JOIN users u ON i.created_by = u.id
    WHERE (i.item_code = ? OR i.barcode = ? OR UPPER(i.item_code) = ? OR UPPER(i.barcode) = ?)
      AND i.is_active = 1
    LIMIT 1
  `;
  const [exactRows] = await db.query(exactSql, [clean, clean, upper, upper]);
  if (exactRows.length > 0) {
    const item = exactRows[0];
    let specs = item.specifications;
    if (typeof specs === "string") {
      try { specs = JSON.parse(specs); } catch (e) { specs = {}; }
    }
    item.specifications = specs || {};
    return item;
  }

  // 2. Partial match if barcode/code is embedded inside QR text or SKU
  const likeSql = `
    SELECT 
      i.*,
      c.name AS category_name,
      c.slug AS category_slug,
      c.icon AS category_icon,
      u.full_name AS created_by_name
    FROM stock_items i
    LEFT JOIN stock_categories c ON i.category_id = c.id
    LEFT JOIN users u ON i.created_by = u.id
    WHERE (i.item_code LIKE ? OR i.barcode LIKE ? OR i.name LIKE ?)
      AND i.is_active = 1
    ORDER BY (i.item_code = ? OR i.barcode = ?) DESC, i.id ASC
    LIMIT 1
  `;
  const [likeRows] = await db.query(likeSql, [`%${clean}%`, `%${clean}%`, `%${clean}%`, clean, clean]);
  if (likeRows.length > 0) {
    const item = likeRows[0];
    let specs = item.specifications;
    if (typeof specs === "string") {
      try { specs = JSON.parse(specs); } catch (e) { specs = {}; }
    }
    item.specifications = specs || {};
    return item;
  }

  return null;
};

const createItem = async (db = defaultDb, itemData, userId) => {
  await ensureStockTables(db);

  let {
    category_id,
    item_code,
    barcode,
    name,
    brand,
    model,
    description,
    specifications,
    image_url,
    unit = "Piece",
    unit_price = 0,
    gst_rate = 18.0,
    hsn_code,
    min_stock_level = 5,
    reorder_level = 10,
    current_stock = 0,
    reserved_stock = 0,
  } = itemData;

  if (!item_code || !item_code.trim()) {
    item_code = await generateItemCode(db, category_id);
  }

  let specsJson = null;
  if (specifications) {
    specsJson = typeof specifications === "string" ? specifications : JSON.stringify(specifications);
  }

  const sql = `
    INSERT INTO stock_items (
      category_id, item_code, barcode, name, brand, model, description,
      specifications, image_url, unit, unit_price, gst_rate,
      hsn_code, min_stock_level, reorder_level, current_stock,
      reserved_stock, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await db.query(sql, [
    category_id,
    item_code,
    barcode ? String(barcode).trim() : null,
    name,
    brand || null,
    model || null,
    description || null,
    specsJson,
    image_url || null,
    unit,
    Number(unit_price) || 0,
    Number(gst_rate) || 18.0,
    hsn_code || null,
    Number(min_stock_level) || 5,
    Number(reorder_level) || 10,
    Number(current_stock) || 0,
    Number(reserved_stock) || 0,
    userId || null,
  ]);

  const newItemId = result.insertId;

  // Create initial transaction if current_stock > 0
  if (Number(current_stock) > 0) {
    const txnNum = await generateTransactionNumber(db);
    const totalVal = Number(current_stock) * Number(unit_price);
    await db.query(
      `INSERT INTO stock_transactions (
        transaction_number, item_id, transaction_type, quantity,
        quantity_before, quantity_after, unit_price, total_value,
        reference_type, notes, created_by
      ) VALUES (?, ?, 'IN', ?, 0, ?, ?, ?, 'PURCHASE', 'Initial stock entry on item creation', ?)`,
      [txnNum, newItemId, Number(current_stock), Number(current_stock), Number(unit_price), totalVal, userId || null]
    );
  }

  // Check alert conditions
  await checkAndCreateStockAlerts(db, newItemId, current_stock, min_stock_level, reorder_level);

  return getItemById(db, newItemId);
};

const updateItem = async (db = defaultDb, id, itemData, userId) => {
  await ensureStockTables(db);

  const existing = await getItemById(db, id);
  if (!existing) return null;

  let {
    category_id = existing.category_id,
    item_code = existing.item_code,
    barcode = existing.barcode,
    name = existing.name,
    brand = existing.brand,
    model = existing.model,
    description = existing.description,
    specifications = existing.specifications,
    image_url = existing.image_url,
    unit = existing.unit,
    unit_price = existing.unit_price,
    gst_rate = existing.gst_rate,
    hsn_code = existing.hsn_code,
    min_stock_level = existing.min_stock_level,
    reorder_level = existing.reorder_level,
    is_active = existing.is_active,
  } = itemData;

  let specsJson = null;
  if (specifications) {
    specsJson = typeof specifications === "string" ? specifications : JSON.stringify(specifications);
  }

  const sql = `
    UPDATE stock_items SET
      category_id = ?,
      item_code = ?,
      barcode = ?,
      name = ?,
      brand = ?,
      model = ?,
      description = ?,
      specifications = ?,
      image_url = ?,
      unit = ?,
      unit_price = ?,
      gst_rate = ?,
      hsn_code = ?,
      min_stock_level = ?,
      reorder_level = ?,
      is_active = ?
    WHERE id = ?
  `;

  await db.query(sql, [
    category_id,
    item_code,
    barcode ? String(barcode).trim() : null,
    name,
    brand || null,
    model || null,
    description || null,
    specsJson,
    image_url || null,
    unit,
    Number(unit_price),
    Number(gst_rate),
    hsn_code || null,
    Number(min_stock_level),
    Number(reorder_level),
    Number(is_active),
    id,
  ]);

  // Re-check alerts
  await checkAndCreateStockAlerts(db, id, existing.current_stock, min_stock_level, reorder_level);

  return getItemById(db, id);
};

const deleteItem = async (db = defaultDb, id) => {
  await ensureStockTables(db);
  // Check if transactions exist
  const [txns] = await db.query("SELECT id FROM stock_transactions WHERE item_id = ? LIMIT 1", [id]);
  if (txns.length > 0) {
    // Soft delete
    await db.query("UPDATE stock_items SET is_active = 0 WHERE id = ?", [id]);
    return { softDeleted: true };
  } else {
    // Hard delete
    await db.query("DELETE FROM stock_alerts WHERE item_id = ?", [id]);
    await db.query("DELETE FROM stock_items WHERE id = ?", [id]);
    return { hardDeleted: true };
  }
};

const bulkDeleteItems = async (db = defaultDb, ids) => {
  await ensureStockTables(db);
  if (!Array.isArray(ids) || ids.length === 0) return { total: 0, softDeleted: 0, hardDeleted: 0 };

  let softDeleted = 0;
  let hardDeleted = 0;

  for (const id of ids) {
    try {
      const res = await deleteItem(db, id);
      if (res.softDeleted) softDeleted++;
      else if (res.hardDeleted) hardDeleted++;
    } catch (e) {
      console.warn(`Could not delete stock item ${id}:`, e.message);
    }
  }

  return { total: ids.length, softDeleted, hardDeleted };
};

const createTransaction = async (db = defaultDb, txnData, userId) => {
  await ensureStockTables(db);

  const {
    item_id,
    transaction_type, // IN, OUT, ADJUSTMENT, RESERVED, RELEASED
    quantity,
    unit_price,
    reference_type = "PURCHASE", // PURCHASE, LEAD, PROJECT, ADJUSTMENT, RETURN, DAMAGE
    reference_id,
    reference_number,
    vendor_name,
    vendor_invoice,
    notes,
  } = txnData;

  const qty = Math.abs(parseInt(quantity, 10));
  if (isNaN(qty) || qty <= 0) {
    throw new Error("Transaction quantity must be a positive integer.");
  }

  // Fetch item
  const [itemRows] = await db.query("SELECT * FROM stock_items WHERE id = ?", [item_id]);
  if (itemRows.length === 0) {
    throw new Error("Stock item not found.");
  }

  const item = itemRows[0];
  const curStock = Number(item.current_stock);
  const curReserved = Number(item.reserved_stock);
  const curPrice = unit_price !== undefined && unit_price !== null && unit_price !== "" 
    ? Number(unit_price) 
    : Number(item.unit_price);

  let qtyBefore = curStock;
  let qtyAfter = curStock;
  let newReserved = curReserved;

  if (transaction_type === "IN") {
    qtyAfter = curStock + qty;
  } else if (transaction_type === "OUT") {
    if (curStock < qty) {
      throw new Error(`Insufficient stock. Current stock is ${curStock}, attempted OUT is ${qty}.`);
    }
    qtyAfter = curStock - qty;
  } else if (transaction_type === "ADJUSTMENT") {
    // For adjustment, quantity is the new stock count
    qtyAfter = parseInt(quantity, 10);
    if (qtyAfter < 0) throw new Error("Stock count cannot be negative.");
  } else if (transaction_type === "RESERVED") {
    const avail = curStock - curReserved;
    if (avail < qty) {
      throw new Error(`Insufficient available stock to reserve. Available: ${avail}, requested: ${qty}.`);
    }
    newReserved = curReserved + qty;
  } else if (transaction_type === "RELEASED") {
    if (curReserved < qty) {
      throw new Error(`Cannot release more than reserved stock. Reserved: ${curReserved}, requested release: ${qty}.`);
    }
    newReserved = curReserved - qty;
  } else {
    throw new Error("Invalid transaction type.");
  }

  const txnNum = await generateTransactionNumber(db);
  const totalValue = qty * curPrice;

  // Insert Transaction
  const txnSql = `
    INSERT INTO stock_transactions (
      transaction_number, item_id, transaction_type, quantity,
      quantity_before, quantity_after, unit_price, total_value,
      reference_type, reference_id, reference_number, vendor_name,
      vendor_invoice, notes, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await db.query(txnSql, [
    txnNum,
    item_id,
    transaction_type,
    transaction_type === "ADJUSTMENT" ? Math.abs(qtyAfter - curStock) : qty,
    qtyBefore,
    qtyAfter,
    curPrice,
    totalValue,
    reference_type || null,
    reference_id || null,
    reference_number || null,
    vendor_name || null,
    vendor_invoice || null,
    notes || null,
    userId || null,
  ]);

  // Update stock item
  await db.query(
    "UPDATE stock_items SET current_stock = ?, reserved_stock = ?, unit_price = ? WHERE id = ?",
    [qtyAfter, newReserved, curPrice, item_id]
  );

  // Trigger Stock Alert Check
  await checkAndCreateStockAlerts(db, item_id, qtyAfter, item.min_stock_level, item.reorder_level);

  return {
    transaction_number: txnNum,
    item_id,
    transaction_type,
    quantity: qty,
    quantity_before: qtyBefore,
    quantity_after: qtyAfter,
    unit_price: curPrice,
    total_value: totalValue,
  };
};

// Quick Stock IN via Barcode / QR Code
const quickScanStockIn = async (db = defaultDb, payload, userId) => {
  await ensureStockTables(db);
  const { code, quantity = 1, unit_price, reference_type = "PURCHASE", vendor_name, vendor_invoice, notes } = payload;
  const cleanCode = String(code || "").trim();

  if (!cleanCode) {
    throw new Error("Barcode or QR code is required.");
  }

  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    throw new Error("Quantity must be a positive integer.");
  }

  // 1. Locate item by barcode or item_code
  const item = await getItemByCodeOrBarcode(db, cleanCode);
  if (!item) {
    return { notFound: true, code: cleanCode };
  }

  // 2. Perform Stock IN transaction
  const txnResult = await createTransaction(
    db,
    {
      item_id: item.id,
      transaction_type: "IN",
      quantity: qty,
      unit_price: unit_price !== undefined && unit_price !== null && unit_price !== "" ? unit_price : item.unit_price,
      reference_type: reference_type || "PURCHASE",
      vendor_name: vendor_name || null,
      vendor_invoice: vendor_invoice || null,
      notes: notes || `Quick Stock IN via QR/Barcode Scanner (${cleanCode})`,
    },
    userId
  );

  // 3. Fetch latest item data
  const updatedItem = await getItemById(db, item.id);

  return {
    notFound: false,
    item: updatedItem,
    quantity: qty,
    previous_stock: txnResult.quantity_before,
    new_stock: txnResult.quantity_after,
    transaction: txnResult,
  };
};

const getTransactions = async (db = defaultDb, filters = {}) => {
  await ensureStockTables(db);
  const {
    item_id,
    transaction_type,
    reference_type,
    search,
    start_date,
    end_date,
    page = 1,
    limit = 50,
  } = filters;

  let whereClauses = ["1=1"];
  let queryParams = [];

  if (item_id) {
    whereClauses.push("t.item_id = ?");
    queryParams.push(item_id);
  }

  if (transaction_type) {
    whereClauses.push("t.transaction_type = ?");
    queryParams.push(transaction_type);
  }

  if (reference_type) {
    whereClauses.push("t.reference_type = ?");
    queryParams.push(reference_type);
  }

  if (start_date) {
    whereClauses.push("t.created_at >= ?");
    queryParams.push(`${start_date} 00:00:00`);
  }

  if (end_date) {
    whereClauses.push("t.created_at <= ?");
    queryParams.push(`${end_date} 23:59:59`);
  }

  if (search && search.trim()) {
    const s = `%${search.trim()}%`;
    whereClauses.push("(i.name LIKE ? OR i.item_code LIKE ? OR t.transaction_number LIKE ? OR t.reference_number LIKE ? OR t.vendor_name LIKE ?)");
    queryParams.push(s, s, s, s, s);
  }

  const whereSql = whereClauses.join(" AND ");
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  queryParams.push(parseInt(limit), offset);

  const sql = `
    SELECT 
      t.*,
      i.name AS item_name,
      i.item_code,
      i.brand AS item_brand,
      i.model AS item_model,
      i.unit AS item_unit,
      i.image_url AS item_image,
      c.name AS category_name,
      c.icon AS category_icon,
      u.full_name AS created_by_name
    FROM stock_transactions t
    JOIN stock_items i ON t.item_id = i.id
    LEFT JOIN stock_categories c ON i.category_id = c.id
    LEFT JOIN users u ON t.created_by = u.id
    WHERE ${whereSql}
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const [transactions] = await db.query(sql, queryParams);

  const countSql = `
    SELECT COUNT(*) AS total
    FROM stock_transactions t
    JOIN stock_items i ON t.item_id = i.id
    WHERE ${whereSql}
  `;
  const [countRows] = await db.query(countSql, queryParams.slice(0, -2));

  return {
    transactions,
    total: countRows[0]?.total || 0,
    page: parseInt(page),
    limit: parseInt(limit),
  };
};

const getAlerts = async (db = defaultDb, filters = {}) => {
  await ensureStockTables(db);
  const { is_resolved = 0, alert_type, category_id } = filters;

  let whereClauses = ["1=1"];
  let queryParams = [];

  if (is_resolved !== undefined && is_resolved !== null && is_resolved !== "") {
    whereClauses.push("a.is_resolved = ?");
    queryParams.push(Number(is_resolved));
  }

  if (alert_type) {
    whereClauses.push("a.alert_type = ?");
    queryParams.push(alert_type);
  }

  if (category_id) {
    whereClauses.push("i.category_id = ?");
    queryParams.push(category_id);
  }

  const whereSql = whereClauses.join(" AND ");

  const sql = `
    SELECT 
      a.*,
      i.name AS item_name,
      i.item_code,
      i.brand AS item_brand,
      i.model AS item_model,
      i.unit AS item_unit,
      i.image_url AS item_image,
      i.current_stock AS item_current_stock,
      i.min_stock_level AS item_min_stock_level,
      i.reorder_level AS item_reorder_level,
      c.name AS category_name,
      c.icon AS category_icon,
      ru.full_name AS resolved_by_name
    FROM stock_alerts a
    JOIN stock_items i ON a.item_id = i.id
    LEFT JOIN stock_categories c ON i.category_id = c.id
    LEFT JOIN users ru ON a.resolved_by = ru.id
    WHERE ${whereSql}
    ORDER BY a.is_resolved ASC, a.created_at DESC
  `;

  const [alerts] = await db.query(sql, queryParams);
  return alerts;
};

const resolveAlert = async (db = defaultDb, alertId, userId) => {
  await ensureStockTables(db);
  await db.query(
    "UPDATE stock_alerts SET is_resolved = 1, resolved_at = NOW(), resolved_by = ? WHERE id = ?",
    [userId || null, alertId]
  );
  return true;
};

const getStockReport = async (db = defaultDb) => {
  await ensureStockTables(db);

  // Total items, stock value, stock with GST
  const [overall] = await db.query(`
    SELECT 
      COUNT(*) AS total_items,
      SUM(current_stock) AS total_quantity,
      SUM(current_stock * unit_price) AS total_valuation,
      SUM(current_stock * unit_price * (1 + gst_rate / 100)) AS total_valuation_with_gst,
      SUM(CASE WHEN current_stock <= 0 THEN 1 ELSE 0 END) AS out_of_stock_count,
      SUM(CASE WHEN current_stock > 0 AND current_stock <= min_stock_level THEN 1 ELSE 0 END) AS low_stock_count,
      SUM(CASE WHEN current_stock > min_stock_level AND current_stock <= reorder_level THEN 1 ELSE 0 END) AS reorder_count,
      SUM(CASE WHEN current_stock > reorder_level THEN 1 ELSE 0 END) AS healthy_count
    FROM stock_items
    WHERE is_active = 1
  `);

  // Category breakdown
  const [categories] = await db.query(`
    SELECT 
      c.id AS category_id,
      c.name AS category_name,
      c.slug AS category_slug,
      c.icon AS category_icon,
      COUNT(i.id) AS item_count,
      IFNULL(SUM(i.current_stock), 0) AS category_quantity,
      IFNULL(SUM(i.current_stock * i.unit_price), 0) AS category_valuation
    FROM stock_categories c
    LEFT JOIN stock_items i ON c.id = i.category_id AND i.is_active = 1
    WHERE c.is_active = 1
    GROUP BY c.id, c.name, c.slug, c.icon
    ORDER BY category_valuation DESC
  `);

  // Top 5 Valuable Items
  const [topItems] = await db.query(`
    SELECT 
      i.id, i.item_code, i.name, i.brand, i.current_stock, i.unit_price, i.unit,
      (i.current_stock * i.unit_price) AS valuation,
      c.name AS category_name
    FROM stock_items i
    LEFT JOIN stock_categories c ON i.category_id = c.id
    WHERE i.is_active = 1
    ORDER BY valuation DESC
    LIMIT 5
  `);

  return {
    summary: overall[0] || {},
    categories,
    top_items: topItems,
  };
};

const bulkImportItems = async (db = defaultDb, items = [], userId) => {
  await ensureStockTables(db);
  const categories = await getCategories(db);

  let successCount = 0;
  let failedCount = 0;
  const createdItems = [];
  const errors = [];

  for (let i = 0; i < items.length; i++) {
    const raw = items[i];
    const rowNum = i + 1;

    try {
      if (!raw.name || !String(raw.name).trim()) {
        errors.push({ row: rowNum, item: raw, error: "Product/Item Name is required." });
        failedCount++;
        continue;
      }

      // Resolve category
      let categoryId = raw.category_id;
      if (!categoryId && (raw.category_name || raw.category || raw.category_slug)) {
        const catSearch = String(raw.category_name || raw.category || raw.category_slug).trim().toLowerCase();
        const found = categories.find(
          (c) => c.name.toLowerCase() === catSearch || c.slug.toLowerCase() === catSearch || String(c.id) === catSearch
        );
        if (found) categoryId = found.id;
      }

      if (!categoryId && categories.length > 0) {
        categoryId = categories[0].id; // Fallback to first category
      }

      if (!categoryId) {
        errors.push({ row: rowNum, item: raw, error: "Category could not be determined." });
        failedCount++;
        continue;
      }

      const itemPayload = {
        category_id: categoryId,
        item_code: raw.item_code || raw.sku || raw.code || "",
        barcode: raw.barcode || raw.barcode_number || raw.upc || raw.ean || "",
        name: String(raw.name).trim(),
        brand: raw.brand || "",
        model: raw.model || "",
        description: raw.description || raw.remarks || "",
        unit: raw.unit || "Piece",
        unit_price: parseFloat(raw.unit_price || raw.price || raw.cost_price || 0) || 0,
        gst_rate: parseFloat(raw.gst_rate || 18.0) || 18.0,
        hsn_code: raw.hsn_code || "",
        min_stock_level: parseInt(raw.min_stock_level || raw.min_stock || 5, 10) || 5,
        reorder_level: parseInt(raw.reorder_level || 10, 10) || 10,
        current_stock: parseInt(raw.current_stock || raw.quantity || raw.qty || 0, 10) || 0,
        specifications: raw.specifications || {},
      };

      const newItem = await createItem(db, itemPayload, userId);
      createdItems.push(newItem);
      successCount++;
    } catch (err) {
      console.error(`bulkImportItems row ${rowNum} error:`, err);
      errors.push({ row: rowNum, item: raw, error: err.message || "Failed to create item" });
      failedCount++;
    }
  }

  return {
    totalProcessed: items.length,
    successCount,
    failedCount,
    createdItems,
    errors,
  };
};

module.exports = {
  ensureStockTables,
  getCategories,
  getItems,
  getItemById,
  getItemByCodeOrBarcode,
  quickScanStockIn,
  createItem,
  updateItem,
  deleteItem,
  bulkDeleteItems,
  createTransaction,
  getTransactions,
  getAlerts,
  resolveAlert,
  getStockReport,
  bulkImportItems,
};

