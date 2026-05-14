import { Request, Response, NextFunction } from 'express';
import { sendSuccess, parsePagination, buildPaginationMeta } from '../../common/helpers';
import { SuppliersService } from './suppliers.service';
import { SuppliersRepository } from './suppliers.repository';

const service = new SuppliersService(new SuppliersRepository());

export class SuppliersController {
  // ── Suppliers ────────────────────────────────────────────────────────────

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await service.create(req.user!.shopId, req.body);
      sendSuccess(res, supplier, 'Supplier created', 201);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await service.getById(req.params.id, req.user!.shopId);
      sendSuccess(res, supplier, 'Supplier details');
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query as any);
      const search = (req.query.search as string) || undefined;
      const { suppliers, total } = await service.list(
        req.user!.shopId,
        pagination.page,
        pagination.limit,
        search,
      );
      const meta = buildPaginationMeta(total, pagination);
      sendSuccess(res, suppliers, 'Suppliers list', 200, meta);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await service.update(req.params.id, req.user!.shopId, req.body);
      sendSuccess(res, supplier, 'Supplier updated');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.delete(req.params.id, req.user!.shopId);
      sendSuccess(res, result, 'Supplier deleted');
    } catch (error) {
      next(error);
    }
  }

  async getRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      // AI recommendations placeholder – returns real supplier list enriched with mock scores
      const { suppliers } = await service.list(req.user!.shopId, 1, 5);
      const enriched = suppliers.map((s) => ({
        ...s,
        rating: 4.5,
        aiRiskStatus: 'LOW',
        tags: ['Reliable', 'Fast Shipping'],
      }));
      sendSuccess(res, enriched, 'AI Recommendations');
    } catch (error) {
      next(error);
    }
  }

  async analyzeRisk(req: Request, res: Response, next: NextFunction) {
    try {
      const riskData = await service.analyzeRisk(req.params.id, req.user!.shopId);
      sendSuccess(res, riskData, 'Supplier AI risk analyzed');
    } catch (error) {
      next(error);
    }
  }

  // ── Ledgers & Payments ───────────────────────────────────────────────────

  async createLedger(req: Request, res: Response, next: NextFunction) {
    try {
      const ledger = await service.createLedger(req.user!.shopId, req.body);
      sendSuccess(res, ledger, 'Supplier ledger created', 201);
    } catch (error) {
      next(error);
    }
  }

  async getLedgers(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query as any);
      const { ledgers, total } = await service.getLedgers(
        req.user!.shopId,
        req.params.supplierId,
        pagination.page,
        pagination.limit
      );
      const meta = buildPaginationMeta(total, pagination);
      sendSuccess(res, ledgers, 'Supplier ledgers', 200, meta);
    } catch (error) {
      next(error);
    }
  }

  async addLedgerPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await service.addPayment(
        req.user!.shopId,
        req.params.ledgerId,
        req.body.amount,
        req.body.paymentMode,
        req.body.notes
      );
      sendSuccess(res, payment, 'Payment added successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  // ── Purchase Orders ──────────────────────────────────────────────────────

  async createPurchaseOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await service.createPurchaseOrder(req.user!.shopId, req.body);
      sendSuccess(res, order, 'Purchase order created', 201);
    } catch (error) {
      next(error);
    }
  }

  async listPurchaseOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query as any);
      const search = (req.query.search as string) || undefined;
      const status = (req.query.status as string) || undefined;
      const { orders, total } = await service.listPurchaseOrders(
        req.user!.shopId,
        pagination.page,
        pagination.limit,
        search,
        status,
      );
      const meta = buildPaginationMeta(total, pagination);
      sendSuccess(res, orders, 'Purchase orders', 200, meta);
    } catch (error) {
      next(error);
    }
  }

  async getPurchaseOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const po = await service.getPurchaseOrderById(req.params.id, req.user!.shopId);
      sendSuccess(res, po, 'Purchase order details');
    } catch (error) {
      next(error);
    }
  }

  async updatePurchaseOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId =
        (req.headers['x-branch-id'] as string) ||
        req.user!.branchId ||
        undefined;
      await service.updatePurchaseOrderStatus(
        req.params.id,
        req.user!.shopId,
        req.body.status,
        branchId,
      );
      sendSuccess(res, null, 'Purchase order status updated');
    } catch (error) {
      next(error);
    }
  }

  async deletePurchaseOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.deletePurchaseOrder(req.params.id, req.user!.shopId);
      sendSuccess(res, result, 'Purchase order deleted');
    } catch (error) {
      next(error);
    }
  }
}
