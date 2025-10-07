import axiosInstance from './axiosInstance';

// Auth API calls
export const authAPI = {
  register: (userData) => axiosInstance.post('/auth/register', userData),
  login: (credentials) => axiosInstance.post('/auth/login', credentials),
  getProfile: () => axiosInstance.get('/auth/profile'),
};

// Documents API calls
export const docsAPI = {
  uploadDocument: (formData) => 
    axiosInstance.post('/docs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getDocuments: (params = {}) => axiosInstance.get('/docs', { params }),
  getDocument: (id, token = null) => 
    axiosInstance.get(`/docs/${id}`, { params: token ? { token } : {} }),
  deleteDocument: (id) => axiosInstance.delete(`/docs/${id}`),
  generateShareToken: (id) => axiosInstance.post(`/docs/${id}/share`),
};

// Q&A API calls
export const askAPI = {
  askQuestion: (questionData) => axiosInstance.post('/ask', questionData),
  getQueryHistory: () => axiosInstance.get('/ask/history'),
};

// Index API calls
export const indexAPI = {
  getStats: () => axiosInstance.get('/index/stats'),
  rebuildIndex: () => axiosInstance.post('/index/rebuild'),
  getHealth: () => axiosInstance.get('/index/health'),
  clearCache: () => axiosInstance.delete('/index/cache'),
};

// Admin API calls
export const adminAPI = {
  getDashboard: () => axiosInstance.get('/admin/dashboard'),
  getUsers: (params = {}) => axiosInstance.get('/admin/users', { params }),
  updateUser: (id, userData) => axiosInstance.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => axiosInstance.delete(`/admin/users/${id}`),
  getAllDocuments: (params = {}) => axiosInstance.get('/admin/documents', { params }),
  getSystemLogs: () => axiosInstance.get('/admin/logs'),
};