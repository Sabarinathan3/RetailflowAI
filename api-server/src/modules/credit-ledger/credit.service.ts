import { NotFoundError, BadRequestError } from '../../common/errors';
import { buildWhatsAppLink } from '../../common/helpers';
import { CreditRepository } from './credit.repository';
import { PaymentMode } from '@prisma/client';

export class CreditService {
  constructor(private repo: CreditRepository) {}

  async getById(id: string, shopId: string) {
    const ledger = await this.repo.findById(id, shopId);
    if (!ledger) throw new NotFoundError('Credit record');
    return ledger;
  }

  async getAll(shopId: string, page: number, limit: number, status?: string, customerId?: string, search?: string) {
    return this.repo.findAll(shopId, page, limit, status, customerId, search);
  }

  async getByCustomer(customerId: string, shopId: string, page: number, limit: number) {
    return this.repo.findByCustomer(customerId, shopId, page, limit);
  }

  async getOverdue(shopId: string) {
    await this.repo.markOverdue(shopId);
    return this.repo.findOverdue(shopId);
  }

  /**
   * Process payment using the Invoice ID instead of Credit Ledger ID natively.
   */
  async payByInvoiceId(invoiceId: string, shopId: string, amount: number, paymentMode: PaymentMode, notes?: string) {
    if (amount <= 0) throw new BadRequestError('Payment amount must be positive');
    
    // Find the credit ledger associated with this invoice ID
    const ledger = await this.repo.findByInvoiceId(invoiceId, shopId);
    if (!ledger) throw new NotFoundError('Credit record for this invoice');
    
    try {
      return await this.repo.addPayment(ledger.id, shopId, amount, paymentMode, notes);
    } catch (error: unknown) {
      if (error instanceof Error) throw new BadRequestError(error.message);
      throw new BadRequestError('Failed to record payment');
    }
  }

  /**
   * Process payment by Credit Ledger ID natively.
   */
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

  async generateReminderLink(id: string, shopId: string, shopName: string) {
    const ledger = await this.getById(id, shopId);
    if (!ledger.customer?.phone) throw new BadRequestError('Customer phone number not available');

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
