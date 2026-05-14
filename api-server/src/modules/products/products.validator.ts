import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  sku: z.string().max(50).optional(),
  barcode: z.string().max(50).optional(),
  category: z.string().max(100).optional(),
  unit: z.string().max(20).optional().default('pcs'),
  purchasePrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  mrp: z.number().min(0).optional(),
  gstPercentage: z.number().min(0).max(100).optional().default(0),
  hsnCode: z.string().max(20).optional(),
  reorderThreshold: z.number().int().min(0).optional().default(10),
  imageUrl: z.string().url().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const searchProductSchema = z.object({
  q: z.string().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(2000).default(20),
  isActive: z.string().optional(),
}).transform((data) => ({
  ...data,
  // Merge: if `q` is not provided, fall back to `search`
  q: data.q || data.search || undefined,
}));
