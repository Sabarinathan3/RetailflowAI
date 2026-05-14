import prisma from '../../config/db';
import { StockAction, Prisma } from '@prisma/client';

export class InventoryRepository {
  async addStock(data: {
    shopId: string;
    branchId: string;
    productId: string;
    quantity: number;
    batchNumber?: string;
    expiryDate?: Date;
    costPrice?: number;
    reason?: string;
    performedBy: string;
  }) {
    return prisma.$transaction(async (tx) => {
      // Upsert inventory
      const existing = await tx.inventory.findFirst({
        where: {
          productId: data.productId,
          branchId: data.branchId,
          batchNumber: data.batchNumber || null,
        },
      });

      const previousQty = existing?.quantity || 0;
      const newQty = previousQty + data.quantity;

      let inventory;
      if (existing) {
        inventory = await tx.inventory.update({
          where: { id: existing.id },
          data: {
            quantity: newQty,
            expiryDate: data.expiryDate || existing.expiryDate,
            costPrice: data.costPrice || existing.costPrice,
          },
        });
      } else {
        inventory = await tx.inventory.create({
          data: {
            productId: data.productId,
            branchId: data.branchId,
            quantity: data.quantity,
            batchNumber: data.batchNumber,
            expiryDate: data.expiryDate,
            costPrice: data.costPrice,
          },
        });
      }

      // Log
      await tx.inventoryLog.create({
        data: {
          shopId: data.shopId,
          branchId: data.branchId,
          productId: data.productId,
          action: StockAction.ADD,
          quantity: data.quantity,
          previousQty,
          newQty,
          batchNumber: data.batchNumber,
          reason: data.reason,
          performedBy: data.performedBy,
        },
      });

      return inventory;
    });
  }

  async adjustStock(data: {
    shopId: string;
    branchId: string;
    productId: string;
    quantity: number;
    batchNumber?: string;
    reason: string;
    performedBy: string;
    isManagerOverride?: boolean;
  }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.inventory.findFirst({
        where: {
          productId: data.productId,
          branchId: data.branchId,
          batchNumber: data.batchNumber || null,
        },
      });

      const previousQty = existing?.quantity || 0;
      const newQty = previousQty + data.quantity;

      // Prevent negative stock unless manager override
      if (newQty < 0 && !data.isManagerOverride) {
        throw new Error(`Stock adjustment would result in negative quantity (${newQty}). Manager override required.`);
      }

      let inventory;
      if (existing) {
        inventory = await tx.inventory.update({
          where: { id: existing.id },
          data: { quantity: newQty },
        });
      } else {
        inventory = await tx.inventory.create({
          data: {
            productId: data.productId,
            branchId: data.branchId,
            quantity: data.quantity,
            batchNumber: data.batchNumber,
          },
        });
      }

      await tx.inventoryLog.create({
        data: {
          shopId: data.shopId,
          branchId: data.branchId,
          productId: data.productId,
          action: StockAction.ADJUST,
          quantity: data.quantity,
          previousQty,
          newQty,
          batchNumber: data.batchNumber,
          reason: data.reason,
          performedBy: data.performedBy,
        },
      });

      return inventory;
    });
  }

  async transferStock(data: {
    shopId: string;
    productId: string;
    fromBranchId: string;
    toBranchId: string;
    quantity: number;
    batchNumber?: string;
    notes?: string;
    performedBy: string;
  }) {
    return prisma.$transaction(async (tx) => {
      // Deduct from source
      const source = await tx.inventory.findFirst({
        where: {
          productId: data.productId,
          branchId: data.fromBranchId,
          batchNumber: data.batchNumber || null,
        },
      });

      const sourcePrevQty = source?.quantity || 0;
      if (sourcePrevQty < data.quantity) {
        throw new Error(`Insufficient stock at source branch. Available: ${sourcePrevQty}`);
      }

      await tx.inventory.update({
        where: { id: source!.id },
        data: { quantity: sourcePrevQty - data.quantity },
      });

      // Add to destination
      const dest = await tx.inventory.findFirst({
        where: {
          productId: data.productId,
          branchId: data.toBranchId,
          batchNumber: data.batchNumber || null,
        },
      });

      const destPrevQty = dest?.quantity || 0;

      if (dest) {
        await tx.inventory.update({
          where: { id: dest.id },
          data: { quantity: destPrevQty + data.quantity },
        });
      } else {
        await tx.inventory.create({
          data: {
            productId: data.productId,
            branchId: data.toBranchId,
            quantity: data.quantity,
            batchNumber: data.batchNumber,
          },
        });
      }

      // Create transfer record
      const transfer = await tx.stockTransfer.create({
        data: {
          fromBranchId: data.fromBranchId,
          toBranchId: data.toBranchId,
          productId: data.productId,
          quantity: data.quantity,
          batchNumber: data.batchNumber,
          notes: data.notes,
          transferredBy: data.performedBy,
        },
      });

      // Logs for both branches
      await tx.inventoryLog.create({
        data: {
          shopId: data.shopId,
          branchId: data.fromBranchId,
          productId: data.productId,
          action: StockAction.TRANSFER_OUT,
          quantity: data.quantity,
          previousQty: sourcePrevQty,
          newQty: sourcePrevQty - data.quantity,
          batchNumber: data.batchNumber,
          referenceId: transfer.id,
          performedBy: data.performedBy,
        },
      });

      await tx.inventoryLog.create({
        data: {
          shopId: data.shopId,
          branchId: data.toBranchId,
          productId: data.productId,
          action: StockAction.TRANSFER_IN,
          quantity: data.quantity,
          previousQty: destPrevQty,
          newQty: destPrevQty + data.quantity,
          batchNumber: data.batchNumber,
          referenceId: transfer.id,
          performedBy: data.performedBy,
        },
      });

      return transfer;
    });
  }

  async getInventory(branchId: string, shopId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.inventory.findMany({
        where: { branchId, branch: { shopId } },
        include: { product: true },
        skip,
        take: limit,
        orderBy: { product: { name: 'asc' } },
      }),
      prisma.inventory.count({
        where: { branchId, branch: { shopId } },
      }),
    ]);
    return { items, total };
  }

  async getInventoryLogs(shopId: string, params: {
    branchId?: string;
    productId?: string;
    page: number;
    limit: number;
  }) {
    const skip = (params.page - 1) * params.limit;
    const where: Prisma.InventoryLogWhereInput = { shopId };
    if (params.branchId) where.branchId = params.branchId;
    if (params.productId) where.productId = params.productId;

    const [logs, total] = await Promise.all([
      prisma.inventoryLog.findMany({
        where,
        include: { product: { select: { name: true, sku: true } } },
        skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventoryLog.count({ where }),
    ]);
    return { logs, total };
  }
}
