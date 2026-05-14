import { Response } from 'express';
import { ApiResponse, PaginationMeta, PaginationParams } from '../types';

/**
 * Send a standardized success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
  meta?: PaginationMeta
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    ...(meta && { meta }),
  };
  res.status(statusCode).json(response);
}

/**
 * Send a standardized error response
 */
export function sendError(
  res: Response,
  message: string = 'Internal server error',
  statusCode: number = 500,
  code?: string,
  errors?: Record<string, string[]>
): void {
  const response: ApiResponse<null> & { code?: string; errors?: Record<string, string[]> } = {
    success: false,
    data: null,
    message,
    ...(code && { code }),
    ...(errors && { errors }),
  };
  res.status(statusCode).json(response);
}

/**
 * Parse pagination parameters from query string
 */
export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(2000, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build pagination meta from total count
 */
export function buildPaginationMeta(
  total: number,
  params: PaginationParams
): PaginationMeta {
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages: Math.ceil(total / params.limit),
  };
}

/**
 * Generate a unique invoice number
 */
export function generateInvoiceNumber(prefix: string = 'INV'): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${datePart}-${randomPart}`;
}

/**
 * Generate a unique order number
 */
export function generateOrderNumber(prefix: string = 'PO'): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${datePart}-${randomPart}`;
}

/**
 * Build a WhatsApp reminder link
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
