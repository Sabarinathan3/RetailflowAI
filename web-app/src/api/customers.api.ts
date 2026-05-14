import { apiClient } from './client';
import type { ApiResponse } from '@/types/api.types';
import type { Customer, CreateCustomerInput, UpdateCustomerInput, CustomerSearchParams } from '@/types/customer.types';
import type { Invoice } from '@/types/billing.types';

export const customersApi = {
  search: (params?: CustomerSearchParams) =>
    apiClient.get<ApiResponse<Customer[]>>('/customers', { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Customer>>(`/customers/${id}`).then((r) => r.data),

  create: (data: CreateCustomerInput) =>
    apiClient.post<ApiResponse<Customer>>('/customers', data).then((r) => r.data),

  update: (id: string, data: UpdateCustomerInput) =>
    apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/customers/${id}`).then((r) => r.data),

  getPurchases: (id: string) =>
    apiClient.get<ApiResponse<Invoice[]>>(`/customers/${id}/purchases`).then((r) => r.data),
};
