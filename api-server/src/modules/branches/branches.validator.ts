import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().max(10).optional(),
  phone: z.string().min(10).max(15).optional(),
  email: z.string().email().optional(),
  isMain: z.boolean().optional().default(false),
  printerConfig: z.object({
    type: z.enum(['thermal', 'a4', 'none']).default('thermal'),
    width: z.number().optional().default(80),
    name: z.string().optional(),
  }).optional(),
  taxSettings: z.object({
    enabled: z.boolean().default(true),
    defaultRate: z.number().min(0).max(100).default(18),
    includeInPrice: z.boolean().default(false),
  }).optional(),
});

export const updateBranchSchema = createBranchSchema.partial();
