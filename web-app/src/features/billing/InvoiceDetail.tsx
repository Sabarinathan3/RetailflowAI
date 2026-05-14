import { useState, useEffect } from 'react';
import { Receipt, Calendar, CreditCard, ExternalLink, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { billingApi } from '@/api/billing.api';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Invoice } from '@/types/billing.types';

interface InvoiceDetailProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string | null;
}

export function InvoiceDetail({ open, onClose, invoiceId }: InvoiceDetailProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && invoiceId) {
      setLoading(true);
      billingApi.getInvoiceById(invoiceId)
        .then(res => {
          if (res.success) setInvoice(res.data);
        })
        .catch(() => toast.error('Failed to load invoice details'))
        .finally(() => setLoading(false));
    } else {
      setInvoice(null);
    }
  }, [open, invoiceId]);

  if (!open) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      case 'REFUNDED': return <Badge variant="danger">Refunded</Badge>;
      case 'PARTIAL_REFUND': return <Badge variant="warning">Partial Refund</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const openPdf = () => {
    if (invoiceId) {
      billingApi.downloadInvoicePdf(invoiceId).catch(() =>
        toast.error('Failed to open receipt PDF')
      );
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Invoice Details" size="lg">
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-[var(--text-muted)] animate-pulse">
          <Receipt className="h-8 w-8 mb-4 opacity-50" />
          <p>Loading invoice data...</p>
        </div>
      ) : !invoice ? (
        <div className="py-12 text-center text-[var(--text-muted)]">
          <p>Invoice not found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Summary */}
          <div className="bg-[var(--bg-secondary)]/30 border border-[var(--border-color)] rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">{invoice.invoiceNumber}</h3>
                {getStatusBadge(invoice.status)}
              </div>
              <p className="text-sm text-[var(--text-secondary)] flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {formatDate(invoice.createdAt)}</span>
                <span className="flex items-center gap-1.5"><CreditCard className="h-4 w-4" /> {invoice.paymentMode}</span>
              </p>
            </div>
            <div className="flex flex-col items-end w-full md:w-auto">
              <p className="text-sm text-[var(--text-secondary)] mb-1">Grand Total</p>
              <h2 className="text-3xl font-black text-primary-500 tracking-tight">{formatCurrency(invoice.totalAmount)}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Info */}
            <div className="border border-[var(--border-color)] rounded-xl p-4">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Billed To</p>
              {invoice.customer ? (
                <div>
                  <p className="font-medium text-[var(--text-primary)] text-base">{invoice.customer.name}</p>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{invoice.customer.phone}</p>
                  {invoice.customer.email && <p className="text-sm text-[var(--text-secondary)] mt-0.5">{invoice.customer.email}</p>}
                </div>
              ) : (
                <div className="text-[var(--text-secondary)] italic">Walk-in Customer</div>
              )}
            </div>

            {/* Note/Cashier */}
            <div className="border border-[var(--border-color)] rounded-xl p-4">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Additional Info</p>
              {invoice.notes ? (
                <p className="text-sm text-[var(--text-secondary)]">{invoice.notes}</p>
              ) : (
                <p className="text-sm text-[var(--text-muted)] italic">No additional notes.</p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <h4 className="font-medium text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 mb-4">Items</h4>
            <div className="border border-[var(--border-color)] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-[var(--bg-secondary)]">
                  <tr className="text-left text-xs font-medium text-[var(--text-muted)] uppercase">
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {invoice.items?.map(item => (
                    <tr key={item.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">{item.productName}</td>
                      <td className="px-4 py-3 text-sm text-[var(--text-secondary)] text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-[var(--text-secondary)] text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-[var(--text-primary)] text-right">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                  {(!invoice.items || invoice.items.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No items found for this invoice.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="flex justify-end pt-4">
            <div className="w-full md:w-64 space-y-2 text-sm">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Tax</span>
                <span>{formatCurrency(invoice.taxAmount)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span>Discount</span>
                  <span>-{formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-[var(--text-primary)] pt-2 border-t border-[var(--border-color)]">
                <span>Total</span>
                <span>{formatCurrency(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border-color)]">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button icon={<Printer className="h-4 w-4" />} onClick={openPdf}>
              Print Receipt
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
