import prisma from '../config/db';
import { logger } from '../config/logger';
import { NotificationsService } from '../modules/notifications/notifications.service';

const notificationsService = new NotificationsService();

/**
 * Low Stock Alert Job
 * Checks all active shops for low stock products and generates alerts.
 */
export async function processLowStock() {
  logger.info('🔄 [BULLMQ] Processing low stock alert job...');
  try {
    const shops = await prisma.shop.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    for (const shop of shops) {
      try {
        const alerts = await notificationsService.generateLowStockAlerts(shop.id);
        if (alerts.length > 0) {
          logger.info(`📦 [LOW_STOCK] ${shop.name}: ${alerts.length} alerts generated`);
        }
      } catch (err: unknown) {
        logger.error(`[LOW_STOCK] Failed for shop ${shop.name}:`, err);
      }
    }

    logger.info('✅ [BULLMQ] Low stock alert job completed');
  } catch (error: unknown) {
    logger.error('[BULLMQ] Low stock alert job failed:', error);
  }
}
