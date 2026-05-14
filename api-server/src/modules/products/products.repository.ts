import prisma from '../../config/db';
import { Prisma } from '@prisma/client';

export class ProductsRepository {
  async create(shopId: string, data: Prisma.ProductUncheckedCreateWithoutShopInput) {
    return prisma.product.create({
      data: { shopId, ...data },
    });
  }

  async findById(id: string, shopId: string) {
    return prisma.product.findFirst({
      where: { id, shopId },
      include: {
        inventory: true,
      },
    });
  }

  async findByBarcode(barcode: string, shopId: string) {
    return prisma.product.findFirst({
      where: { barcode, shopId },
      include: { inventory: true },
    });
  }

  async findBySku(sku: string, shopId: string) {
    return prisma.product.findFirst({
      where: { sku, shopId },
      include: { inventory: true },
    });
  }

  async search(shopId: string, params: {
    q?: string;
    category?: string;
    page: number;
    limit: number;
  }) {
    const skip = (params.page - 1) * params.limit;
    const where: Prisma.ProductWhereInput = {
      shopId,
      isActive: true,
    };

    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { sku: { contains: params.q, mode: 'insensitive' } },
        { barcode: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    if (params.category) {
      where.category = params.category;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: params.limit,
        include: { inventory: true },
        orderBy: { name: 'asc' },
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total };
  }

  async update(id: string, shopId: string, data: Prisma.ProductUncheckedUpdateWithoutShopInput) {
    return prisma.product.updateMany({
      where: { id, shopId },
      data,
    });
  }

  async softDelete(id: string, shopId: string) {
    return prisma.product.updateMany({
      where: { id, shopId },
      data: { isActive: false },
    });
  }

  async getCategories(shopId: string) {
    const result = await prisma.product.findMany({
      where: { shopId, isActive: true, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return result.map((r) => r.category).filter(Boolean);
  }

  async getLowStockProducts(shopId: string, branchId?: string) {
    // Raw query for efficiency — finds products where inventory < reorderThreshold
    return prisma.$queryRaw`
      SELECT p.*, COALESCE(SUM(i.quantity), 0) as total_stock
      FROM products p
      LEFT JOIN inventory i ON i.product_id = p.id
        ${branchId ? Prisma.sql`AND i.branch_id = ${branchId}` : Prisma.empty}
      WHERE p.shop_id = ${shopId}
        AND p.is_active = true
      GROUP BY p.id
      HAVING COALESCE(SUM(i.quantity), 0) <= p.reorder_threshold
      ORDER BY COALESCE(SUM(i.quantity), 0) ASC
    `;
  }
}
