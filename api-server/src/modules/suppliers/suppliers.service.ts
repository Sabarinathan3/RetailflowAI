import { NotFoundError, BadRequestError } from '../../common/errors';
import { generateOrderNumber } from '../../common/helpers';
import { SuppliersRepository } from './suppliers.repository';
import { PurchaseOrderStatus, Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

const notificationsService = new NotificationsService();

export class SuppliersService {
  constructor(private repo: SuppliersRepository) {}

  async create(shopId: string, data: Prisma.SupplierUncheckedCreateWithoutShopInput) {
    return this.repo.create(shopId, data);
  }

  async getById(id: string, shopId: string) {
    const supplier = await this.repo.findById(id, shopId);
    if (!supplier) throw new NotFoundError('Supplier');
    return supplier;
  }

  async list(shopId: string, page: number, limit: number, search?: string) {
    return this.repo.findAll(shopId, page, limit, search);
  }

  async update(id: string, shopId: string, data: Prisma.SupplierUncheckedUpdateWithoutShopInput) {
    await this.getById(id, shopId);
    await this.repo.update(id, shopId, data);
    return this.repo.findById(id, shopId);
  }

  async delete(id: string, shopId: string) {
    await this.getById(id, shopId);
    await this.repo.delete(id, shopId);
    return { message: 'Supplier deleted' };
  }

  async createPurchaseOrder(
    shopId: string,
    data: {
      supplierId: string;
      expectedDate?: Date;
      notes?: string;
      items: { productId: string; quantity: number; unitPrice: number }[];
    },
  ) {
    const orderNumber = generateOrderNumber();
    const totalAmount = data.items.reduce(
      (sum: number, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const po = await this.repo.createPurchaseOrder(shopId, { ...data, orderNumber, totalAmount });
    
    // Trigger PO Notification
    try {
      const supplier = await this.getById(data.supplierId, shopId);
      await notificationsService.create(
        shopId,
        'PURCHASE_ORDER',
        'Purchase Order Created',
        `PO ${orderNumber} created for supplier ${supplier.name}.`,
        { purchaseOrderId: po.id },
        undefined,
        'inventory',
        'MEDIUM'
      );
    } catch (e) {
      console.error('Failed to create PO notification', e);
    }
    
    return po;
  }

  async getPurchaseOrderById(id: string, shopId: string) {
    const po = await this.repo.findPurchaseOrderById(id, shopId);
    if (!po) throw new NotFoundError('Purchase Order');
    return po;
  }

  async listPurchaseOrders(
    shopId: string,
    page: number,
    limit: number,
    search?: string,
    status?: string,
  ) {
    return this.repo.findPurchaseOrders(shopId, page, limit, search, status);
  }

  async deletePurchaseOrder(id: string, shopId: string) {
    const po = await this.repo.findPurchaseOrderById(id, shopId);
    if (!po) throw new NotFoundError('Purchase Order');
    if (!['DRAFT', 'CANCELLED'].includes(po.status)) {
      throw new BadRequestError('Only DRAFT or CANCELLED orders can be deleted');
    }
    await this.repo.deletePurchaseOrder(id, shopId);
    return { message: 'Purchase order deleted' };
  }

  async updatePurchaseOrderStatus(
    id: string,
    shopId: string,
    status: PurchaseOrderStatus,
    branchId?: string,
  ) {
    const po = await this.repo.findPurchaseOrderById(id, shopId);
    if (!po) throw new NotFoundError('Purchase Order');
    if (po.status === 'RECEIVED' && status !== 'RECEIVED') {
      throw new BadRequestError('Received orders cannot be moved back');
    }
    const updatedPo = await this.repo.updatePurchaseOrderStatus(id, shopId, status, branchId);
    
    // Trigger notification
    try {
      if (status === 'RECEIVED') {
        await notificationsService.create(
          shopId,
          'INVENTORY_UPDATE',
          'Purchase Order Received',
          `Inventory updated from PO ${po.orderNumber}.`,
          { purchaseOrderId: po.id },
          undefined,
          'inventory',
          'HIGH'
        );
      } else {
        await notificationsService.create(
          shopId,
          'PURCHASE_ORDER',
          `Purchase Order ${status}`,
          `PO ${po.orderNumber} status changed to ${status}.`,
          { purchaseOrderId: po.id },
          undefined,
          'inventory',
          'MEDIUM'
        );
      }
    } catch (e) {
      console.error('Failed to create PO status notification', e);
    }

    return updatedPo;
  }

  // ── AI Risk Assessment ──────────────────────────────────────────────────
  async analyzeRisk(id: string, shopId: string) {
    const supplier = await this.getById(id, shopId);
    
    // In a real scenario, this would call an external ML model or AI Gateway
    // For now, we simulate risk assessment logic
    const delays = Math.floor(Math.random() * 10);
    const riskStatus = delays > 5 ? 'HIGH' : delays > 2 ? 'MEDIUM' : 'LOW';
    const tags = riskStatus === 'HIGH' ? ['Delayed Deliveries', 'Attention Required'] : ['Reliable'];
    
    await this.repo.updateAiRisk(id, shopId, riskStatus, tags);
    
    return {
      supplierId: id,
      riskStatus,
      tags,
      insights: `Supplier has had ${delays} delayed deliveries recently.`,
    };
  }

  // ── Ledger & Payments ───────────────────────────────────────────────────
  async createLedger(shopId: string, data: Prisma.SupplierLedgerUncheckedCreateWithoutShopInput) {
    return this.repo.createSupplierLedger(shopId, data);
  }

  async getLedgers(shopId: string, supplierId: string, page: number, limit: number) {
    return this.repo.findLedgers(shopId, supplierId, page, limit);
  }

  async addPayment(shopId: string, ledgerId: string, amount: number, paymentMode: any, notes?: string) {
    return this.repo.addLedgerPayment(shopId, ledgerId, amount, paymentMode, notes);
  }
}
