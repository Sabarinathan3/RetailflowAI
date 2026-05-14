import { apiClient } from './client';
import type { ApiResponse } from '@/types/api.types';
import type { InventoryLog, AddStockInput, AdjustStockInput, TransferStockInput, InventorySearchParams } from '@/types/inventory.types';

export const inventoryApi = {
  getLogs: (params?: InventorySearchParams) =>
    apiClient.get<ApiResponse<InventoryLog[]>>('/inventory/logs', { params }).then((r) => r.data),

  addStock: (data: AddStockInput) =>
    apiClient.post<ApiResponse<InventoryLog>>('/inventory/add', data).then((r) => r.data),

  adjustStock: (data: AdjustStockInput) =>
    apiClient.post<ApiResponse<InventoryLog>>('/inventory/adjust', data).then((r) => r.data),

  transferStock: (data: TransferStockInput) =>
    apiClient.post<ApiResponse<InventoryLog>>('/inventory/transfer', data).then((r) => r.data),
};
