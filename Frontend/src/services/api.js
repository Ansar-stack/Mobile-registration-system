import axios from 'axios';
import i18n from '../i18n';

const API_BASE_URL = import.meta.env.VITE_APP_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach current language to every request
api.interceptors.request.use((config) => {
  config.headers['Accept-Language'] = i18n.language || 'en';
  return config;
});

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Something went wrong';

    if (status === 401 && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }

    error.message = message;
    return Promise.reject(error);
  }
);

export default api;