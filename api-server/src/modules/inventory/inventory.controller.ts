import { Request, Response, NextFunction } from 'express';
import { sendSuccess, parsePagination, buildPaginationMeta } from '../../common/helpers';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from './inventory.repository';

const service = new InventoryService(new InventoryRepository());

export class InventoryController {
  async addStock(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = req.tenantContext?.branchId || req.user!.branchId;
      if (!branchId) return next(new (require('../../common/errors').BadRequestError)('Branch context required'));
      const result = await service.addStock(
        req.user!.shopId, branchId, req.user!.userId, req.body
      );
      sendSuccess(res, result, 'Stock added', 201);
    } catch (error) {
      next(error);
    }
  }

  async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = req.tenantContext?.branchId || req.user!.branchId;
      if (!branchId) return next(new (require('../../common/errors').BadRequestError)('Branch context required'));
      const result = await service.adjustStock(
        req.user!.shopId, branchId, req.user!.userId, req.user!.role, req.body
      );
      sendSuccess(res, result, 'Stock adjusted');
    } catch (error) {
      next(error);
    }
  }

  async transferStock(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.transferStock(req.user!.shopId, req.user!.userId, req.body);
      sendSuccess(res, result, 'Stock transferred');
    } catch (error) {
      next(error);
    }
  }

  async getInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = (req.query.branchId as string) || req.user!.branchId!;
      const pagination = parsePagination(req.query as any);
      const { items, total } = await service.getInventory(branchId, req.user!.shopId, pagination.page, pagination.limit);
      const meta = buildPaginationMeta(total, pagination);
      sendSuccess(res, items, 'Inventory list', 200, meta);
    } catch (error) {
      next(error);
    }
  }

  async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query as any);
      const branchId = req.query.branchId as string | undefined;
      const productId = req.query.productId as string | undefined;
      const { logs, total } = await service.getLogs(req.user!.shopId, {
        branchId,
        productId,
        page: pagination.page,
        limit: pagination.limit,
      });
      const meta = buildPaginationMeta(total, pagination);
      sendSuccess(res, logs, 'Inventory logs', 200, meta);
    } catch (error) {
      next(error);
    }
  }
}
