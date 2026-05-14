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

const addStockSchema = z.object({
  productId: z.string().min(1, 'Please select a product'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  batchNumber: z.string().optional().or(z.literal('')),
  expiryDate: z.string().optional().or(z.literal('')),
  costPrice: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().min(0).optional()
  ),
  reason: z.string().max(500).optional().or(z.literal('')),
});

type AddStockFormData = z.infer<typeof addStockSchema>;

interface AddStockFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddStockForm({ open, onClose, onSuccess }: AddStockFormProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (open) {
      productsApi.search({ limit: 100 }).then((res) => {
        if (res.success) setProducts(res.data);
      });
    }
  }, [open]);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AddStockFormData>({
    resolver: zodResolver(addStockSchema) as never,
    defaultValues: { quantity: 1 },
  });

  const onSubmit = async (data: AddStockFormData) => {
    setLoading(true);
    try {
      const clean = {
        ...data,
        batchNumber: data.batchNumber || undefined,
        expiryDate: data.expiryDate || undefined,
        reason: data.reason || undefined,
      };

      await inventoryApi.addStock(clean);
      toast.success('Stock added successfully');
      reset();
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add stock');
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Stock" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">Product *</label>
          <select 
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            {...register('productId')}
          >
            <option value="">Select a product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.sku || p.barcode || 'No SKU'})</option>
            ))}
          </select>
          {errors.productId && <p className="text-xs text-red-400">{errors.productId.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Quantity *" type="number" error={errors.quantity?.message} {...register('quantity')} />
          <Input label="Cost Price" type="number" step="0.01" error={errors.costPrice?.message} {...register('costPrice')} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Input label="Batch Number" {...register('batchNumber')} />
          <Input label="Expiry Date" type="date" {...register('expiryDate')} />
        </div>
        
        <Input label="Reason / Notes" placeholder="e.g. New stock delivery" {...register('reason')} />
        
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Add Stock</Button>
        </div>
      </form>
    </Modal>
  );
}
