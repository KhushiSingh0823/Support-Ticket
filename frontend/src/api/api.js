import axios from 'axios';

// Use environment variable for API base URL
const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

// Automatically attach token from localStorage (for authentication)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Update ticket status
export const updateTicketStatus = (ticketId, status) =>
  API.patch(`/tickets/update-status/${ticketId}`, { status });

// ✅ Get all messages for a specific ticket
export const getTicketMessages = (ticketId) =>
  API.get(`/chat/ticket/${ticketId}`);

// ✅ Send a new message related to a specific ticket
export const sendTicketMessage = (ticketId, formData) =>
  API.post(`/chat/ticket/${ticketId}/send`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

// ✅ Export the configured Axios instance
export default API;
