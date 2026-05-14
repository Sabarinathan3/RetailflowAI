import prisma from '../../config/db';
import { PaginatedResponse, ActivityLogFilter, ActivityLogResponse } from './admin.types';
import { AdminRole, Permission } from '@prisma/client';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

export class AdminRepository {
  // ─────────────────────────────────────────────
  // ADMIN USER OPERATIONS
  // ─────────────────────────────────────────────

  async createAdminUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: AdminRole;
    permissions?: Permission[];
  }) {
    return prisma.adminUser.create({
      data: {
        email: data.email.toLowerCase(),
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
        permissions: data.permissions || [],
        isActive: true,
      },
    });
  }

  async findAdminUserByEmail(email: string) {
    return prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findAdminUserById(id: string) {
    return prisma.adminUser.findUnique({
      where: { id },
    });
  }

  async getAllAdminUsers(
    page: number = 1,
    limit: number = 20,
    search?: string
  ): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.adminUser.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          permissions: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.adminUser.count({ where }),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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
    return prisma.adminUser.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
        permissions: data.permissions,
        isActive: data.isActive,
      },
    });
  }

  async deleteAdminUser(id: string) {
    return prisma.adminUser.delete({
      where: { id },
    });
  }

  async updateLastLogin(adminUserId: string, ipAddress?: string) {
    return prisma.adminUser.update({
      where: { id: adminUserId },
      data: {
        lastLoginAt: new Date(),
        ipAddress: ipAddress,
        lastActivityAt: new Date(),
      },
    });
  }

  // ─────────────────────────────────────────────
  // ADMIN SESSION OPERATIONS
  // ─────────────────────────────────────────────

  async createAdminSession(data: {
    adminUserId: string;
    token: string;
    refreshToken?: string;
    expiresAt: Date;
    refreshExpiresAt?: Date;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.adminSession.create({
      data: {
        adminUserId: data.adminUserId,
        token: data.token,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
        refreshExpiresAt: data.refreshExpiresAt,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        isActive: true,
      },
    });
  }

  async findAdminSessionByToken(token: string) {
    return prisma.adminSession.findUnique({
      where: { token },
      include: { adminUser: true },
    });
  }

  async findAdminSessionByRefreshToken(refreshToken: string) {
    return prisma.adminSession.findUnique({
      where: { refreshToken: refreshToken || '' },
      include: { adminUser: true },
    });
  }

  async revokeAdminSession(sessionId: string) {
    return prisma.adminSession.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });
  }

  async revokeAllAdminSessions(adminUserId: string) {
    return prisma.adminSession.updateMany({
      where: { adminUserId, isActive: true },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });
  }

  // ─────────────────────────────────────────────
  // ACTIVITY LOG OPERATIONS
  // ─────────────────────────────────────────────

  async logAdminActivity(data: {
    adminUserId: string;
    action: string;
    resource: string;
    resourceId?: string;
    description?: string;
    oldValues?: any;
    newValues?: any;
    status: string;
    errorMessage?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.adminActivityLog.create({
      data: {
        adminUserId: data.adminUserId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        description: data.description,
        oldValues: data.oldValues,
        newValues: data.newValues,
        status: data.status,
        errorMessage: data.errorMessage,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  async getActivityLogs(
    filter: ActivityLogFilter,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<ActivityLogResponse>> {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filter.adminUserId) where.adminUserId = filter.adminUserId;
    if (filter.action) where.action = filter.action;
    if (filter.resource) where.resource = filter.resource;

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = filter.startDate;
      if (filter.endDate) where.createdAt.lte = filter.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.adminActivityLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          adminUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.adminActivityLog.count({ where }),
    ]);

    return {
      data: logs.map((log: (typeof logs)[number]) => ({
        id: log.id,
        adminUser: {
          id: log.adminUser.id,
          email: log.adminUser.email,
          name: `${log.adminUser.firstName} ${log.adminUser.lastName}`,
        },
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId ?? undefined,
        description: log.description ?? undefined,
        status: log.status,
        createdAt: log.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─────────────────────────────────────────────
  // ADMIN SETTINGS OPERATIONS
  // ─────────────────────────────────────────────

  async getSettingByKey(key: string) {
    return prisma.adminSettings.findUnique({
      where: { key },
    });
  }

  async getSettingsByCategory(category: string) {
    return prisma.adminSettings.findMany({
      where: { category },
    });
  }

  async getAllSettings() {
    return prisma.adminSettings.findMany({
      orderBy: { category: 'asc' },
    });
  }

  async createOrUpdateSetting(data: {
    key: string;
    value: any;
    category: string;
    description?: string;
    updatedBy?: string;
  }) {
    const existing = await prisma.adminSettings.findUnique({
      where: { key: data.key },
    });

    if (existing) {
      return prisma.adminSettings.update({
        where: { key: data.key },
        data: {
          value: data.value,
          updatedBy: data.updatedBy,
          updatedAt: new Date(),
        },
      });
    } else {
      return prisma.adminSettings.create({
        data: {
          key: data.key,
          value: data.value,
          category: data.category,
          description: data.description,
          updatedBy: data.updatedBy,
        },
      });
    }
  }

  // ─────────────────────────────────────────────
  // SYSTEM AUDIT OPERATIONS
  // ─────────────────────────────────────────────

  async createSystemAudit(data: {
    adminUserId?: string;
    eventType: string;
    entity?: string;
    entityId?: string;
    changes?: any;
    severity?: string;
    status?: string;
    message?: string;
    ipAddress?: string;
  }) {
    return prisma.systemAudit.create({
      data: {
        adminUserId: data.adminUserId,
        eventType: data.eventType,
        entity: data.entity,
        entityId: data.entityId,
        changes: data.changes,
        severity: data.severity || 'info',
        status: data.status || 'completed',
        message: data.message,
        ipAddress: data.ipAddress,
      },
    });
  }

  async getSystemAuditLogs(
    page: number = 1,
    limit: number = 50,
    eventType?: string,
    severity?: string
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (eventType) where.eventType = eventType;
    if (severity) where.severity = severity;

    const [logs, total] = await Promise.all([
      prisma.systemAudit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.systemAudit.count({ where }),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─────────────────────────────────────────────
  // DASHBOARD ANALYTICS & SHOP OPERATIONS
  // ─────────────────────────────────────────────

  async getAllShops(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { branches: true, users: true, invoices: true, products: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.shop.count({ where }),
    ]);
    return { shops, total };
  }

  async getShopById(shopId: string) {
    return prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        branches: true,
        _count: {
          select: { users: true, invoices: true, products: true, customers: true },
        },
      },
    });
  }

  async updateShopSubscription(shopId: string, plan: SubscriptionPlan, status: SubscriptionStatus, expiryDate?: Date) {
    return prisma.shop.update({
      where: { id: shopId },
      data: {
        subscriptionPlan: plan,
        subscriptionStatus: status,
        subscriptionExpiry: expiryDate,
      },
    });
  }

  async toggleShopActive(shopId: string, isActive: boolean) {
    return prisma.shop.update({
      where: { id: shopId },
      data: { isActive },
    });
  }

  async updateFeatureFlags(shopId: string, flags: any) {
    return prisma.shop.update({
      where: { id: shopId },
      data: { featureFlags: flags },
    });
  }

  async getUsageAnalytics() {
    const [totalShops, activeShops, totalUsers, totalInvoices, totalProducts] = await Promise.all([
      prisma.shop.count(),
      prisma.shop.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.invoice.count(),
      prisma.product.count(),
    ]);

    // Subscription breakdown
    const subscriptionBreakdown = await prisma.shop.groupBy({
      by: ['subscriptionPlan'],
      _count: true,
    });

    // Revenue this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyRevenue = await prisma.invoice.aggregate({
      where: { createdAt: { gte: monthStart }, status: 'COMPLETED' },
      _sum: { totalAmount: true },
      _count: true,
    });

    return {
      totalShops,
      activeShops,
      totalUsers,
      totalInvoices,
      totalProducts,
      subscriptionBreakdown: subscriptionBreakdown.map((s: (typeof subscriptionBreakdown)[number]) => ({
        plan: s.subscriptionPlan,
        count: s._count,
      })),
      monthlyPlatformRevenue: {
        invoiceCount: monthlyRevenue._count,
        totalAmount: monthlyRevenue._sum.totalAmount || 0,
      },
    };
  }

  async getDashboardMetrics() {
    const totalShops = await prisma.shop.count();
    const activeShops = await prisma.shop.count({
      where: { isActive: true },
    });
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { isActive: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayInvoices = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: today,
        },
      },
      select: { totalAmount: true },
    });

    const todaySales = todayInvoices.reduce(
      (sum: number, inv: (typeof todayInvoices)[number]) => sum + inv.totalAmount,
      0
    );

    return {
      shops: {
        total: totalShops,
        active: activeShops,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      sales: {
        todayTotal: todaySales,
        invoiceCount: todayInvoices.length,
      },
    };
  }

  async getAllUsers(
    page: number = 1,
    limit: number = 20,
    shopId?: string,
    branchId?: string,
    search?: string
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (shopId) where.shopId = shopId;
    if (branchId) where.branchId = branchId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          shopId: true,
          branchId: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getShopMetrics(shopId: string) {
    const [branchCount, userCount, productCount, invoiceCount] =
      await Promise.all([
        prisma.branch.count({ where: { shopId } }),
        prisma.user.count({ where: { shopId } }),
        prisma.product.count({ where: { shopId } }),
        prisma.invoice.count({ where: { shopId } }),
      ]);

    const totalSales = await prisma.invoice.aggregate({
      where: { shopId },
      _sum: { totalAmount: true },
    });

    return {
      branches: branchCount,
      users: userCount,
      products: productCount,
      invoices: invoiceCount,
      totalSales: totalSales._sum?.totalAmount || 0,
    };
  }
}
