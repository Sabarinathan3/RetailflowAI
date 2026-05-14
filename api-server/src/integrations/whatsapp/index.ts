import { buildWhatsAppLink } from '../../common/helpers';
import { logger } from '../../config/logger';

/**
 * Generate WhatsApp message link for various use cases.
 */
export function createDueReminderLink(phone: string, customerName: string, amount: number, shopName: string): string {
  const message = `Hi ${customerName},\n\nThis is a payment reminder from ${shopName}.\nOutstanding Amount: ₹${amount.toFixed(2)}\n\nPlease settle your dues at your earliest convenience.\n\nThank you!`;
  return buildWhatsAppLink(phone, message);
}

export function createInvoiceLink(phone: string, customerName: string, invoiceNumber: string, amount: number, shopName: string): string {
  const message = `Hi ${customerName},\n\nThank you for shopping at ${shopName}!\nInvoice: ${invoiceNumber}\nTotal: ₹${amount.toFixed(2)}\n\nVisit us again!`;
  return buildWhatsAppLink(phone, message);
}

export function createLowStockAlertLink(phone: string, managerName: string, productName: string, currentStock: number): string {
  const message = `Hi ${managerName},\n\n⚠️ Low Stock Alert!\nProduct: ${productName}\nCurrent Stock: ${currentStock} units\n\nPlease reorder soon.`;
  return buildWhatsAppLink(phone, message);
}
