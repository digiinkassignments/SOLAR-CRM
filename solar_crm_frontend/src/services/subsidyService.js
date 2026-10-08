import api from "../api/axios";

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
