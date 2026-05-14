import { AdminRole, Permission } from '@prisma/client';

// ─────────────────────────────────────────────
// AUTH TYPES
// ─────────────────────────────────────────────

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

export interface AdminTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AdminAuthResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  permissions: Permission[];
  tokens: AdminTokens;
}

export interface JwtAdminPayload {
  id: string;
  email: string;
  role: AdminRole;
  permissions: Permission[];
  iat?: number;
  exp?: number;
}

// ─────────────────────────────────────────────
// USER MANAGEMENT TYPES
// ─────────────────────────────────────────────

export interface CreateUserInput {
  shopId: string;
  branchId?: string;
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  role: 'OWNER' | 'MANAGER' | 'CASHIER' | 'ADMIN';
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
}

export interface UserListResponse {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  shopId: string;
  branchId?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

// ─────────────────────────────────────────────
// BRANCH MANAGEMENT TYPES
// ─────────────────────────────────────────────

export interface CreateBranchInput {
  shopId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  isMain?: boolean;
}

export interface UpdateBranchInput {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface BranchListResponse {
  id: string;
  shopId: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  isMain: boolean;
  isActive: boolean;
  userCount: number;
  createdAt: Date;
}

// ─────────────────────────────────────────────
// PRODUCT MANAGEMENT TYPES
// ─────────────────────────────────────────────

export interface CreateProductInput {
  shopId: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  category?: string;
  unit?: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp?: number;
  gstPercentage?: number;
  hsnCode?: string;
  reorderThreshold?: number;
  imageUrl?: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  category?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  mrp?: number;
  gstPercentage?: number;
  reorderThreshold?: number;
  imageUrl?: string;
  isActive?: boolean;
}

export interface ProductListResponse {
  id: string;
  shopId: string;
  name: string;
  sku?: string;
  barcode?: string;
  category?: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp?: number;
  totalStock: number;
  reorderThreshold: number;
  isActive: boolean;
  createdAt: Date;
}

// ─────────────────────────────────────────────
// INVENTORY MANAGEMENT TYPES
// ─────────────────────────────────────────────

export interface InventoryStatusResponse {
  productId: string;
  productName: string;
  sku?: string;
  category?: string;
  totalStock: number;
  lowStockItems: number;
  outOfStockItems: number;
  lastUpdated: Date;
}

export interface InventoryTransferInput {
  fromBranchId: string;
  toBranchId: string;
  items: Array<{
    productId: string;
    quantity: number;
    batchNumber?: string;
  }>;
  notes?: string;
}

// ─────────────────────────────────────────────
// ORDER MANAGEMENT TYPES
// ─────────────────────────────────────────────

export interface OrderListResponse {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName?: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  paymentMode: string;
  shopId: string;
  branchId: string;
  createdAt: Date;
}

export interface OrderDetailResponse {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName?: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    gstAmount: number;
    totalPrice: number;
  }>;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
  paymentMode: string;
  createdAt: Date;
}

// ─────────────────────────────────────────────
// SUPPLIER MANAGEMENT TYPES
// ─────────────────────────────────────────────

export interface CreateSupplierInput {
  shopId: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  leadTimeDays?: number;
}

export interface UpdateSupplierInput {
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  leadTimeDays?: number;
  isActive?: boolean;
}

export interface SupplierListResponse {
  id: string;
  shopId: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  rating?: number;
  aiRiskStatus: string;
  totalOrders: number;
  isActive: boolean;
  createdAt: Date;
}

// ─────────────────────────────────────────────
// REPORTS & ANALYTICS TYPES
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// ACTIVITY LOG TYPES
// ─────────────────────────────────────────────

export interface ActivityLogFilter {
  adminUserId?: string;
  action?: string;
  resource?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
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

// ─────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
