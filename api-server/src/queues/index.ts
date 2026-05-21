import { createQueue } from '../config/queue';
import { logger } from '../config/logger';
import cron from 'node-cron';

// Import job processor logic
import { processAnomalyScan } from '../jobs/anomaly_scan.job';
import { processLowStock } from '../jobs/low_stock.job';
import { processDueReminder } from '../jobs/due_reminder.job';
import { processForecastRetrain } from '../jobs/forecast_retrain.job';

export const backgroundJobsQueue = createQueue('background-jobs');

export async function scheduleRepeatableJobs() {
  if (!backgroundJobsQueue) {
    logger.info('📅 Redis is disabled — scheduling repeatable background jobs via node-cron (in-process)...');
    setupCronFallbacks();
    return;
  }

  logger.info('📅 Scheduling repeatable background jobs via BullMQ...');
  try {
    // Anomaly scan: Daily at 1 AM
    await backgroundJobsQueue.add('anomaly_scan', {}, {
      repeat: { pattern: '0 1 * * *' }
    });

    // Low stock alert: Daily at 8 AM
    await backgroundJobsQueue.add('low_stock_alert', {}, {
      repeat: { pattern: '0 8 * * *' }
    });

    // Due reminder: Daily at 9 AM
    await backgroundJobsQueue.add('due_reminder', {}, {
      repeat: { pattern: '0 9 * * *' }
    });

    // Forecast retrain: Weekly on Sunday at 2 AM
    await backgroundJobsQueue.add('forecast_retrain', {}, {
      repeat: { pattern: '0 2 * * 0' }
    });

    logger.info('✅ Repeatable jobs scheduled successfully via BullMQ');
  } catch (error: any) {
    logger.error(`❌ Failed to schedule repeatable jobs via BullMQ: ${error.message}`);
    logger.info('🔄 Falling back to node-cron scheduling...');
    setupCronFallbacks();
  }
}

function setupCronFallbacks() {
  // Anomaly Scan: Daily at 1 AM
  cron.schedule('0 1 * * *', async () => {
    logger.info('⏰ Running cron fallback job: anomaly_scan');
    try {
      await processAnomalyScan();
    } catch (err: any) {
      logger.error(`❌ Cron fallback anomaly_scan failed: ${err.message}`);
    }
  });

  // Low Stock Alert: Daily at 8 AM
  cron.schedule('0 8 * * *', async () => {
    logger.info('⏰ Running cron fallback job: low_stock_alert');
    try {
      await processLowStock();
    } catch (err: any) {
      logger.error(`❌ Cron fallback low_stock_alert failed: ${err.message}`);
    }
  });

  // Due Reminder: Daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    logger.info('⏰ Running cron fallback job: due_reminder');
    try {
      await processDueReminder();
    } catch (err: any) {
      logger.error(`❌ Cron fallback due_reminder failed: ${err.message}`);
    }
  });

  // Forecast Retrain: Weekly on Sunday at 2 AM
  cron.schedule('0 2 * * 0', async () => {
    logger.info('⏰ Running cron fallback job: forecast_retrain');
    try {
      await processForecastRetrain();
    } catch (err: any) {
      logger.error(`❌ Cron fallback forecast_retrain failed: ${err.message}`);
    }
  });

  logger.info('✅ Repeatable jobs scheduled successfully via node-cron');
}
