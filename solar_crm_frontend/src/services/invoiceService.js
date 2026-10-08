import api from "../api/axios";

// Fetch invoices
export const getInvoices = async (params) => {
  const response = await api.get("/invoices", { params });
  return response.data;
};

// Get single invoice by ID
export const getInvoiceById = async (id) => {
  const response = await api.get(`/invoices/${id}`);
  return response.data;
};

// Create new invoice
export const createInvoice = async (data) => {
  const response = await api.post("/invoices", data);
  return response.data;
};

// Record installment payment
export const recordPayment = async (id, data) => {
  const response = await api.post(`/invoices/${id}/payments`, data);
  return response.data;
};

// Delete single invoice
export const deleteInvoice = async (id) => {
  const response = await api.delete(`/invoices/${id}`);
  return response.data;
};

// Bulk delete invoices with fallback
export const bulkDeleteInvoices = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) return { success: true };
  try {
    const response = await api.post("/invoices/bulk-delete", { ids });
    return response.data;
  } catch (err) {
    if (err.response?.status === 404) {
      await Promise.all(ids.map((id) => api.delete(`/invoices/${id}`)));
      return { success: true, message: `${ids.length} invoices deleted.` };
    }
    throw err;
  }
};
