import { apiClient } from './client';
import type { ApiResponse, PaginationParams } from '@/types/api.types';
import type { Supplier, PurchaseOrder, CreatePurchaseOrderInput } from '@/types/supplier.types';

export const suppliersApi = {
  // ── Suppliers ──────────────────────────────────────────────────────────

  getSuppliers: (params?: PaginationParams & { search?: string }) =>
    apiClient
      .get<ApiResponse<Supplier[]>>('/suppliers', { params })
      .then((r) => r.data),

  getSupplier: (id: string) =>
    apiClient
      .get<ApiResponse<Supplier>>(`/suppliers/${id}`)
      .then((r) => r.data),

  createSupplier: (data: Partial<Supplier>) =>
    apiClient
      .post<ApiResponse<Supplier>>('/suppliers', data)
      .then((r) => r.data),

  updateSupplier: (id: string, data: Partial<Supplier>) =>
    apiClient
      .put<ApiResponse<Supplier>>(`/suppliers/${id}`, data)
      .then((r) => r.data),

  deleteSupplier: (id: string) =>
    apiClient
      .delete<ApiResponse<void>>(`/suppliers/${id}`)
      .then((r) => r.data),

  getRecommendations: () =>
    apiClient
      .get<ApiResponse<Supplier[]>>('/suppliers/ai/recommendations')
      .then((r) => r.data),

  analyzeRisk: (id: string) =>
    apiClient
      .post<ApiResponse<{ riskStatus: 'LOW' | 'MEDIUM' | 'HIGH', tags: string[], insights: string }>>(`/suppliers/${id}/ai-risk`)
      .then((r) => r.data),

  // ── Ledgers ────────────────────────────────────────────────────────────

  createLedger: (data: any) =>
    apiClient
      .post<ApiResponse<any>>('/suppliers/ledgers', data)
      .then((r) => r.data),

  getLedgers: (supplierId: string, params?: PaginationParams) =>
    apiClient
      .get<ApiResponse<any[]>>(`/suppliers/${supplierId}/ledgers`, { params })
      .then((r) => r.data),

  addLedgerPayment: (ledgerId: string, data: { amount: number, paymentMode: string, notes?: string }) =>
    apiClient
      .post<ApiResponse<any>>(`/suppliers/ledgers/${ledgerId}/payments`, data)
      .then((r) => r.data),

  // ── Purchase Orders ────────────────────────────────────────────────────

  getPurchaseOrders: (params?: PaginationParams & { search?: string; status?: string }) =>
    apiClient
      .get<ApiResponse<PurchaseOrder[]>>('/purchase-orders', { params })
      .then((r) => r.data),

  getPurchaseOrderById: (id: string) =>
    apiClient
      .get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`)
      .then((r) => r.data),

  createPurchaseOrder: (data: CreatePurchaseOrderInput) =>
    apiClient
      .post<ApiResponse<PurchaseOrder>>('/purchase-orders', data)
      .then((r) => r.data),

  updatePurchaseOrderStatus: (id: string, status: string) =>
    apiClient
      .put<ApiResponse<null>>(`/purchase-orders/${id}`, { status })
      .then((r) => r.data),

  deletePurchaseOrder: (id: string) =>
    apiClient
      .delete<ApiResponse<void>>(`/purchase-orders/${id}`)
      .then((r) => r.data),
};
