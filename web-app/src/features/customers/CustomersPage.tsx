import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Users, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { CustomerForm } from './CustomerForm';
import { CustomerDetail } from './CustomerDetail';
import { customersApi } from '@/api/customers.api';
import { formatCurrency, formatRelativeTime } from '@/utils/format';
import type { Customer } from '@/types/customer.types';
import type { PaginationMeta } from '@/types/api.types';

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [viewing, setViewing] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customersApi.search({ page, limit: 20, search: search || undefined });
      if (res.success) {
        setCustomers(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { 
    const debounce = setTimeout(() => {
      loadCustomers(); 
    }, 400);
    return () => clearTimeout(debounce);
  }, [loadCustomers]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await customersApi.delete(deleteTarget.id);
      toast.success('Customer deleted');
      setDeleteTarget(null);
      loadCustomers();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditing(null);
    loadCustomers();
  };

  return (
    <div>
      <PageHeader title="Customers" subtitle="Manage your customer directory and credit"
        action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowForm(true)}>Add Customer</Button>} />

      <Card padding="none">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--border-color)] flex flex-col sm:flex-row gap-3">
          <SearchInput onSearch={(v) => { setSearch(v); setPage(1); }} placeholder="Search customers..." className="flex-1 max-w-sm" />
        </div>

        {/* Table */}
        {loading ? <TableSkeleton rows={8} cols={5} /> : customers.length === 0 ? (
          <EmptyState icon={<Users className="h-8 w-8" />} title="No customers found"
            description={search ? 'Try a different search term' : 'Add your first customer to get started'}
            action={!search ? { label: 'Add Customer', onClick: () => setShowForm(true) } : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3 text-right">Total Purchases</th>
                  <th className="px-4 py-3 text-right">Credit Limit</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="cursor-pointer" onClick={() => setViewing(c)}>
                        <p className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">{c.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">Added {formatRelativeTime(c.createdAt)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-[var(--text-secondary)]">{c.phone}</p>
                      {c.email && <p className="text-xs text-[var(--text-muted)]">{c.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(c.totalPurchases)}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-medium text-[var(--text-secondary)]">{formatCurrency(c.creditLimit)}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => setViewing(c)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setShowForm(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(c)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
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
            <p className="text-xs text-[var(--text-muted)]">Showing {customers.length} of {meta.total} customers</p>
            <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      {/* Customer Form Modal */}
      <CustomerForm open={showForm} customer={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSuccess={handleFormSuccess} />

      {/* Customer Detail Modal */}
      <CustomerDetail open={!!viewing} customer={viewing} onClose={() => setViewing(null)} />

      {/* Delete Confirmation */}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title={`Delete "${deleteTarget?.name}"?`} description="This action cannot be undone."
        confirmText="Delete" loading={deleting} />
    </div>
  );
}
