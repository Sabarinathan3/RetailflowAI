import { Role } from '@prisma/client';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface JwtPayload {
  userId: string;
  shopId: string;
  branchId: string | null;
  role: Role;
}

export interface JwtTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TenantContext {
  shopId: string;
  branchId: string;
  userId: string;
  role: Role;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      tenantContext?: TenantContext;
    }
  }
}
