import api from "../api/axios";

// Fetch quotations with filters
export const getQuotations = async (params) => {
  const response = await api.get("/quotations", { params });
  return response.data;
};

// Get single quotation by ID
export const getQuotationById = async (id) => {
  const response = await api.get(`/quotations/${id}`);
  return response.data;
};

// Create new quotation
export const createQuotation = async (data) => {
  const response = await api.post("/quotations", data);
  return response.data;
};

// Update quotation
export const updateQuotation = async (id, data) => {
  const response = await api.put(`/quotations/${id}`, data);
  return response.data;
};

// Delete single quotation
export const deleteQuotation = async (id) => {
  const response = await api.delete(`/quotations/${id}`);
  return response.data;
};

// Duplicate quotation
export const duplicateQuotation = async (id) => {
  const response = await api.post(`/quotations/${id}/duplicate`);
  return response.data;
};

// Update quotation status
export const updateQuotationStatus = async (id, status) => {
  const response = await api.patch(`/quotations/${id}/status`, { status });
  return response.data;
};

// Bulk delete quotations with fallback
export const bulkDeleteQuotations = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) return { success: true };
  try {
    const response = await api.post("/quotations/bulk-delete", { ids });
    return response.data;
  } catch (err) {
    if (err.response?.status === 404) {
      await Promise.all(ids.map((id) => api.delete(`/quotations/${id}`)));
      return { success: true, message: `${ids.length} quotations deleted.` };
    }
    throw err;
  }
};
