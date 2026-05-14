import { z } from 'zod';

export const createShopSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional(),
  gstNumber: z.string().max(20).optional(),
  pan: z.string().max(15).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().max(10).optional(),
  taxEnabled: z.boolean().optional().default(true),
  defaultTaxRate: z.number().min(0).max(100).optional().default(18),
});

export const updateShopSchema = createShopSchema.partial();
