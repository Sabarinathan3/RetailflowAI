import { apiClient } from './client';
import type { ApiResponse, PaginationParams } from '@/types/api.types';
import type { Notification } from '@/types/notification.types';

export const notificationsApi = {
  getNotifications: (params?: PaginationParams) =>
    apiClient.get<ApiResponse<Notification[]>>('/notifications', { params }).then((r) => r.data),

  markAsRead: (id: string) =>
    apiClient.patch<ApiResponse<null>>(`/notifications/${id}/read`).then((r) => r.data),

  markAllAsRead: () =>
    apiClient.patch<ApiResponse<null>>('/notifications/read-all').then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/notifications/${id}`).then((r) => r.data),

  getUnreadCount: () =>
    apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread/count').then((r) => r.data),
};
