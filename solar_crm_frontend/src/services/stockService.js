import api from "../api/axios";

// Fetch all categories
export const getCategories = async () => {
  const response = await api.get("/stock/categories");
  return response.data;
};

// Fetch stock items with search, category, status, sort & pagination
export const getStockItems = async (params) => {
  const response = await api.get("/stock/items", { params });
  return response.data;
};

// Fetch single stock item details
export const getStockItemById = async (id) => {
  const response = await api.get(`/stock/items/${id}`);
  return response.data;
};

// Create new stock item (accepts FormData for image upload or JS object)
export const createStockItem = async (data) => {
  const config = data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
  const response = await api.post("/stock/items", data, config);
  return response.data;
};

// Update stock item
export const updateStockItem = async (id, data) => {
  const config = data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
  const response = await api.put(`/stock/items/${id}`, data, config);
  return response.data;
};

// Delete stock item
export const deleteStockItem = async (id) => {
  const response = await api.delete(`/stock/items/${id}`);
  return response.data;
};

// Bulk Delete stock items
export const bulkDeleteStockItems = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) return { success: true };
  try {
    const response = await api.post("/stock/items/bulk-delete", { ids });
    return response.data;
  } catch (err) {
    if (err.response?.status === 404) {
      await Promise.all(ids.map((id) => api.delete(`/stock/items/${id}`)));
      return { success: true, message: `${ids.length} stock items deleted.` };
    }
    throw err;
  }
};

// Record Stock Transaction (Stock IN / Stock OUT / Adjustment / Reserve)
export const createStockTransaction = async (data) => {
  const response = await api.post("/stock/transactions", data);
  return response.data;
};

// Fetch transaction history
export const getStockTransactions = async (params) => {
  const response = await api.get("/stock/transactions", { params });
  return response.data;
};

// Fetch low stock alerts
export const getStockAlerts = async (params) => {
  const response = await api.get("/stock/alerts", { params });
  return response.data;
};

// Resolve stock alert
export const resolveStockAlert = async (id) => {
  const response = await api.put(`/stock/alerts/${id}/resolve`);
  return response.data;
};

// Fetch Stock Valuation & Inventory Report
export const getStockReport = async () => {
  const response = await api.get("/stock/report");
  return response.data;
};

// Bulk Import stock items from CSV / JSON
export const bulkImportStockItems = async (items) => {
  const response = await api.post("/stock/items/bulk-import", { items });
  return response.data;
};

// Quick Stock IN via Barcode or QR Code Scan
export const quickStockInByBarcode = async (payload) => {
  const response = await api.post("/stock/quick-scan-in", payload);
  return response.data;
};

// Get stock item by Barcode or Code
export const getStockItemByBarcode = async (code) => {
  const response = await api.get(`/stock/items/barcode/${encodeURIComponent(code)}`);
  return response.data;
};

