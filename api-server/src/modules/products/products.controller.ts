import { Request, Response, NextFunction } from 'express';
import { sendSuccess, parsePagination, buildPaginationMeta } from '../../common/helpers';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';

const service = new ProductsService(new ProductsRepository());

export class ProductsController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await service.create(req.user!.shopId, req.body);
      sendSuccess(res, product, 'Product created', 201);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await service.getById(req.params.id, req.user!.shopId);
      sendSuccess(res, product, 'Product details');
    } catch (error) {
      next(error);
    }
  }

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, category, page, limit } = req.query as any;
      const { products, total } = await service.search(req.user!.shopId, {
        q, category, page: Number(page) || 1, limit: Number(limit) || 20,
      });
      const pagination = parsePagination(req.query as any);
      const meta = buildPaginationMeta(total, pagination);
      sendSuccess(res, products, 'Products list', 200, meta);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await service.update(req.params.id, req.user!.shopId, req.body);
      sendSuccess(res, product, 'Product updated');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.delete(req.params.id, req.user!.shopId);
      sendSuccess(res, result, 'Product deleted');
    } catch (error) {
      next(error);
    }
  }

  async getByBarcode(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await service.getByBarcode(req.params.barcode, req.user!.shopId);
      sendSuccess(res, product, 'Product found');
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await service.getCategories(req.user!.shopId);
      sendSuccess(res, categories, 'Product categories');
    } catch (error) {
      next(error);
    }
  }

  async getLowStock(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = req.query.branchId as string | undefined;
      const products = await service.getLowStock(req.user!.shopId, branchId);
      sendSuccess(res, products, 'Low stock products');
    } catch (error) {
      next(error);
    }
  }
}
