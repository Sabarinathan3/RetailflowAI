import { apiClient } from './client';
import type { ApiResponse } from '@/types/api.types';
import type { Branch } from '@/types/branch.types';

export const branchesApi = {
  list: () =>
    apiClient.get<ApiResponse<Branch[]>>('/branches').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Branch>>(`/branches/${id}`).then((r) => r.data),

  create: (data: Partial<Branch>) =>
    apiClient.post<ApiResponse<Branch>>('/branches', data).then((r) => r.data),

  update: (id: string, data: Partial<Branch>) =>
    apiClient.put<ApiResponse<Branch>>(`/branches/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/branches/${id}`).then((r) => r.data),
};
