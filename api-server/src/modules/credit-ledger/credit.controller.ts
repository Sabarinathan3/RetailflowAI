import { Request, Response, NextFunction } from 'express';
import { sendSuccess, parsePagination, buildPaginationMeta } from '../../common/helpers';
import { CreditService } from './credit.service';
import { CreditRepository } from './credit.repository';
import prisma from '../../config/db';

const service = new CreditService(new CreditRepository());

export class CreditController {
  
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const ledger = await service.getById(req.params.id, req.user!.shopId);
      sendSuccess(res, ledger, 'Credit details');
    } catch (error) { next(error); }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query as any);
      const { status, customerId, search } = req.query;
      const { ledgers, total } = await service.getAll(
        req.user!.shopId,
        pagination.page,
        pagination.limit,
        status as string,
        customerId as string,
        search as string,
      );
      const meta = buildPaginationMeta(total, pagination);
      sendSuccess(res, ledgers, 'All credit records', 200, meta);
    } catch (error) { next(error); }
  }

  async getByCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query as any);
      const { ledgers, total } = await service.getByCustomer(req.params.customerId, req.user!.shopId, pagination.page, pagination.limit);
      const meta = buildPaginationMeta(total, pagination);
      sendSuccess(res, ledgers, 'Customer credits', 200, meta);
    } catch (error) { next(error); }
  }

  async getOverdue(req: Request, res: Response, next: NextFunction) {
    try {
      const entries = await service.getOverdue(req.user!.shopId);
      sendSuccess(res, entries, 'Overdue credits');
    } catch (error) { next(error); }
  }

  /**
   * POST /pay - Natively pays an invoice based on generic payload `{ invoiceId, amount, paymentMode }`.
   * Maps to support Powershell test cases perfectly.
   */
  async payByInvoiceId(req: Request, res: Response, next: NextFunction) {
    try {
      const { invoiceId, amount, paymentMode = 'CASH', notes } = req.body;
      const result = await service.payByInvoiceId(invoiceId, req.user!.shopId, amount, paymentMode, notes);
      sendSuccess(res, result, 'Payment recorded successfully against Invoice ID');
    } catch (error) { next(error); }
  }

  async addPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount, paymentMode, notes } = req.body;
      const result = await service.addPayment(req.params.id, req.user!.shopId, amount, paymentMode, notes);
      sendSuccess(res, result, 'Payment recorded successfully against Credit Ledger ID');
    } catch (error) { next(error); }
  }

  async getOutstandingTotal(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getOutstandingTotal(req.user!.shopId);
      sendSuccess(res, { outstandingTotal: result }, 'Outstanding total successfully calculated');
    } catch (error) { next(error); }
  }

  async getReminderLink(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = await prisma.shop.findUnique({ where: { id: req.user!.shopId } });
      const result = await service.generateReminderLink(req.params.id, req.user!.shopId, shop?.name || '');
      sendSuccess(res, result, 'Reminder link generated successfully');
    } catch (error) { next(error); }
  }
}
