import { z } from 'zod';

export const addStockSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
  batchNumber: z.string().optional(),
  expiryDate: z.coerce.date().optional(),
  costPrice: z.number().min(0).optional(),
  reason: z.string().max(500).optional(),
});

export const adjustStockSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int(), // can be negative for adjustments
  batchNumber: z.string().optional(),
  reason: z.string().min(1).max(500),
});

export const transferStockSchema = z.object({
  productId: z.string().uuid(),
  fromBranchId: z.string().uuid(),
  toBranchId: z.string().uuid(),
  quantity: z.number().int().min(1),
  batchNumber: z.string().optional(),
  notes: z.string().max(500).optional(),
});
