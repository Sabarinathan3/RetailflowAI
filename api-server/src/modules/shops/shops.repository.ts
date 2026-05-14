import prisma from '../../config/db';

import { Prisma } from '@prisma/client';

export class ShopsRepository {
  async findById(shopId: string) {
    return prisma.shop.findUnique({ where: { id: shopId } });
  }

  async update(shopId: string, data: Prisma.ShopUncheckedUpdateInput) {
    return prisma.shop.update({ where: { id: shopId }, data });
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [shops, total] = await Promise.all([
      prisma.shop.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.shop.count(),
    ]);
    return { shops, total };
  }
}
