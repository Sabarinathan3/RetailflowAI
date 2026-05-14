import { apiClient } from './client';
import type { ApiResponse } from '@/types/api.types';
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductSearchParams,
} from '@/types/product.types';

export const productsApi = {
  search: (params?: ProductSearchParams) =>
    apiClient.get<ApiResponse<Product[]>>('/products', { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Product>>(`/products/${id}`).then((r) => r.data),

  getByBarcode: (barcode: string) =>
    apiClient.get<ApiResponse<Product>>(`/products/barcode/${barcode}`).then((r) => r.data),

  getCategories: () =>
    apiClient.get<ApiResponse<string[]>>('/products/categories').then((r) => r.data),

  getLowStock: () =>
    apiClient.get<ApiResponse<Product[]>>('/products/low-stock').then((r) => r.data),

  create: (data: CreateProductInput) =>
    apiClient.post<ApiResponse<Product>>('/products', data).then((r) => r.data),

  update: (id: string, data: UpdateProductInput) =>
    apiClient.put<ApiResponse<Product>>(`/products/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/products/${id}`).then((r) => r.data),
};
