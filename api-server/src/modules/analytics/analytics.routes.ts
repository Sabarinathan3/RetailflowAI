import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';

const router = Router();
const controller = new AnalyticsController();

router.use(authMiddleware, roleMiddleware('OWNER', 'MANAGER', 'ADMIN'));

router.get('/dashboard', controller.dashboard);
router.get('/daily-sales', controller.dailySales);
router.get('/top-products', controller.topProducts);
router.get('/dead-stock', controller.deadStock);
router.get('/low-stock', controller.lowStock);
router.get('/pending-dues', controller.pendingDues);
router.get('/branch-comparison', controller.branchComparison);

export default router;
