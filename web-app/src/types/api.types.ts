export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
  meta?: PaginationMeta;
  code?: string;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}
