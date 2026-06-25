import axios from 'axios';

const BASE_URL = '/api/gis';

export const getWards = async (params = {}) => {
  const response = await axios.get(`${BASE_URL}/wards`, { params });
  return response.data;
};

export const getWardComplaints = async (wardId) => {
  const response = await axios.get(`${BASE_URL}/wards/${wardId}/complaints`);
  return response.data;
};

export const getHeatmapData = async (params = {}) => {
  const response = await axios.get(`${BASE_URL}/heatmap`, { params });
  return response.data;
};

export const getClusterData = async (params = {}) => {
  const response = await axios.get(`${BASE_URL}/clusters`, { params });
  return response.data;
};

export const detectWard = async (lat, lng) => {
  const response = await axios.post(`${BASE_URL}/detect-ward`, { lat, lng });
  return response.data;
};

export const getActivityFeed = async () => {
  const response = await axios.get(`${BASE_URL}/activity-feed`);
  return response.data;
};
