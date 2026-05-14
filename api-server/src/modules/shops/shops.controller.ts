import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../common/helpers';
import { parsePagination, buildPaginationMeta } from '../../common/helpers';
import { ShopsService } from './shops.service';
import { ShopsRepository } from './shops.repository';

const service = new ShopsService(new ShopsRepository());

export class ShopsController {
  async getShop(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = await service.getShop(req.user!.shopId);
      sendSuccess(res, shop, 'Shop details');
    } catch (error) {
      next(error);
    }
  }

  async updateShop(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = await service.updateShop(req.user!.shopId, req.body);
      sendSuccess(res, shop, 'Shop updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
