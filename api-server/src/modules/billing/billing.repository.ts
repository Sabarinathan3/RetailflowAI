import prisma from '../../config/db';
import { PaymentMode, InvoiceStatus, StockAction } from '@prisma/client';

export interface CreateInvoiceData {
  shopId: string;
  branchId: string;
  userId: string;
  customerId?: string;
  invoiceNumber: string;
  paymentMode: PaymentMode;
  discountPercent?: number;
  discountAmount: number;
  notes?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    gstPercentage: number;
    gstAmount: number;
    totalPrice: number;
    batchNumber?: string;
  }>;
  subtotal: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  paidAmount: number;
}

export class BillingRepository {
  /**
   * Creates an invoice inside a Prisma transaction:
   * 1. Create Invoice record
   * 2. Create InvoiceItem records
   * 3. Update Inventory (deduct stock)
   * 4. Create InventoryLog entries
   * 5. Create CreditLedger if payment mode is CREDIT
   * 6. Update customer total_spent and loyalty_points
   */
  async createInvoiceTransaction(data: CreateInvoiceData) {
    return prisma.$transaction(async (tx) => {
      // 1. Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          shopId: data.shopId,
          branchId: data.branchId,
          userId: data.userId,
          invoiceNumber: data.invoiceNumber,
          customerId: data.customerId || null,
          paymentMode: data.paymentMode,
          subtotal: data.subtotal,
          discountAmount: data.discountAmount,
          discountPercent: data.discountPercent,
          taxAmount: data.taxAmount,
          cgst: data.cgst,
          sgst: data.sgst,
          igst: data.igst,
          totalAmount: data.totalAmount,
          paidAmount: data.paidAmount,
          notes: data.notes,
          status: 'COMPLETED',
        },
      });

      // 2. Create Invoice Items
      const invoiceItems = await Promise.all(
        data.items.map((item) =>
          tx.invoiceItem.create({
            data: {
              invoiceId: invoice.id,
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              gstPercentage: item.gstPercentage,
              gstAmount: item.gstAmount,
              totalPrice: item.totalPrice,
              batchNumber: item.batchNumber,
            },
          })
        )
      );

      // 3 & 4. Update Inventory + Create Logs
      for (const item of data.items) {
        let qtyToDeduct = item.quantity;

        if (item.batchNumber) {
          const inventory = await tx.inventory.findFirst({
            where: { productId: item.productId, branchId: data.branchId, batchNumber: item.batchNumber },
          });

          const previousQty = inventory?.quantity || 0;
          const newQty = previousQty - item.quantity;

          if (inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: { quantity: newQty },
            });
          } else {
            await tx.inventory.create({
              data: {
                productId: item.productId,
                branchId: data.branchId,
                quantity: -item.quantity,
                batchNumber: item.batchNumber,
              },
            });
          }

