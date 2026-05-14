export const APP_NAME = 'RetailFlow AI';
export const API_PREFIX = '/api/v1';

export const ROLES = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  ADMIN: 'ADMIN',
} as const;

export const PAYMENT_MODES = {
  CASH: 'CASH',
  UPI: 'UPI',
  CARD: 'CARD',
  CREDIT: 'CREDIT',
} as const;

export const LOYALTY_POINTS_PER_RUPEE = 1; // 1 point per ₹100 spent
export const LOYALTY_POINTS_THRESHOLD = 100;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const CACHE_TTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 3600,       // 1 hour
  DAY: 86400,       // 24 hours
} as const;
