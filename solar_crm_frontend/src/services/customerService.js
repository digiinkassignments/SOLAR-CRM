import api from "../api/axios";

// 1. Get Customers List with filters & stats
export const getCustomers = async (params = {}) => {
  const response = await api.get("/customers", { params });
  return response.data;
};

// 2. Get Single Customer 360 Profile
export const getCustomerById = async (id) => {
  const response = await api.get(`/customers/${id}`);
  return response.data;
};

// 3. Create Customer Manually
export const createCustomer = async (data) => {
  const response = await api.post("/customers", data);
  return response.data;
};

// 4. Update Customer Profile
export const updateCustomer = async (id, data) => {
  const response = await api.put(`/customers/${id}`, data);
  return response.data;
};

// 5. Delete Customer (Admin only)
export const deleteCustomer = async (id) => {
  const response = await api.delete(`/customers/${id}`);
  return response.data;
};
