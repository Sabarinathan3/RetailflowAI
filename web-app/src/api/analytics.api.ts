import { apiClient } from './client';
import type { ApiResponse } from '@/types/api.types';
import type { DashboardData, DailySalesEntry, TopProduct } from '@/types/analytics.types';

export const analyticsApi = {
  getDashboard: (branchId?: string) =>
    apiClient
      .get<ApiResponse<DashboardData>>('/analytics/dashboard', {
        params: branchId ? { branchId } : undefined,
      })
      .then((r) => r.data),

  getDailySales: (params?: { branchId?: string; startDate?: string; endDate?: string }) =>
    apiClient
      .get<ApiResponse<DailySalesEntry[]>>('/analytics/daily-sales', { params })
      .then((r) => r.data),

  getTopProducts: (params?: { branchId?: string; limit?: number }) =>
    apiClient
      .get<ApiResponse<TopProduct[]>>('/analytics/top-products', { params })
      .then((r) => r.data),
};
