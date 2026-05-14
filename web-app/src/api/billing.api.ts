import { apiClient } from './client';
import type { ApiResponse } from '@/types/api.types';
import type { Invoice, CreateInvoiceInput, BillingSearchParams } from '@/types/billing.types';

export const billingApi = {
  getInvoices: (params?: BillingSearchParams) =>
    apiClient.get<ApiResponse<Invoice[]>>('/billing', { params }).then((r) => r.data),

  getInvoiceById: (id: string) =>
    apiClient.get<ApiResponse<Invoice>>(`/billing/${id}`).then((r) => r.data),

  createInvoice: (data: CreateInvoiceInput) =>
    apiClient.post<ApiResponse<Invoice>>('/billing', data).then((r) => r.data),

  /**
   * Fetches the invoice PDF via the authenticated apiClient (carries JWT),
   * creates a temporary blob URL, opens it in a new tab, and auto-revokes
   * the URL after 60 s to avoid memory leaks.
   */
  downloadInvoicePdf: async (id: string): Promise<void> => {
    if (!id) throw new Error('Billing ID is required to download receipt');

    const response = await apiClient.get(`/billing/${id}/pdf`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    // Open in new tab
    const tab = window.open(url, '_blank');
    if (!tab) {
      // Fallback: trigger download if popup was blocked
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    // Release memory after 60 seconds
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },

  refundInvoice: (id: string, reason: string) =>
    apiClient.post<ApiResponse<Invoice>>(`/billing/${id}/refund`, { reason }).then((r) => r.data),
};
