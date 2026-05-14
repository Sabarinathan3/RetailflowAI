import { useState, useEffect, useCallback, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { suppliersApi } from '@/api/suppliers.api';
import { productsApi } from '@/api/products.api';
import { formatCurrency } from '@/utils/format';
import type { Supplier, CreatePurchaseOrderInput } from '@/types/supplier.types';
import type { Product } from '@/types/product.types';
import { Plus, Trash2, Search, Loader2, Package } from 'lucide-react';

interface POItem {
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePOModal({ isOpen, onClose, onSuccess }: CreatePOModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [supplierId, setSupplierId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<POItem[]>([]);

  // Product search
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load suppliers when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setSupplierId('');
    setExpectedDate('');
    setNotes('');
    setItems([]);
    setProductSearch('');
    setProductResults([]);

    setSuppliersLoading(true);
    suppliersApi
      .getSuppliers({ limit: 200 })
      .then((r) => { if (r.success) setSuppliers(r.data); })
      .catch(() => toast.error('Failed to load suppliers'))
      .finally(() => setSuppliersLoading(false));
  }, [isOpen]);

  // Product search with debounce
  useEffect(() => {
    if (!productSearch.trim()) {
      setProductResults([]);
      setShowDropdown(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await productsApi.search({ search: productSearch, limit: 10 });
        if (res.success) {
          setProductResults(res.data);
          setShowDropdown(true);
        }
      } catch {
        // silently ignore search errors
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [productSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addProduct = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          unit: product.unit,
          quantity: 1,
          unitPrice: product.purchasePrice,
        },
      ];
    });
    setProductSearch('');
    setProductResults([]);
    setShowDropdown(false);
  };

  const updateItem = (productId: string, field: 'quantity' | 'unitPrice', value: number) => {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, [field]: value } : i)),
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const grandTotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) { toast.error('Please select a supplier'); return; }
    if (items.length === 0) { toast.error('Add at least one item'); return; }
    if (items.some((i) => i.quantity <= 0 || i.unitPrice < 0)) {
      toast.error('Invalid quantity or price in items');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreatePurchaseOrderInput = {
        supplierId,
        expectedDate: expectedDate || undefined,
        notes: notes.trim() || undefined,
        items: items.map(({ productId, quantity, unitPrice }) => ({
          productId,
          quantity,
          unitPrice,
        })),
      };
      const res = await suppliersApi.createPurchaseOrder(payload);
      if (res.success) {
        toast.success(`Purchase Order ${res.data.orderNumber} created`);
        onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Create Purchase Order" size="xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Supplier + Date row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Supplier <span className="text-rose-500">*</span>
            </label>
            {suppliersLoading ? (
              <div className="flex items-center gap-2 p-2 text-[var(--text-muted)]">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading suppliers…
              </div>
            ) : (
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="">Select supplier…</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <Input
            label="Expected Delivery Date"
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Product search */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            Add Products
          </label>
          <div ref={searchRef} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search product by name or SKU…"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
            {searchLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[var(--text-muted)]" />
            )}

            {showDropdown && productResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                {productResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProduct(p)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-secondary)] transition-colors text-left"
                  >
                    <Package className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{p.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {p.sku ? `SKU: ${p.sku} · ` : ''}Purchase: {formatCurrency(p.purchasePrice)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Items table */}
        {items.length > 0 && (
          <div className="rounded-xl border border-[var(--border-color)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-center w-28">Qty</th>
                  <th className="px-4 py-3 text-right w-36">Unit Price (₹)</th>
                  <th className="px-4 py-3 text-right w-28">Total</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] bg-[var(--bg-card)]">
                {items.map((item) => (
                  <tr key={item.productId}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text-primary)]">{item.productName}</p>
                      <p className="text-xs text-[var(--text-muted)]">{item.unit}</p>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.productId, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="w-full text-center px-2 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(item.productId, 'unitPrice', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right px-2 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[var(--text-primary)]">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--bg-secondary)]/60">
                  <td colSpan={3} className="px-4 py-3 text-right font-semibold text-[var(--text-secondary)]">
                    Grand Total
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-lg text-[var(--text-primary)]">
                    {formatCurrency(grandTotal)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {items.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--border-color)] py-8 text-center text-[var(--text-muted)]">
            <Plus className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Search and add products above</p>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Payment terms, delivery instructions…"
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-[var(--border-color)]">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting} disabled={items.length === 0 || !supplierId}>
            Create Purchase Order
          </Button>
        </div>
      </form>
    </Modal>
  );
}
