import { useState, useEffect } from 'react';
import { ShoppingBag, CreditCard, User, Mail, Phone, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { customersApi } from '@/api/customers.api';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Customer } from '@/types/customer.types';
import type { Invoice } from '@/types/billing.types';

interface CustomerDetailProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export function CustomerDetail({ open, onClose, customer }: CustomerDetailProps) {
  const [purchases, setPurchases] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && customer) {
      setLoading(true);
      customersApi.getPurchases(customer.id)
        .then(res => {
          if (res.success) setPurchases(res.data);
        })
        .catch(() => toast.error('Failed to load customer purchases'))
        .finally(() => setLoading(false));
    }
  }, [open, customer]);

  if (!customer) return null;

  return (
    <Modal open={open} onClose={onClose} title="Customer Profile" size="xl">
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-500">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] text-lg">{customer.name}</h3>
              <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                <Phone className="h-3 w-3" /> {customer.phone}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Lifetime Value</p>
              <h3 className="font-semibold text-[var(--text-primary)] text-lg">
                {formatCurrency(customer.totalPurchases)}
              </h3>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Credit Limit</p>
              <h3 className="font-semibold text-[var(--text-primary)] text-lg">
                {formatCurrency(customer.creditLimit)}
              </h3>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 space-y-4">
            <h4 className="font-medium text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">Details</h4>
            <div className="space-y-3">
              {customer.email && (
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Calendar className="h-4 w-4" />
                <span>Joined {formatDate(customer.createdAt)}</span>
              </div>
              {customer.address && (
                <div className="pt-2 border-t border-[var(--border-color)]">
                  <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Address</p>
                  <p className="text-sm text-[var(--text-secondary)]">{customer.address}</p>
                </div>
              )}
              {customer.gstNumber && (
                <div className="pt-2 border-t border-[var(--border-color)]">
                  <p className="text-xs font-medium text-[var(--text-muted)] mb-1">GST Number</p>
                  <Badge variant="outline">{customer.gstNumber}</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Recent Purchases */}
          <div className="md:col-span-3">
            <h4 className="font-medium text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 mb-4">
              Purchase History
            </h4>
            
            {loading ? (
              <div className="py-8 text-center text-sm text-[var(--text-muted)] animate-pulse">Loading purchases...</div>
            ) : purchases.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)]/10">
                <ShoppingBag className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-2" />
                <p className="text-sm text-[var(--text-primary)] font-medium">No purchases yet</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">This customer hasn't made any purchases.</p>
              </div>
            ) : (
              <div className="border border-[var(--border-color)] rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[var(--bg-secondary)]">
                    <tr className="text-left text-xs font-medium text-[var(--text-muted)] uppercase">
                      <th className="px-4 py-3">Invoice</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Payment Mode</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {purchases.map(invoice => (
                      <tr key={invoice.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-[var(--text-primary)] text-sm">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                          {formatDate(invoice.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={invoice.paymentMode === 'CASH' ? 'success' : invoice.paymentMode === 'CREDIT' ? 'warning' : 'info'}>
                            {invoice.paymentMode}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-sm">
                          {formatCurrency(invoice.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
