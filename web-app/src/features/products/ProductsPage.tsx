import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ProductForm } from './ProductForm';
import { productsApi } from '@/api/products.api';
import { formatCurrency } from '@/utils/format';
import type { Product } from '@/types/product.types';
import type { PaginationMeta } from '@/types/api.types';

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsApi.search({ page, limit: 20, search: search || undefined });
      if (res.success) {
        setProducts(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { 
    const debounce = setTimeout(() => {
      loadProducts(); 
    }, 400);
    return () => clearTimeout(debounce);
  }, [loadProducts]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await productsApi.delete(deleteTarget.id);
      toast.success('Product deleted');
      setDeleteTarget(null);
      loadProducts();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditing(null);
    loadProducts();
  };

  return (
    <div>
      <PageHeader title="Products" subtitle="Manage your product catalog"
        action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowForm(true)}>Add Product</Button>} />

      <Card padding="none">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--border-color)] flex flex-col sm:flex-row gap-3">
          <SearchInput onSearch={(v) => { setSearch(v); setPage(1); }} placeholder="Search products..." className="flex-1 max-w-sm" />
        </div>

        {/* Table */}
        {loading ? <TableSkeleton rows={8} cols={6} /> : products.length === 0 ? (
          <EmptyState icon={<Package className="h-8 w-8" />} title="No products found"
            description={search ? 'Try a different search term' : 'Add your first product to get started'}
            action={!search ? { label: 'Add Product', onClick: () => setShowForm(true) } : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 hidden sm:table-cell">SKU</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-center hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{p.name}</p>
                        {p.barcode && <p className="text-xs text-[var(--text-muted)]">#{p.barcode}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-sm text-[var(--text-secondary)]">{p.sku || '—'}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{p.category || 'Uncategorized'}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(p.sellingPrice)}</p>
                      <p className="text-xs text-[var(--text-muted)]">Cost: {formatCurrency(p.purchasePrice)}</p>
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <Badge variant={p.isActive ? 'success' : 'danger'} dot>{p.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setShowForm(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(p)}>
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
            <p className="text-xs text-[var(--text-muted)]">Showing {products.length} of {meta.total} products</p>
            <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      {/* Product Form Modal */}
      <ProductForm open={showForm} product={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSuccess={handleFormSuccess} />

      {/* Delete Confirmation */}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title={`Delete "${deleteTarget?.name}"?`} description="This action cannot be undone. The product will be permanently removed."
        confirmText="Delete" loading={deleting} />
    </div>
  );
}
