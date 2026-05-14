import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PackageSearch,
  FileText,
  Plus,
  Filter,
  Download,
  Loader2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  TruckIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { suppliersApi } from '@/api/suppliers.api';
import type { PurchaseOrder } from '@/types/supplier.types';
import type { PaginationMeta } from '@/types/api.types';
import { formatCurrency, formatDate } from '@/utils/format';
import { CreatePOModal } from './CreatePOModal';
import * as XLSX from 'xlsx';

const STATUS_TABS = ['ALL', 'DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED'] as const;
type StatusTab = (typeof STATUS_TABS)[number];

function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'default' {
  switch (status) {
    case 'RECEIVED': return 'success';
    case 'ORDERED': return 'warning';
    case 'CANCELLED': return 'danger';
    default: return 'default';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'RECEIVED': return <CheckCircle2 className="w-3.5 h-3.5" />;
    case 'ORDERED': return <TruckIcon className="w-3.5 h-3.5" />;
    case 'CANCELLED': return <XCircle className="w-3.5 h-3.5" />;
    default: return <Clock className="w-3.5 h-3.5" />;
  }
}

function exportPOsCSV(orders: PurchaseOrder[]) {
  if (orders.length === 0) { toast.error('No data to export'); return; }
  const today = new Date().toISOString().split('T')[0];
  const rows = orders.map((o, i) => ({
    '#': i + 1,
    'Order Number': o.orderNumber,
    'Supplier': o.supplier?.name ?? '',
    'Status': o.status,
    'Expected Date': o.expectedDate ? formatDate(o.expectedDate) : '',
    'Total Amount': o.totalAmount,
    'Created At': formatDate(o.createdAt),
  }));
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      headers.map((h) => {
        const v = String(r[h as keyof typeof r] ?? '');
        return v.includes(',') ? `"${v}"` : v;
      }).join(','),
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `purchase-orders-${today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Exported as CSV');
}

function exportPOsExcel(orders: PurchaseOrder[]) {
  if (orders.length === 0) { toast.error('No data to export'); return; }
  const today = new Date().toISOString().split('T')[0];
  const rows = orders.map((o, i) => ({
    '#': i + 1,
    'Order Number': o.orderNumber,
    'Supplier': o.supplier?.name ?? '',
    'Status': o.status,
    'Expected Date': o.expectedDate ? formatDate(o.expectedDate) : '',
    'Total Amount (₹)': o.totalAmount,
    'Created At': formatDate(o.createdAt),
    'Notes': o.notes ?? '',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 4 }, { wch: 22 }, { wch: 25 }, { wch: 12 },
    { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 30 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Purchase Orders');
  XLSX.writeFile(wb, `purchase-orders-${today}.xlsx`);
  toast.success('Exported as Excel');
}

export function PurchaseOrderPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<StatusTab>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadOrders = useCallback(async (p = page, q = search, s = activeStatus) => {
    setLoading(true);
    try {
      const res = await suppliersApi.getPurchaseOrders({
        page: p,
        limit: 20,
        search: q || undefined,
        status: s === 'ALL' ? undefined : s,
      });
      if (res.success) {
        setOrders(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, [page, search, activeStatus]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      loadOrders(1, search, activeStatus);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, activeStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadOrders(page, search, activeStatus);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (order: PurchaseOrder, newStatus: string) => {
    if (order.status === newStatus) return;
    setUpdatingId(order.id);
    try {
      await suppliersApi.updatePurchaseOrderStatus(order.id, newStatus);
      toast.success(`Order ${order.orderNumber} marked as ${newStatus}`);
      loadOrders(page, search, activeStatus);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (order: PurchaseOrder) => {
    if (!window.confirm(`Delete PO ${order.orderNumber}? This cannot be undone.`)) return;
    setDeletingId(order.id);
    try {
      await suppliersApi.deletePurchaseOrder(order.id);
      toast.success(`PO ${order.orderNumber} deleted`);
      loadOrders(page, search, activeStatus);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = async (type: 'csv' | 'excel') => {
    setExporting(true);
    try {
      // Fetch all matching records for export (up to 1000)
      const res = await suppliersApi.getPurchaseOrders({
        page: 1,
        limit: 1000,
        search: search || undefined,
        status: activeStatus === 'ALL' ? undefined : activeStatus,
      });
      if (!res.success || res.data.length === 0) {
        toast.error('No data to export');
        return;
      }
      if (type === 'csv') exportPOsCSV(res.data);
      else exportPOsExcel(res.data);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Purchase Orders"
          subtitle="Manage procurements, track deliveries, and receive stock"
        />
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Button
              variant="outline"
              icon={exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              disabled={exporting}
              onClick={() => handleExport('excel')}
            >
              Export
            </Button>
          </div>
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            Create PO
          </Button>
        </div>
      </div>

      <Card padding="none" className="overflow-hidden border border-[var(--border-color)]">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--border-color)] flex flex-col sm:flex-row gap-4 justify-between bg-[var(--bg-card)]">
          <div className="relative w-full sm:w-80">
            <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PO number or supplier…"
              className="pl-9 bg-[var(--bg-secondary)] border-none"
            />
          </div>

          {/* Status tabs */}
          <div className="flex gap-1 bg-[var(--bg-secondary)] p-1 rounded-lg flex-wrap">
            {STATUS_TABS.map((s) => (
              <button
                key={s}
                onClick={() => { setActiveStatus(s); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeStatus === s
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-12 w-12 text-[var(--text-muted)]" />}
            title="No purchase orders"
            description={
              search || activeStatus !== 'ALL'
                ? 'No orders match your current filters.'
                : "You haven't created any purchase orders yet."
            }
            action={{ label: 'Create First PO', onClick: () => setIsCreateOpen(true) }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-secondary)]/30">
                  <th className="px-6 py-4">Order Details</th>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">Expected Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] bg-[var(--bg-card)]">
                {orders.map((o) => {
                  const isUpdating = updatingId === o.id;
                  const isDeleting = deletingId === o.id;
                  return (
                    <tr key={o.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-[var(--primary-color)]/10 text-[var(--primary-color)]">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-[var(--text-primary)]">{o.orderNumber}</p>
                            <p className="text-xs text-[var(--text-secondary)]">{formatDate(o.createdAt)}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {o.supplier?.name ?? '—'}
                        </p>
                        {o.supplier?.phone && (
                          <p className="text-xs text-[var(--text-secondary)]">{o.supplier.phone}</p>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm text-[var(--text-secondary)]">
                          {o.expectedDate ? formatDate(o.expectedDate) : '—'}
                        </p>
                        {o.receivedDate && (
                          <p className="text-xs text-emerald-500">
                            Received: {formatDate(o.receivedDate)}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <Badge variant={getStatusVariant(o.status)} dot>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(o.status)}
                            {o.status.charAt(0) + o.status.slice(1).toLowerCase()}
                          </span>
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-right font-semibold text-[var(--text-primary)]">
                        {formatCurrency(o.totalAmount)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isUpdating || isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
                          ) : (
                            <>
                              {/* Status quick actions */}
                              {o.status === 'DRAFT' && (
                                <button
                                  onClick={() => handleStatusChange(o, 'ORDERED')}
                                  title="Mark as Ordered"
                                  className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors text-xs font-medium"
                                >
                                  Order
                                </button>
                              )}
                              {o.status === 'ORDERED' && (
                                <button
                                  onClick={() => handleStatusChange(o, 'RECEIVED')}
                                  title="Mark as Received (updates stock)"
                                  className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors text-xs font-medium"
                                >
                                  Receive
                                </button>
                              )}
                              {(o.status === 'DRAFT' || o.status === 'ORDERED') && (
                                <button
                                  onClick={() => handleStatusChange(o, 'CANCELLED')}
                                  title="Cancel PO"
                                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-rose-500/10 hover:text-rose-500 transition-colors text-xs"
                                >
                                  Cancel
                                </button>
                              )}
                              {(o.status === 'DRAFT' || o.status === 'CANCELLED') && (
                                <button
                                  onClick={() => handleDelete(o)}
                                  title="Delete PO"
                                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]/20">
            <p className="text-sm text-[var(--text-muted)]">
              Showing {orders.length} of {meta.total} records
            </p>
            <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <CreatePOModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => { setPage(1); loadOrders(1, search, activeStatus); }}
      />
    </div>
  );
}
