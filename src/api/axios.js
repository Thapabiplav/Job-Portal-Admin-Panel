import axios from 'axios';
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearAllTokens,
} from '../utils/authStore';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : '');

const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL.replace(/\/$/, '')}/api` : '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    const url = config.url || '';
    if ((url.includes('/auth/refresh') || url.includes('/auth/logout')) && getRefreshToken()) {
      config.headers['X-Refresh-Token'] = getRefreshToken();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status !== 401) return Promise.reject(error);

    const isRefreshRoute = originalRequest?.url?.includes('/auth/refresh');
    if (isRefreshRoute) {
      clearAllTokens();
      refreshPromise = null;
      return Promise.reject(error);
    }
    if (originalRequest._retry) return Promise.reject(error);

    let isCrossOrigin = false;
    if (API_BASE_URL && typeof window !== 'undefined') {
      try {
        const apiOrigin = new URL(API_BASE_URL.replace(/\/+$/, '')).origin;
        isCrossOrigin = apiOrigin !== window.location.origin;
      } catch {
        isCrossOrigin = false;
      }
    }
    if (isCrossOrigin && !getRefreshToken()) {
      clearAllTokens();
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      if (!refreshPromise) {
        refreshPromise = api.post('/auth/refresh').then((res) => {
          if (res.data?.accessToken) {
            setAccessToken(res.data.accessToken);
            if (res.data?.refreshToken) setRefreshToken(res.data.refreshToken);
          }
          return res;
        }).catch((err) => {
          refreshPromise = null;
          throw err;
        });
      }
      const refreshRes = await refreshPromise;
      refreshPromise = null;
      if (refreshRes?.data?.accessToken) {
        originalRequest.headers.Authorization = `Bearer ${refreshRes.data.accessToken}`;
        return api(originalRequest);
      }
    } catch (refreshErr) {
      refreshPromise = null;
      clearAllTokens();
      return Promise.reject(refreshErr);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  getMe: () => api.get('/auth/me'),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  getJobs: (params) => api.get('/admin/jobs', { params }),
  deleteJob: (id) => api.delete(`/admin/jobs/${id}`),
  getOrganizations: (params) => api.get('/admin/organizations', { params }),
  verifyOrganization: (id) => api.put(`/admin/organizations/${id}/verify`),
};

export default api;
