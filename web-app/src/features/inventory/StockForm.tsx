import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { inventoryApi } from '@/api/inventory.api';
import { productsApi } from '@/api/products.api';
import type { Product } from '@/types/product.types';
import { useBranchStore } from '@/store/branch.store';

const stockSchema = z.object({
  actionType: z.enum(['ADD', 'ADJUST', 'TRANSFER']),
  productId: z.string().min(1, 'Please select a product'),
  // Fields for ADD
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1').optional(),
  costPrice: z.preprocess((v) => (v === '' || v === undefined ? undefined : Number(v)), z.number().min(0).optional()),
  batchNumber: z.string().optional().or(z.literal('')),
  expiryDate: z.string().optional().or(z.literal('')),
  // Fields for ADJUST — new absolute quantity
  newQuantity: z.coerce.number().min(0, 'Quantity cannot be negative').optional(),
  // Fields for TRANSFER
  toBranchId: z.string().optional(),
  // Common
  reason: z.string().max(255).optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.actionType === 'ADD' || data.actionType === 'TRANSFER') {
    if (data.quantity === undefined || data.quantity < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Quantity is required and must be at least 1', path: ['quantity'] });
    }
  }
  if (data.actionType === 'ADJUST') {
    if (data.newQuantity === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'New quantity is required', path: ['newQuantity'] });
    }
    if (!data.reason?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Reason is required for adjustments', path: ['reason'] });
    }
  }
  if (data.actionType === 'TRANSFER') {
    if (!data.toBranchId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Destination branch is required', path: ['toBranchId'] });
    }
  }
});

type StockFormData = z.infer<typeof stockSchema>;

interface StockFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialAction?: 'ADD' | 'ADJUST' | 'TRANSFER';
}

export function StockForm({ open, onClose, onSuccess, initialAction = 'ADD' }: StockFormProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const { branches, activeBranchId } = useBranchStore();

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<StockFormData>({
    resolver: zodResolver(stockSchema) as never,
    defaultValues: { actionType: initialAction, quantity: 1, newQuantity: 0 },
  });

  const actionType = watch('actionType');

  useEffect(() => {
    if (open) {
      setValue('actionType', initialAction);
      productsApi.search({ limit: 100 }).then((res) => {
        if (res.success) setProducts(res.data);
      });
    }
  }, [open, initialAction, setValue]);

  const onSubmit = async (data: StockFormData) => {
    setLoading(true);
    try {
      const reason = data.reason || undefined;

      if (data.actionType === 'ADD') {
        await inventoryApi.addStock({
          productId: data.productId,
          quantity: data.quantity!,
          batchNumber: data.batchNumber || undefined,
          expiryDate: data.expiryDate || undefined,
          costPrice: data.costPrice,
          reason,
        });
        toast.success('Stock added successfully');
      } else if (data.actionType === 'ADJUST') {
        // Backend adjustStock expects a delta quantity and a required reason string.
        // The user enters the new absolute total; compute delta from selected product's currentStock.
        const selectedProduct = products.find(p => p.id === data.productId);
        const currentStock = selectedProduct?.currentStock ?? 0;
        const delta = data.newQuantity! - currentStock;
        await inventoryApi.adjustStock({
          productId: data.productId,
          quantity: delta,
          reason: data.reason || 'Manual adjustment',
        });
        toast.success('Stock adjusted successfully');
      } else if (data.actionType === 'TRANSFER') {
        await inventoryApi.transferStock({
          productId: data.productId,
          toBranchId: data.toBranchId!,
          quantity: data.quantity!,
          notes: reason,
        });
        toast.success('Stock transferred successfully');
      }

      reset();
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to process stock action');
    } finally {
      setLoading(false);
    }
  };

  const availableBranches = branches.filter(b => b.id !== activeBranchId && b.isActive);

  return (
    <Modal open={open} onClose={onClose} title="Manage Stock" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        
        {/* Action Selector */}
        <div className="flex bg-[var(--bg-secondary)] rounded-xl p-1 mb-4 border border-[var(--border-color)]">
          {(['ADD', 'ADJUST', 'TRANSFER'] as const).map((type) => (
            <button
              key={type}
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${actionType === type ? 'bg-[var(--bg-card)] shadow-sm text-primary-600 dark:text-primary-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              onClick={() => setValue('actionType', type)}
            >
              {type === 'ADD' ? 'Add' : type === 'ADJUST' ? 'Adjust' : 'Transfer'}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">Product *</label>
          <select 
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            {...register('productId')}
          >
            <option value="">Select a product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>
            ))}
          </select>
          {errors.productId && <p className="text-xs text-red-400">{errors.productId.message}</p>}
        </div>

        {actionType === 'ADD' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Quantity to Add *" type="number" error={errors.quantity?.message} {...register('quantity')} />
              <Input label="Cost Price" type="number" step="0.01" error={errors.costPrice?.message} {...register('costPrice')} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input label="Batch Number" {...register('batchNumber')} />
              <Input label="Expiry Date" type="date" {...register('expiryDate')} />
            </div>
          </>
        )}

        {actionType === 'ADJUST' && (
          <div className="grid grid-cols-1">
            <Input label="New Total Quantity *" type="number" error={errors.newQuantity?.message} {...register('newQuantity')} />
            <p className="text-xs text-[var(--text-muted)] mt-1 ml-1">Set the exact stock count currently on hand.</p>
          </div>
        )}

        {actionType === 'TRANSFER' && (
          <>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">Destination Branch *</label>
              <select 
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                {...register('toBranchId')}
              >
                <option value="">Select destination branch...</option>
                {availableBranches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} {b.city ? `(${b.city})` : ''}</option>
                ))}
              </select>
              {errors.toBranchId && <p className="text-xs text-red-400">{errors.toBranchId.message}</p>}
            </div>
            <Input label="Quantity to Transfer *" type="number" error={errors.quantity?.message} {...register('quantity')} />
          </>
        )}
        
        <Input
          label={actionType === 'ADJUST' ? 'Reason for Adjustment *' : 'Notes / Reason'}
          placeholder={actionType === 'ADJUST' ? 'e.g. Physical count correction' : 'Optional details...'}
          error={(errors as any).reason?.message}
          {...register('reason')}
        />
        
        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)] mt-6">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" loading={loading}>
            {actionType === 'ADD' ? 'Add Stock' : actionType === 'ADJUST' ? 'Adjust Stock' : 'Transfer Stock'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
