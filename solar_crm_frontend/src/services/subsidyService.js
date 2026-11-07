import api from "../api/axios";

// Fetch all subsidies list with stage, owner, and SLA metadata
export const getSubsidiesList = async (params = {}) => {
  const response = await api.get("/subsidy/list", { params });
  return response.data;
};

// Create or update subsidy application details
export const applySubsidy = async (subsidyData) => {
  const response = await api.post("/subsidy/apply", subsidyData);
  return response.data;
};

// Get subsidy application and customer documents for lead
export const getSubsidyByLead = async (leadId) => {
  const response = await api.get(`/subsidy/${leadId}`);
  return response.data;
};

// Upload customer KYC document
export const uploadCustomerDoc = async (formData) => {
  const response = await api.post("/subsidy/upload-doc", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Verify or reject customer document
export const verifyCustomerDoc = async (docId, statusData) => {
  const response = await api.put(`/subsidy/verify-doc/${docId}`, statusData);
  return response.data;
};

// Log a subsidy portal rejection and create actionable fix task
export const logSubsidyRejection = async (rejectionData) => {
  const response = await api.post("/subsidy/reject", rejectionData);
  return response.data;
};

// Mark rejection fix task as resolved
export const resolveRejectionFixTask = async (rejectionLogId) => {
  const response = await api.put(`/subsidy/resolve-fix/${rejectionLogId}`);
  return response.data;
};
