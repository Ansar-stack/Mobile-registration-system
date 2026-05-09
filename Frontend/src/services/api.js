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

// Attach current language and tokens to every request
api.interceptors.request.use((config) => {
  config.headers['Accept-Language'] = i18n.language || 'en';
  
  // Add tokens from localStorage
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  if (refreshToken) {
    config.headers['X-Refresh-Token'] = refreshToken;
  }
  
  return config;
});

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    // Store tokens if they're in the response
    if (response.data?.data?.accessToken) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
    }
    if (response.data?.data?.refreshToken) {
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Something went wrong';

    if (status === 401) {
      // Clear tokens on unauthorized
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    error.message = message;
    return Promise.reject(error);
  }
);

export default api;