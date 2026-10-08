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

    const createdBy = req.user?.id || null;
    const survey = await surveyModel.scheduleSurvey(
      { lead_id, assigned_engineer_id, scheduled_date, scheduled_time, site_notes },
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
    return res.status(500).json({
      success: false,
      message: "Failed to schedule site survey.",
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
    const surveys = await surveyModel.getSurveysList(req.query, req.db);
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

module.exports = {
  scheduleSurveyHandler,
  getSurveyByLeadHandler,
  getSurveysListHandler,
  completeSurveyHandler,
  uploadPhotosHandler,
};
