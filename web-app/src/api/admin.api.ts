import { adminApiClient, unwrapAdminData, unwrapAdminList } from './admin-client';
import type { ApiResponse, PaginationParams } from '@/types/api.types';
import type {
  AdminUsageAnalytics,
  AdminShopWithCounts,
  UpdateSubscriptionDTO,
  ToggleShopActiveDTO,
  UpdateFeatureFlagsDTO,
  AdminAuthResponse,
  AdminLoginInput,
  AdminRegisterInput,
  AdminUser,
  ActivityLogResponse,
  DashboardAnalytics,
  InventoryReportResponse,
  SalesReportResponse,
  PaginatedResponse,
  SalesReportFilter,
  AdminPlanDefinition,
} from '@/types/admin.types';

/**
 * Platform admin API — uses dedicated axios instance with admin JWT (not tenant auth).
 */
export const adminApi = {
  register: async (data: AdminRegisterInput): Promise<AdminAuthResponse> => {
    const response = await adminApiClient.post<ApiResponse<AdminAuthResponse>>(
      '/admin/auth/register',
      data
    );
    return unwrapAdminData(response);
  },

  login: async (data: AdminLoginInput): Promise<AdminAuthResponse> => {
    const response = await adminApiClient.post<ApiResponse<AdminAuthResponse>>(
      '/admin/auth/login',
      data
    );
    return unwrapAdminData(response);
  },

  logout: async (): Promise<void> => {
    await adminApiClient.post('/admin/auth/logout');
  },

  refreshToken: async (refreshToken: string) => {
    const response = await adminApiClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      '/admin/auth/refresh',
      { refreshToken }
    );
    return unwrapAdminData(response);
  },

  getProfile: async () => {
    const response = await adminApiClient.get<ApiResponse<unknown>>('/admin/auth/profile');
    return unwrapAdminData(response);
  },

  listAdminUsers: async (params?: PaginationParams): Promise<PaginatedResponse<AdminUser>> => {
    const response = await adminApiClient.get<ApiResponse<AdminUser[]>>('/admin/users', { params });
    return unwrapAdminList(response);
  },

  getAdminUser: async (id: string) => {
    const response = await adminApiClient.get<ApiResponse<unknown>>(`/admin/users/${id}`);
    return unwrapAdminData(response);
  },

  updateAdminUser: async (id: string, data: unknown) => {
    const response = await adminApiClient.put<ApiResponse<unknown>>(`/admin/users/${id}`, data);
    return unwrapAdminData(response);
  },

  deleteAdminUser: async (id: string) => {
    await adminApiClient.delete(`/admin/users/${id}`);
  },

  getActivityLogs: async (
    params?: PaginationParams & { action?: string; resource?: string }
  ): Promise<PaginatedResponse<ActivityLogResponse>> => {
    const response = await adminApiClient.get<ApiResponse<ActivityLogResponse[]>>('/admin/logs', {
      params,
    });
    return unwrapAdminList(response);
  },

  getSettings: async (params?: Record<string, unknown>) => {
    const response = await adminApiClient.get<ApiResponse<unknown>>('/admin/settings', { params });
    return unwrapAdminData(response);
  },

  updateSetting: async (key: string, value: unknown, category?: string) => {
    const response = await adminApiClient.put<ApiResponse<unknown>>('/admin/settings', {
      key,
      value,
      category,
    });
    return unwrapAdminData(response);
  },

  getDashboard: async (): Promise<DashboardAnalytics> => {
    const response = await adminApiClient.get<ApiResponse<DashboardAnalytics>>('/admin/dashboard');
    return unwrapAdminData(response);
  },

  getUsageAnalytics: async (): Promise<AdminUsageAnalytics> => {
    const response = await adminApiClient.get<ApiResponse<AdminUsageAnalytics>>('/admin/analytics');
    return unwrapAdminData(response);
  },

  getSubscriptionPlans: async (): Promise<AdminPlanDefinition[]> => {
    const response = await adminApiClient.get<ApiResponse<AdminPlanDefinition[]>>(
      '/admin/subscription-plans'
    );
    return unwrapAdminData(response);
  },

  generateSalesReport: async (filter: SalesReportFilter): Promise<SalesReportResponse> => {
    const response = await adminApiClient.post<ApiResponse<SalesReportResponse>>(
      '/admin/reports/sales',
      {
        startDate: filter.startDate.toISOString(),
        endDate: filter.endDate.toISOString(),
        shopId: filter.shopId,
        branchId: filter.branchId,
        paymentMode: filter.paymentMode,
      }
    );
    return unwrapAdminData(response);
  },

  generateInventoryReport: async (): Promise<InventoryReportResponse> => {
    const response = await adminApiClient.get<ApiResponse<InventoryReportResponse>>(
      '/admin/reports/inventory'
    );
    return unwrapAdminData(response);
  },

  listShops: async (params?: PaginationParams) => {
    const response = await adminApiClient.get<ApiResponse<AdminShopWithCounts[]>>('/admin/shops', {
      params,
    });
    return response.data;
  },

  getShop: async (id: string) => {
    const response = await adminApiClient.get<ApiResponse<AdminShopWithCounts>>(`/admin/shops/${id}`);
    return response.data;
  },

  getShopMetrics: async (id: string) => {
    const response = await adminApiClient.get<ApiResponse<unknown>>(`/admin/shops/${id}/metrics`);
    return unwrapAdminData(response);
  },

  updateSubscription: async (id: string, data: UpdateSubscriptionDTO) => {
    const response = await adminApiClient.put<ApiResponse<AdminShopWithCounts>>(
      `/admin/shops/${id}/subscription`,
      data
    );
    return response.data;
  },

  toggleActive: async (id: string, data: ToggleShopActiveDTO) => {
    const response = await adminApiClient.patch<ApiResponse<AdminShopWithCounts>>(
      `/admin/shops/${id}/toggle`,
      data
    );
    return response.data;
  },

  toggleShopActive: async (id: string, isActive: boolean) => {
    const response = await adminApiClient.patch<ApiResponse<AdminShopWithCounts>>(
      `/admin/shops/${id}/toggle`,
      { isActive }
    );
    return unwrapAdminData(response);
  },

  updateFeatureFlags: async (id: string, data: UpdateFeatureFlagsDTO) => {
    const response = await adminApiClient.put<ApiResponse<AdminShopWithCounts>>(
      `/admin/shops/${id}/feature-flags`,
      data
    );
    return response.data;
  },
};
