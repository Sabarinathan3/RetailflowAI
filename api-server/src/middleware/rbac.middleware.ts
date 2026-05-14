import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../common/errors';
import { AdminService } from '../modules/admin/admin.service';
import { AdminRepository } from '../modules/admin/admin.repository';
import { Permission } from '@prisma/client';

const service = new AdminService(new AdminRepository());
const adminRepo = new AdminRepository();

// Extend Express Request to include admin data
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        email: string;
        role: string;
        permissions: Permission[];
      };
      sessionId?: string;
    }
  }
}

/**
 * Admin Authentication Middleware
 * Verifies JWT token and attaches admin data to request
 */
export const adminAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const payload = service.verifyToken(token);

    const session = await adminRepo.findAdminSessionByToken(token);
    if (!session?.isActive) {
      throw new UnauthorizedError('Session revoked or invalid');
    }
    if (session.expiresAt < new Date()) {
      throw new UnauthorizedError('Session expired');
    }
    if (session.adminUserId !== payload.id) {
      throw new UnauthorizedError('Session does not match token');
    }

    (req as any).admin = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions || [],
    };
    req.sessionId = session.id;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Permission Middleware
 * Checks if admin has required permissions
 */
export const checkPermission = (requiredPermission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const admin = (req as any).admin;

      if (!admin) {
        throw new UnauthorizedError('Admin not authenticated');
      }

      if (!service.hasPermission(admin.permissions, requiredPermission)) {
        throw new ForbiddenError('Insufficient permissions for this action');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Admin Role Middleware
 * Checks if admin has one of the required roles
 */
export const checkAdminRole = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const admin = (req as any).admin;

      if (!admin) {
        throw new UnauthorizedError('Admin not authenticated');
      }

      if (!requiredRoles.includes(admin.role)) {
        throw new ForbiddenError(`Only ${requiredRoles.join(', ')} can access this resource`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Multiple Permissions Middleware
 * Checks if admin has all required permissions
 */
export const checkAllPermissions = (requiredPermissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const admin = (req as any).admin;

      if (!admin) {
        throw new UnauthorizedError('Admin not authenticated');
      }

      const hasAllPermissions = requiredPermissions.every((perm) =>
        service.hasPermission(admin.permissions, perm)
      );

      if (!hasAllPermissions) {
        throw new ForbiddenError('Insufficient permissions for this action');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Any Permission Middleware
 * Checks if admin has any of the required permissions
 */
export const checkAnyPermission = (requiredPermissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const admin = (req as any).admin;

      if (!admin) {
        throw new UnauthorizedError('Admin not authenticated');
      }

      const hasAnyPermission = requiredPermissions.some((perm) =>
        service.hasPermission(admin.permissions, perm)
      );

      if (!hasAnyPermission) {
        throw new ForbiddenError('Insufficient permissions for this action');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Optional Admin Middleware
 * Tries to authenticate but doesn't fail if token is missing
 */
export const optionalAdminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = service.verifyToken(token);
      const session = await adminRepo.findAdminSessionByToken(token);
      if (session?.isActive && session.expiresAt >= new Date() && session.adminUserId === payload.id) {
        (req as any).admin = {
          id: payload.id,
          email: payload.email,
          role: payload.role,
          permissions: payload.permissions || [],
        };
        req.sessionId = session.id;
      }
    }

    next();
  } catch {
    next();
  }
};

/**
 * Audit Logging Middleware
 * Logs admin actions for audit trail
 */
export const auditLogMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Store original send function
  const originalSend = res.send;

  // Override send function to log after response
  res.send = function (data: any) {
    // Log admin activity
    const admin = (req as any).admin;
    if (admin && req.method !== 'GET') {
      const repo = new AdminRepository();
      repo.logAdminActivity({
        adminUserId: admin.id,
        action: req.method.toLowerCase(),
        resource: req.path.split('/')[2] || 'unknown',
        resourceId: req.params.id,
        description: `${req.method} ${req.path}`,
        status: res.statusCode >= 400 ? 'error' : 'success',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }).catch(console.error);
    }

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Rate Limit Middleware for Admin APIs
 */
import rateLimit from 'express-rate-limit';

export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

/**
 * Data Sanitization Middleware
 */
export const sanitizeAdminInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        // Remove dangerous characters and trim
        req.body[key] = req.body[key]
          .trim()
          .replace(/<[^>]*>/g, '')
          .substring(0, 1000); // Limit string length
      }
    });
  }

  next();
};
