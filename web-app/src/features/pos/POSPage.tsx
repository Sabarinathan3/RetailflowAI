import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ShoppingCart, Search, ScanLine, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { productsApi } from '@/api/products.api';
import { billingApi } from '@/api/billing.api';
import { formatCurrency } from '@/utils/format';
import { useBranchStore } from '@/store/branch.store';
import { PaymentForm } from './PaymentForm';
import type { Product } from '@/types/product.types';
import type { Customer } from '@/types/customer.types';
import type { PaymentMode } from '@/types/enums';

interface CartItem {
  id: string;
  name: string;
  unit: string;
  sellingPrice: number;
  gstPercentage: number;
  barcode: string | null;
  sku: string | null;
  imageUrl: string | null;
  inventory?: Product['inventory'];
  cartQuantity: number;
}

function toCartItem(product: Product, cartQuantity = 1): CartItem {
  return {
    id: product.id,
    name: product.name,
    unit: product.unit,
    sellingPrice: product.sellingPrice,
    gstPercentage: product.gstPercentage,
    barcode: product.barcode,
    sku: product.sku,
    imageUrl: product.imageUrl,
    inventory: product.inventory,
    cartQuantity,
  };
}

export function POSPage() {
  const navigate = useNavigate();
  const { activeBranchId } = useBranchStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer] = useState<Customer | null>(null);

  // Payment
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Barcode scanner buffer
  const barcodeBuffer = useRef('');

  // ── Load products once on mount ───────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [prodRes, catRes] = await Promise.all([
          productsApi.search({ limit: 1000 }),
          productsApi.getCategories(),
        ]);
        if (cancelled) return;
        if (prodRes.success) {
          setProducts(prodRes.data);
        } else {
          toast.error('Products loaded but response format unexpected');
        }
        if (catRes.success) setCategories(catRes.data);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to load products';
        // Handle 409 gracefully — likely a Prisma unique constraint race condition
        if (msg.includes('409') || msg.includes('Conflict') || msg.includes('Duplicate')) {
          toast.warning('Product catalog sync conflict detected. Retrying…');
          // Retry once after a short delay
          setTimeout(async () => {
            try {
              const retry = await productsApi.search({ limit: 1000 });
              if (!cancelled && retry.success) setProducts(retry.data);
            } catch {
              if (!cancelled) toast.error('Failed to load products after retry');
            }
          }, 1000);
        } else {
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // ── Barcode scanner ───────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Enter') {
        const code = barcodeBuffer.current;
        barcodeBuffer.current = '';
        if (code.length > 2) handleBarcodeScan(code);
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBarcodeScan = async (barcode: string) => {
    const product = products.find((p) => p.barcode === barcode);
    if (product) {
      addToCart(product);
      toast.success(`Added ${product.name}`);
      return;
    }
    try {
      const res = await productsApi.getByBarcode(barcode);
      if (res.success && res.data) {
        // Merge into products list so stock display is correct
        setProducts((prev) => {
          if (prev.find((p) => p.id === res.data.id)) return prev;
          return [...prev, res.data];
        });
        addToCart(res.data);
        toast.success(`Added ${res.data.name}`);
      } else {
        toast.error(`Product not found for barcode: ${barcode}`);
      }
    } catch {
      toast.error(`Product not found for barcode: ${barcode}`);
    }
  };

  // ── Filtered products ─────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q));
      const matchesCategory = !activeCategory || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, activeCategory]);

  // ── Stock helpers ─────────────────────────────────────────────────────
  const getAvailableStock = useCallback(
    (item: CartItem | Product) => {
      // Prefer currentStock shortcut if backend sends it
      if ('currentStock' in item && typeof item.currentStock === 'number' && !item.inventory?.length) {
        return item.currentStock;
      }

      const inv = item.inventory;

      // No inventory relation loaded at all — use currentStock or 0
      if (!inv || inv.length === 0) {
        return ('currentStock' in item && typeof item.currentStock === 'number')
          ? item.currentStock
          : 0;
      }

      // Total stock across ALL branches (the reliable ground truth)
      const totalStock = inv.reduce((s, i) => s + (i.quantity ?? 0), 0);

      // If no active branch context, return total
      if (!activeBranchId) return totalStock;

      // Check if this branch even HAS an inventory entry
      const branchEntry = inv.filter((i) => i.branchId === activeBranchId);
      if (branchEntry.length === 0) {
        // Branch has no entry for this product → show total so POS remains usable
        return totalStock;
      }

      // Branch entry exists — use branch-specific quantity
      // If branch stock is 0 but other branches have stock, still show 0
      // (branch-level accuracy is important for actual sales)
      const branchStock = branchEntry.reduce((s, i) => s + (i.quantity ?? 0), 0);
      return branchStock;
    },
    [activeBranchId],
  );

  // ── Cart operations ───────────────────────────────────────────────────
  const addToCart = useCallback(
    (product: Product) => {
      const available = getAvailableStock(product);
      if (available <= 0) {
        toast.error(`"${product.name}" is out of stock.`);
        return;
      }
      setCart((prev) => {
        const existing = prev.find((i) => i.id === product.id);
        if (existing) {
          if (existing.cartQuantity >= available) {
            toast.error(`Cannot add more. Only ${available} available.`);
            return prev;
          }
          return prev.map((i) =>
            i.id === product.id ? { ...i, cartQuantity: i.cartQuantity + 1 } : i,
          );
        }
        return [...prev, toCartItem(product, 1)];
      });
    },
    [getAvailableStock],
  );

  const updateCartQuantity = useCallback(
    (id: string, qty: number) => {
      if (qty <= 0) {
        setCart((prev) => prev.filter((i) => i.id !== id));
        return;
      }
      setCart((prev) => {
        const item = prev.find((i) => i.id === id);
        if (!item) return prev;
        const available = getAvailableStock(item);
        if (qty > available) {
          toast.error(`Only ${available} items available for "${item.name}".`);
          return prev;
        }
        return prev.map((i) => (i.id === id ? { ...i, cartQuantity: qty } : i));
      });
    },
    [getAvailableStock],
  );

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // ── Totals ────────────────────────────────────────────────────────────
  const { subtotal, totalTax, grandTotal, hasStockErrors } = useMemo(() => {
    let sub = 0;
    let tax = 0;
    let stockErr = false;

    for (const item of cart) {
      const lineBase = item.sellingPrice * item.cartQuantity;
      // Tax is INCLUDED in sellingPrice (inclusive GST)
      const lineGst = lineBase - lineBase / (1 + item.gstPercentage / 100);
      sub += lineBase;
      tax += lineGst;
      if (item.cartQuantity > getAvailableStock(item)) stockErr = true;
    }

    return {
      subtotal: sub,          // total including tax
      totalTax: tax,           // GST component
      grandTotal: sub,         // same as subtotal when tax is inclusive
      hasStockErrors: stockErr,
    };
  }, [cart, getAvailableStock]);

  // ── Checkout ──────────────────────────────────────────────────────────
  const handleCheckout = () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    if (hasStockErrors) { toast.error('Please resolve stock issues before checkout.'); return; }
    setShowPayment(true);
  };

  const processPayment = async (selectedPaymentMode: PaymentMode, selectedAmountPaid: number | '') => {
    if (isProcessing) return; // prevent double submit
    setIsProcessing(true);
    try {
      const res = await billingApi.createInvoice({
        customerId: customer?.id || undefined,
        paymentMode: selectedPaymentMode,
        paidAmount: typeof selectedAmountPaid === 'number' ? selectedAmountPaid : undefined,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.cartQuantity,
          discount: 0,
        })),
      });

      if (res.success) {
        // Safely extract billing ID from the response.
        // After the service fix, shape is: { success: true, data: Invoice }
        const billId: string | undefined =
          (res.data as any)?.id ??          // primary: res.data.id
          (res.data as any)?.invoice?.id;   // fallback: old nested shape

        const methodLabel = selectedPaymentMode === 'UPI' ? 'UPI payment' :
                            selectedPaymentMode === 'CASH' ? 'Cash payment' :
                            selectedPaymentMode === 'CARD' ? 'Card payment' : 'Credit';

        if (!billId) {
          console.error('Billing response shape unexpected:', res);
          toast.error('Sale recorded but receipt ID missing — check billing history.');
        } else {
          toast.success(`${methodLabel} confirmed! Opening receipt…`);

          // Download PDF via authenticated axios (carries JWT bearer token)
          billingApi.downloadInvoicePdf(billId).catch(() => {
            toast.warning('Receipt download failed — find it in Billing History.');
          });
        }

        setCart([]);
        setShowPayment(false);

        // Refresh product stock after successful sale
        productsApi.search({ limit: 1000 }).then((r) => {
          if (r.success) setProducts(r.data);
        });
      } else {
        toast.error((res as any).message || 'Checkout failed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Checkout failed';
      toast.error(msg);
      // If it's a stock error, close payment modal and refresh
      if (msg.toLowerCase().includes('stock') || msg.toLowerCase().includes('insufficient')) {
        setShowPayment(false);
        productsApi.search({ limit: 1000 }).then((r) => {
          if (r.success) setProducts(r.data);
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-64px)] -m-4 sm:-m-6 lg:-m-8 bg-[var(--bg-secondary)]">
      {/* Left Panel: Products */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[var(--border-color)]">
        {/* Header & Search */}
        <div className="p-4 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search products or scan barcode…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-[var(--text-primary)]"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              <ScanLine className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="px-4 py-3 bg-[var(--bg-card)] border-b border-[var(--border-color)] overflow-x-auto whitespace-nowrap flex gap-2 hide-scrollbar">
          <Button
            variant={activeCategory === null ? 'primary' : 'secondary'}
            size="sm"
            className="rounded-full"
            onClick={() => setActiveCategory(null)}
          >
            All Products
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'primary' : 'secondary'}
              size="sm"
              className="rounded-full"
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)]">
              <Search className="h-12 w-12 mb-4 opacity-50" />
              <p className="font-medium">No products found</p>
              <p className="text-sm mt-1 opacity-70">Try a different search term or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => {
                const stock = getAvailableStock(product);
                const inCart = cart.find((c) => c.id === product.id);
                return (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`bg-[var(--bg-card)] rounded-xl border p-3 cursor-pointer hover:shadow-md transition-all group flex flex-col h-full relative ${
                      stock <= 0
                        ? 'border-[var(--border-color)] opacity-60 cursor-not-allowed'
                        : inCart
                        ? 'border-primary-500 ring-1 ring-primary-500/30'
                        : 'border-[var(--border-color)] hover:border-primary-500'
                    }`}
                  >
                    {inCart && (
                      <span className="absolute top-2 right-2 bg-primary-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center z-10">
                        {inCart.cartQuantity}
                      </span>
                    )}
                    <div className="h-20 bg-[var(--bg-secondary)] rounded-lg mb-2.5 flex items-center justify-center text-[var(--text-muted)] overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-2xl font-bold uppercase opacity-40">
                          {product.name.slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-tight mb-1 line-clamp-2 flex-1">
                        {product.name}
                      </h3>
                      <div className="flex items-end justify-between mt-1.5">
                        <p className="text-primary-500 font-bold text-sm">
                          {formatCurrency(product.sellingPrice)}
                        </p>
                        <p
                          className={`text-[10px] font-medium ${
                            stock > 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {stock > 0 ? `${stock} left` : 'Out'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Cart */}
      <div className="w-[360px] bg-[var(--bg-card)] flex flex-col shadow-xl z-10 flex-shrink-0">
        <div className="p-4 border-b border-[var(--border-color)] bg-primary-500/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold">
            <ShoppingCart className="h-5 w-5" />
            <span>Current Sale</span>
          </div>
          {cart.length > 0 && (
            <Badge variant="primary" className="bg-primary-500 text-white border-0">
              {cart.reduce((s, i) => s + i.cartQuantity, 0)} Items
            </Badge>
          )}
        </div>

        {/* Customer (placeholder – functional in future iteration) */}
        <div className="px-3 py-2.5 border-b border-[var(--border-color)]">
          <div className="text-xs text-[var(--text-muted)] px-2 py-2 rounded-lg border border-dashed border-[var(--border-color)] flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            Walk-in Customer (optional)
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] opacity-70">
              <ShoppingCart className="h-12 w-12 mb-3" />
              <p className="font-medium">Cart is empty</p>
              <p className="text-xs mt-1">Click products to add them</p>
            </div>
          ) : (
            cart.map((item) => {
              const available = getAvailableStock(item);
              const stockError = item.cartQuantity > available;
              return (
                <div
                  key={item.id}
                  className={`flex gap-3 p-3 rounded-xl border transition-colors ${
                    stockError
                      ? 'bg-rose-500/5 border-rose-500/30'
                      : 'bg-[var(--bg-secondary)] border-[var(--border-color)]'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {item.name}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {formatCurrency(item.sellingPrice)} / {item.unit}
                    </p>
                    {stockError && (
                      <p className="text-xs font-semibold text-rose-500 mt-1">
                        {available === 0 ? 'Out of Stock' : `Only ${available} available`}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {formatCurrency(item.sellingPrice * item.cartQuantity)}
                    </p>
                    <div className="flex items-center gap-1 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] p-0.5">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.cartQuantity - 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold"
                      >
                        −
                      </button>
                      <span className="text-xs font-semibold w-5 text-center text-[var(--text-primary)]">
                        {item.cartQuantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.cartQuantity + 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Totals & Checkout */}
        <div className="p-4 bg-[var(--bg-card)] border-t border-[var(--border-color)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="space-y-1.5 mb-4 text-sm">
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Subtotal (incl. tax)</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)] text-xs">
              <span>GST (incl.)</span>
              <span className="text-emerald-500">{formatCurrency(totalTax)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-[var(--text-primary)] pt-2 border-t border-[var(--border-color)]">
              <span>Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onClick={() => setCart([])}
              disabled={cart.length === 0}
              className="w-full"
            >
              Clear
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={cart.length === 0 || hasStockErrors}
              className="w-full font-bold shadow-lg shadow-primary-500/25"
            >
              Pay Now
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentForm
        open={showPayment}
        onClose={() => !isProcessing && setShowPayment(false)}
        grandTotal={grandTotal}
        isProcessing={isProcessing}
        onConfirm={processPayment}
      />
    </div>
  );
}
