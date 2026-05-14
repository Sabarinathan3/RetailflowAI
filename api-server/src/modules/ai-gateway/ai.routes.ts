import { Router } from 'express';
import { AiController } from './ai.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';

const router = Router();
const controller = new AiController();

// All AI routes require authentication and proper roles
router.use(authMiddleware, roleMiddleware('OWNER', 'MANAGER', 'ADMIN'));

/**
 * @route   POST /api/v1/ai/forecast
 * @desc    Forecast product demand
 */
router.post('/forecast', controller.forecast);

/**
 * @route   POST /api/v1/ai/credit-risk
 * @desc    Assess customer credit risk
 */
router.post('/credit-risk', controller.creditRisk);

/**
 * @route   POST /api/v1/ai/anomaly
 * @desc    Detect anomalies in logs
 */
router.post('/anomaly', controller.anomaly);

/**
 * @route   POST /api/v1/ai/shelf-scan
 * @desc    Analyze shelf images
 */
router.post('/shelf-scan', controller.shelfScan);

/**
 * @route   GET /api/v1/ai/predictions
 * @desc    Get historical AI predictions
 */
router.get('/predictions', controller.getPredictions);

export default router;
