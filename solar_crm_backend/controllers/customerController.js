const customerModel = require("../models/customerModel");
const { db: defaultDb } = require("../config/db");

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
    console.error("getCustomers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers.",
      error: error.message,
    });
  }
};

// 2. Get Single Customer 360° Profile
const getCustomerById = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { id } = req.params;

    const customer = await customerModel.getCustomerById(id, db);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("getCustomerById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer profile.",
      error: error.message,
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
        message: "Customer name and mobile number are required.",
      });
    }

    const created = await customerModel.createCustomer(req.body, userId, db);
    return res.status(201).json({
      success: true,
      message: "Customer created successfully.",
      data: created,
    });
  } catch (error) {
    console.error("createCustomer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create customer.",
      error: error.message,
    });
  }
};

// 4. Update Customer Profile
const updateCustomer = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { id } = req.params;

    await customerModel.updateCustomer(id, req.body, db);
    return res.json({
      success: true,
      message: "Customer updated successfully.",
    });
  } catch (error) {
    console.error("updateCustomer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update customer.",
      error: error.message,
    });
  }
};

// 5. Delete Customer (Super Admin only)
const deleteCustomer = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { id } = req.params;

    await customerModel.deleteCustomer(id, db);
    return res.json({
      success: true,
      message: "Customer deleted successfully.",
    });
  } catch (error) {
    console.error("deleteCustomer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete customer.",
      error: error.message,
    });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
