import { createQueue } from '../config/queue';
import { logger } from '../config/logger';

export const backgroundJobsQueue = createQueue('background-jobs');

export async function scheduleRepeatableJobs() {
  logger.info('📅 Scheduling repeatable background jobs...');

  await backgroundJobsQueue.add('anomaly_scan', {}, {
    repeat: { pattern: '0 1 * * *' } // Daily at 1 AM
  });

  await backgroundJobsQueue.add('low_stock_alert', {}, {
    repeat: { pattern: '0 8 * * *' } // Daily at 8 AM
  });

  await backgroundJobsQueue.add('due_reminder', {}, {
    repeat: { pattern: '0 9 * * *' } // Daily at 9 AM
  });

  await backgroundJobsQueue.add('forecast_retrain', {}, {
    repeat: { pattern: '0 2 * * 0' } // Weekly on Sunday at 2 AM
  });

  logger.info('✅ Repeatable jobs scheduled successfully');
}
