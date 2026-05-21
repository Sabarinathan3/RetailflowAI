import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types/api.types';
import { useAdminStore } from '@/store/admin.store';

const API_URL = import.meta.env.VITE_API_URL || 'https://retailflow-api-server.onrender.com/api/v1';

export const adminApiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

adminApiClient.interceptors.request.use((config) => {
  const url = config.url || '';
  const isPublicAdmin =
    url.startsWith('/admin/auth/register') ||
    url.startsWith('/admin/auth/login') ||
    url.startsWith('/admin/auth/refresh');

  if (!isPublicAdmin) {
    const token =
      useAdminStore.getState().accessToken || localStorage.getItem('adminAccessToken');
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let adminRefreshing = false;
let adminQueue: Array<{ resolve: (v?: unknown) => void; reject: (e: unknown) => void }> = [];

const runAdminQueue = (error: unknown) => {
  adminQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(undefined);
  });
  adminQueue = [];
};

adminApiClient.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<{ message?: string }>) => {
    const original = error.config as InternalAxiosRequestConfig & { _adminRetry?: boolean };
    const msg =
      error.response?.data?.message || error.message || 'An unexpected error occurred';

    if (!original || error.response?.status !== 401 || original._adminRetry) {
      return Promise.reject(new Error(msg));
    }

    const url = original.url || '';
    if (
      !url.includes('/admin/') ||
      url.includes('/admin/auth/login') ||
      url.includes('/admin/auth/register')
    ) {
      return Promise.reject(new Error(msg));
    }

    if (adminRefreshing) {
      return new Promise((resolve, reject) => {
        adminQueue.push({ resolve, reject });
      }).then(() => adminApiClient(original));
    }

    original._adminRetry = true;
    adminRefreshing = true;

    const refreshToken =
      useAdminStore.getState().refreshToken || localStorage.getItem('adminRefreshToken');

    if (!refreshToken) {
      adminRefreshing = false;
      useAdminStore.getState().logout();
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminRefreshToken');
      return Promise.reject(new Error(msg));
    }

    try {
      const { data } = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
        `${API_URL}/admin/auth/refresh`,
        { refreshToken }
      );
      if (!data.success || !data.data) {
        throw new Error(data.message || 'Session refresh failed');
      }
      const { accessToken, refreshToken: newRefresh } = data.data;
      useAdminStore.getState().setTokens(accessToken, newRefresh);
      localStorage.setItem('adminAccessToken', accessToken);
      localStorage.setItem('adminRefreshToken', newRefresh);
      original.headers.Authorization = `Bearer ${accessToken}`;
      runAdminQueue(null);
      return adminApiClient(original);
    } catch (e) {
      useAdminStore.getState().logout();
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminRefreshToken');
      runAdminQueue(e);
      return Promise.reject(e instanceof Error ? e : new Error(String(e)));
    } finally {
      adminRefreshing = false;
    }
  }
);

export function unwrapAdminData<T>(response: AxiosResponse<ApiResponse<T>>): T {
  return response.data.data as T;
}

import type { PaginatedResponse } from '@/types/admin.types';

export function unwrapAdminList<T>(response: AxiosResponse<ApiResponse<T[]>>): PaginatedResponse<T> {
  const body = response.data;
  const m = body.meta;
  const data = (Array.isArray(body.data) ? body.data : []) as T[];
  if (!m) {
    return { data, total: data.length, page: 1, limit: data.length || 20, totalPages: 1 };
  }
  return {
    data,
    total: m.total,
    page: m.page,
    limit: m.limit,
    totalPages: m.totalPages,
  };
}
