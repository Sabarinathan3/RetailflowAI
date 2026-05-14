import prisma from '../../config/db';
import { PurchaseOrderStatus, Prisma } from '@prisma/client';

export class SuppliersRepository {
  async create(shopId: string, data: Prisma.SupplierUncheckedCreateWithoutShopInput) {
    return prisma.supplier.create({ data: { shopId, ...data } });
  }

  async findById(id: string, shopId: string) {
    return prisma.supplier.findFirst({ where: { id, shopId } });
  }

  async findAll(shopId: string, page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.SupplierWhereInput = {
      shopId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { contactPerson: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { gstNumber: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.supplier.count({ where }),
    ]);
    return { suppliers, total };
  }

  async update(id: string, shopId: string, data: Prisma.SupplierUncheckedUpdateWithoutShopInput) {
    return prisma.supplier.updateMany({ where: { id, shopId }, data });
  }

  async delete(id: string, shopId: string) {
    return prisma.supplier.updateMany({ where: { id, shopId }, data: { isActive: false } });
  }

  async updateAiRisk(id: string, shopId: string, aiRiskStatus: string, tags?: any) {
    return prisma.supplier.updateMany({
      where: { id, shopId },
      data: { aiRiskStatus, tags },
    });
  }

  // ── Purchase Orders ──────────────────────────────────────────────────────

  async createPurchaseOrder(shopId: string, data: {
    supplierId: string;
    expectedDate?: Date;
    notes?: string;
    orderNumber: string;
    totalAmount: number;
    items: { productId: string; quantity: number; unitPrice: number }[];
  }) {
    return prisma.purchaseOrder.create({
      data: {
        shopId,
        supplierId: data.supplierId,
        orderNumber: data.orderNumber,
        totalAmount: data.totalAmount || 0,
        notes: data.notes,
        expectedDate: data.expectedDate,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: { items: { include: { product: true } }, supplier: true },
    });
  }

  async findPurchaseOrders(shopId: string, page: number, limit: number, search?: string, status?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.PurchaseOrderWhereInput = {
      shopId,
      ...(status ? { status: status as PurchaseOrderStatus } : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: 'insensitive' } },
              { supplier: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: { supplier: true, items: { include: { product: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);
    return { orders, total };
  }

  async findPurchaseOrderById(id: string, shopId: string) {
    return prisma.purchaseOrder.findFirst({
      where: { id, shopId },
      include: { supplier: true, items: { include: { product: true } } },
    });
  }

  async deletePurchaseOrder(id: string, shopId: string) {
    // Only allow deleting DRAFT/CANCELLED orders
    return prisma.purchaseOrder.deleteMany({
      where: { id, shopId, status: { in: ['DRAFT', 'CANCELLED'] } },
    });
  }

  /**
   * Update PO status. When status becomes RECEIVED, atomically update
   * inventory for every item in a Prisma transaction.
   */
  async updatePurchaseOrderStatus(id: string, shopId: string, status: PurchaseOrderStatus, branchId?: string) {
    if (status !== 'RECEIVED') {
      return prisma.purchaseOrder.updateMany({
        where: { id, shopId },
        data: { status },
      });
    }

    // Transactional: mark RECEIVED + update inventory
    return prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findFirst({
        where: { id, shopId },
        include: { items: true },
      });
      if (!po) throw new Error('Purchase order not found');
      if (po.status === 'RECEIVED') throw new Error('Purchase order already received');

      // Determine target branch: prefer provided branchId, else shop's main branch
      let targetBranchId = branchId;
      if (!targetBranchId) {
        const mainBranch = await tx.branch.findFirst({ where: { shopId, isMain: true } });
        if (!mainBranch) {
          const anyBranch = await tx.branch.findFirst({ where: { shopId } });
          if (!anyBranch) throw new Error('No branch found for shop');
          targetBranchId = anyBranch.id;
        } else {
          targetBranchId = mainBranch.id;
        }
      }

      // Update inventory for each item
      for (const item of po.items) {
        const existing = await tx.inventory.findFirst({
          where: { productId: item.productId, branchId: targetBranchId!, batchNumber: null },
        });

        const previousQty = existing?.quantity ?? 0;
        const newQty = previousQty + item.quantity;

        if (existing) {
          await tx.inventory.update({
            where: { id: existing.id },
            data: { quantity: newQty },
          });
        } else {
          await tx.inventory.create({
            data: {
              productId: item.productId,
              branchId: targetBranchId!,
              quantity: item.quantity,
              batchNumber: null,
            },
          });
        }

        // Inventory log
        await tx.inventoryLog.create({
          data: {
            shopId,
            branchId: targetBranchId!,
            productId: item.productId,
            action: 'ADD',
            quantity: item.quantity,
            previousQty,
            newQty,
            referenceId: po.id,
            reason: `PO Received: ${po.orderNumber}`,
          },
        });

        // Mark items as received
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { receivedQty: item.quantity },
        });
      }

      // Mark PO as RECEIVED
      return tx.purchaseOrder.update({
        where: { id },
        data: { status: 'RECEIVED', receivedDate: new Date() },
      });
    });
  }

  // ── Supplier Ledger & Payments ──────────────────────────────────────────

  async createSupplierLedger(shopId: string, data: Prisma.SupplierLedgerUncheckedCreateWithoutShopInput) {
    return prisma.supplierLedger.create({ data: { shopId, ...data } });
  }

  async findLedgers(shopId: string, supplierId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = { shopId, supplierId };
    const [ledgers, total] = await Promise.all([
      prisma.supplierLedger.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { purchaseOrder: true },
      }),
      prisma.supplierLedger.count({ where }),
    ]);
    return { ledgers, total };
  }

  async addLedgerPayment(shopId: string, ledgerId: string, amount: number, paymentMode: any, notes?: string) {
    return prisma.$transaction(async (tx) => {
      const ledger = await tx.supplierLedger.findFirst({ where: { id: ledgerId, shopId } });
      if (!ledger) throw new Error('Ledger not found');

      const newPaid = ledger.paidAmount + amount;
      const newOut = ledger.totalAmount - newPaid;
      const newStatus = newOut <= 0 ? 'PAID' : 'PARTIAL';

      const payment = await tx.supplierPayment.create({
        data: {
          supplierLedgerId: ledgerId,
          amount,
          paymentMode,
          notes,
        },
      });

      await tx.supplierLedger.update({
        where: { id: ledger.id },
        data: { paidAmount: newPaid, outstandingAmount: newOut, status: newStatus },
      });

      return payment;
    });
  }
}
