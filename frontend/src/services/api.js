import api from '../api/client';

export const authService = {
  login: (username, password) => api.post('/auth/login/', { username, password }),
  register: (data) => api.post('/auth/register/', data),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  refreshToken: (refresh) => api.post('/auth/refresh/', { refresh }),
};

export const clinicalService = {
  createAssessment: (data) => api.post('/clinical/assessments/', data),
  getHistory: (params) => api.get('/clinical/assessments/history/', { params }),
  getAssessment: (id) => api.get(`/clinical/assessments/${id}/`),
  updateDoctorNotes: (id, data) => api.patch(`/clinical/assessments/${id}/`, data),
  downloadPdf: (id) => api.get(`/clinical/assessments/${id}/pdf/`, { responseType: 'blob' }),
  getPatients: (params) => api.get('/clinical/patients/', { params }),
  getPatient: (id) => api.get(`/clinical/patients/${id}/`),
  updatePatient: (id, data) => api.patch(`/clinical/patients/${id}/`, data),
  deletePatient: (id) => api.delete(`/clinical/patients/${id}/`),
  getDoctorDashboard: () => api.get('/clinical/doctor/dashboard/'),
  getAdminDashboard: () => api.get('/clinical/admin/dashboard/'),
  getAuditLogs: (params) => api.get('/clinical/admin/audit-logs/', { params }),
  sendChatMessage: (data) => api.post('/clinical/chat/', data),
};

export const mlService = {
  getModels: () => api.get('/ml/models/'),
  activateModel: (id) => api.post(`/ml/models/${id}/activate/`),
  retrainModels: () => api.post('/ml/models/retrain/'),
};

export default api;

