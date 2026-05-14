import { NotFoundError, BadRequestError } from '../../common/errors';
import { buildWhatsAppLink } from '../../common/helpers';
import { CreditLedgerRepository } from './credit-ledger.repository';
import { PaymentMode } from '@prisma/client';

export class CreditLedgerService {
  constructor(private repo: CreditLedgerRepository) {}

  async getById(id: string, shopId: string) {
    const ledger = await this.repo.findById(id, shopId);
    if (!ledger) throw new NotFoundError('Credit record');
    return ledger;
  }

  async getByCustomer(customerId: string, shopId: string, page: number, limit: number) {
    return this.repo.findByCustomer(customerId, shopId, page, limit);
  }

  async getPending(shopId: string, page: number, limit: number) {
    return this.repo.findPending(shopId, page, limit);
  }

  async getOverdue(shopId: string) {
    // Auto-mark overdue entries first
    await this.repo.markOverdue(shopId);
    return this.repo.findOverdue(shopId);
  }

  async addPayment(ledgerId: string, shopId: string, amount: number, paymentMode: PaymentMode, notes?: string) {
    if (amount <= 0) throw new BadRequestError('Payment amount must be positive');
    try {
      return await this.repo.addPayment(ledgerId, shopId, amount, paymentMode, notes);
    } catch (error: unknown) {
      if (error instanceof Error) throw new BadRequestError(error.message);
      throw new BadRequestError('Failed to record payment');
    }
  }

  async getOutstandingTotal(shopId: string) {
    return this.repo.getOutstandingTotal(shopId);
  }

  /**
   * Generate a WhatsApp reminder link for a credit entry.
   */
  async generateReminderLink(id: string, shopId: string, shopName: string) {
    const ledger = await this.getById(id, shopId);
    if (!ledger.customer?.phone) {
      throw new BadRequestError('Customer phone number not available');
    }

    const message = `Hi ${ledger.customer.name},\n\n` +
      `This is a payment reminder from ${shopName}.\n` +
      `Outstanding Amount: ₹${ledger.outstandingAmount.toFixed(2)}\n` +
      (ledger.dueDate ? `Due Date: ${ledger.dueDate.toLocaleDateString('en-IN')}\n` : '') +
      `\nPlease settle your dues at your earliest convenience.\n\nThank you!`;

    return {
      whatsappLink: buildWhatsAppLink(ledger.customer.phone, message),
      customerName: ledger.customer.name,
      customerPhone: ledger.customer.phone,
      outstandingAmount: ledger.outstandingAmount,
    };
  }
}
