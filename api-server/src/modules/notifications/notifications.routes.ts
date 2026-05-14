import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';

const router = Router();
const controller = new NotificationsController();

router.use(authMiddleware);

router.get('/', controller.list);
router.get('/unread/count', controller.getUnreadCount);
router.patch('/:id/read', controller.markRead);
router.patch('/read-all', controller.markAllRead);
router.delete('/:id', controller.delete);
router.post('/trigger/low-stock', roleMiddleware('OWNER', 'MANAGER'), controller.triggerLowStockAlerts);
router.post('/trigger/due-reminders', roleMiddleware('OWNER', 'MANAGER'), controller.triggerDueReminders);
router.post('/trigger/daily-summary', roleMiddleware('OWNER', 'MANAGER'), controller.triggerDailySummary);

export default router;
