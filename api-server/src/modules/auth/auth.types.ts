import { Role } from '@prisma/client';

export interface RegisterInput {
  shopName: string;
  ownerName: string;
  email: string;
  phone?: string;
  password: string;
  branchName?: string;
  gstNumber?: string;
}

export interface LoginInput {
  emailOrPhone: string;
  password: string;
}

export interface PinLoginInput {
  shopId: string;
  pin: string;
  branchId?: string;
}

export interface RefreshInput {
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  shopId: string;
  branchId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  role: Role;
}

export interface RegisterResult {
  user: AuthUser;
  shop: { id: string; name: string };
  branch: { id: string; name: string };
  tokens: { accessToken: string; refreshToken: string };
}

export interface LoginResult {
  user: AuthUser;
  tokens: { accessToken: string; refreshToken: string };
}
