import api from './api';

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (data) => api.post('/auth/signup', data),
  me: () => api.get('/auth/me'),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
};

export const assetApi = {
  list: (params) => api.get('/assets', { params }),
  getById: (id) => api.get(`/assets/${id}`),
  create: (data) => api.post('/assets', data),
  update: (id, data) => api.patch(`/assets/${id}`, data),
  transition: (id, toStatus, reason) => api.post(`/assets/${id}/transition`, { toStatus, reason }),
  stats: () => api.get('/assets/stats/summary'),
};

export const masterApi = {
  dashboard: () => api.get('/dashboard/overview'),
  departments: () => api.get('/departments'),
  createDepartment: (data) => api.post('/departments', data),
  locations: () => api.get('/locations'),
  createLocation: (data) => api.post('/locations', data),
  categories: () => api.get('/categories'),
  createCategory: (data) => api.post('/categories', data),
  vendors: () => api.get('/vendors'),
  createVendor: (data) => api.post('/vendors', data),
  notifications: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  listUsers: () => api.get('/users'),
  updateUserRole: (id, data) => api.patch(`/users/${id}/role`, data),
  listAuditLogs: () => api.get('/audit-logs'),
};

export const assignmentApi = {
  listRequests: (params) => api.get('/assignments/requests', { params }),
  createRequest: (data) => api.post('/assignments/requests', data),
  approveRequest: (id, data) => api.post(`/assignments/requests/${id}/approve`, data),
  rejectRequest: (id, rejectionReason) =>
    api.post(`/assignments/requests/${id}/reject`, { rejectionReason }),
  list: (params) => api.get('/assignments', { params }),
  my: () => api.get('/assignments/my'),
  returnAssignment: (id, data) => api.post(`/assignments/${id}/return`, data),
};

export const bookingApi = {
  create: (data) => api.post('/bookings', data),
  list: (params) => api.get('/bookings', { params }),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
};

export const maintenanceApi = {
  create: (data) => api.post('/maintenances', data),
  list: (params) => api.get('/maintenances', { params }),
  approve: (id, data) => api.put(`/maintenances/${id}/approve`, data),
  assign: (id, data) => api.put(`/maintenances/${id}/assign`, data),
  start: (id) => api.put(`/maintenances/${id}/start`),
  resolve: (id, data) => api.put(`/maintenances/${id}/resolve`, data),
};

export const auditApi = {
  create: (data) => api.post('/audits', data),
  list: () => api.get('/audits'),
  getById: (id) => api.get(`/audits/${id}`),
  checkItem: (id, itemId, data) => api.put(`/audits/${id}/items/${itemId}`, data),
  close: (id) => api.put(`/audits/${id}/close`),
};

export const reportApi = {
  get: () => api.get('/reports'),
};
