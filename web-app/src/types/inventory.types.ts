import type { StockAction } from './enums';
import type { Product } from './product.types';
import type { Branch } from './branch.types';

export interface InventoryLog {
  id: string;
  productId: string;
  branchId: string;
  userId: string;
  action: StockAction;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
  product?: Product;
  branch?: Branch;
}

export interface AddStockInput {
  productId: string;
  quantity: number;
  batchNumber?: string;
  expiryDate?: string;
  costPrice?: number;
  reason?: string; // backend field name
}

export interface AdjustStockInput {
  productId: string;
  quantity: number;  // delta: positive=add, negative=reduce
  reason: string;    // required by backend schema
}

export interface TransferStockInput {
  productId: string;
  toBranchId: string;
  quantity: number;
  notes?: string;
}

export interface InventorySearchParams {
  page?: number;
  limit?: number;
  productId?: string;
  action?: StockAction;
  startDate?: string;
  endDate?: string;
}
