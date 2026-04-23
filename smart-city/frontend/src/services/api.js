import axios from 'axios';

const API_URL = '/api/complaints';

export const createComplaint = async (formData) => {
  const response = await axios.post(API_URL, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const submitFeedback = async (complaintId, feedbackData) => {
  const response = await axios.post(`${API_URL}/${complaintId}/feedback`, feedbackData);
  return response.data;
};

export const getComplaint = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const updateComplaintStatus = async (id, status) => {
  const response = await axios.put(`${API_URL}/${id}`, { status });
  return response.data;
};

export const getStats = async () => {
  const response = await axios.get(`${API_URL}/stats`);
  return response.data;
};
