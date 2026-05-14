import { useState, useEffect, useCallback } from 'react';
import { Building, Eye, Ban, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { adminApi } from '@/api/admin.api';
import type { AdminShopWithCounts } from '@/types/admin.types';
import type { PaginationMeta } from '@/types/api.types';
import { formatDate } from '@/utils/format';
import { toast } from 'sonner';

export function AdminShops() {
  const [shops, setShops] = useState<AdminShopWithCounts[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const loadShops = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listShops({ page, limit: 10, search: search || undefined });
      if (res.success) {
        setShops(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch {
      toast.error('Failed to load shops');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { 
    const debounce = setTimeout(() => {
      loadShops(); 
    }, 400);
    return () => clearTimeout(debounce);
  }, [loadShops]);

  const toggleShop = async (id: string, currentStatus: boolean) => {
    try {
      const res = await adminApi.toggleActive(id, { isActive: !currentStatus });
      if (res.success) {
        toast.success(`Shop ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
        loadShops();
      }
    } catch {
      toast.error('Failed to update shop status');
    }
  };

  return (
    <Card padding="none">
      <div className="p-4 border-b border-[var(--border-color)] flex flex-col sm:flex-row gap-3">
        <SearchInput onSearch={(v) => { setSearch(v); setPage(1); }} placeholder="Search shops by name or email..." className="max-w-sm" />
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : shops.length === 0 ? (
        <div className="p-8 text-center">
          <Building className="mx-auto h-12 w-12 text-[var(--text-muted)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--text-primary)]">No shops found</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-secondary)]/20">
                <th className="px-4 py-3">Shop</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {shops.map((shop) => (
                <tr key={shop.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{shop.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{shop.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={shop.subscriptionPlan === 'ENTERPRISE' ? 'primary' : 'default'}>{shop.subscriptionPlan}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                    {shop._count.users} Users<br/>
                    <span className="text-xs text-[var(--text-muted)]">{shop._count.branches} Branches</span>
                  </td>
                  <td className="px-4 py-3">
                    {shop.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="danger">Disabled</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                    {formatDate(shop.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => toggleShop(shop.id, shop.isActive)}>
                        {shop.isActive ? <Ban className="h-4 w-4 text-rose-500" /> : <CheckCircle className="h-4 w-4 text-emerald-500" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="p-4 border-t border-[var(--border-color)] flex items-center justify-between">
          <p className="text-xs text-[var(--text-muted)]">Showing {shops.length} of {meta.total} shops</p>
          <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
        </div>
      )}
    </Card>
  );
}
