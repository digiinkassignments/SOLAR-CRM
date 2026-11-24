const duplicates = require('../services/duplicateRecords');
const customerModel = require('../models/customerModel');
const { db: defaultDb } = require('../config/db');

// 1. Get All Customers (with KPIs)
const getCustomers = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const filters = {
      search: req.query.search,
      city: req.query.city,
      requirement: req.query.requirement,
      role_id: req.user?.role_id,
      user_id: req.user?.id,
    };

    const rows = await customerModel.getCustomers(filters, db);
    await duplicates.decorate(db, 'customer', rows);

    // Compute stats summary
    const stats = {
      totalCustomers: rows.length,
      totalCapacityKw: rows.reduce((acc, c) => acc + (parseFloat(c.total_system_kw) || 0), 0),
      totalBilled: rows.reduce((acc, c) => acc + (parseFloat(c.total_billed_amount) || 0), 0),
      totalPaid: rows.reduce((acc, c) => acc + (parseFloat(c.total_paid_amount) || 0), 0),
      totalBalance: rows.reduce((acc, c) => acc + (parseFloat(c.total_balance_amount) || 0), 0),
    };

    return res.json({
      success: true,
      stats,
      data: rows,
    });
  } catch (error) {
    console.error('getCustomers error:', error);
    return res.status(error.status || 500).json({
      success: false,
      message: 'Failed to fetch customers.',
      error: error.status ? error.message : undefined,
      code: error.code === 'DUPLICATE_RECORD' ? error.code : undefined,
      duplicates: error.duplicates,
    });
  }
};

// 2. Get Single Customer 360° Profile
const getCustomerById = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { id } = req.params;

    await require('../services/customerWorkspace').accessibleCustomer(db, id, req.user);
    const customer = await customerModel.getCustomerById(id, db);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    await duplicates.decorate(db, 'customer', [customer]);
    return res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('getCustomerById error:', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : 'Failed to fetch customer profile.',
      error: error.status ? error.message : undefined,
      code: error.code === 'DUPLICATE_RECORD' ? error.code : undefined,
      duplicates: error.duplicates,
    });
  }
};

// 3. Create Customer Manually
const createCustomer = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const userId = req.user?.id || null;

    const { customer_name, mobile_number } = req.body;
    if (!customer_name || !mobile_number) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and mobile number are required.',
      });
    }

    if (
      req.body.lead_source != null &&
      (typeof req.body.lead_source !== 'string' || req.body.lead_source.length > 150)
    )
      return res
        .status(400)
        .json({ success: false, message: 'Lead source must be text up to 150 characters.' });
    await customerModel.ensureCustomerTables(db);
    await require('../services/customerOpening').ensure(db);
    const created = await duplicates.locked(
      db,
      req.body,
      async (connection) => {
        const [[retry]] = req.body.request_key
          ? await connection.query(
              'SELECT customer_id FROM customer_opening_records WHERE request_key=? AND recorded_by=?',
              [req.body.request_key, userId]
            )
          : [[]];
        const matches = await duplicates.check(
          connection,
          req.body,
          req.user,
          'customer',
          retry?.customer_id
        );
        const created = await customerModel.createCustomer(
          req.body,
          userId,
          connection,
          (connection, created) =>
            duplicates.record(connection, 'customer', created.id, matches, req.body, req.user)
        );
        return created;
      },
      ['customer-code']
    );
    return res.status(201).json({
      success: true,
      message: 'Customer created successfully.',
      data: created,
    });
  } catch (error) {
    if (!error.status) console.error('createCustomer error:', error.code || error.name);
    return res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : 'Failed to create customer.',
      error: error.status ? error.message : undefined,
      code: error.code === 'DUPLICATE_RECORD' ? error.code : undefined,
      duplicates: error.duplicates,
    });
  }
};

// 4. Update Customer Profile
const updateCustomer = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { id } = req.params;

    if (
      req.body.lead_source != null &&
      (typeof req.body.lead_source !== 'string' || req.body.lead_source.length > 150)
    )
      return res
        .status(400)
        .json({ success: false, message: 'Lead source must be text up to 150 characters.' });
    await require('../services/customerWorkspace').accessibleCustomer(db, id, req.user);
    const [[existing]] = await db.query('SELECT * FROM customers WHERE id=?', [id]);
    const phonesChanged =
      existing &&
      ['mobile_number', 'alternate_number'].some(
        (key) =>
          req.body[key] !== undefined && String(req.body[key] || '') !== String(existing[key] || '')
      );
    if (phonesChanged) {
      const payload = { ...existing, ...req.body };
      await duplicates.locked(db, payload, async (connection) => {
        const matches = await duplicates.check(connection, payload, req.user, 'customer', id);
        await customerModel.updateCustomer(id, payload, connection, (connection) =>
          duplicates.record(connection, 'customer', Number(id), matches, payload, req.user)
        );
      });
    } else await customerModel.updateCustomer(id, { ...existing, ...req.body }, db);
    return res.json({
      success: true,
      message: 'Customer updated successfully.',
    });
  } catch (error) {
    if (!error.status) console.error('updateCustomer error:', error.code || error.name);
    return res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : 'Failed to update customer.',
      error: error.status ? error.message : undefined,
      code: error.code === 'DUPLICATE_RECORD' ? error.code : undefined,
      duplicates: error.duplicates,
    });
  }
};

// 5. Delete Customer (Super Admin only)
const deleteCustomer = require('./customerDeletionController').archive;

const convertCustomerToProject = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const id = Number(req.params.id);
    await require('../services/customerWorkspace').accessibleCustomer(db, id, req.user);
    const [[customer]] = await db.query('SELECT * FROM customers WHERE id=?', [id]);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
    const [[existing]] = await db.query(
      'SELECT id,project_number FROM projects WHERE is_deleted=0 AND ((lead_id IS NOT NULL AND lead_id=?) OR (customer_id IS NOT NULL AND customer_id=?)) ORDER BY id LIMIT 1',
      [customer.lead_id || 0, id]
    );
    if (existing) return res.json({ success: true, existing: true, data: existing, message: 'Customer is already linked to a project.' });
    const [opening = {}] = await require('../services/customerOpening').records(db, [id]);
    const capacity = Number(opening.plant_size_kw || customer.plant_size_kw || req.body?.system_capacity_kw || 0);
    if (!Number.isFinite(capacity) || capacity <= 0) return res.status(400).json({ success: false, message: 'Enter a positive plant size before converting this customer to a project.' });
    const projectId = await require('../models/projectModel').createProject(db, {
      lead_id: customer.lead_id || null, customer_id: id, customer_name: customer.customer_name,
      customer_phone: customer.mobile_number, customer_address: customer.address, city: customer.city,
      state: customer.state, pincode: customer.pincode, system_capacity_kw: capacity,
      stage: 'Pre-Install Inspection', assigned_to: customer.assigned_to || null,
      notes: 'Created from confirmed customer profile.',
    }, req.user?.id || null);
    if (customer.lead_id) await db.query("UPDATE leads SET customer_id=?,status=CASE WHEN status NOT IN ('Lost','Invalid') THEN 'Won' ELSE status END WHERE id=?", [id, customer.lead_id]);
    await db.query('UPDATE projects SET customer_id=? WHERE id=?', [id, projectId]);
    const [[project]] = await db.query('SELECT id,project_number FROM projects WHERE id=?', [projectId]);
    return res.status(201).json({ success: true, existing: false, data: project, message: 'Customer converted to project successfully.' });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Could not convert customer to project.' });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  convertCustomerToProject,
};
