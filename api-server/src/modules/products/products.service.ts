import { NotFoundError, ConflictError } from '../../common/errors';
import { ProductsRepository } from './products.repository';
import { Prisma } from '@prisma/client';

export class ProductsService {
  constructor(private repo: ProductsRepository) {}

  async create(shopId: string, data: Prisma.ProductUncheckedCreateWithoutShopInput) {
    // Check SKU uniqueness
    if (data.sku && typeof data.sku === 'string') {
      const existing = await this.repo.findBySku(data.sku, shopId);
      if (existing) throw new ConflictError(`Product with SKU "${data.sku}" already exists`);
    }
    // Check barcode uniqueness
    if (data.barcode) {
      const existing = await this.repo.findByBarcode(data.barcode, shopId);
      if (existing) throw new ConflictError(`Product with barcode "${data.barcode}" already exists`);
    }
    return this.repo.create(shopId, data);
  }

  async getById(id: string, shopId: string) {
    const product = await this.repo.findById(id, shopId);
    if (!product) throw new NotFoundError('Product');
    return product;
  }

  async search(shopId: string, params: { q?: string; category?: string; page: number; limit: number }) {
    const result = await this.repo.search(shopId, params);
    // Attach computed currentStock (total across all branches) so POS always has a stock value
    const products = result.products.map((p) => ({
      ...p,
      currentStock: p.inventory.reduce((sum, inv) => sum + (inv.quantity ?? 0), 0),
    }));
    return { products, total: result.total };
  }

  async update(id: string, shopId: string, data: Prisma.ProductUncheckedUpdateWithoutShopInput) {
    await this.getById(id, shopId);
    // Check SKU/barcode uniqueness on update
    if (data.sku && typeof data.sku === 'string') {
      const existing = await this.repo.findBySku(data.sku, shopId);
      if (existing && existing.id !== id) throw new ConflictError(`SKU "${data.sku}" already in use`);
    }
    if (data.barcode && typeof data.barcode === 'string') {
      const existing = await this.repo.findByBarcode(data.barcode, shopId);
      if (existing && existing.id !== id) throw new ConflictError(`Barcode "${data.barcode}" already in use`);
    }
    await this.repo.update(id, shopId, data);
    return this.repo.findById(id, shopId);
  }

  async delete(id: string, shopId: string) {
    await this.getById(id, shopId);
    await this.repo.softDelete(id, shopId);
    return { message: 'Product deleted' };
  }

  async getByBarcode(barcode: string, shopId: string) {
    const product = await this.repo.findByBarcode(barcode, shopId);
    if (!product) throw new NotFoundError('Product');
    return product;
  }

  async getCategories(shopId: string) {
    return this.repo.getCategories(shopId);
  }

  async getLowStock(shopId: string, branchId?: string) {
    return this.repo.getLowStockProducts(shopId, branchId);
  }
}
