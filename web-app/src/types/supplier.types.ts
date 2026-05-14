import type { PurchaseOrderStatus } from './enums';

export interface Supplier {
  id: string;
  shopId: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstNumber: string | null;
  /** Outstanding balance owed to supplier – computed or mocked field */
  balanceToPay?: number;
  leadTimeDays?: number | null;
  /** Enriched field (not in DB) */
  rating?: number | null;
  isActive?: boolean;
  /** Enriched field (not in DB) */
  tags?: string[];
  aiRiskScore?: number;
  /** Enriched field (not in DB) */
  aiRiskStatus?: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  receivedQty: number;
  product?: {
    id: string;
    name: string;
    sku: string | null;
    unit: string;
  };
}

export interface PurchaseOrder {
  id: string;
  shopId: string;
  supplierId: string;
  orderNumber: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  expectedDate: string | null;
  receivedDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  expectedDate?: string;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}
