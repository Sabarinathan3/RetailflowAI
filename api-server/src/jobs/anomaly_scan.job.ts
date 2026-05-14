import cron from 'node-cron';
import prisma from '../config/db';
import { logger } from '../config/logger';
import { AnalyticsRepository } from '../modules/analytics/analytics.repository';

const analyticsRepo = new AnalyticsRepository();

/**
 * Daily Analytics Aggregation / Anomaly Scan Job
 * Snapshots daily sales metrics for reporting.
 */
export async function processAnomalyScan() {
  logger.info('🔄 [BULLMQ] Processing daily analytics aggregation...');
  try {
    const shops = await prisma.shop.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const shop of shops) {
      try {
        // Get yesterday's sales data
        const dailySales = await prisma.invoice.aggregate({
          where: {
            shopId: shop.id,
            status: 'COMPLETED',
            createdAt: { gte: yesterday, lt: today },
          },
          _sum: { totalAmount: true, taxAmount: true, discountAmount: true },
          _count: true,
        });

        // Get top products for yesterday
        const topProducts = await prisma.$queryRaw`
          SELECT ii.product_name, SUM(ii.quantity)::int as qty, SUM(ii.total_price)::float as revenue
          FROM invoice_items ii
          JOIN invoices i ON i.id = ii.invoice_id
          WHERE i.shop_id = ${shop.id}
            AND i.status = 'COMPLETED'
            AND i.created_at >= ${yesterday}
            AND i.created_at < ${today}
          GROUP BY ii.product_name
          ORDER BY qty DESC
          LIMIT 10
        `;

        // Save snapshot
        await prisma.analyticsSnapshot.upsert({
          where: {
            shopId_branchId_date_metric: {
              shopId: shop.id,
              branchId: null as any,
              date: yesterday,
              metric: 'daily_sales',
            },
          },
          update: {
            value: {
              totalSales: dailySales._sum.totalAmount || 0,
              totalTax: dailySales._sum.taxAmount || 0,
              totalDiscount: dailySales._sum.discountAmount || 0,
              invoiceCount: dailySales._count,
              topProducts: topProducts as any,
            },
          },
          create: {
            shopId: shop.id,
            date: yesterday,
            metric: 'daily_sales',
            value: {
              totalSales: dailySales._sum.totalAmount || 0,
              totalTax: dailySales._sum.taxAmount || 0,
              totalDiscount: dailySales._sum.discountAmount || 0,
              invoiceCount: dailySales._count,
              topProducts: topProducts as any,
            },
          },
        });

        logger.info(`📊 [ANALYTICS] Snapshot saved for ${shop.name}`);
      } catch (err: unknown) {
        logger.error(`[ANALYTICS] Failed for shop ${shop.name}:`, err);
      }
    }

    logger.info('✅ [BULLMQ] Daily analytics aggregation completed');
  } catch (error: unknown) {
    logger.error('[BULLMQ] Analytics aggregation job failed:', error);
  }
}
