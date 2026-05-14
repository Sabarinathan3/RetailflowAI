import prisma from '../../config/db';
import { CreditStatus, PaymentMode } from '@prisma/client';

export class CreditLedgerRepository {
  async findById(id: string, shopId: string) {
    return prisma.creditLedger.findFirst({
      where: { id, shopId },
      include: {
        customer: true,
        invoice: { select: { id: true, invoiceNumber: true, totalAmount: true } },
        payments: { orderBy: { paidAt: 'desc' } },
      },
    });
  }

  async findByCustomer(customerId: string, shopId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [ledgers, total] = await Promise.all([
      prisma.creditLedger.findMany({
        where: { customerId, shopId },
        include: {
          invoice: { select: { id: true, invoiceNumber: true } },
          payments: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.creditLedger.count({ where: { customerId, shopId } }),
    ]);
    return { ledgers, total };
  }

  async findPending(shopId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = { shopId, status: { in: ['PENDING' as CreditStatus, 'PARTIAL' as CreditStatus, 'OVERDUE' as CreditStatus] } };
    const [ledgers, total] = await Promise.all([
      prisma.creditLedger.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          invoice: { select: { id: true, invoiceNumber: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.creditLedger.count({ where }),
    ]);
    return { ledgers, total };
  }

  async findOverdue(shopId: string) {
    return prisma.creditLedger.findMany({
      where: {
        shopId,
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: { lt: new Date() },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        invoice: { select: { invoiceNumber: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async addPayment(ledgerId: string, shopId: string, amount: number, paymentMode: PaymentMode, notes?: string) {
    return prisma.$transaction(async (tx) => {
      const ledger = await tx.creditLedger.findFirst({
        where: { id: ledgerId, shopId },
      });

      if (!ledger) throw new Error('Credit ledger not found');
      if (ledger.status === 'PAID') throw new Error('This credit is already fully paid');

      const newPaidAmount = ledger.paidAmount + amount;
      const newOutstanding = ledger.totalAmount - newPaidAmount;

      let newStatus: CreditStatus;
      if (newOutstanding <= 0) {
        newStatus = 'PAID';
      } else if (newPaidAmount > 0) {
        newStatus = 'PARTIAL';
      } else {
        newStatus = ledger.status;
      }

      // Create payment record
      const payment = await tx.creditPayment.create({
        data: {
          creditLedgerId: ledgerId,
          amount,
          paymentMode,
          notes,
        },
      });

      // Update ledger
      const updated = await tx.creditLedger.update({
        where: { id: ledgerId },
        data: {
          paidAmount: newPaidAmount,
          outstandingAmount: Math.max(0, newOutstanding),
          status: newStatus,
        },
        include: { customer: true, payments: true },
      });

      return { ledger: updated, payment };
    });
  }

  async getOutstandingTotal(shopId: string) {
    const result = await prisma.creditLedger.aggregate({
      where: {
        shopId,
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
      },
      _sum: { outstandingAmount: true },
      _count: true,
    });
    return {
      totalOutstanding: result._sum.outstandingAmount || 0,
      count: result._count,
    };
  }

  async markOverdue(shopId: string) {
    return prisma.creditLedger.updateMany({
      where: {
        shopId,
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: { lt: new Date() },
      },
      data: { status: 'OVERDUE' },
    });
  }
}
