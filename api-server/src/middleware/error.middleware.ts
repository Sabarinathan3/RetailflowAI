import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../common/errors';
import { sendError } from '../common/helpers';
import { logger } from '../config/logger';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(err);

  // Zod validation errors (caught by validate middleware)
  if (err instanceof ValidationError) {
    sendError(res, err.message, err.statusCode, err.code, err.errors);
    return;
  }

  // Custom AppError instances
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.code);
    return;
  }

  // Prisma known request errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    switch (prismaErr.code) {
      case 'P2002':
        sendError(res, `Duplicate value for: ${prismaErr.meta?.target?.join(', ')}`, 409, 'DUPLICATE');
        return;
      case 'P2025':
        sendError(res, 'Record not found', 404, 'NOT_FOUND');
        return;
      case 'P2003':
        sendError(res, 'Related record not found', 400, 'FOREIGN_KEY_VIOLATION');
        return;
      default:
        sendError(res, 'Database error', 500, 'DB_ERROR');
        return;
    }
  }

  // Prisma validation errors
  if (err.constructor.name === 'PrismaClientValidationError') {
    sendError(res, 'Invalid data provided', 400, 'VALIDATION_ERROR');
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token', 401, 'INVALID_TOKEN');
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Token expired', 401, 'TOKEN_EXPIRED');
    return;
  }

  // Fallback
  const statusCode = 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  sendError(res, message, statusCode, 'INTERNAL_ERROR');
}
