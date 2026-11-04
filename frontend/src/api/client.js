import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('heartsense_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('heartsense_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/refresh/', {
            refresh: refreshToken,
          });
          const newAccessToken = res.data.access;
          localStorage.setItem('heartsense_access_token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('heartsense_access_token');
          localStorage.removeItem('heartsense_refresh_token');
          localStorage.removeItem('heartsense_user');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('heartsense_access_token');
        localStorage.removeItem('heartsense_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
