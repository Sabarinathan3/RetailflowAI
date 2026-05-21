import { Queue, Worker, QueueEvents, DefaultJobOptions } from 'bullmq';
import { env } from './env';
import { logger } from './logger';
import { isRedisEnabled } from './redis';

export const connection = isRedisEnabled() && env.REDIS_URL
  ? {
      host: new URL(env.REDIS_URL).hostname,
      port: parseInt(new URL(env.REDIS_URL).port || '6379'),
      password: new URL(env.REDIS_URL).password || undefined,
      username: new URL(env.REDIS_URL).username || undefined,
      tls: env.REDIS_URL.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    }
  : undefined;

export const defaultJobOptions: DefaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};

export function createQueue(name: string): Queue | null {
  if (!isRedisEnabled()) {
    logger.warn(`⚠️  Redis is disabled — BullMQ Queue [${name}] will not be created.`);
    return null;
  }
  return new Queue(name, {
    connection: connection as any,
    defaultJobOptions,
  });
}

export function createWorker(name: string, processor: any): Worker | null {
  if (!isRedisEnabled()) {
    logger.warn(`⚠️  Redis is disabled — BullMQ Worker [${name}] will not be created.`);
    return null;
  }
  
  const worker = new Worker(name, processor, { connection: connection as any });

  worker.on('completed', (job) => {
    logger.info(`✅ Job ${job.id} completed successfully in queue ${name}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`❌ Job ${job?.id} failed with error ${err.message}`);
  });

  return worker;
}

export function createQueueEvents(name: string): QueueEvents | null {
  if (!isRedisEnabled()) {
    return null;
  }
  return new QueueEvents(name, { connection: connection as any });
}
