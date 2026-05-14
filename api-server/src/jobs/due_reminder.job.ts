import cron from 'node-cron';
import prisma from '../config/db';
import { logger } from '../config/logger';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { CreditLedgerRepository } from '../modules/credit-ledger/credit-ledger.repository';

const notificationsService = new NotificationsService();
const creditRepo = new CreditLedgerRepository();

/**
 * Due Reminder Job
 * Marks overdue credits and generates reminders.
 */
export async function processDueReminder() {
  logger.info('🔄 [BULLMQ] Processing due reminder job...');
  try {
    const shops = await prisma.shop.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    for (const shop of shops) {
      try {
        // Mark overdue entries
        const marked = await creditRepo.markOverdue(shop.id);
        if (marked.count > 0) {
          logger.info(`⚠️  [OVERDUE] ${shop.name}: ${marked.count} entries marked overdue`);
        }

        // Generate reminders
        const reminders = await notificationsService.generateDueReminders(shop.id);
        if (reminders.length > 0) {
          logger.info(`📨 [DUE_REMINDER] ${shop.name}: ${reminders.length} reminders generated`);
        }
      } catch (err: unknown) {
        logger.error(`[DUE_REMINDER] Failed for shop ${shop.name}:`, err);
      }
    }

    logger.info('✅ [BULLMQ] Due reminder job completed');
  } catch (error: unknown) {
    logger.error('[BULLMQ] Due reminder job failed:', error);
  }
}
