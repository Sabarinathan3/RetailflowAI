import { Request, Response, NextFunction } from 'express';
import { BadRequestError, UnauthorizedError } from '../common/errors';
import prisma from '../config/db';

/**
 * Middleware to extract and validate tenant context (shop_id, branch_id) from
 * the authenticated JWT payload. Ensures multi-tenant isolation.
 * Must be used AFTER authMiddleware.
 *
 * Also allows branch_id override via X-Branch-Id header (for users with multi-branch access).
 */
export async function tenantMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }

  const { shopId, branchId, userId, role } = req.user;

  if (!shopId) {
    next(new BadRequestError('Shop context missing from token'));
    return;
  }

  // Allow branch override via header (for owners/managers switching branches)
  const headerBranchId = req.headers['x-branch-id'] as string | undefined;
  const effectiveBranchId = headerBranchId || branchId;

  if (!effectiveBranchId && role !== 'ADMIN') {
    next(new BadRequestError('Branch context required. Set X-Branch-Id header or ensure branch is in token.'));
    return;
  }

  // Validate branchId belongs to this shop (prevents FK errors + tenant leakage)
  if (effectiveBranchId) {
    try {
      const branch = await prisma.branch.findFirst({
        where: { id: effectiveBranchId, shopId, isActive: true },
        select: { id: true },
      });
      if (!branch) {
        next(new BadRequestError('Invalid branchId for this shop'));
        return;
      }
    } catch (err) {
      next(new BadRequestError('Failed to validate branch context'));
      return;
    }
  }

  req.tenantContext = {
    shopId,
    branchId: effectiveBranchId || '',
    userId,
    role,
  };

  next();
}
