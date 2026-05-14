import prisma from '../../config/db';
import { cacheGet, cacheSet } from '../../config/redis';
import { AiClient } from './ai.client';
import { logger } from '../../config/logger';

const CACHE_TTL_HOURS = 24 * 60 * 60; // 24 hours string cache

export class AiService {
  /**
   * 1. Forecast Product Demand
   * Fetches last 30 days of sales history and forwards to FastAPI.
   */
  async forecast(shopId: string, productId: string) {
    const cacheKey = `ai:forecast:${shopId}:${productId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return JSON.parse(cached);

    // Prepare history data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historyData = await prisma.invoiceItem.groupBy({
      by: ['productId'],
      where: {
        productId,
        invoice: { shopId, createdAt: { gte: thirtyDaysAgo } }
      },
      _sum: { quantity: true },
    });

    const recentSales = historyData[0]?._sum.quantity || 0;

    try {
      const response = await AiClient.postForecast({
        shopId,
        productId,
        history: [{ period: '30d', sales: recentSales }],
      });

      // Save to DB
      await prisma.aiPrediction.create({
        data: {
          shopId,
          type: 'forecast',
          inputData: { productId, recentSales },
          prediction: response.prediction,
          confidence: response.confidence,
        }
      });

      await cacheSet(cacheKey, JSON.stringify(response), CACHE_TTL_HOURS);
      return response;
    } catch (error) {
      logger.error(`AI Forecast Fallback Triggered for ${productId}`);
      // Fallback: Naive historical average
      const fallbackPrediction = {
        prediction: Math.ceil(recentSales * 1.1), // Assumes 10% growth
        confidence: 0.5,
        fallback: true
      };
      return fallbackPrediction;
    }
  }

  /**
   * 2. Assess Customer Credit Risk
   * Fetches credit ratios.
   */
  async creditRisk(shopId: string, customerId: string) {
    const cacheKey = `ai:credit-risk:${shopId}:${customerId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const ledgers = await prisma.creditLedger.findMany({
      where: { shopId, customerId }
    });

    const totalOverdue = ledgers.filter(l => l.status === 'OVERDUE').length;
    const totalPaid = ledgers.filter(l => l.status === 'PAID').length;

    try {
      const response = await AiClient.postCreditRisk({
        shopId,
        customerId,
        history: { totalOverdue, totalPaid, count: ledgers.length }
      });

      // Save to DB
      await prisma.aiPrediction.create({
        data: {
          shopId,
          type: 'credit-risk',
          inputData: { customerId, totalOverdue, totalPaid },
          prediction: response.prediction,
          confidence: response.confidence,
        }
      });

      await cacheSet(cacheKey, JSON.stringify(response), CACHE_TTL_HOURS);
      return response;
    } catch (error) {
      logger.error(`AI CreditRisk Fallback Triggered for ${customerId}`);
      // Fallback: Rule-based risk logic
      let riskCategory = 'LOW';
      let riskScore = 0.2;
      if (totalOverdue > 2) { riskCategory = 'HIGH'; riskScore = 0.9; }
      else if (totalOverdue > 0) { riskCategory = 'MEDIUM'; riskScore = 0.6; }

      const fallbackResult = { prediction: { category: riskCategory, score: riskScore }, confidence: 0.8, fallback: true };
      return fallbackResult;
    }
  }

  /**
   * 3. Detect Anomalies
   */
  async detectAnomaly(shopId: string, logs: any[]) {
    try {
      const response = await AiClient.postAnomaly({ shopId, logs });
      
      // Save to DB
      await prisma.aiPrediction.create({
        data: {
          shopId,
          type: 'anomaly',
          inputData: { logCount: logs.length },
          prediction: response.prediction,
          confidence: response.confidence,
        }
      });

      return response;
    } catch (error) {
      logger.error(`AI Anomaly Fallback Triggered`);
      return { prediction: { anomaliesDetected: 0, alerts: [] }, confidence: 0.0, fallback: true };
    }
  }

  /**
   * 4. Shelf Scanning
   */
  async shelfScan(shopId: string, imageUrl: string) {
    try {
      const response = await AiClient.postShelfScan({ shopId, imageUrl });

      // Save to DB
      await prisma.aiPrediction.create({
        data: {
          shopId,
          type: 'shelf-scan',
          inputData: { imageUrl },
          prediction: response.prediction,
          confidence: response.confidence,
        }
      });

      return response;
    } catch (error) {
      logger.error(`AI ShelfScan Fallback Triggered`);
      return { prediction: { productCount: 0, mismatch: true }, confidence: 0.0, fallback: true };
    }
  }

  /**
   * 5. Get Historical Predictions
   */
  async getPredictions(shopId: string, type?: string, limit = 50) {
    return prisma.aiPrediction.findMany({
      where: {
        shopId,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

