import { Job } from 'bullmq';
import { createWorker } from '../config/queue';
import { logger } from '../config/logger';
import prisma from '../config/db';
import { getRedis } from '../config/redis';

// Import processor logic from original jobs
import { processAnomalyScan } from '../jobs/anomaly_scan.job';
import { processLowStock } from '../jobs/low_stock.job';
import { processDueReminder } from '../jobs/due_reminder.job';
import { processForecastRetrain } from '../jobs/forecast_retrain.job';

export const backgroundWorker = createWorker('background-jobs', async (job: Job) => {
  logger.info(`👷 Processing job ${job.name} (ID: ${job.id})`);

  switch (job.name) {
    case 'anomaly_scan':
      await processAnomalyScan();
      break;
    case 'low_stock_alert':
      await processLowStock();
      break;
    case 'due_reminder':
      await processDueReminder();
      break;
    case 'forecast_retrain':
      await processForecastRetrain();
      break;
    default:
      logger.warn(`⚠️ Unknown job name: ${job.name}`);
  }
});

logger.info('👷 BullMQ Worker started successfully for queue: background-jobs');

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down worker...');
  await backgroundWorker.close();
  await prisma.$disconnect();
  const redis = getRedis();
  if (redis) redis.disconnect();
  process.exit(0);
});
