import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../common/helpers';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './analytics.repository';

const service = new AnalyticsService(new AnalyticsRepository());

export class AnalyticsController {
  async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = req.query.branchId as string | undefined;
      const data = await service.getDashboard(req.user!.shopId, branchId);
      sendSuccess(res, data, 'Dashboard data');
    } catch (error) { next(error); }
  }

  async dailySales(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getDailySales(
        req.user!.shopId,
        req.query.branchId as string,
        req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      );
      sendSuccess(res, data, 'Daily sales');
    } catch (error) { next(error); }
  }

  async topProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Number(req.query.limit) || 10;
      const data = await service.getTopProducts(req.user!.shopId, req.query.branchId as string, limit);
      sendSuccess(res, data, 'Top products');
    } catch (error) { next(error); }
  }

  async deadStock(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getDeadStock(req.user!.shopId);
      sendSuccess(res, data, 'Dead stock');
    } catch (error) { next(error); }
  }

  async lowStock(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getLowStock(req.user!.shopId);
      sendSuccess(res, data, 'Low stock');
    } catch (error) { next(error); }
  }

  async pendingDues(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getPendingDues(req.user!.shopId);
      sendSuccess(res, data, 'Pending dues');
    } catch (error) { next(error); }
  }

  async branchComparison(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getBranchComparison(req.user!.shopId);
      sendSuccess(res, data, 'Branch comparison');
    } catch (error) { next(error); }
  }
}