          await tx.inventoryLog.create({
            data: {
              shopId: data.shopId,
              branchId: data.branchId,
              productId: item.productId,
              action: 'SALE' as StockAction,
              quantity: item.quantity,
              previousQty,
              newQty,
              batchNumber: item.batchNumber,
              referenceId: invoice.id,
              performedBy: data.userId,
            },
          });
        } else {
          // No batch number provided: deduct from oldest batches first
          const inventories = await tx.inventory.findMany({
            where: { productId: item.productId, branchId: data.branchId },
            orderBy: { createdAt: 'asc' },
          });

          for (const inv of inventories) {
            if (qtyToDeduct <= 0) break;
            
            const availableInBatch = inv.quantity;
            if (availableInBatch <= 0) continue;

            const deduct = Math.min(availableInBatch, qtyToDeduct);
            
            await tx.inventory.update({
              where: { id: inv.id },
              data: { quantity: inv.quantity - deduct },
            });

            await tx.inventoryLog.create({
              data: {
                shopId: data.shopId,
                branchId: data.branchId,
                productId: item.productId,
                action: 'SALE' as StockAction,
                quantity: deduct,
                previousQty: inv.quantity,
                newQty: inv.quantity - deduct,
                batchNumber: inv.batchNumber,
                referenceId: invoice.id,
                performedBy: data.userId,
              },
            });

            qtyToDeduct -= deduct;
          }

          // If still remaining (edge case: negative stock)
          if (qtyToDeduct > 0) {
            const firstInv = inventories[0];
            if (firstInv) {
              await tx.inventory.update({
                where: { id: firstInv.id },
                data: { quantity: firstInv.quantity - qtyToDeduct },
              });
              await tx.inventoryLog.create({
                data: {
                  shopId: data.shopId,
                  branchId: data.branchId,
                  productId: item.productId,
                  action: 'SALE' as StockAction,
                  quantity: qtyToDeduct,
                  previousQty: firstInv.quantity,
                  newQty: firstInv.quantity - qtyToDeduct,
                  batchNumber: firstInv.batchNumber,
                  referenceId: invoice.id,
                  performedBy: data.userId,
                },
              });
            } else {
              await tx.inventory.create({
                data: {
                  productId: item.productId,
                  branchId: data.branchId,
                  quantity: -qtyToDeduct,
                  batchNumber: null,
                },
              });
            }
          }
        }
      }

      // 5. Create CreditLedger if payment mode is CREDIT
      let creditLedger = null;
      if (data.paymentMode === 'CREDIT' && data.customerId) {
        const outstanding = data.totalAmount - data.paidAmount;
        creditLedger = await tx.creditLedger.create({
          data: {
            shopId: data.shopId,
            customerId: data.customerId,
            invoiceId: invoice.id,
            totalAmount: data.totalAmount,
            paidAmount: data.paidAmount,
            outstandingAmount: outstanding,
            status: data.paidAmount >= data.totalAmount ? 'PAID' : 'PENDING',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });
      }

      // 6. Update customer stats
      if (data.customerId) {
        const loyaltyPoints = Math.floor(data.totalAmount / 100); // 1 point per ₹100
        await tx.customer.update({
          where: { id: data.customerId },
          data: {
            totalSpent: { increment: data.totalAmount },
            loyaltyPoints: { increment: loyaltyPoints },
          },
        });
      }

      return { invoice, invoiceItems, creditLedger };
    });
  }

  /**
   * Refund an invoice — reverses stock and updates status.
   */
  async refundInvoiceTransaction(invoiceId: string, shopId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, shopId },
        include: { items: true },
      });

      if (!invoice) throw new Error('Invoice not found');
      if (invoice.status === 'REFUNDED') throw new Error('Invoice already refunded');

      // Reverse stock for each item
      for (const item of invoice.items) {
        const inventory = await tx.inventory.findFirst({
          where: {
            productId: item.productId,
            branchId: invoice.branchId,
            batchNumber: item.batchNumber || null,
          },
        });

        const previousQty = inventory?.quantity || 0;
        const newQty = previousQty + item.quantity;

        if (inventory) {
          await tx.inventory.update({
            where: { id: inventory.id },
            data: { quantity: newQty },
          });
        } else {
          await tx.inventory.create({
            data: {
              productId: item.productId,
              branchId: invoice.branchId,
              quantity: item.quantity,
              batchNumber: item.batchNumber,
            },
          });
        }

        await tx.inventoryLog.create({
          data: {
            shopId,
            branchId: invoice.branchId,
            productId: item.productId,
            action: 'REFUND' as StockAction,
            quantity: item.quantity,
            previousQty,
            newQty,
            batchNumber: item.batchNumber,
            referenceId: invoice.id,
            performedBy: userId,
            reason: 'Invoice refund',
          },
        });
      }

      // Update invoice status
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: 'REFUNDED' as InvoiceStatus },
      });

      // Update credit ledger if exists
      if (invoice.paymentMode === 'CREDIT') {
        await tx.creditLedger.updateMany({
          where: { invoiceId },
          data: { status: 'PAID', outstandingAmount: 0 },
        });
      }

      // Reverse customer stats
      if (invoice.customerId) {
        const loyaltyPoints = Math.floor(invoice.totalAmount / 100);
        await tx.customer.update({
          where: { id: invoice.customerId },
          data: {
            totalSpent: { decrement: invoice.totalAmount },
            loyaltyPoints: { decrement: loyaltyPoints },
          },
        });
      }

      return updatedInvoice;
    });
  }

  async findInvoiceById(id: string, shopId: string) {
    return prisma.invoice.findFirst({
      where: { id, shopId },
      include: {
        items: { include: { product: true } },
        customer: true,
        user: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async findInvoices(shopId: string, branchId: string, params: {
    page: number;
    limit: number;
    startDate?: Date;
    endDate?: Date;
    customerId?: string;
    paymentMode?: PaymentMode;
  }) {
    const skip = (params.page - 1) * params.limit;
    const where: any = { shopId, branchId };

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }
    if (params.customerId) where.customerId = params.customerId;
    if (params.paymentMode) where.paymentMode = params.paymentMode;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: params.limit,
        include: {
          items: true,
          customer: { select: { id: true, name: true, phone: true } },
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    return { invoices, total };
  }
}
