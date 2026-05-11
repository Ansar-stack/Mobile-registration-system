import api from './api';

export const authService = {
  login: (email, password) => api.post('/api/v1/auth/login', { email, password }),
  forgotPassword: (email) => api.post('/api/v1/auth/forgot-password', { email }),
  resetPassword: (password, token) => api.post('/api/v1/auth/reset-password', { password, token }),
  verify: () => api.get('/api/v1/auth/verify'),
  changePassword: (data) => api.patch('/api/v1/auth/change-password', data),
  logout: () => api.post('/api/v1/auth/logout'),
};

// User-scoped customer routes
export const customerService = {
  getAll: (params) => api.get('/api/v1/customers', { params }),
  getById: (id) => api.get(`/api/v1/customers/${id}`),
  create: (formData) => api.post('/api/v1/customers', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAddresses: (customerId) => api.get(`/api/v1/customers/${customerId}/addresses`),
  addAddresses: (customerId, data) => api.post(`/api/v1/customers/${customerId}/addresses`, data),
};

// User-scoped mobile routes
export const mobileService = {
  getAll: (params) => api.get('/api/v1/mobiles', { params }),
  getById: (id) => api.get(`/api/v1/mobiles/${id}`),
  create: (data) => api.post('/api/v1/mobiles', data),
};

// User-scoped transaction routes
export const transactionService = {
  getAll: (params) => api.get('/api/v1/transactions', { params }),
  getById: (id) => api.get(`/api/v1/transactions/${id}`),
  create: (data) => api.post('/api/v1/transactions', data),
};

// Admin-scoped routes
export const adminCustomerService = {
  getAll: (params) => api.get('/api/v1/admin/customers', { params }),
  getById: (id) => api.get(`/api/v1/admin/customers/${id}`),
  update: (id, data) => api.patch(`/api/v1/admin/customers/${id}`, data),
  delete: (id) => api.delete(`/api/v1/admin/customers/${id}`),
};

export const adminMobileService = {
  getAll: (params) => api.get('/api/v1/admin/mobiles', { params }),
  getById: (id) => api.get(`/api/v1/admin/mobiles/${id}`),
  update: (id, data) => api.patch(`/api/v1/admin/mobiles/${id}`, data),
  delete: (id) => api.delete(`/api/v1/admin/mobiles/${id}`),
};

export const adminTransactionService = {
  getAll: (params) => api.get('/api/v1/admin/transactions', { params }),
  getById: (id) => api.get(`/api/v1/admin/transactions/${id}`),
  delete: (id) => api.delete(`/api/v1/admin/transactions/${id}`),
};

export const adminUserService = {
  getAll: (params) => api.get('/api/v1/admin/user/users', { params }),
  getById: (id) => api.get(`/api/v1/admin/user/users/${id}`),
  getUserMobiles: (id, params) => api.get(`/api/v1/admin/user/users/${id}/mobiles`, { params }),
  getUserCustomers: (id, params) => api.get(`/api/v1/admin/user/users/${id}/customers`, { params }),
  getUserTransactions: (id, params) => api.get(`/api/v1/admin/user/users/${id}/transactions`, { params }),
  create: (data) => api.post('/api/v1/admin/user/users', data),
  update: (id, data) => api.patch(`/api/v1/admin/user/users/${id}`, data),
  toggleActive: (id) => api.patch(`/api/v1/admin/user/users/${id}/toggle-active`),
  delete: (id) => api.delete(`/api/v1/admin/user/users/${id}`),
};

export const adminStolenMobileService = {
  getAll: (params) => api.get('/api/v1/admin/stolen-mobile/stolen-mobiles', { params }),
  getById: (id) => api.get(`/api/v1/admin/stolen-mobile/stolen-mobiles/${id}`),
  create: (data) => api.post('/api/v1/admin/stolen-mobile/stolen-mobiles', data),
  update: (id, data) => api.patch(`/api/v1/admin/stolen-mobile/stolen-mobiles/${id}`, data),
  delete: (id) => api.delete(`/api/v1/admin/stolen-mobile/stolen-mobiles/${id}`),
};

export const notificationService = {
  getAll: (params) => api.get('/api/v1/admin/notifications', { params }),
  getById: (id) => api.get(`/api/v1/admin/notifications/${id}`),
  markAsRead: (id) => api.patch(`/api/v1/admin/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/api/v1/admin/notifications/read-all'),
  delete: (id) => api.delete(`/api/v1/admin/notifications/${id}`),
  deleteAllRead: () => api.delete('/api/v1/admin/notifications/delete-all-read'),
  downloadPdf: (id) => api.get(`/api/v1/admin/notifications/${id}/pdf`, { responseType: 'blob' }),
};

export const dashboardService = {
  getStats: () => api.get('/api/v1/admin/dashboard'),
};


export const adminDetectedStolenMobileService = {
  getAll: (params) => api.get('/api/v1/admin/detected-stolen-mobile/detected-stolen-mobiles', { params }),
  getById: (id) => api.get(`/api/v1/admin/detected-stolen-mobile/detected-stolen-mobiles/${id}`),
  delete: (id) => api.delete(`/api/v1/admin/detected-stolen-mobile/detected-stolen-mobiles/${id}`),
  getStats: () => api.get('/api/v1/admin/detected-stolen-mobile/detected-stolen-mobiles/stats'),
};