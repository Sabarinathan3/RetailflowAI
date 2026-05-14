import { Role } from '@prisma/client';
import prisma from '../../config/db';

export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, isActive: true },
      include: { shop: true, branch: true },
    });
  }

  async findUserByPhone(phone: string) {
    return prisma.user.findFirst({
      where: { phone, isActive: true },
      include: { shop: true, branch: true },
    });
  }

  async findUsersByShopAndPin(shopId: string) {
    return prisma.user.findMany({
      where: { shopId, role: 'CASHIER', isActive: true, pin: { not: null } },
      include: { branch: true },
    });
  }

  async findUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { shop: true, branch: true },
    });
  }

  /**
   * Register a new shop with owner and main branch in a single transaction.
   */
  async createShopWithOwner(data: {
    shopName: string;
    ownerName: string;
    email: string;
    phone?: string;
    hashedPassword: string;
    branchName: string;
    gstNumber?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: {
          name: data.shopName,
          email: data.email,
          gstNumber: data.gstNumber,
        },
      });

      const branch = await tx.branch.create({
        data: {
          shopId: shop.id,
          name: data.branchName,
          isMain: true,
        },
      });

      const user = await tx.user.create({
        data: {
          shopId: shop.id,
          branchId: branch.id,
          name: data.ownerName,
          email: data.email,
          phone: data.phone,
          password: data.hashedPassword,
          role: 'OWNER' as Role,
        },
      });

      return { shop, branch, user };
    });
  }

  async saveRefreshToken(userId: string, token: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  }

  async findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token },
    });
  }

  async deleteRefreshToken(token: string) {
    return prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  async deleteExpiredTokens() {
    return prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  async updateLastLogin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { email },
    });
    return count > 0;
  }
}
