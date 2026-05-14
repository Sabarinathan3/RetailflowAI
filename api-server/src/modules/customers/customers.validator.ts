import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(10).max(15),
  email: z.string().email().optional(),
  address: z.string().max(500).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const searchCustomerSchema = z.object({
  phone: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
