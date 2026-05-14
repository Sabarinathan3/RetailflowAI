import prisma from '../../config/db';
import { logger } from '../../config/logger';
import { CreditService } from './credit.service';
import { CreditRepository } from './credit.repository';
import { NotificationsService } from '../notifications/notifications.service';

const creditService = new CreditService(new CreditRepository());
const notificationsService = new NotificationsService();

/**
 * BullMQ Job Processor / Cron Executor for Credit Reminders
 * Identifies overdue accounts and builds systematic notifications.
 */
export async function processCreditReminders() {
  logger.info('⏳ Starting credit reminder processing...');

  try {
    const shops = await prisma.shop.findMany({ where: { isActive: true } });

    for (const shop of shops) {
      // Find all overdue credits for this shop
      const overdueCredits = await creditService.getOverdue(shop.id);

      for (const credit of overdueCredits) {
        if (!credit.customer) continue;

        const outstanding = credit.outstandingAmount;
        const msg = `Automated Reminder: Credit of ₹${outstanding} is overdue for customer "${credit.customer.name}".`;

        logger.info(`Sending due reminder: ${msg}`);

        await notificationsService.create(
          shop.id,
          'DUE_REMINDER',
          'Overdue Payment Reminder',
          msg,
          { creditLedgerId: credit.id, customerId: credit.customerId, outstandingAmount: outstanding }
        );
      }
    }

    logger.info('✅ Credit reminder processing complete.');
  } catch (error) {
    logger.error('❌ Failed processing credit reminders:', error);
    throw error;
  }
}
