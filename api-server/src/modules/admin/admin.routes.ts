import { Router } from 'express';
import { AdminController } from './admin.controller';
import {
  adminAuthMiddleware,
  checkPermission,
  checkAdminRole,
  checkAllPermissions,
  adminRateLimiter,
  adminLoginLimiter,
  sanitizeAdminInput,
  auditLogMiddleware,
} from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { z } from 'zod';
import { Permission } from '@prisma/client';

const router = Router();
const controller = new AdminController();

// ─────────────────────────────────────────────
// VALIDATION SCHEMAS
// ─────────────────────────────────────────────

const adminRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
});

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

const updateAdminUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER']).optional(),
  permissions: z.array(z.enum(Object.values(Permission) as any)).optional(),
  isActive: z.boolean().optional(),
});

const settingSchema = z.object({
  key: z.string(),
  value: z.any(),
  category: z.string().optional(),
});

const salesReportSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  shopId: z.string().optional(),
  branchId: z.string().optional(),
  paymentMode: z.string().optional(),
});

const subscriptionSchema = z.object({
  plan: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELLED']),
  expiryDate: z.string().optional(),
});

const toggleActiveSchema = z.object({
  isActive: z.boolean(),
});

const featureFlagsSchema = z.object({
  flags: z.record(z.boolean()),
});

// ─────────────────────────────────────────────
// AUTHENTICATION ROUTES (Public)
// ─────────────────────────────────────────────

router.post(
  '/auth/register',
  sanitizeAdminInput,
  validate(adminRegisterSchema),
  controller.register.bind(controller)
);

router.post(
  '/auth/login',
  adminLoginLimiter,
  sanitizeAdminInput,
  validate(adminLoginSchema),
  controller.login.bind(controller)
);

router.post(
  '/auth/refresh',
  validate(refreshTokenSchema),
  controller.refreshToken.bind(controller)
);

// ─────────────────────────────────────────────
// PROTECTED ADMIN ROUTES (Require Auth)
// ─────────────────────────────────────────────

router.use(adminAuthMiddleware);
router.use(auditLogMiddleware);
router.use(adminRateLimiter);

// Profile
router.get('/auth/profile', controller.getProfile.bind(controller));
router.post('/auth/logout', controller.logout.bind(controller));

router.get(
  '/subscription-plans',
  checkAdminRole(['ADMIN', 'MANAGER']),
  controller.getSubscriptionPlans.bind(controller)
);

// ─────────────────────────────────────────────
// ADMIN USER MANAGEMENT
// ─────────────────────────────────────────────

router.get(
  '/users',
  checkAdminRole(['ADMIN']),
  controller.listAdminUsers.bind(controller)
);

router.get(
  '/users/:id',
  checkAdminRole(['ADMIN']),
  controller.getAdminUser.bind(controller)
);

router.put(
  '/users/:id',
  checkAdminRole(['ADMIN']),
  sanitizeAdminInput,
  validate(updateAdminUserSchema),
  controller.updateAdminUser.bind(controller)
);

router.delete(
  '/users/:id',
  checkAdminRole(['ADMIN']),
  controller.deleteAdminUser.bind(controller)
);

// ─────────────────────────────────────────────
// ACTIVITY LOGS
// ─────────────────────────────────────────────

router.get(
  '/logs',
  checkPermission(Permission.AUDIT_LOGS_VIEW),
  controller.getActivityLogs.bind(controller)
);

// ─────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────

router.get(
  '/settings',
  checkPermission(Permission.ADMIN_SETTINGS),
  controller.getSettings.bind(controller)
);

router.put(
  '/settings',
  checkPermission(Permission.ADMIN_SETTINGS),
  sanitizeAdminInput,
  validate(settingSchema),
  controller.updateSetting.bind(controller)
);

// ─────────────────────────────────────────────
// DASHBOARD & ANALYTICS
// ─────────────────────────────────────────────

router.get(
  '/dashboard',
  checkPermission(Permission.ANALYTICS_VIEW),
  controller.getDashboard.bind(controller)
);

router.get(
  '/analytics',
  checkPermission(Permission.ANALYTICS_VIEW),
  controller.getUsageAnalytics.bind(controller)
);

// ─────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────

router.post(
  '/reports/sales',
  checkPermission(Permission.REPORTS_VIEW),
  sanitizeAdminInput,
  validate(salesReportSchema),
  controller.generateSalesReport.bind(controller)
);

router.get(
  '/reports/inventory',
  checkPermission(Permission.REPORTS_VIEW),
  controller.generateInventoryReport.bind(controller)
);

// ─────────────────────────────────────────────
// SHOP MANAGEMENT
// ─────────────────────────────────────────────

router.get(
  '/shops',
  checkAdminRole(['ADMIN']),
  controller.listShops.bind(controller)
);

router.get(
  '/shops/:id',
  checkAdminRole(['ADMIN']),
  controller.getShop.bind(controller)
);

router.get(
  '/shops/:id/metrics',
  checkAdminRole(['ADMIN']),
  controller.getShopMetrics.bind(controller)
);

router.put(
  '/shops/:id/subscription',
  checkAdminRole(['ADMIN']),
  sanitizeAdminInput,
  validate(subscriptionSchema),
  controller.updateSubscription.bind(controller)
);

router.patch(
  '/shops/:id/toggle',
  checkAdminRole(['ADMIN']),
  sanitizeAdminInput,
  validate(toggleActiveSchema),
  controller.toggleShopActive.bind(controller)
);

router.put(
  '/shops/:id/feature-flags',
  checkAdminRole(['ADMIN']),
  sanitizeAdminInput,
  validate(featureFlagsSchema),
  controller.updateFeatureFlags.bind(controller)
);

export default router;
