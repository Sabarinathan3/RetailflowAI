export interface DashboardData {
  sales: SalesSummary;
  topProducts: TopProduct[];
  lowStockCount: number;
  pendingDues: {
    totalOutstanding: number;
    count: number;
  };
}

export interface SalesSummary {
  todaySales: number;
  todayTransactions: number;
  weekSales: number;
  monthSales: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface DailySalesEntry {
  date: string;
  totalSales: number;
  totalTransactions: number;
}
