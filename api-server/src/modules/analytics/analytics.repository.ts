import prisma from '../../config/db';
import { Prisma } from '@prisma/client';

export class AnalyticsRepository {
  async getDailySales(shopId: string, branchId?: string, startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate || new Date();

    const where: any = {
      shopId,
      createdAt: { gte: start, lte: end },
      status: 'COMPLETED',
    };
    if (branchId) where.branchId = branchId;

    return prisma.$queryRaw`
      SELECT
        DATE(created_at) as date,
        COUNT(*)::int as invoice_count,
        SUM(total_amount)::float as total_sales,
        SUM(tax_amount)::float as total_tax,
        SUM(discount_amount)::float as total_discount
      FROM invoices
      WHERE shop_id = ${shopId}
        AND status = 'COMPLETED'
        AND created_at >= ${start}
        AND created_at <= ${end}
        ${branchId ? Prisma.sql`AND branch_id = ${branchId}` : Prisma.empty}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
  }

  async getTopProducts(shopId: string, branchId?: string, limit: number = 10) {
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));

    return prisma.$queryRaw`
      SELECT
        ii.product_id,
        ii.product_name,
        SUM(ii.quantity)::int as total_quantity,
        SUM(ii.total_price)::float as total_revenue
      FROM invoice_items ii
      JOIN invoices i ON i.id = ii.invoice_id
      WHERE i.shop_id = ${shopId}
        AND i.status = 'COMPLETED'
        AND i.created_at >= ${thirtyDaysAgo}
        ${branchId ? Prisma.sql`AND i.branch_id = ${branchId}` : Prisma.empty}
      GROUP BY ii.product_id, ii.product_name
      ORDER BY total_quantity DESC
      LIMIT ${limit}
    `;
  }

  async getDeadStock(shopId: string, daysSinceLastSale: number = 30) {
    const cutoffDate = new Date(new Date().setDate(new Date().getDate() - daysSinceLastSale));

    return prisma.$queryRaw`
      SELECT p.id, p.name, p.sku, p.category,
        COALESCE(SUM(inv.quantity), 0)::int as current_stock,
        MAX(i.created_at) as last_sold_at
      FROM products p
      LEFT JOIN inventory inv ON inv.product_id = p.id
      LEFT JOIN invoice_items ii ON ii.product_id = p.id
      LEFT JOIN invoices i ON i.id = ii.invoice_id AND i.status = 'COMPLETED'
      WHERE p.shop_id = ${shopId}
        AND p.is_active = true
      GROUP BY p.id
      HAVING MAX(i.created_at) IS NULL OR MAX(i.created_at) < ${cutoffDate}
      ORDER BY current_stock DESC
    `;
  }

  async getLowStockProducts(shopId: string) {
    return prisma.$queryRaw`
      SELECT p.id, p.name, p.sku, p.category, p.reorder_threshold,
        COALESCE(SUM(inv.quantity), 0)::int as current_stock
      FROM products p
      LEFT JOIN inventory inv ON inv.product_id = p.id
      WHERE p.shop_id = ${shopId}
        AND p.is_active = true
      GROUP BY p.id
      HAVING COALESCE(SUM(inv.quantity), 0) <= p.reorder_threshold
      ORDER BY COALESCE(SUM(inv.quantity), 0) ASC
    `;
  }

  async getPendingDues(shopId: string) {
    return prisma.creditLedger.aggregate({
      where: {
        shopId,
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
      },
      _sum: { outstandingAmount: true },
      _count: true,
    });
  }

  async getBranchComparison(shopId: string, startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate || new Date();

    return prisma.$queryRaw`
      SELECT
        b.id as branch_id,
        b.name as branch_name,
        COUNT(i.id)::int as invoice_count,
        COALESCE(SUM(i.total_amount), 0)::float as total_sales,
        COALESCE(AVG(i.total_amount), 0)::float as avg_ticket_size
      FROM branches b
      LEFT JOIN invoices i ON i.branch_id = b.id
        AND i.status = 'COMPLETED'
        AND i.created_at >= ${start}
        AND i.created_at <= ${end}
      WHERE b.shop_id = ${shopId}
      GROUP BY b.id, b.name
      ORDER BY total_sales DESC
    `;
  }

  async getSalesSummary(shopId: string, branchId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      shopId,
      status: 'COMPLETED',
      createdAt: { gte: today, lt: tomorrow },
    };
    if (branchId) where.branchId = branchId;

    const todaySales = await prisma.invoice.aggregate({
      where,
      _sum: { totalAmount: true },
      _count: true,
    });

    // This month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthWhere = { ...where, createdAt: { gte: monthStart, lt: tomorrow } };
    const monthSales = await prisma.invoice.aggregate({
      where: monthWhere,
      _sum: { totalAmount: true },
      _count: true,
    });

    return {
      today: {
        sales: todaySales._sum.totalAmount || 0,
        invoiceCount: todaySales._count,
      },
      thisMonth: {
        sales: monthSales._sum.totalAmount || 0,
        invoiceCount: monthSales._count,
      },
    };
  }
}
