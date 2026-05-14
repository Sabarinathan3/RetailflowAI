import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../common/errors';
import { JwtPayload } from '../common/types';

/**
 * Middleware to verify JWT access token and attach user info to request.
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  let token = '';
  try {
    const rawAuthHeader = req.headers.authorization;
    const authHeader = Array.isArray(rawAuthHeader) ? rawAuthHeader[0] : rawAuthHeader;

    if (!authHeader || !/^Bearer\s+/i.test(authHeader)) {
      throw new UnauthorizedError('Access token required');
    }

    token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token || token === 'null' || token === 'undefined') {
      throw new UnauthorizedError('Valid access token required');
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    req.user = {
      userId: decoded.userId,
      shopId: decoded.shopId,
      branchId: decoded.branchId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error(`[Auth] JWT Error: ${error.message} - Token: ${token.substring(0, 10)}...`);
      next(new UnauthorizedError(`Invalid token: ${error.message}`));
    } else {
      console.error('[Auth] Unexpected Error:', error);
      next(new UnauthorizedError('Authentication failed'));
    }
  }
}
