import api from "../api/axios";

/**
 * AI Lead Copilot Service
 * Calls backend GET /api/ai/lead-copilot/:id to get real-time AI insights
 */
export const getLeadCopilotInsights = async (leadId) => {
  const response = await api.get(`/ai/lead-copilot/${leadId}`);
  return response.data;
};

/**
 * AI Proposal & Savings Engine Service
 * Calls backend POST /api/ai/proposal-analysis
 */
export const getAIProposalSavings = async (specs) => {
  const response = await api.post("/ai/proposal-analysis", specs);
  return response.data;
};

export default {
  getLeadCopilotInsights,
  getAIProposalSavings,
};
