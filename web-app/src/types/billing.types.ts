import type { InvoiceStatus, PaymentMode } from './enums';
import type { Customer } from './customer.types';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  gstPercentage: number;
  gstAmount: number;
  totalPrice: number;
  batchNumber?: string | null;
}

export interface Invoice {
  id: string;
  shopId: string;
  branchId: string;
  invoiceNumber: string;
  customerId: string | null;
  /** userId (cashier) */
  userId: string;
  subtotal: number;
  discountAmount: number;
  discountPercent?: number | null;
  taxAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  paidAmount: number;
  paymentMode: PaymentMode;
  status: InvoiceStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer | null;
  items?: InvoiceItem[];
}

export interface CreateInvoiceInput {
  customerId?: string;
  paymentMode: PaymentMode;
  discountPercent?: number;
  notes?: string;
  paidAmount?: number;
  items: {
    productId: string;
    quantity: number;
    discount?: number;
    batchNumber?: string;
  }[];
}

export interface BillingSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: InvoiceStatus;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  paymentMode?: PaymentMode;
}
