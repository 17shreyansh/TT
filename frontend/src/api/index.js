import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

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
