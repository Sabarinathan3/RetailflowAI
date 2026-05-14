import type { Shop } from './shop.types';
import type { SubscriptionPlan, SubscriptionStatus } from './enums';

export interface AdminPlanDefinition {
  id: string;
  name: string;
  price: number;
  interval: 'MONTHLY' | 'YEARLY';
  limits: {
    maxBranches: number;
    maxProducts: number;
    maxUsers: number;
  };
  features: string[];
}

export interface AdminAuthResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MANAGER';
  permissions: string[];
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface AdminLoginInput {
  email: string;
  password: string;
}

export interface AdminRegisterInput {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'ADMIN' | 'MANAGER';
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

export interface ActivityLogResponse {
  id: string;
  adminUser: {
    id: string;
    email: string;
    name: string;
  };
  action: string;
  resource: string;
  resourceId?: string;
  description?: string;
  status: string;
  createdAt: Date;
}

export interface DashboardAnalytics {
  salesMetrics: {
    todaySales: number;
    weekSales: number;
    monthSales: number;
    growthPercent: number;
  };
  inventoryMetrics: {
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalValue: number;
  };
  userMetrics: {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
  };
  transactionMetrics: {
    totalTransactions: number;
    failedTransactions: number;
    avgTransactionValue: number;
  };
}

export interface InventoryReportResponse {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  fastMoving: Array<{
    productName: string;
    quantity: number;
    value: number;
  }>;
  slowMoving: Array<{
    productName: string;
    quantity: number;
    value: number;
  }>;
}

export interface SalesReportFilter {
  startDate: Date;
  endDate: Date;
  shopId?: string;
  branchId?: string;
  paymentMode?: string;
}

export interface SalesReportResponse {
  period: string;
  totalSales: number;
  totalTransactions: number;
  averageTransactionValue: number;
  totalTax: number;
  paymentBreakdown: Record<string, number>;
  topProducts: Array<{
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  topCustomers: Array<{
    customerName: string;
    transactions: number;
    totalSpent: number;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUsageAnalytics {
  totalShops: number;
  activeShops: number;
  totalUsers: number;
  totalInvoices: number;
  totalProducts: number;
  subscriptionBreakdown: { plan: SubscriptionPlan; count: number }[];
  monthlyPlatformRevenue: {
    invoiceCount: number;
    totalAmount: number;
  };
}

export interface AdminShopWithCounts extends Shop {
  _count: {
    branches: number;
    users: number;
    invoices: number;
    products: number;
    customers?: number;
  };
}

export interface UpdateSubscriptionDTO {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiryDate?: string;
}

export interface ToggleShopActiveDTO {
  isActive: boolean;
}

export interface UpdateFeatureFlagsDTO {
  flags: Record<string, boolean>;
}

export interface ActivityLogFilter {
  adminUserId?: string;
  action?: string;
  resource?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
}
