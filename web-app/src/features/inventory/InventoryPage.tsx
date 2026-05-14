import { useState, useEffect, useCallback } from 'react';
import { Warehouse, Plus, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { inventoryApi } from '@/api/inventory.api';
import { formatDate } from '@/utils/format';
import type { InventoryLog } from '@/types/inventory.types';
import type { PaginationMeta } from '@/types/api.types';

import { StockForm } from './StockForm';

export function InventoryPage() {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  
  const [showForm, setShowForm] = useState(false);
  const [formAction, setFormAction] = useState<'ADD' | 'ADJUST' | 'TRANSFER'>('ADD');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.getLogs({ page, limit: 20 });
      if (res.success) {
        setLogs(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch { toast.error('Failed to load inventory logs'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { 
    const debounce = setTimeout(() => {
      loadLogs(); 
    }, 400);
    return () => clearTimeout(debounce);
  }, [loadLogs]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'ADD': return <Badge variant="success">Added</Badge>;
      case 'ADJUST': return <Badge variant="warning">Adjusted</Badge>;
      case 'SALE': return <Badge variant="info">Sale</Badge>;
      case 'REFUND': return <Badge variant="outline">Refund</Badge>;
      case 'TRANSFER_IN': return <Badge variant="success">Transfer In</Badge>;
      case 'TRANSFER_OUT': return <Badge variant="danger">Transfer Out</Badge>;
      default: return <Badge>{action}</Badge>;
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    loadLogs();
  };

  const openForm = (action: 'ADD' | 'ADJUST' | 'TRANSFER') => {
    setFormAction(action);
    setShowForm(true);
  };

  return (
    <div>
      <PageHeader title="Inventory Logs" subtitle="Track all stock movements"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={<ArrowRightLeft className="h-4 w-4" />} onClick={() => openForm('TRANSFER')}>Transfer</Button>
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => openForm('ADD')}>Add / Adjust Stock</Button>
          </div>
        } />

      <Card padding="none">
        {/* Table */}
        {loading ? <TableSkeleton rows={8} cols={6} /> : logs.length === 0 ? (
          <EmptyState icon={<Warehouse className="h-8 w-8" />} title="No inventory movements"
            description="Your inventory log is currently empty." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3 text-right">Change</th>
                  <th className="px-4 py-3 text-right">New Stock</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {formatDate(log.createdAt, { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{log.product?.name || 'Unknown'}</p>
                    </td>
                    <td className="px-4 py-3">{getActionBadge(log.action)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-medium ${log.quantityChange > 0 ? 'text-emerald-500' : log.quantityChange < 0 ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
                        {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-[var(--text-primary)] font-medium">
                      {log.newStock}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)] max-w-[200px] truncate">
                      {log.notes || '—'}
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
            <p className="text-xs text-[var(--text-muted)]">Showing {logs.length} of {meta.total} records</p>
            <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>
      
      <StockForm 
        open={showForm} 
        onClose={() => setShowForm(false)} 
        onSuccess={handleFormSuccess}
        initialAction={formAction}
      />
    </div>
  );
}
