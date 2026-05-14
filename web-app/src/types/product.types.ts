export interface Product {
  id: string;
  shopId: string;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number | null;
  gstPercentage: number;
  hsnCode: string | null;
  reorderThreshold: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  inventory?: ProductInventory[];
  currentStock?: number;
}

export interface ProductInventory {
  id: string;
  productId: string;
  branchId: string;
  quantity: number;
  batchNumber: string | null;
  expiryDate: string | null;
  costPrice: number | null;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  category?: string;
  unit?: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp?: number;
  gstPercentage?: number;
  hsnCode?: string;
  reorderThreshold?: number;
  imageUrl?: string;
}

// Type assertion wrapper to clear the unused type warning
export type UpdateProductInput = Partial<CreateProductInput>;

export interface ProductSearchParams {
  page?: number;
  limit?: number;
  q?: string;
  search?: string;
  category?: string;
  isActive?: boolean;
}
