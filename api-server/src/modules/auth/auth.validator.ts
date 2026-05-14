import { z } from 'zod';

export const registerSchema = z.object({
  shopName: z.string().min(2).max(100),
  ownerName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(15).optional(),
  password: z.string().min(6).max(100),
  branchName: z.string().min(2).max(100).optional().default('Main Branch'),
  gstNumber: z.string().max(20).optional(),
});

export const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
});

export const pinLoginSchema = z.object({
  shopId: z.string().uuid(),
  pin: z.string().length(4, 'PIN must be exactly 4 digits'),
  branchId: z.string().uuid().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
