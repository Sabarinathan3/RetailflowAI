import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../common/helpers';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';

const authService = new AuthService(new AuthRepository());

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      sendSuccess(res, result, 'Shop registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async pinLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.pinLogin(req.body);
      sendSuccess(res, result, 'PIN login successful');
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshTokens(refreshToken);
      sendSuccess(res, tokens, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const repo = new AuthRepository();
      const user = await repo.findUserById(req.user!.userId);
      if (!user) {
        throw new Error('User not found');
      }
      sendSuccess(res, {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        shopId: user.shopId,
        branchId: user.branchId,
      }, 'User profile');
    } catch (error) {
      next(error);
    }
  }
}
