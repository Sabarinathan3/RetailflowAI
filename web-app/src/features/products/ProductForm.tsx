import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { productsApi } from '@/api/products.api';
import type { Product } from '@/types/product.types';

const optNum = z.preprocess(
  (v) => (v === '' || v === undefined ? undefined : Number(v)),
  z.number().min(0).optional()
);

const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(500).optional().or(z.literal('')),
  sku: z.string().max(50).optional().or(z.literal('')),
  barcode: z.string().max(50).optional().or(z.literal('')),
  category: z.string().max(100).optional().or(z.literal('')),
  unit: z.string().default('pcs'),
  purchasePrice: z.coerce.number().min(0, 'Must be >= 0'),
  sellingPrice: z.coerce.number().min(0, 'Must be >= 0'),
  mrp: optNum,
  gstPercentage: optNum,
  hsnCode: z.string().max(20).optional().or(z.literal('')),
  reorderThreshold: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().int().min(0).optional()
  ),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProductForm({ open, product, onClose, onSuccess }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!product;

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as never,
    defaultValues: product ? {
      name: product.name, description: product.description || '', sku: product.sku || '',
      barcode: product.barcode || '', category: product.category || '', unit: product.unit,
      purchasePrice: product.purchasePrice, sellingPrice: product.sellingPrice,
      mrp: product.mrp ?? undefined, gstPercentage: product.gstPercentage, hsnCode: product.hsnCode || '',
      reorderThreshold: product.reorderThreshold,
    } : { unit: 'pcs', gstPercentage: 0, reorderThreshold: 10 },
  });

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true);
    try {
      const clean = {
        ...data,
        description: data.description || undefined,
        sku: data.sku || undefined,
        barcode: data.barcode || undefined,
        category: data.category || undefined,
        hsnCode: data.hsnCode || undefined,
        mrp: data.mrp ? Number(data.mrp) : undefined,
      };

      if (isEditing) {
        await productsApi.update(product.id, clean);
        toast.success('Product updated');
      } else {
        await productsApi.create(clean);
        toast.success('Product created');
      }
      reset();
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save product');
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Edit Product' : 'Add Product'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Product Name *" error={errors.name?.message} {...register('name')} />
          <Input label="Category" placeholder="e.g., Electronics" {...register('category')} />
        </div>
        <Input label="Description" placeholder="Optional description" {...register('description')} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Input label="SKU" placeholder="AUTO" {...register('sku')} />
          <Input label="Barcode" {...register('barcode')} />
          <Input label="Unit" {...register('unit')} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Input label="Purchase Price *" type="number" step="0.01" error={errors.purchasePrice?.message} {...register('purchasePrice')} />
          <Input label="Selling Price *" type="number" step="0.01" error={errors.sellingPrice?.message} {...register('sellingPrice')} />
          <Input label="MRP" type="number" step="0.01" {...register('mrp')} />
          <Input label="GST %" type="number" step="0.01" {...register('gstPercentage')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="HSN Code" {...register('hsnCode')} />
          <Input label="Reorder Threshold" type="number" {...register('reorderThreshold')} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEditing ? 'Update' : 'Create'} Product</Button>
        </div>
      </form>
    </Modal>
  );
}
