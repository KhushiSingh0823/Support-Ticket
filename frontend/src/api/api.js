import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Automatically attach token from localStorage
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

// ✅ FIXED: Fetch all messages for a specific ticket
export const getTicketMessages = (ticketId) =>
  API.get(`/chat/ticket/${ticketId}`);

// ✅ Send a new message related to a specific ticket
export const sendTicketMessage = (ticketId, formData) =>
  API.post(`/chat/ticket/${ticketId}/send`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

// ✅ FIXED: Add this line 👇
export default API;
