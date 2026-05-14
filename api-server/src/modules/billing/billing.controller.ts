import { Request, Response, NextFunction } from 'express';
import { sendSuccess, parsePagination, buildPaginationMeta } from '../../common/helpers';
import { BillingService } from './billing.service';
import { BillingRepository } from './billing.repository';

const service = new BillingService(new BillingRepository());

export class BillingController {
  async createInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { shopId } = req.user!;
      // Use tenantContext branchId — it respects the X-Branch-Id header override
      const branchId = req.tenantContext?.branchId || req.user!.branchId;
      if (!branchId) {
        return next(new (require('../../common/errors').BadRequestError)('Branch context required. Please select a branch first.'));
      }
      const result = await service.createInvoice(shopId, branchId, req.user!.userId, req.body);
      sendSuccess(res, result, 'Invoice created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await service.getInvoice(req.params.id, req.user!.shopId);
      sendSuccess(res, invoice, 'Invoice details');
    } catch (error) {
      next(error);
    }
  }

  async listInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query as any);
      const branchId = req.tenantContext?.branchId || req.user!.branchId!;
      const { invoices, total } = await service.listInvoices(
        req.user!.shopId,
        branchId,
        {
          page: pagination.page,
          limit: pagination.limit,
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
          customerId: req.query.customerId as string,
          paymentMode: req.query.paymentMode as any,
        }
      );
      const meta = buildPaginationMeta(total, pagination);
      sendSuccess(res, invoices, 'Invoices list', 200, meta);
    } catch (error) {
      next(error);
    }
  }

  async refundInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.refundInvoice(req.params.id, req.user!.shopId, req.user!.userId);
      sendSuccess(res, result, 'Invoice refunded successfully');
    } catch (error) {
      next(error);
    }
  }

  async downloadPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id || id === 'undefined' || id === 'null') {
        return next(new (require('../../common/errors').BadRequestError)('A valid Billing ID is required'));
      }
      const pdfBuffer = await service.generatePdf(id, req.user!.shopId);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
}
