import { Request, Response, NextFunction } from 'express';
import { sendSuccess, parsePagination, buildPaginationMeta } from '../../common/helpers';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';
import { Permission } from '@prisma/client';

const service = new AdminService(new AdminRepository());

export class AdminController {
  // ─────────────────────────────────────────────
  // AUTHENTICATION ENDPOINTS
  // ─────────────────────────────────────────────

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.register(req.body);
      sendSuccess(res, result, 'Admin registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip;
      const result = await service.login(req.body, ipAddress);
      sendSuccess(res, result, 'Logged in successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).admin.id;
      const sessionId = (req as any).sessionId;
      await service.logout(adminId, sessionId);
      sendSuccess(res, null, 'Logged out successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await service.refreshToken(refreshToken);
      sendSuccess(res, tokens, 'Token refreshed', 200);
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).admin.id;
      const admin = await service.getAdminUser(adminId);
      const { password, ...profile } = admin;
      sendSuccess(res, profile, 'Profile retrieved', 200);
    } catch (error) {
      next(error);
    }
  }

  // ─────────────────────────────────────────────
  // ADMIN USER MANAGEMENT
  // ─────────────────────────────────────────────

  async listAdminUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query as any);
      const result = await service.listAdminUsers(pagination.page, pagination.limit, req.query.search as string);
      const meta = buildPaginationMeta(result.total, pagination);
      sendSuccess(res, result.data, 'Admin users retrieved', 200, meta);
    } catch (error) {
      next(error);
    }
  }

  async getAdminUser(req: Request, res: Response, next: NextFunction) {
    try {
      const admin = await service.getAdminUser(req.params.id);
      const { password, ...profile } = admin;
      sendSuccess(res, profile, 'Admin user retrieved', 200);
    } catch (error) {
      next(error);
    }
  }

  async updateAdminUser(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await service.updateAdminUser(req.params.id, req.body);
      const { password, ...profile } = updated;
      sendSuccess(res, profile, 'Admin user updated', 200);
    } catch (error) {
      next(error);
    }
  }

  async deleteAdminUser(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = (req as any).admin?.id as string;
      await service.deleteAdminUser(req.params.id, actorId);
      sendSuccess(res, null, 'Admin user deleted', 200);
    } catch (error) {
      next(error);
    }
  }

  // ─────────────────────────────────────────────
  // ACTIVITY LOGS
  // ─────────────────────────────────────────────

  async getActivityLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query as any);
      const filter = {
        adminUserId: req.query.adminUserId as string,
        action: req.query.action as string,
        resource: req.query.resource as string,
        severity: req.query.severity as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const result = await service.getActivityLogs(filter, pagination.page, pagination.limit);
      const meta = buildPaginationMeta(result.total, pagination);
      sendSuccess(res, result.data, 'Activity logs retrieved', 200, meta);
    } catch (error) {
      next(error);
    }
  }

  // ─────────────────────────────────────────────
  // SETTINGS
  // ─────────────────────────────────────────────

  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await service.getSettings(req.query.category as string);
      sendSuccess(res, settings, 'Settings retrieved', 200);
    } catch (error) {
      next(error);
    }
  }

  async updateSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).admin.id;
      const { key, value, category } = req.body;
      const setting = await service.updateSetting(key, value, adminId, category);
      sendSuccess(res, setting, 'Setting updated', 200);
    } catch (error) {
      next(error);
    }
  }

  // ─────────────────────────────────────────────
  // DASHBOARD & ANALYTICS
  // ─────────────────────────────────────────────

  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await service.getDashboardMetrics();
      sendSuccess(res, metrics, 'Dashboard metrics retrieved', 200);
    } catch (error) {
      next(error);
    }
  }

  async getUsageAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await service.getUsageAnalytics();
      sendSuccess(res, analytics, 'Usage analytics retrieved', 200);
    } catch (error) {
      next(error);
    }
  }

  // ─────────────────────────────────────────────
  // REPORTS
  // ─────────────────────────────────────────────

  async generateSalesReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, shopId, branchId, paymentMode } = req.body;
      const report = await service.generateSalesReport({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        shopId,
        branchId,
        paymentMode,
      });
      sendSuccess(res, report, 'Sales report generated', 200);
    } catch (error) {
      next(error);
    }
  }

  async generateInventoryReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await service.generateInventoryReport();
      sendSuccess(res, report, 'Inventory report generated', 200);
    } catch (error) {
      next(error);
    }
  }

  // ─────────────────────────────────────────────
  // SHOP MANAGEMENT
  // ─────────────────────────────────────────────

  async listShops(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query as any);
      const { shops, total } = await service.listShops(pagination.page, pagination.limit, req.query.search as string);
      const meta = buildPaginationMeta(total, pagination);
      sendSuccess(res, shops, 'All shops', 200, meta);
    } catch (error) {
      next(error);
    }
  }

  async getShop(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = await service.getShop(req.params.id);
      sendSuccess(res, shop, 'Shop details', 200);
    } catch (error) {
      next(error);
    }
  }

  async getShopMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await service.getShopMetrics(req.params.id);
      sendSuccess(res, metrics, 'Shop metrics retrieved', 200);
    } catch (error) {
      next(error);
    }
  }

  async updateSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const { plan, status, expiryDate } = req.body;
      const shop = await service.updateSubscription(
        req.params.id,
        plan,
        status,
        expiryDate ? new Date(expiryDate) : undefined
      );
      sendSuccess(res, shop, 'Subscription updated', 200);
    } catch (error) {
      next(error);
    }
  }

  async toggleShopActive(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive } = req.body;
      const shop = await service.toggleShopActive(req.params.id, isActive);
      sendSuccess(res, shop, `Shop ${isActive ? 'enabled' : 'disabled'}`, 200);
    } catch (error) {
      next(error);
    }
  }

  async updateFeatureFlags(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = await service.updateFeatureFlags(req.params.id, req.body.flags);
      sendSuccess(res, shop, 'Feature flags updated', 200);
    } catch (error) {
      next(error);
    }
  }

  async getSubscriptionPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = service.getSubscriptionPlans();
      sendSuccess(res, plans, 'Subscription plans retrieved', 200);
    } catch (error) {
      next(error);
    }
  }
}
