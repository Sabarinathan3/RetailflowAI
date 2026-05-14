import axios from 'axios';
import axiosRetry from 'axios-retry';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

/**
 * Configure Axios Instance for FastAPI AI Microservice
 * Enforces a strict 3000ms timeout for Gateway resilience.
 */
const apiClient = axios.create({
  baseURL: env.AI_SERVICE_URL || 'http://localhost:8000',
  timeout: 3000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Configure Retry Logic
 * Retries up to 2 times using exponential backoff (e.g. 100ms, 200ms).
 * Triggers on network errors (ECONNREFUSED) or timeouts (ECONNABORTED) or 5xx errors.
 */
axiosRetry(apiClient, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ECONNABORTED';
  },
  onRetry: (retryCount, error, requestConfig) => {
    logger.warn(`⚠️ AI Service Retry [${retryCount}/2] for ${requestConfig.url}: ${error.message}`);
  },
});

export interface AiPredictionResponse {
  prediction: any;
  confidence: number;
}

export const AiClient = {
  async postForecast(payload: any): Promise<AiPredictionResponse> {
    const res = await apiClient.post<AiPredictionResponse>('/forecast', payload);
    return res.data;
  },

  async postCreditRisk(payload: any): Promise<AiPredictionResponse> {
    const res = await apiClient.post<AiPredictionResponse>('/credit-risk', payload);
    return res.data;
  },

  async postAnomaly(payload: any): Promise<AiPredictionResponse> {
    const res = await apiClient.post<AiPredictionResponse>('/anomaly', payload);
    return res.data;
  },

  async postShelfScan(payload: any): Promise<AiPredictionResponse> {
    const res = await apiClient.post<AiPredictionResponse>('/shelf-scan', payload);
    return res.data;
  },
};
