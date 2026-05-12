import axios from 'axios';
import i18n from '../i18n';

const API_BASE_URL = import.meta.env.VITE_APP_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  config.headers['Accept-Language'] = i18n.language || 'en';
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  if (accessToken) config.headers['Authorization'] = `Bearer ${accessToken}`;
  if (refreshToken) config.headers['x-refresh-token'] = refreshToken;
  return config;
});

api.interceptors.response.use(
  (response) => {
    const newAccessToken = response.headers['x-new-access-token'];
    const newRefreshToken = response.headers['x-new-refresh-token'];
    if (newAccessToken) localStorage.setItem('accessToken', newAccessToken);
    if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Something went wrong';

    if (status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }

    if (status === 403) {
      const data = error.response?.data;
      // Only force logout if the account is deactivated (not a regular forbidden)
      if (data?.message?.toLowerCase().includes('deactivated') || data?.message?.toLowerCase().includes('غیر فعال')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    error.message = message;
    return Promise.reject(error);
  }
);

export default api;