import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis) return redis;

  if (!env.REDIS_URL) {
    logger.warn('⚠️  REDIS_URL not set — Redis features disabled');
    return null;
  }

  try {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('⚠️  Redis connection failed after 3 retries — disabling Redis');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on('connect', () => logger.info('✅ Redis connected'));
    redis.on('error', (err) => logger.error('Redis error:', err.message));

    redis.connect().catch(() => {
      logger.warn('⚠️  Redis connection failed — running without cache');
      redis = null;
    });
  } catch {
    logger.warn('⚠️  Redis initialization failed — running without cache');
    redis = null;
  }

  return redis;
}

// Cache helpers
export async function cacheGet(key: string): Promise<string | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    return await client.get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds: number = 300): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.set(key, value, 'EX', ttlSeconds);
  } catch {
    // silently fail
  }
}

export async function cacheDel(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.del(key);
  } catch {
    // silently fail
  }
}

// Token Blacklist helpers
export async function blacklistToken(token: string, expiresInSeconds: number): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.set(`bl_${token}`, 'true', 'EX', expiresInSeconds);
  } catch {
    // silently fail
  }
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;
  try {
    const result = await client.get(`bl_${token}`);
    return result === 'true';
  } catch {
    return false;
  }
}

export default getRedis;
