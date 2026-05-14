import { Request, Response, NextFunction } from 'express';
import { sendSuccess, parsePagination, buildPaginationMeta } from '../../common/helpers';
import { CustomersService } from './customers.service';
import { CustomersRepository } from './customers.repository';

const service = new CustomersService(new CustomersRepository());

export class CustomersController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await service.create(req.user!.shopId, req.body);
      sendSuccess(res, customer, 'Customer created', 201);
    } catch (error) { next(error); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await service.getById(req.params.id, req.user!.shopId);
      sendSuccess(res, customer, 'Customer details');
    } catch (error) { next(error); }
  }

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query as any);
      const { customers, total } = await service.search(req.user!.shopId, {
        phone: req.query.phone,
        q: req.query.q,
        page: pagination.page,
        limit: pagination.limit,
      });
      const meta = buildPaginationMeta(total, pagination);
      sendSuccess(res, customers, 'Customers list', 200, meta);
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await service.update(req.params.id, req.user!.shopId, req.body);
      sendSuccess(res, customer, 'Customer updated');
    } catch (error) { next(error); }
  }

  async getPurchaseHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query as any);
      const { invoices, total } = await service.getPurchaseHistory(
        req.params.id, req.user!.shopId, pagination.page, pagination.limit
      );
      const meta = buildPaginationMeta(total, pagination);
      sendSuccess(res, invoices, 'Purchase history', 200, meta);
    } catch (error) { next(error); }
  }
}
