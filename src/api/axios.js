import axios from 'axios';
import {
  clearAllTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
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
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers?.Authorization) {
      delete config.headers.Authorization;
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

    originalRequest._retry = true;
    try {
      if (!refreshPromise) {
        const rt = getRefreshToken();
        const refreshPayload = rt ? { refresh_token: rt } : {};
        const refreshConfig = rt ? { headers: { 'X-Refresh-Token': rt } } : undefined;
        refreshPromise = api
          .post('/auth/refresh', refreshPayload, refreshConfig)
          .then((res) => res)
          .catch((err) => {
            refreshPromise = null;
            throw err;
          });
      }
      const refreshRes = await refreshPromise;
      refreshPromise = null;
      if (refreshRes?.status === 200) {
        const newAccess =
          refreshRes?.data?.access_token || refreshRes?.data?.accessToken || null;
        if (newAccess) setAccessToken(newAccess);
        const newRt = refreshRes?.data?.refresh_token || null;
        if (newRt) setRefreshToken(newRt);
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
  refresh: () => {
    const rt = getRefreshToken();
    const payload = rt ? { refresh_token: rt } : {};
    const cfg = rt ? { headers: { 'X-Refresh-Token': rt } } : undefined;
    return api.post('/auth/refresh', payload, cfg);
  },
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
  getCandidateVerificationRequests: async (params) => {
    try {
      return await api.get('/admin/candidate-verifications', { params });
    } catch (err) {
      const isNotFound = err?.response?.status === 404;
      if (!isNotFound) throw err;
      return api.get('/admin/candidate-verification-requests', { params });
    }
  },
  verifyCandidateRequest: async (id) => {
    try {
      return await api.put(`/admin/candidate-verifications/${id}/verify`);
    } catch (err) {
      const isNotFound = err?.response?.status === 404;
      if (!isNotFound) throw err;
      return api.put(`/admin/candidate-verification-requests/${id}/verify`);
    }
  },
  getOrders: (params) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id, status) => api.patch(`/admin/orders/${id}/status`, { status }),
  contactVendorByEmail: (id, payload = {}) =>
    api.post(`/admin/orders/${id}/contact-vendor-email`, payload),
  getServiceBookings: (params) => api.get("/admin/service-bookings", { params }),
  updateServiceBookingStatus: (id, status) =>
    api.patch(`/admin/service-bookings/${id}/status`, { status }),
  contactServiceVendorByEmail: (id, payload = {}) =>
    api.post(`/admin/service-bookings/${id}/contact-vendor-email`, payload),
};

export default api;
