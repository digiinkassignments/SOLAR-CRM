import api from "../api/axios";

// Book order / convert lead to Deal Won
export const closeOrder = async (orderData) => {
  const response = await api.post("/deals/close-order", orderData);
  return response.data;
};

// Get order details by lead ID
export const getOrderByLead = async (leadId) => {
  const response = await api.get(`/deals/order/${leadId}`);
  return response.data;
};
