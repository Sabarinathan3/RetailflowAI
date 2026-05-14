import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedis } from '../config/redis';
import { logger } from '../config/logger';
import { Request, Response } from 'express';

/**
 * Custom Key Generator
 * Uses user ID if available, falls back safely to express-rate-limit's built-in ipKeyGenerator.
 * This prevents ERR_ERL_KEY_GEN_IPV6 errors associated with raw req.ip usage.
 */
const keyGenerator = (req: Request, res: Response): string => {
  // @ts-expect-error - Assuming user object is attached via authMiddleware
  if (req.user?.id) {
    // @ts-expect-error
    return `user:${req.user.id}`;
  }
  
  // Safely fallback to the official IP generator to handle IPv6 correctly
  return ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? 'unknown');
};

/**
 * Creates a unique RedisStore instance to prevent ERR_ERL_STORE_REUSE.
 * Falls back to memory store if Redis is unavailable.
 */
const createStore = (prefix: string) => {
  const redisClient = getRedis();

  if (redisClient) {
    return new RedisStore({
      // @ts-expect-error - Known typing discrepancy
      sendCommand: (...args: string[]) => redisClient.call(...args),
      prefix, // Unique prefix for each rate limiter instance
    });
  }

  logger.warn(`⚠️ Redis unavailable, using memory store for rate limiter prefix: ${prefix}`);
  return undefined; // Falls back to default express-rate-limit memory store
};

/**
 * 1. General API Limiter (Standard Routes)
 * Development: 200/minute, Production: 50/minute
 */
const isDev = process.env.NODE_ENV === 'development';

export const apiLimiter = rateLimit({
  store: createStore('rl:api:'),
  windowMs: 60 * 1000, // 1 minute
  max: isDev ? 200 : 50,
  message: {
    success: false,
    message: 'Too many requests, please try again in a minute',
  },
  skip: (req) => isDev || req.ip === '127.0.0.1' || req.ip === '::1',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

/**
 * 2. Auth Limiter (Login, Register, etc.)
 */
export const authLimiter = rateLimit({
  store: createStore('rl:auth:'),
  windowMs: 15 * 60 * 1000, 
  max: isDev ? 100 : 10,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
  skip: (req) => isDev || req.ip === '127.0.0.1' || req.ip === '::1',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

/**
 * 3. Strict Limiter (Sensitive Routes: Payments, Password Resets)
 */
export const strictLimiter = rateLimit({
  store: createStore('rl:strict:'),
  windowMs: 30 * 60 * 1000, 
  max: isDev ? 50 : 5,
  message: {
    success: false,
    message: 'Too many sensitive requests, please try again after 30 minutes',
  },
  skip: (req) => isDev || req.ip === '127.0.0.1' || req.ip === '::1',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});
