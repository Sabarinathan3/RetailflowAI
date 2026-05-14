import prisma from '../../config/db';
import { Prisma, PaymentMode, CreditStatus } from '@prisma/client';

export class CreditRepository {
  async findById(id: string, shopId: string) {
    return prisma.creditLedger.findUnique({
      where: { id },
      include: { customer: true, invoice: true, payments: true },
    });
  }

  async findAll(shopId: string, page: number, limit: number, status?: string, customerId?: string, search?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.CreditLedgerWhereInput = { shopId };
    
    if (status) where.status = status as CreditStatus;
    if (customerId) where.customerId = customerId;
    if (search) {
      where.customer = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [ledgers, total] = await prisma.$transaction([
      prisma.creditLedger.findMany({
        where,
        include: { customer: true, invoice: true, payments: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.creditLedger.count({ where }),
    ]);
    return { ledgers, total };
  }

  async findByInvoiceId(invoiceId: string, shopId: string) {
    return prisma.creditLedger.findFirst({
      where: { invoiceId, shopId },
      include: { customer: true, invoice: true, payments: true },
    });
  }

  async findByCustomer(customerId: string, shopId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [ledgers, total] = await prisma.$transaction([
      prisma.creditLedger.findMany({
        where: { customerId, shopId },
        include: { invoice: true, payments: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.creditLedger.count({ where: { customerId, shopId } }),
    ]);
    return { ledgers, total };
  }

  async markOverdue(shopId: string) {
    const today = new Date();
    await prisma.creditLedger.updateMany({
      where: { shopId, status: { in: ['PENDING', 'PARTIAL'] }, dueDate: { lt: today } },
      data: { status: 'OVERDUE' },
    });
  }

  async findOverdue(shopId: string) {
    return prisma.creditLedger.findMany({
      where: { shopId, status: 'OVERDUE' },
      include: { customer: true, invoice: true },
      orderBy: { dueDate: 'asc' },
    });
  }

  async addPayment(ledgerId: string, shopId: string, amount: number, paymentMode: PaymentMode, notes?: string) {
    return prisma.$transaction(async (tx) => {
      const ledger = await tx.creditLedger.findUnique({ where: { id: ledgerId } });
      if (!ledger || ledger.shopId !== shopId) throw new Error('Credit ledger not found');
      
      if (amount > ledger.outstandingAmount) {
        throw new Error(`Amount cannot exceed outstanding balance of ₹${ledger.outstandingAmount}`);
      }

      const payment = await tx.creditPayment.create({
        data: { creditLedgerId: ledgerId, amount, paymentMode, notes },
      });

      const newPaidAmount = ledger.paidAmount + amount;
      const newOutstanding = ledger.outstandingAmount - amount;
      let newStatus = ledger.status;

      if (newOutstanding <= 0) {
        newStatus = 'PAID';
      } else if (newPaidAmount > 0) {
        newStatus = 'PARTIAL';
      }

      const updatedLedger = await tx.creditLedger.update({
        where: { id: ledgerId },
        data: {
          paidAmount: newPaidAmount,
          outstandingAmount: newOutstanding,
          status: newStatus,
        },
      });

      return { payment, ledger: updatedLedger };
    });
  }

  async getOutstandingTotal(shopId: string) {
    const result = await prisma.creditLedger.aggregate({
      where: { shopId, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
      _sum: { outstandingAmount: true },
    });
    return result._sum.outstandingAmount || 0;
  }
}
