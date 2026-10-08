import api from "../api/axios";

// Schedule a new site survey
export const scheduleSurvey = async (surveyData) => {
  const response = await api.post("/surveys/schedule", surveyData);
  return response.data;
};

// Get survey details by Lead ID
export const getSurveyByLead = async (leadId) => {
  const response = await api.get(`/surveys/lead/${leadId}`);
  return response.data;
};

// Get list of all site surveys
export const getSurveysList = async (params = {}) => {
  const response = await api.get("/surveys", { params });
  return response.data;
};

// Record survey measurements, checklist, and complete
export const completeSurvey = async (surveyId, executionData) => {
  const response = await api.put(`/surveys/${surveyId}/complete`, executionData);
  return response.data;
};

// Upload site photos
export const uploadSurveyPhotos = async (formData) => {
  const response = await api.post("/surveys/upload-photos", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
