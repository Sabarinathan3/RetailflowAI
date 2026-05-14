import { BadRequestError } from '../../common/errors';
import { InventoryRepository } from './inventory.repository';

export class InventoryService {
  constructor(private repo: InventoryRepository) {}

  async addStock(shopId: string, branchId: string, userId: string, data: { productId: string, quantity: number, batchNumber?: string, expiryDate?: Date, costPrice?: number, reason?: string }) {
    try {
      return await this.repo.addStock({
        shopId,
        branchId,
        productId: data.productId,
        quantity: data.quantity,
        batchNumber: data.batchNumber,
        expiryDate: data.expiryDate,
        costPrice: data.costPrice,
        reason: data.reason,
        performedBy: userId,
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestError('Invalid branchId or productId');
      }
      if (error instanceof Error) {
        throw new BadRequestError(error.message);
      }
      throw new BadRequestError('Add stock failed');
    }
  }

  async adjustStock(shopId: string, branchId: string, userId: string, role: string, data: { productId: string, quantity: number, batchNumber?: string, reason: string }) {
    const isManagerOverride = role === 'OWNER' || role === 'MANAGER';
    try {
      return await this.repo.adjustStock({
        shopId,
        branchId,
        productId: data.productId,
        quantity: data.quantity,
        batchNumber: data.batchNumber,
        reason: data.reason,
        performedBy: userId,
        isManagerOverride,
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestError('Invalid branchId or productId');
      }
      if (error instanceof Error) {
        throw new BadRequestError(error.message);
      }
      throw new BadRequestError('Adjustment failed');
    }
  }

  async transferStock(shopId: string, userId: string, data: { productId: string, fromBranchId: string, toBranchId: string, quantity: number, batchNumber?: string, notes?: string }) {
    if (data.fromBranchId === data.toBranchId) {
      throw new BadRequestError('Cannot transfer to the same branch');
    }
    try {
      return await this.repo.transferStock({
        shopId,
        productId: data.productId,
        fromBranchId: data.fromBranchId,
        toBranchId: data.toBranchId,
        quantity: data.quantity,
        batchNumber: data.batchNumber,
        notes: data.notes,
        performedBy: userId,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestError(error.message);
      }
      throw new BadRequestError('Transfer failed');
    }
  }

  async getInventory(branchId: string, shopId: string, page: number, limit: number) {
    return this.repo.getInventory(branchId, shopId, page, limit);
  }

  async getLogs(shopId: string, params: { branchId?: string; productId?: string; page: number; limit: number }) {
    return this.repo.getInventoryLogs(shopId, params);
  }
}
