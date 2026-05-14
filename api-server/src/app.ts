import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { API_PREFIX } from './common/constants';
import { errorMiddleware } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rate-limit.middleware';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import shopsRoutes from './modules/shops/shops.routes';
import branchesRoutes from './modules/branches/branches.routes';
import productsRoutes from './modules/products/products.routes';
import billingRoutes from './modules/billing/billing.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import customersRoutes from './modules/customers/customers.routes';
import creditLedgerRoutes from './modules/credit-ledger/credit.routes';
import suppliersRoutes from './modules/suppliers/suppliers.routes';
import purchaseOrderRoutes from './modules/suppliers/purchase-orders.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import aiRoutes from './modules/ai-gateway/ai.routes';
import adminRoutes from './modules/admin/admin.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';

const app = express();

// ─── Global Middleware ──────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Branch-Id'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('short'));
app.use(apiLimiter);

// ─── Health Check ───────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    message: 'RetailFlow AI API is running',
  });
});

// ─── API Routes ─────────────────────────────────────────────
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/shops`, shopsRoutes);
app.use(`${API_PREFIX}/branches`, branchesRoutes);
app.use(`${API_PREFIX}/products`, productsRoutes);
app.use(`${API_PREFIX}/billing`, billingRoutes);
app.use(`${API_PREFIX}/inventory`, inventoryRoutes);
app.use(`${API_PREFIX}/customers`, customersRoutes);
app.use(`${API_PREFIX}/credit-ledger`, creditLedgerRoutes);
app.use(`${API_PREFIX}/suppliers`, suppliersRoutes);
app.use(`${API_PREFIX}/purchase-orders`, purchaseOrderRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/ai`, aiRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/notifications`, notificationsRoutes);

// ─── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
  const { logger } = require('./config/logger');
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    data: null,
    message: 'Route not found',
  });
});

// ─── Error Handler (must be last) ───────────────────────────
app.use(errorMiddleware);

export default app;
