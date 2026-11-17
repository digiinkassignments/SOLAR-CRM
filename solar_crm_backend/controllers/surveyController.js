const surveyModel = require("../models/surveyModel");

// 1. Schedule Site Survey
const scheduleSurveyHandler = async (req, res) => {
  try {
    const { lead_id, assigned_engineer_id, scheduled_date, scheduled_time, site_notes } = req.body;

    if (!lead_id || !scheduled_date || !scheduled_time) {
      return res.status(400).json({
        success: false,
        message: "lead_id, scheduled_date, and scheduled_time are required.",
      });
    }

    if(![1,2,3,4].includes(Number(req.user.role_id)))return res.sendStatus(403);
    if(!await require('../models/leadModel').isLeadAccessibleByUser(lead_id,req.user.role_id,req.user.id,req.db))return res.sendStatus(404);
    if(!require('../services/field/definitions').validDate(scheduled_date))return res.status(400).json({success:false,message:'Enter a valid survey date.'});
    const [[engineer]]=await req.db.query("SELECT id, full_name, role_id FROM users WHERE id=? AND role_id=4 AND is_deleted=0 AND LOWER(status)='active'",[assigned_engineer_id]);
    if(!engineer)return res.status(400).json({success:false,message:'Choose an active Site Engineer.'});
    const existing=await surveyModel.getSurveyByLeadId(lead_id,req.db);
    if(existing?.status==='completed')return res.status(409).json({success:false,message:'Survey already completed. Assign a follow-up field task instead of overwriting the report.'});
    const exactTime=require('../services/surveyBooking').time(scheduled_time);
    if(!exactTime)return res.status(400).json({success:false,message:'Enter an exact survey time.'});
    require('../services/surveyBooking').location(req.body);
    const createdBy = req.user?.id || null;
    const survey = await surveyModel.scheduleSurvey(
      { ...req.body, lead_id, assigned_engineer_id, scheduled_date, scheduled_time:exactTime, site_notes },
      createdBy,
      req.db
    );

    return res.status(201).json({
      success: true,
      message: "Site survey scheduled successfully.",
      data: survey,
    });
  } catch (error) {
    console.error("scheduleSurveyHandler error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : "Failed to schedule site survey.",
      error: error.message,
    });
  }
};

// 2. Get Survey by Lead ID
const getSurveyByLeadHandler = async (req, res) => {
  try {
    const { leadId } = req.params;
    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: "leadId parameter is required.",
      });
    }

    if(!await require('../models/leadModel').isLeadAccessibleByUser(leadId,req.user.role_id,req.user.id,req.db))return res.sendStatus(404);
    const survey = await surveyModel.getSurveyByLeadId(leadId, req.db);
    return res.status(200).json({
      success: true,
      message: "Survey data retrieved successfully.",
      data: survey,
    });
  } catch (error) {
    console.error("getSurveyByLeadHandler error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch survey details.",
      error: error.message,
    });
  }
};

// 3. Get All Surveys List
const getSurveysListHandler = async (req, res) => {
  try {
    const roleId = Number(req.user.role_id);
    const surveys = await surveyModel.getSurveysList({
      ...req.query,
      user_role_id: roleId,
      current_user_id: req.user.id,
      scope_user_id: [2, 3, 4].includes(roleId) ? req.user.id : null,
      is_engineer: roleId === 4,
      is_sales: roleId === 3,
    }, req.db);
    return res.status(200).json({
      success: true,
      message: "Site surveys fetched successfully.",
      data: surveys,
    });
  } catch (error) {
    console.error("getSurveysListHandler error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch site surveys list.",
      error: error.message,
    });
  }
};

// 4. Complete Survey Execution
const completeSurveyHandler = async (req, res) => {
  try {
    if(![1, 2, 3, 4].includes(Number(req.user.role_id))) return res.sendStatus(403);
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Survey id parameter is required.",
      });
    }

    const existing = await surveyModel.getSurveyById(id, req.db);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Site survey record not found.",
      });
    }

    const updatedSurvey = await surveyModel.completeSurvey(id, req.body, req.db);

    return res.status(200).json({
      success: true,
      message: "Site survey recorded and completed successfully.",
      data: updatedSurvey,
    });
  } catch (error) {
    console.error("completeSurveyHandler error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to complete site survey.",
      error: error.message,
    });
  }
};

// 5. Photo Upload Handler
const uploadPhotosHandler = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No photo files uploaded.",
      });
    }

    const filePaths = req.files.map((file) => `/uploads/surveys/${file.filename}`);

    return res.status(200).json({
      success: true,
      message: "Survey photos uploaded successfully.",
      data: filePaths,
    });
  } catch (error) {
    console.error("uploadPhotosHandler error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload survey photos.",
      error: error.message,
    });
  }
};

// 6. Approve Survey & Convert to Project Handler
const approveSurveyToProjectHandler = async (req, res) => {
  try {
    const roleId = Number(req.user?.role_id);
    if (![1, 2, 4].includes(roleId)) return res.sendStatus(403);

    const { id, leadId } = req.params;
    const { notes, initialStage, assigned_to } = req.body || {};

    const projectData = await surveyModel.approveSurveyAndCreateProject(
      {
        surveyId: id ? Number(id) : null,
        leadId: leadId ? Number(leadId) : null,
        approvedBy: req.user.id,
        notes,
        initialStage,
        assignedTo: assigned_to ? Number(assigned_to) : null,
      },
      req.db
    );

    return res.status(200).json({
      success: true,
      message: `Survey approved and Project ${projectData.project_number} created successfully!`,
      data: projectData,
    });
  } catch (error) {
    console.error("approveSurveyToProjectHandler error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to approve survey and create project.",
    });
  }
};

module.exports = {
  scheduleSurveyHandler,
  getSurveyByLeadHandler,
  getSurveysListHandler,
  completeSurveyHandler,
  uploadPhotosHandler,
  approveSurveyToProjectHandler,
};
