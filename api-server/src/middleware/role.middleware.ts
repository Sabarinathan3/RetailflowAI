import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../common/errors';

/**
 * Middleware factory to restrict access to specific roles.
 * Must be used AFTER authMiddleware.
 *
 * @example
 * router.get('/admin-only', authMiddleware, roleMiddleware('ADMIN', 'OWNER'), controller.handler);
 */
export function roleMiddleware(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`
        )
      );
      return;
    }

    next();
  };
}
