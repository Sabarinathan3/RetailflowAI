import { Request, Response, NextFunction } from 'express';
import { sendSuccess, parsePagination, buildPaginationMeta } from '../../common/helpers';
import { CreditLedgerService } from './credit-ledger.service';
import { CreditLedgerRepository } from './credit-ledger.repository';
import prisma from '../../config/db';

const service = new CreditLedgerService(new CreditLedgerRepository());

export class CreditLedgerController {
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const ledger = await service.getById(req.params.id, req.user!.shopId);
      sendSuccess(res, ledger, 'Credit details');
    } catch (error) { next(error); }
  }

  async getByCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query as any);
      const { ledgers, total } = await service.getByCustomer(
        req.params.customerId, req.user!.shopId, pagination.page, pagination.limit
      );
      const meta = buildPaginationMeta(total, pagination);
      sendSuccess(res, ledgers, 'Customer credits', 200, meta);
    } catch (error) { next(error); }
  }

  async getPending(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query as any);
      const { ledgers, total } = await service.getPending(req.user!.shopId, pagination.page, pagination.limit);
      const meta = buildPaginationMeta(total, pagination);
      sendSuccess(res, ledgers, 'Pending credits', 200, meta);
    } catch (error) { next(error); }
  }

  async getOverdue(req: Request, res: Response, next: NextFunction) {
    try {
      const entries = await service.getOverdue(req.user!.shopId);
      sendSuccess(res, entries, 'Overdue credits');
    } catch (error) { next(error); }
  }

  async addPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount, paymentMode, notes } = req.body;
      const result = await service.addPayment(req.params.id, req.user!.shopId, amount, paymentMode, notes);
      sendSuccess(res, result, 'Payment recorded');
    } catch (error) { next(error); }
  }

  async getOutstandingTotal(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getOutstandingTotal(req.user!.shopId);
      sendSuccess(res, result, 'Outstanding total');
    } catch (error) { next(error); }
  }

  async getReminderLink(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = await prisma.shop.findUnique({ where: { id: req.user!.shopId } });
      const result = await service.generateReminderLink(req.params.id, req.user!.shopId, shop?.name || '');
      sendSuccess(res, result, 'Reminder link generated');
    } catch (error) { next(error); }
  }
}
