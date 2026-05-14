import { apiClient } from './client';
import type { ApiResponse, PaginationParams } from '@/types/api.types';
import type { CreditLedger, CreditPayment, AddCreditPaymentInput, CreditSummary } from '@/types/credit.types';

export const creditApi = {
  /** List all ledgers with optional status/customer filter + pagination */
  getLedgers: (params?: PaginationParams & { status?: string; customerId?: string; search?: string }) =>
    apiClient.get<ApiResponse<CreditLedger[]>>('/credit-ledger', { params }).then((r) => r.data),

  /** Single ledger by ID */
  getLedgerById: (id: string) =>
    apiClient.get<ApiResponse<CreditLedger>>(`/credit-ledger/${id}`).then((r) => r.data),

  /** Ledgers for a specific customer */
  getLedgersByCustomer: (customerId: string, params?: PaginationParams) =>
    apiClient.get<ApiResponse<CreditLedger[]>>(`/credit-ledger/customer/${customerId}`, { params }).then((r) => r.data),

  /** Record a partial or full payment on a ledger by ledger ID */
  addPayment: (ledgerId: string, data: AddCreditPaymentInput) =>
    apiClient.post<ApiResponse<{ ledger: CreditLedger; payment: CreditPayment }>>(`/credit-ledger/${ledgerId}/payment`, data).then((r) => r.data),

  /** Overdue ledgers list */
  getOverdue: () =>
    apiClient.get<ApiResponse<CreditLedger[]>>('/credit-ledger/overdue').then((r) => r.data),

  /** Outstanding totals — {outstandingTotal, count} */
  getOutstanding: () =>
    apiClient.get<ApiResponse<{ outstandingTotal: number; count: number }>>('/credit-ledger/outstanding').then((r) => r.data),

  /**
   * Generate WhatsApp reminder link.
   * Backend returns { whatsappLink, customerName, customerPhone, outstandingAmount }
   */
  getReminder: (id: string) =>
    apiClient.get<ApiResponse<{ whatsappLink: string; customerName: string; customerPhone: string; outstandingAmount: number }>>(`/credit-ledger/${id}/reminder`).then((r) => r.data),
};
