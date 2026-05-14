import prisma from '../../config/db';
import { NotificationType } from '@prisma/client';
import { logger } from '../../config/logger';
import { buildWhatsAppLink } from '../../common/helpers';

export class NotificationsService {
  /**
   * Create a notification for a shop/user.
   */
  async create(
    shopId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
    userId?: string,
    category: string = 'system',
    priority: any = 'MEDIUM'
  ) {
    return prisma.notification.create({
      data: { shopId, type, category, priority, title, message, data, userId },
    });
  }

  /**
   * Get notifications for a shop/user.
   */
  async list(shopId: string, userId?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where: any = { shopId };
    if (userId) {
      where.OR = [{ userId }, { userId: null }]; // user-specific + broadcast
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);
    return { notifications, total };
  }

  /**
   * Mark notification as read.
   */
  async markRead(id: string, shopId: string) {
    return prisma.notification.updateMany({
      where: { id, shopId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all as read.
   */
  async markAllRead(shopId: string, userId?: string) {
    const where: any = { shopId, isRead: false };
    if (userId) where.userId = userId;
    return prisma.notification.updateMany({ where, data: { isRead: true } });
  }

  /**
   * Delete a notification.
   */
  async delete(id: string, shopId: string) {
    return prisma.notification.deleteMany({
      where: { id, shopId },
    });
  }

  /**
   * Get unread count.
   */
  async getUnreadCount(shopId: string, userId?: string) {
    const where: any = { shopId, isRead: false };
    if (userId) {
      where.OR = [{ userId }, { userId: null }];
    }
    return prisma.notification.count({ where });
  }

  /**
   * Generate low stock notifications.
   */
  async generateLowStockAlerts(shopId: string) {
    const lowStockProducts: any[] = await prisma.$queryRaw`
      SELECT p.id, p.name, p.sku, p.reorder_threshold,
        COALESCE(SUM(i.quantity), 0)::int as current_stock
      FROM products p
      LEFT JOIN inventory i ON i.product_id = p.id
      WHERE p.shop_id = ${shopId} AND p.is_active = true
      GROUP BY p.id
      HAVING COALESCE(SUM(i.quantity), 0) <= p.reorder_threshold
    `;

    const notifications = [];
    for (const product of lowStockProducts) {
      const notification = await this.create(
        shopId,
        'LOW_STOCK',
        `Low Stock: ${product.name}`,
        `${product.name} (SKU: ${product.sku || 'N/A'}) has only ${product.current_stock} units left. Reorder threshold: ${product.reorder_threshold}.`,
        { productId: product.id, currentStock: product.current_stock }
      );
      notifications.push(notification);
    }

    return notifications;
  }

  /**
   * Generate due reminder notifications with WhatsApp links.
   */
  async generateDueReminders(shopId: string) {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    const overdueLedgers = await prisma.creditLedger.findMany({
      where: {
        shopId,
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
        dueDate: { lte: new Date() },
      },
      include: { customer: true },
    });

    const reminders = [];
    for (const ledger of overdueLedgers) {
      if (!ledger.customer) continue;

      const whatsappMessage = `Hi ${ledger.customer.name}, this is a payment reminder from ${shop?.name || 'our store'}. Your outstanding amount is ₹${ledger.outstandingAmount.toFixed(2)}. Please settle at your earliest convenience. Thank you!`;

      const whatsappLink = ledger.customer.phone
        ? buildWhatsAppLink(ledger.customer.phone, whatsappMessage)
        : null;

      const notification = await this.create(
        shopId,
        'DUE_REMINDER',
        `Payment Due: ${ledger.customer.name}`,
        `₹${ledger.outstandingAmount.toFixed(2)} outstanding from ${ledger.customer.name}`,
        {
          customerId: ledger.customerId,
          creditLedgerId: ledger.id,
          outstandingAmount: ledger.outstandingAmount,
          whatsappLink,
        }
      );
      reminders.push(notification);
    }

    return reminders;
  }

  /**
   * Generate daily sales summary notification.
   */
  async generateDailySummary(shopId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const invoices = await prisma.invoice.findMany({
      where: {
        shopId,
        status: 'COMPLETED',
        createdAt: { gte: today },
      },
    });

    const totalOrders = invoices.length;
    const revenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    if (totalOrders > 0) {
      return this.create(
        shopId,
        'DAILY_SUMMARY',
        "Today's Sales Summary",
        `Total Orders: ${totalOrders}\nRevenue: ₹${revenue.toFixed(2)}`,
        { totalOrders, revenue },
        undefined,
        'sales',
        'LOW'
      );
    }
    return null;
  }
}
