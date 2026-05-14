import { Request, Response, NextFunction } from 'express';
import { sendSuccess, parsePagination, buildPaginationMeta } from '../../common/helpers';
import { NotificationsService } from './notifications.service';

const service = new NotificationsService();

export class NotificationsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query as any);
      const { notifications, total } = await service.list(
        req.user!.shopId, req.user!.userId, pagination.page, pagination.limit
      );
      const meta = buildPaginationMeta(total, pagination);
      sendSuccess(res, notifications, 'Notifications', 200, meta);
    } catch (error) { next(error); }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      await service.markRead(req.params.id, req.user!.shopId);
      sendSuccess(res, null, 'Notification marked as read');
    } catch (error) { next(error); }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      await service.markAllRead(req.user!.shopId, req.user!.userId);
      sendSuccess(res, null, 'All notifications marked as read');
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await service.delete(req.params.id, req.user!.shopId);
      sendSuccess(res, null, 'Notification deleted');
    } catch (error) { next(error); }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await service.getUnreadCount(req.user!.shopId, req.user!.userId);
      sendSuccess(res, { count }, 'Unread notifications count');
    } catch (error) { next(error); }
  }

  async triggerLowStockAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const alerts = await service.generateLowStockAlerts(req.user!.shopId);
      sendSuccess(res, { count: alerts.length }, `${alerts.length} low stock alerts generated`);
    } catch (error) { next(error); }
  }

  async triggerDueReminders(req: Request, res: Response, next: NextFunction) {
    try {
      const reminders = await service.generateDueReminders(req.user!.shopId);
      sendSuccess(res, { count: reminders.length }, `${reminders.length} due reminders generated`);
    } catch (error) { next(error); }
  }

  async triggerDailySummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await service.generateDailySummary(req.user!.shopId);
      sendSuccess(res, summary, `Daily summary generated`);
    } catch (error) { next(error); }
  }
}
