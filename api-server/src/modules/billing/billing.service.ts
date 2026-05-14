import { PaymentMode } from '@prisma/client';
import { BadRequestError, NotFoundError, InsufficientStockError } from '../../common/errors';
import { generateInvoiceNumber } from '../../common/helpers';
import { BillingRepository, CreateInvoiceData } from './billing.repository';
import { calculateItemTax, calculateInvoiceGst } from './gst.helper';
import { generateInvoicePdf } from './invoice_pdf.service';
import prisma from '../../config/db';
import { NotificationsService } from '../notifications/notifications.service';

const notificationsService = new NotificationsService();

interface CreateInvoiceInput {
  customerId?: string;
  paymentMode: PaymentMode;
  discountPercent?: number;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    discount?: number;
    batchNumber?: string;
  }>;
  paidAmount?: number;
}

export class BillingService {
  constructor(private repo: BillingRepository) {}

  async createInvoice(shopId: string, branchId: string, userId: string, input: CreateInvoiceInput) {
    // Validate items
    if (!input.items || input.items.length === 0) {
      throw new BadRequestError('Invoice must have at least one item');
    }

    // Credit payments require a customer
    if (input.paymentMode === 'CREDIT' && !input.customerId) {
      throw new BadRequestError('Customer is required for CREDIT payment');
    }

    // Fetch products and check stock
    const processedItems: CreateInvoiceData['items'] = [];
    const itemTaxes: Array<{ baseAmount: number; gstAmount: number; totalPrice: number }> = [];

    for (const item of input.items) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, shopId, isActive: true },
      });

      if (!product) {
        throw new NotFoundError(`Product ${item.productId}`);
      }

      // Check stock availability
      // Strategy: check the specific branch first; if zero, fall back to
      // ALL branches in the shop. This matches the POS UI which sums stock
      // across branches when no active branch is selected.
      let available = 0;
      let checkBranchId: string | null = branchId;

      if (item.batchNumber) {
        const inventory = await prisma.inventory.findFirst({
          where: { productId: item.productId, branchId, batchNumber: item.batchNumber },
        });
        available = inventory?.quantity || 0;
      } else {
        // Check stock in the specific branch first
        const branchInventories = await prisma.inventory.findMany({
          where: { productId: item.productId, branchId },
        });
        available = branchInventories.reduce((sum, inv) => sum + inv.quantity, 0);

        // If no stock in this branch, check ALL branches for the shop
        if (available === 0) {
          const allInventories = await prisma.inventory.findMany({
            where: {
              productId: item.productId,
              branch: { shopId },
            },
          });
          available = allInventories.reduce((sum, inv) => sum + inv.quantity, 0);
          // Signal that deduction should happen across all branches
          checkBranchId = null;
        }
      }

      if (available < item.quantity) {
        throw new InsufficientStockError(product.name, available, item.quantity);
      }

      // Calculate tax
      const tax = calculateItemTax(
        product.sellingPrice,
        item.quantity,
        product.gstPercentage,
        item.discount || 0
      );

      processedItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.sellingPrice,
        discount: item.discount || 0,
        gstPercentage: product.gstPercentage,
        gstAmount: tax.gstAmount,
        totalPrice: tax.totalPrice,
        batchNumber: item.batchNumber,
      });

      itemTaxes.push({
        baseAmount: tax.baseAmount,
        gstAmount: tax.gstAmount,
        totalPrice: tax.totalPrice,
      });
    }

    // Calculate invoice totals
    const gstBreakdown = calculateInvoiceGst(itemTaxes, false, input.discountPercent);
    const invoiceNumber = generateInvoiceNumber();
    const paidAmount = input.paymentMode === 'CREDIT'
      ? (input.paidAmount || 0)
      : gstBreakdown.totalWithTax;

    const invoiceData: CreateInvoiceData = {
      shopId,
      branchId,
      userId,
      customerId: input.customerId,
      invoiceNumber,
      paymentMode: input.paymentMode,
      discountPercent: input.discountPercent,
      discountAmount: gstBreakdown.subtotal * (input.discountPercent || 0) / 100,
      notes: input.notes,
      items: processedItems,
      subtotal: gstBreakdown.subtotal,
      taxAmount: gstBreakdown.taxAmount,
      cgst: gstBreakdown.cgst,
      sgst: gstBreakdown.sgst,
      igst: gstBreakdown.igst,
      totalAmount: gstBreakdown.totalWithTax,
      paidAmount,
    };

    const { invoice } = await this.repo.createInvoiceTransaction(invoiceData);

    // Return the invoice with its items for a clean, predictable API response shape
    const fullInvoice = await this.repo.findInvoiceById(invoice.id, shopId);

    // Generate Sale Completed Notification
    try {
      await notificationsService.create(
        shopId,
        'SALE_COMPLETED',
        'Sale Completed',
        `Invoice ${invoice.invoiceNumber} created for ₹${invoice.totalAmount.toFixed(2)}`,
        { invoiceId: invoice.id, amount: invoice.totalAmount },
        userId,
        'sales',
        'LOW'
      );
    } catch (error) {
      console.error('Failed to create sale completed notification:', error);
    }

    return fullInvoice!;
  }

  async getInvoice(id: string, shopId: string) {
    const invoice = await this.repo.findInvoiceById(id, shopId);
    if (!invoice) throw new NotFoundError('Invoice');
    return invoice;
  }

  async listInvoices(shopId: string, branchId: string, params: any) {
    return this.repo.findInvoices(shopId, branchId, params);
  }

  async refundInvoice(invoiceId: string, shopId: string, userId: string) {
    const invoice = await this.repo.findInvoiceById(invoiceId, shopId);
    if (!invoice) throw new NotFoundError('Invoice');
    if (invoice.status === 'REFUNDED') {
      throw new BadRequestError('Invoice already refunded');
    }
    return this.repo.refundInvoiceTransaction(invoiceId, shopId, userId);
  }

  async generatePdf(invoiceId: string, shopId: string) {
    const invoice = await this.repo.findInvoiceById(invoiceId, shopId);
    if (!invoice) throw new NotFoundError('Invoice');

    // Fetch shop info
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    const branch = await prisma.branch.findUnique({ where: { id: invoice.branchId } });

    return generateInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.createdAt,
      shopName: shop?.name || '',
      shopAddress: shop?.address || undefined,
      shopGst: shop?.gstNumber || undefined,
      shopPhone: shop?.phone || undefined,
      branchName: branch?.name || '',
      customerName: invoice.customer?.name,
      customerPhone: invoice.customer?.phone,
      items: invoice.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        gstPercentage: item.gstPercentage,
        gstAmount: item.gstAmount,
        totalPrice: item.totalPrice,
      })),
      subtotal: invoice.subtotal,
      discountAmount: invoice.discountAmount,
      cgst: invoice.cgst,
      sgst: invoice.sgst,
      igst: invoice.igst,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      paymentMode: invoice.paymentMode,
    });
  }
}
