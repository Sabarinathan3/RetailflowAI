import axios from 'axios';
import type { ApiResponse } from '@/types/api.types';
import { useAuthStore } from '@/store/auth.store';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ── Request Interceptor ─────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken && accessToken !== 'null' && accessToken !== 'undefined') {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Attach branch context header if available
    const branchId = localStorage.getItem('activeBranchId');
    if (branchId) {
      config.headers['X-Branch-Id'] = branchId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(undefined);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => apiClient(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      if (!refreshToken) {
        logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
          `${API_URL}/auth/refresh`,
          { refreshToken }
        );

        if (response.data.success) {
          const { accessToken: newAccess, refreshToken: newRefresh } = response.data.data;
          setTokens(newAccess, newRefresh);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          processQueue(null);
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError);
        logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Extract error message from API response
    let message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    
    if (error.response?.status === 429) {
      message = 'Too many requests. Please slow down and wait a moment.';
    }

    return Promise.reject(new Error(message));
  }
);
