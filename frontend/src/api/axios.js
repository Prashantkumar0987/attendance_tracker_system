import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://attendance-tracker-system-ktp9.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('att_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('att_token');
      localStorage.removeItem('att_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
