const { getLeadById, getFollowups } = require("../models/leadModel");
const {
  analyzeLeadWithGemini,
  generateProposalSavingsWithGemini
} = require("../services/geminiService");

/**
 * GET /api/ai/lead-copilot/:id
 * Analyzes lead with Google Gemini AI to return closure probability,
 * talking script, recommended system, subsidy, and WhatsApp pitches.
 */
const getLeadCopilotAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.db;

    const leads = await getLeadById(id, db);
    if (!leads || leads.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Lead not found."
      });
    }

    const lead = leads[0];
    let followups = [];
    try {
      followups = await getFollowups(id, db);
    } catch (fErr) {
      console.warn("[getLeadCopilotAnalysis] Could not fetch followups:", fErr.message);
    }

    const analysis = await analyzeLeadWithGemini(lead, followups);

    return res.status(200).json({
      success: true,
      message: "Lead copilot analysis generated successfully.",
      data: {
        lead_id: lead.id,
        lead_code: lead.lead_code,
        customer_name: lead.customer_name,
        mobile_number: lead.mobile_number,
        city: lead.city,
        state: lead.state,
        ...analysis
      }
    });
  } catch (error) {
    console.error("[getLeadCopilotAnalysis] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate AI lead analysis.",
      error: error.message
    });
  }
};

/**
 * POST /api/ai/proposal-analysis
 * Generates proposal executive summary, 25-yr ROI, and carbon offset
 */
const getProposalSavingsAnalysis = async (req, res) => {
  try {
    const specs = req.body || {};
    const analysis = await generateProposalSavingsWithGemini(specs);

    return res.status(200).json({
      success: true,
      message: "AI proposal analysis generated successfully.",
      data: analysis
    });
  } catch (error) {
    console.error("[getProposalSavingsAnalysis] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate AI proposal analysis.",
      error: error.message
    });
  }
};

module.exports = {
  getLeadCopilotAnalysis,
  getProposalSavingsAnalysis
};
