import prisma from '../../config/db';
import { Prisma } from '@prisma/client';

export class CustomersRepository {
  async create(shopId: string, data: any) {
    return prisma.customer.create({ data: { shopId, ...data } });
  }

  async findById(id: string, shopId: string) {
    return prisma.customer.findFirst({ where: { id, shopId } });
  }

  async findByPhone(phone: string, shopId: string) {
    return prisma.customer.findFirst({ where: { phone, shopId } });
  }

  async search(shopId: string, params: { phone?: string; q?: string; page: number; limit: number }) {
    const skip = (params.page - 1) * params.limit;
    const where: Prisma.CustomerWhereInput = { shopId };

    if (params.phone) {
      where.phone = { contains: params.phone };
    }
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { phone: { contains: params.q } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({ where, skip, take: params.limit, orderBy: { name: 'asc' } }),
      prisma.customer.count({ where }),
    ]);
    return { customers, total };
  }

  async update(id: string, shopId: string, data: any) {
    return prisma.customer.updateMany({ where: { id, shopId }, data });
  }

  async getPurchaseHistory(customerId: string, shopId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { customerId, shopId },
        include: { items: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where: { customerId, shopId } }),
    ]);
    return { invoices, total };
  }
}
