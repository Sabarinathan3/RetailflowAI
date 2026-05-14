import { useState, useEffect, useCallback } from 'react';
import { Plus, Receipt, FileText, Search, ExternalLink, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { billingApi } from '@/api/billing.api';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Invoice } from '@/types/billing.types';
import type { PaginationMeta } from '@/types/api.types';
import { useNavigate } from 'react-router-dom';
import { InvoiceDetail } from './InvoiceDetail';

export function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await billingApi.getInvoices({ page, limit: 20, search: search || undefined });
      if (res.success) {
        setInvoices(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { 
    const debounce = setTimeout(() => {
      loadInvoices(); 
    }, 400);
    return () => clearTimeout(debounce);
  }, [loadInvoices]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      case 'REFUNDED': return <Badge variant="danger">Refunded</Badge>;
      case 'PARTIAL_REFUND': return <Badge variant="warning">Partial Refund</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const openPdf = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // prevent row click from firing
    billingApi.downloadInvoicePdf(id).catch(() =>
      toast.error('Failed to open receipt PDF')
    );
  };

  return (
    <div>
      <PageHeader title="Billing & Invoices" subtitle="View and manage all transactions"
        action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/pos')}>New POS Sale</Button>} />

      <Card padding="none">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--border-color)] flex flex-col sm:flex-row gap-3">
          <SearchInput onSearch={(v) => { setSearch(v); setPage(1); }} placeholder="Search by invoice number or customer..." className="flex-1 max-w-sm" />
        </div>

        {/* Table */}
        {loading ? <TableSkeleton rows={8} cols={6} /> : invoices.length === 0 ? (
          <EmptyState icon={<Receipt className="h-8 w-8" />} title="No invoices found"
            description={search ? 'Try a different search term' : 'Create your first sale to see invoices here'}
            action={!search ? { label: 'New Sale', onClick: () => navigate('/pos') } : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors cursor-pointer group" onClick={() => setViewingId(inv.id)}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-primary-600 dark:text-primary-400 group-hover:underline">{inv.invoiceNumber}</p>
                      <p className="text-xs text-[var(--text-muted)]">{inv.paymentMode}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {formatDate(inv.createdAt, { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-[var(--text-primary)]">{inv.customer?.name || 'Walk-in Customer'}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(inv.totalAmount)}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setViewingId(inv.id); }} title="View Details">
                          <Eye className="h-4 w-4 text-[var(--text-secondary)]" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => openPdf(e, inv.id)} title="Print PDF">
                          <FileText className="h-4 w-4 text-[var(--text-secondary)]" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t border-[var(--border-color)] flex items-center justify-between">
            <p className="text-xs text-[var(--text-muted)]">Showing {invoices.length} of {meta.total} invoices</p>
            <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>
      
      {/* Invoice Detail Modal */}
      <InvoiceDetail open={!!viewingId} invoiceId={viewingId} onClose={() => setViewingId(null)} />
    </div>
  );
}
