import prisma from '../../config/db';

export class BranchesRepository {
  async create(shopId: string, data: any) {
    return prisma.branch.create({
      data: { shopId, ...data },
    });
  }

  async findById(id: string, shopId: string) {
    return prisma.branch.findFirst({
      where: { id, shopId },
    });
  }

  async findAll(shopId: string) {
    return prisma.branch.findMany({
      where: { shopId },
      orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async update(id: string, shopId: string, data: any) {
    return prisma.branch.updateMany({
      where: { id, shopId },
      data,
    });
  }

  async delete(id: string, shopId: string) {
    return prisma.branch.deleteMany({
      where: { id, shopId, isMain: false },
    });
  }
}
