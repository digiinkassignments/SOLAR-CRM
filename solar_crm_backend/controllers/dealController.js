const dealModel = require("../models/dealModel");

// 1. Close Order & Mark Deal Won
const closeOrderHandler = async (req, res) => {
  try {
    const { lead_id, total_project_cost, advance_payment_amount, advance_payment_date } = req.body;

    if (!lead_id || !total_project_cost || !advance_payment_amount) {
      return res.status(400).json({
        success: false,
        message: "lead_id, total_project_cost, and advance_payment_amount are required.",
      });
    }

    const createdBy = req.user?.id || null;
    const order = await dealModel.closeOrder(req.body, createdBy, req.db);

    return res.status(201).json({
      success: true,
      message: "Order booked successfully! Lead status updated to 'Deal Won'.",
      data: order,
    });
  } catch (error) {
    console.error("closeOrderHandler error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to book project order.",
      error: error.message,
    });
  }
};

// 2. Get Order Details by Lead ID
const getOrderByLeadHandler = async (req, res) => {
  try {
    const { leadId } = req.params;
    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: "leadId parameter is required.",
      });
    }

    const order = await dealModel.getOrderByLeadId(leadId, req.db);
    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("getOrderByLeadHandler error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order details.",
      error: error.message,
    });
  }
};

module.exports = {
  closeOrderHandler,
  getOrderByLeadHandler,
};
