import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(10).catch(() => {
    const isProd = process.env.NODE_ENV === 'production';
    const fallback = isProd
      ? require('crypto').randomBytes(32).toString('hex')
      : 'fallback-jwt-access-secret-for-dev-purposes-only-minimum-32-chars';
    console.warn(`\n⚠️  [SECURITY WARNING] JWT_ACCESS_SECRET was missing or too short (min 10 chars).`);
    console.warn(`   Using a ${isProd ? 'securely generated random' : 'default placeholder'} fallback secret.`);
    if (isProd) {
      console.warn(`   Note: This fallback will reset on every server restart, invalidating existing sessions.`);
      console.warn(`   To fix this permanently, configure a persistent JWT_ACCESS_SECRET in your Render dashboard environment variables.\n`);
    }
    return fallback;
  }),

  JWT_REFRESH_SECRET: z.string().min(10).catch(() => {
    const isProd = process.env.NODE_ENV === 'production';
    const fallback = isProd
      ? require('crypto').randomBytes(32).toString('hex')
      : 'fallback-jwt-refresh-secret-for-dev-purposes-only-minimum-32-chars';
    console.warn(`⚠️  [SECURITY WARNING] JWT_REFRESH_SECRET was missing or too short (min 10 chars). Using fallback.`);
    return fallback;
  }),

  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  REDIS_URL: z.string().optional(),

  AI_SERVICE_URL: z.string().optional().default('http://localhost:8000'),
  AI_SERVICE_TIMEOUT: z.coerce.number().optional().default(5000),

  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
