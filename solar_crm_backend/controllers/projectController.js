const projectModel = require("../models/projectModel");
const dbConfig = require("../config/db");
const defaultDb = dbConfig.db || dbConfig.defaultDb;

// 1. Get All Projects
const getAllProjects = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const isEngineer = Number(req.user?.role_id) === 4;
    const filters = {
      stage: req.query.stage,
      assigned_to: req.query.assigned_to,
      engineer_id: isEngineer && req.query.assigned_to !== 'All' ? req.user.id : null,
      search: req.query.search,
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 15,
    };

    const data = await projectModel.getAllProjects(db, filters);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("getAllProjects error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. Get Single Project By ID
const getProjectById = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { id } = req.params;

    const project = await projectModel.getProjectById(db, id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    return res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("getProjectById error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. Create Project
const createProject = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const userId = req.user?.id || null;
    const { customer_name, customer_phone, system_capacity_kw } = req.body;

    if (!customer_name || !customer_phone || !system_capacity_kw) {
      return res.status(400).json({
        success: false,
        message: "customer_name, customer_phone, and system_capacity_kw are required.",
      });
    }

    const insertId = await projectModel.createProject(db, req.body, userId);
    return res.status(201).json({
      success: true,
      message: "Project created successfully.",
      data: { id: insertId },
    });
  } catch (error) {
    console.error("createProject error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 4. Update Project Stage
const updateProjectStage = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { id } = req.params;
    const { stage, notes } = req.body;
    const userId = req.user?.id || null;

    if (!stage) {
      return res.status(400).json({
        success: false,
        message: "Stage is required.",
      });
    }

    const result = await projectModel.updateProjectStage(db, id, stage, userId, notes);
    return res.json({
      success: true,
      message: "Project stage updated successfully.",
      data: result,
    });
  } catch (error) {
    console.error("updateProjectStage error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 5. Update Project (Full / Partial edit)
const updateProject = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { id } = req.params;

    const updated = await projectModel.updateProject(db, id, req.body);
    if (!updated) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided to update or project not found.",
      });
    }

    return res.json({
      success: true,
      message: "Project updated successfully.",
      data: { id },
    });
  } catch (error) {
    console.error("updateProject error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 6. Delete Project (Soft Delete, Admin/Manager Only)
const deleteProject = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { id } = req.params;

    // Role check: Only Admin and Manager are allowed
    const roleId = Number(req.user?.role_id);
    const roleName = String(req.user?.role_name || req.user?.role || "").toLowerCase();
    const isAllowed =
      roleId === 1 ||
      roleId === 2 ||
      roleName.includes("admin") ||
      roleName.includes("manager") ||
      roleName.includes("super");

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Admins and Managers can delete projects.",
      });
    }

    const deleted = await projectModel.softDeleteProject(db, id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Project not found or already deleted.",
      });
    }

    return res.json({
      success: true,
      message: "Project deleted successfully.",
    });
  } catch (error) {
    console.error("deleteProject error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 7. Get Project Stage Statistics
const getProjectStats = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const stats = await projectModel.getProjectStats(db);
    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("getProjectStats error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 8. Get Completed Surveys ready for project creation
const getCompletedSurveysHandler = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const [rows] = await db.query(`
      SELECT s.id AS survey_id, s.lead_id, s.scheduled_date, s.feasibility_verdict,
             s.proposed_capacity_kw, s.roof_type, s.roof_area_sqft, s.electrical_phase,
             s.assigned_engineer_id, u.full_name AS engineer_name,
             l.lead_code, l.customer_name, l.mobile_number, l.address, l.city, l.state, l.pincode, l.required_kw,
             p.id AS project_id, p.project_number
      FROM site_surveys s
      JOIN leads l ON s.lead_id = l.id
      LEFT JOIN users u ON s.assigned_engineer_id = u.id
      LEFT JOIN projects p ON (p.lead_id = s.lead_id AND p.is_deleted = 0)
      WHERE s.status = 'completed' AND l.is_deleted = 0
      ORDER BY s.id DESC
      LIMIT 100
    `);
    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("getCompletedSurveysHandler error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProjectStage,
  updateProject,
  deleteProject,
  getProjectStats,
  getCompletedSurveysHandler,
};
