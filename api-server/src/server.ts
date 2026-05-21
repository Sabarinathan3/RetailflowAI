import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import prisma from './config/db';
import { getRedis } from './config/redis';

// Import background jobs scheduler
import { scheduleRepeatableJobs } from './queues';

async function bootstrap() {
  try {
    // Test database connection with retry logic
    const maxDbRetries = 5;
    let dbAttempt = 0;
    while (dbAttempt < maxDbRetries) {
      try {
        dbAttempt++;
        await prisma.$connect();
        logger.info('✅ Database connected successfully');
        break;
      } catch (err: any) {
        logger.warn(`⚠️  Database connection attempt ${dbAttempt}/${maxDbRetries} failed: ${err.message}`);
        if (dbAttempt >= maxDbRetries) {
          logger.error('❌ Max database connection retries reached. Exiting...');
          throw err;
        }
        // Wait 2 seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Initialize Redis (optional — graceful fallback)
    getRedis();

    // Schedule background queue jobs if running in main context
    if (env.NODE_ENV !== 'test') {
      await scheduleRepeatableJobs();
    }

    // Start HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 RetailFlow AI API running on port ${env.PORT}`);
      logger.info(`📋 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 Health: http://localhost:${env.PORT}/health`);
      logger.info(`🔗 API: http://localhost:${env.PORT}/api/v1`);
    });

    server.on('error', async (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(
          `Port ${env.PORT} is already in use (EADDRINUSE). Stop the other process using that port, or set PORT in .env to a free value. On Windows: netstat -ano | findstr :${env.PORT}`
        );
      } else {
        logger.error('HTTP server failed to start:', err);
      }
      await prisma.$disconnect().catch(() => undefined);
      process.exit(1);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        await prisma.$disconnect();
        logger.info('👋 Server shut down');
        process.exit(0);
      });

      // Force shutdown after 10s
      setTimeout(() => {
        logger.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
