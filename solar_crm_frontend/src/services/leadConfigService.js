import axios from "axios";

const API_BASE = "/api/lead-config";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ── Lead Sources ─────────────────────────────────────────────
export const getLeadSources = async (includeInactive = false) => {
  const res = await axios.get(`${API_BASE}/lead-sources?include_inactive=${includeInactive}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const createLeadSource = async (name) => {
  const res = await axios.post(
    `${API_BASE}/lead-sources`,
    { name },
    { headers: getAuthHeaders() }
  );
  return res.data;
};

export const updateLeadSource = async (id, data) => {
  const res = await axios.put(`${API_BASE}/lead-sources/${id}`, data, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const deleteLeadSource = async (id) => {
  const res = await axios.delete(`${API_BASE}/lead-sources/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// ── Pipeline Statuses ────────────────────────────────────────
export const getPipelineStatuses = async (includeInactive = false) => {
  const res = await axios.get(`${API_BASE}/pipeline-statuses?include_inactive=${includeInactive}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const createPipelineStatus = async (data) => {
  const res = await axios.post(`${API_BASE}/pipeline-statuses`, data, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const updatePipelineStatus = async (id, data) => {
  const res = await axios.put(`${API_BASE}/pipeline-statuses/${id}`, data, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const deletePipelineStatus = async (id) => {
  const res = await axios.delete(`${API_BASE}/pipeline-statuses/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const reorderPipelineStatuses = async (orderList) => {
  const res = await axios.post(
    `${API_BASE}/pipeline-statuses/reorder`,
    { orderList },
    { headers: getAuthHeaders() }
  );
  return res.data;
};
