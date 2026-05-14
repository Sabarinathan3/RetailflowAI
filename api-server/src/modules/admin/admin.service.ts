import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { BadRequestError, ConflictError, UnauthorizedError, NotFoundError, ForbiddenError } from '../../common/errors';
import { AdminRepository } from './admin.repository';
import {
  AdminAuthResponse,
  AdminLoginInput,
  AdminRegisterInput,
  AdminTokens,
  JwtAdminPayload,
  ActivityLogFilter,
  SalesReportFilter,
  SalesReportResponse,
  InventoryReportResponse,
  DashboardAnalytics,
} from './admin.types';
import {
  AdminRole,
  Permission,
  PaymentMode,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@prisma/client';
import prisma from '../../config/db';
import { PlansService } from './plans.service';

export class AdminService {
  private readonly plansService = new PlansService();
  constructor(private repo: AdminRepository) {}

  // ─────────────────────────────────────────────
  // AUTHENTICATION
  // ─────────────────────────────────────────────

  async register(input: AdminRegisterInput): Promise<AdminAuthResponse> {
    // Validate input
    if (input.password !== input.confirmPassword) {
      throw new BadRequestError('Passwords do not match');
    }

    if (input.password.length < 8) {
      throw new BadRequestError('Password must be at least 8 characters long');
    }

    // Check if email already exists
    const existing = await this.repo.findAdminUserByEmail(input.email);
    if (existing) {
      throw new ConflictError('Email is already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 12);

    // Create admin user
    const adminUser = await this.repo.createAdminUser({
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: AdminRole.MANAGER,
      permissions: this.getDefaultPermissions(AdminRole.MANAGER),
    });

    const tokens = this.generateTokens(adminUser);
    await this.repo.createAdminSession({
      adminUserId: adminUser.id,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      id: adminUser.id,
      email: adminUser.email,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      role: adminUser.role,
      permissions: adminUser.permissions as Permission[],
      tokens,
    };
  }

  async login(input: AdminLoginInput, ipAddress?: string): Promise<AdminAuthResponse> {
    // Find admin user
    const adminUser = await this.repo.findAdminUserByEmail(input.email);

    if (!adminUser || !adminUser.isActive) {
      throw new UnauthorizedError('Invalid credentials or account is inactive');
    }

    // Verify password
    const validPassword = await bcrypt.compare(input.password, adminUser.password);
    if (!validPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate tokens
    const tokens = this.generateTokens(adminUser);

    // Create session
    await this.repo.createAdminSession({
      adminUserId: adminUser.id,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: ipAddress,
    });

    // Update last login
    await this.repo.updateLastLogin(adminUser.id, ipAddress);

    // Log activity
    await this.repo.logAdminActivity({
      adminUserId: adminUser.id,
      action: 'login',
      resource: 'admin_auth',
      status: 'success',
      ipAddress: ipAddress,
    });

    return {
      id: adminUser.id,
      email: adminUser.email,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      role: adminUser.role,
      permissions: adminUser.permissions as Permission[],
      tokens,
    };
  }

  async logout(adminUserId: string, sessionId?: string): Promise<void> {
    if (sessionId) {
      await this.repo.revokeAdminSession(sessionId);
    }

    await this.repo.logAdminActivity({
      adminUserId,
      action: 'logout',
      resource: 'admin_auth',
      status: 'success',
    });
  }

  async refreshToken(refreshToken: string): Promise<AdminTokens> {
    const session = await this.repo.findAdminSessionByRefreshToken(refreshToken);

    if (!session || !session.isActive || session.refreshExpiresAt! < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const adminUser = session.adminUser;
    const tokens = this.generateTokens(adminUser);

    // Update session with new tokens
    await this.repo.revokeAdminSession(session.id);
    await this.repo.createAdminSession({
      adminUserId: adminUser.id,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return tokens;
  }

  // ─────────────────────────────────────────────
  // PERMISSION & RBAC
  // ─────────────────────────────────────────────

  private getDefaultPermissions(role: AdminRole): Permission[] {
    const all = Object.values(Permission).filter((p): p is Permission => typeof p === 'string');
    const permissionMap: Record<AdminRole, Permission[]> = {
      ADMIN: all,
      MANAGER: [
        Permission.USER_VIEW,
        Permission.BRANCH_VIEW,
        Permission.PRODUCT_VIEW,
        Permission.INVENTORY_VIEW,
        Permission.ORDER_VIEW,
        Permission.SUPPLIER_VIEW,
        Permission.REPORTS_VIEW,
        Permission.ANALYTICS_VIEW,
      ],
    };

    return permissionMap[role] || [];
  }

  hasPermission(permissions: Permission[], requiredPermission: Permission): boolean {
    return permissions.includes(requiredPermission);
  }

  // ─────────────────────────────────────────────
  // ADMIN USER MANAGEMENT
  // ─────────────────────────────────────────────

  async getAdminUser(id: string) {
    const adminUser = await this.repo.findAdminUserById(id);
    if (!adminUser) {
      throw new NotFoundError('Admin user');
    }
    return adminUser;
  }

  async listAdminUsers(page: number = 1, limit: number = 20, search?: string) {
    return this.repo.getAllAdminUsers(page, limit, search);
  }

  async updateAdminUser(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      role?: AdminRole;
      permissions?: Permission[];
      isActive?: boolean;
    }
  ) {
    const adminUser = await this.getAdminUser(id);

    const updated = await this.repo.updateAdminUser(id, {
      firstName: data.firstName || adminUser.firstName,
      lastName: data.lastName || adminUser.lastName,
      phone: data.phone,
      role: data.role || adminUser.role,
      permissions: data.permissions,
      isActive: data.isActive,
    });

    return updated;
  }

  async deleteAdminUser(id: string, actorAdminId?: string) {
    if (actorAdminId && id === actorAdminId) {
      throw new BadRequestError('You cannot delete your own admin account');
    }
    await this.getAdminUser(id);
    return this.repo.deleteAdminUser(id);
  }

  getSubscriptionPlans() {
    return this.plansService.getPlans();
  }

  // ─────────────────────────────────────────────
  // ACTIVITY LOGGING
  // ─────────────────────────────────────────────

  async getActivityLogs(filter: ActivityLogFilter, page: number = 1, limit: number = 50) {
    return this.repo.getActivityLogs(filter, page, limit);
  }

  // ─────────────────────────────────────────────
  // SETTINGS MANAGEMENT
  // ─────────────────────────────────────────────

  async getSettings(category?: string) {
    if (category) {
      return this.repo.getSettingsByCategory(category);
    }
    return this.repo.getAllSettings();
  }

  async updateSetting(
    key: string,
    value: any,
    adminUserId: string,
    category?: string
  ) {
    return this.repo.createOrUpdateSetting({
      key,
      value,
      category: category || 'general',
      updatedBy: adminUserId,
    });
  }

  // ─────────────────────────────────────────────
  // DASHBOARD & ANALYTICS
  // ─────────────────────────────────────────────

  async getDashboardMetrics(): Promise<DashboardAnalytics> {
    const platformMetrics = await this.repo.getDashboardMetrics();
    const [todaySales, weekSales, monthSales, inventoryMetrics, yesterdaySales, failedTransactions] =
      await Promise.all([
        this.getTodaySales(),
        this.getWeekSales(),
        this.getMonthSales(),
        this.getInventoryMetricsSnapshot(),
        this.getYesterdaySales(),
        prisma.invoice.count({ where: { status: { not: 'COMPLETED' } } }),
      ]);

    const growthPercent =
      yesterdaySales > 0
        ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 1000) / 10
        : 0;

    return {
      salesMetrics: {
        todaySales,
        weekSales,
        monthSales,
        growthPercent,
      },
      inventoryMetrics,
      userMetrics: {
        totalUsers: platformMetrics.users.total,
        activeUsers: platformMetrics.users.active,
        newUsersThisMonth: await this.getNewUsersThisMonth(),
      },
      transactionMetrics: {
        totalTransactions: await prisma.invoice.count(),
        failedTransactions,
        avgTransactionValue: await this.getAverageTransactionValue(),
      },
    };
  }

  private async getInventoryMetricsSnapshot(): Promise<DashboardAnalytics['inventoryMetrics']> {
    const rows = await prisma.inventory.findMany({
      select: {
        quantity: true,
        product: { select: { sellingPrice: true, reorderThreshold: true } },
      },
    });

    let lowStockCount = 0;
    let totalValue = 0;
    for (const row of rows) {
      totalValue += row.quantity * (row.product.sellingPrice || 0);
      if (row.quantity > 0 && row.quantity <= row.product.reorderThreshold) {
        lowStockCount += 1;
      }
    }

    const [totalProducts, outOfStockCount] = await Promise.all([
      prisma.product.count(),
      prisma.inventory.count({ where: { quantity: 0 } }),
    ]);

    return {
      totalProducts,
      lowStockCount,
      outOfStockCount,
      totalValue,
    };
  }

  private async getYesterdaySales(): Promise<number> {
    const start = new Date();
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);

    const result = await prisma.invoice.aggregate({
      where: { createdAt: { gte: start, lte: end } },
      _sum: { totalAmount: true },
    });

    return result._sum?.totalAmount || 0;
  }

  private async getTodaySales(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await prisma.invoice.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { totalAmount: true },
    });

    return result._sum?.totalAmount || 0;
  }

  private async getWeekSales(): Promise<number> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const result = await prisma.invoice.aggregate({
      where: { createdAt: { gte: weekAgo } },
      _sum: { totalAmount: true },
    });

    return result._sum?.totalAmount || 0;
  }

  private async getMonthSales(): Promise<number> {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const result = await prisma.invoice.aggregate({
      where: { createdAt: { gte: monthAgo } },
      _sum: { totalAmount: true },
    });

    return result._sum?.totalAmount || 0;
  }

  private async getNewUsersThisMonth(): Promise<number> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    return prisma.user.count({
      where: { createdAt: { gte: monthStart } },
    });
  }

  private async getAverageTransactionValue(): Promise<number> {
    const result = await prisma.invoice.aggregate({
      _avg: { totalAmount: true },
    });

    return result._avg?.totalAmount || 0;
  }

  // ─────────────────────────────────────────────
  // REPORTS
  // ─────────────────────────────────────────────

  async generateSalesReport(filter: SalesReportFilter): Promise<SalesReportResponse> {
    const where: any = {
      createdAt: {
        gte: filter.startDate,
        lte: filter.endDate,
      },
    };

    if (filter.shopId) where.shopId = filter.shopId;
    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.paymentMode) where.paymentMode = filter.paymentMode as PaymentMode;

    const invoices = await prisma.invoice.findMany({
      where,
      include: { customer: true, items: true },
    });

    const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalTax = invoices.reduce((sum, inv) => sum + inv.taxAmount, 0);
    const averageTransaction = totalSales / (invoices.length || 1);

    // Payment breakdown
    const paymentBreakdown: Record<string, number> = {};
    invoices.forEach((inv) => {
      paymentBreakdown[inv.paymentMode] = (paymentBreakdown[inv.paymentMode] || 0) + inv.totalAmount;
    });

    // Top products (from line items on filtered invoices)
    const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const inv of invoices) {
      for (const item of inv.items) {
        if (!productMap[item.productId]) {
          productMap[item.productId] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        productMap[item.productId].quantity += item.quantity;
        productMap[item.productId].revenue += item.totalPrice;
      }
    }

    const topProducts = Object.values(productMap)
      .map((p) => ({ productName: p.name, quantity: p.quantity, revenue: p.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Top customers
    const customerMap: Record<string, { name: string; transactions: number; totalSpent: number }> = {};
    invoices.forEach((inv) => {
      const customerId = inv.customerId || 'Walk-in';
      if (!customerMap[customerId]) {
        customerMap[customerId] = {
          name: inv.customer?.name || 'Walk-in',
          transactions: 0,
          totalSpent: 0,
        };
      }
      customerMap[customerId].transactions += 1;
      customerMap[customerId].totalSpent += inv.totalAmount;
    });

    const topCustomers = Object.values(customerMap)
      .map((c) => ({
        customerName: c.name,
        transactions: c.transactions,
        totalSpent: c.totalSpent,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      period: `${filter.startDate.toLocaleDateString()} - ${filter.endDate.toLocaleDateString()}`,
      totalSales,
      totalTransactions: invoices.length,
      averageTransactionValue: averageTransaction,
      totalTax,
      paymentBreakdown,
      topProducts,
      topCustomers,
    };
  }

  async generateInventoryReport(): Promise<InventoryReportResponse> {
    const [inventory, fastMoving, slowMoving] = await Promise.all([
      prisma.inventory.findMany({
        include: { product: true },
      }),
      prisma.inventory.findMany({
        where: { quantity: { gt: 0 } },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: { product: true },
      }),
      prisma.inventory.findMany({
        where: { quantity: { gt: 0 } },
        orderBy: { updatedAt: 'asc' },
        take: 10,
        include: { product: true },
      }),
    ]);

    const totalValue = inventory.reduce((sum, item) => {
      return sum + item.quantity * (item.product.sellingPrice || 0);
    }, 0);

    const lowStockCount = inventory.filter(
      (item) => item.quantity <= item.product.reorderThreshold
    ).length;

    const outOfStockCount = inventory.filter((item) => item.quantity === 0).length;

    return {
      totalProducts: (await prisma.product.count()),
      totalValue,
      lowStockItems: lowStockCount,
      outOfStockItems: outOfStockCount,
      fastMoving: fastMoving.map((item) => ({
        productName: item.product.name,
        quantity: item.quantity,
        value: item.quantity * item.product.sellingPrice,
      })),
      slowMoving: slowMoving.map((item) => ({
        productName: item.product.name,
        quantity: item.quantity,
        value: item.quantity * item.product.sellingPrice,
      })),
    };
  }

  // ─────────────────────────────────────────────
  // SHOP MANAGEMENT
  // ─────────────────────────────────────────────

  async listShops(page: number = 1, limit: number = 20, search?: string) {
    return this.repo.getAllShops(page, limit, search);
  }

  async getShop(shopId: string) {
    const shop = await this.repo.getShopById(shopId);
    if (!shop) throw new NotFoundError('Shop');
    return shop;
  }

  async getShopMetrics(shopId: string) {
    return this.repo.getShopMetrics(shopId);
  }

  async updateSubscription(shopId: string, plan: SubscriptionPlan, status: SubscriptionStatus, expiryDate?: Date) {
    await this.getShop(shopId);
    return this.repo.updateShopSubscription(shopId, plan, status, expiryDate);
  }

  async toggleShopActive(shopId: string, isActive: boolean) {
    await this.getShop(shopId);
    return this.repo.toggleShopActive(shopId, isActive);
  }

  async updateFeatureFlags(shopId: string, flags: any) {
    await this.getShop(shopId);
    return this.repo.updateFeatureFlags(shopId, flags);
  }

  async getUsageAnalytics() {
    return this.repo.getUsageAnalytics();
  }

  // ─────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────

  private generateTokens(adminUser: any): AdminTokens {
    const payload: JwtAdminPayload = {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      permissions: adminUser.permissions || [],
    };

    const accessOpts: SignOptions = {
      expiresIn: env.JWT_ACCESS_EXPIRY as SignOptions['expiresIn'],
    };
    const refreshOpts: SignOptions = {
      expiresIn: env.JWT_REFRESH_EXPIRY as SignOptions['expiresIn'],
    };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, accessOpts);
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, refreshOpts);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  verifyToken(token: string): JwtAdminPayload {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAdminPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}
