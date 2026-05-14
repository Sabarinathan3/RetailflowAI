import cron from 'node-cron';
import prisma from '../config/db';
import { logger } from '../config/logger';

/**
 * Forecast Retrain Trigger Job
 * Triggers AI service retraining.
 */
export async function processForecastRetrain() {
  logger.info('🔄 [BULLMQ] Processing forecast retrain trigger...');
  try {
    const shops = await prisma.shop.findMany({
      where: {
        isActive: true,
        subscriptionPlan: { in: ['PRO', 'ENTERPRISE'] },
      },
      select: { id: true, name: true },
    });

    for (const shop of shops) {
      try {
        // Trigger AI service retraining
        const response = await fetch(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/retrain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shop_id: shop.id }),
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          logger.info(`🤖 [RETRAIN] Triggered for shop: ${shop.name}`);
        } else {
          logger.warn(`🤖 [RETRAIN] Failed for shop ${shop.name}: ${response.status}`);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          logger.warn(`🤖 [RETRAIN] AI service unavailable for ${shop.name}: ${err.message}`);
        } else {
          logger.warn(`🤖 [RETRAIN] AI service unavailable for ${shop.name}`);
        }
      }
    }

    logger.info('✅ [BULLMQ] Forecast retrain trigger completed');
  } catch (error: unknown) {
    logger.error('[BULLMQ] Forecast retrain job failed:', error);
  }
}
