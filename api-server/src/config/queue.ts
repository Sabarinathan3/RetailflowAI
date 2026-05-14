import { Queue, Worker, QueueEvents, DefaultJobOptions } from 'bullmq';
import { env } from './env';
import { logger } from './logger';

export const connection = {
  host: env.REDIS_URL ? new URL(env.REDIS_URL).hostname : 'localhost',
  port: env.REDIS_URL ? parseInt(new URL(env.REDIS_URL).port || '6379') : 6379,
  password: env.REDIS_URL ? new URL(env.REDIS_URL).password : undefined,
};

export const defaultJobOptions: DefaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};

export function createQueue(name: string) {
  return new Queue(name, {
    connection,
    defaultJobOptions,
  });
}

export function createWorker(name: string, processor: any) {
  const worker = new Worker(name, processor, { connection });

  worker.on('completed', (job) => {
    logger.info(`✅ Job ${job.id} completed successfully in queue ${name}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`❌ Job ${job?.id} failed with error ${err.message}`);
  });

  return worker;
}

export function createQueueEvents(name: string) {
  return new QueueEvents(name, { connection });
}
