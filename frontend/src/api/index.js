import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl && !envUrl.includes('localhost')) return envUrl;
  
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `http://${window.location.hostname}:5006`;
  }
  return envUrl || 'http://localhost:5006';
};

const API_URL = `${getBaseUrl()}/api`;

export const startEngine = async () => {
  const res = await axios.post(`${API_URL}/engine/start`);
  return res.data;
};

export const stopEngine = async () => {
  const res = await axios.post(`${API_URL}/engine/stop`);
  return res.data;
};

export const getEngineStatus = async () => {
  const res = await axios.get(`${API_URL}/engine/status`);
  return res.data;
};

export const restartEngine = async () => {
  const res = await axios.post(`${API_URL}/engine/restart`);
  return res.data;
};
