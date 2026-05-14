import { AnalyticsRepository } from './analytics.repository';
import { cacheGet, cacheSet } from '../../config/redis';
import { CACHE_TTL } from '../../common/constants';

export class AnalyticsService {
  constructor(private repo: AnalyticsRepository) {}

  async getDailySales(shopId: string, branchId?: string, startDate?: Date, endDate?: Date) {
    const cacheKey = `analytics:daily_sales:${shopId}:${branchId || 'all'}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await this.repo.getDailySales(shopId, branchId, startDate, endDate);
    await cacheSet(cacheKey, JSON.stringify(result), CACHE_TTL.MEDIUM);
    return result;
  }

  async getTopProducts(shopId: string, branchId?: string, limit: number = 10) {
    const cacheKey = `analytics:top_products:${shopId}:${branchId || 'all'}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await this.repo.getTopProducts(shopId, branchId, limit);
    await cacheSet(cacheKey, JSON.stringify(result), CACHE_TTL.MEDIUM);
    return result;
  }

  async getDeadStock(shopId: string) {
    return this.repo.getDeadStock(shopId);
  }

  async getLowStock(shopId: string) {
    return this.repo.getLowStockProducts(shopId);
  }

  async getPendingDues(shopId: string) {
    return this.repo.getPendingDues(shopId);
  }

  async getBranchComparison(shopId: string, startDate?: Date, endDate?: Date) {
    return this.repo.getBranchComparison(shopId, startDate, endDate);
  }

  async getDashboard(shopId: string, branchId?: string) {
    const [summary, topProducts, lowStock, pendingDues] = await Promise.all([
      this.repo.getSalesSummary(shopId, branchId),
      this.repo.getTopProducts(shopId, branchId, 5),
      this.repo.getLowStockProducts(shopId),
      this.repo.getPendingDues(shopId),
    ]);

    return {
      sales: summary,
      topProducts,
      lowStockCount: (lowStock as any[]).length,
      pendingDues: {
        totalOutstanding: pendingDues._sum.outstandingAmount || 0,
        count: pendingDues._count,
      },
    };
  }
}
