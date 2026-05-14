import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { logger } from '../config/logger';

/**
 * Middleware factory that logs important actions to the audit_logs table.
 * Use on sensitive endpoints (billing, inventory changes, user management).
 *
 * @param action - Description of the action (e.g., 'CREATE_INVOICE', 'UPDATE_STOCK')
 * @param entity - Entity type (e.g., 'Invoice', 'Product')
 */
export function auditMiddleware(action: string, entity: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Capture the original json method to intercept responses
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      // Only log on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const entityId = req.params.id || body?.data?.id || null;

        prisma.auditLog
          .create({
            data: {
              shopId: req.user.shopId,
              userId: req.user.userId,
              action,
              entity,
              entityId,
              newValues: body?.data ? JSON.parse(JSON.stringify(body.data)) : null,
              ipAddress: req.ip || req.socket.remoteAddress || null,
              userAgent: req.headers['user-agent'] || null,
            },
          })
          .catch((err) => {
            logger.error('Failed to write audit log:', err);
          });
      }

      return originalJson(body);
    };

    next();
  };
}
