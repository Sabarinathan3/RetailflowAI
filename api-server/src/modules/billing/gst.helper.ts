/**
 * GST Helper — computes tax breakdowns for invoices
 */

export interface GstBreakdown {
  subtotal: number;      // pre-tax amount
  cgst: number;          // Central GST
  sgst: number;          // State GST
  igst: number;          // Integrated GST (for inter-state)
  taxAmount: number;     // total tax
  totalWithTax: number;  // subtotal + tax
}

export interface ItemTax {
  unitPrice: number;
  quantity: number;
  gstPercentage: number;
  discount: number;   // flat discount on item total
  baseAmount: number;
  gstAmount: number;
  totalPrice: number;
}

/**
 * Calculate GST for a single item.
 */
export function calculateItemTax(
  unitPrice: number,
  quantity: number,
  gstPercentage: number,
  discount: number = 0
): ItemTax {
  const baseAmount = unitPrice * quantity - discount;
  const gstAmount = (baseAmount * gstPercentage) / 100;
  const totalPrice = baseAmount + gstAmount;

  return {
    unitPrice,
    quantity,
    gstPercentage,
    discount,
    baseAmount: round2(baseAmount),
    gstAmount: round2(gstAmount),
    totalPrice: round2(totalPrice),
  };
}

/**
 * Calculate total GST breakdown for an invoice.
 * Splits tax into CGST + SGST equally (intra-state).
 * For inter-state, uses IGST.
 */
export function calculateInvoiceGst(
  items: Array<{ baseAmount: number; gstAmount: number; totalPrice: number }>,
  isInterState: boolean = false,
  discountPercent: number = 0
): GstBreakdown {
  let subtotal = items.reduce((sum, item) => sum + item.baseAmount, 0);
  let taxAmount = items.reduce((sum, item) => sum + item.gstAmount, 0);

  // Apply invoice-level discount
  if (discountPercent > 0) {
    const discountAmount = (subtotal * discountPercent) / 100;
    subtotal -= discountAmount;
    taxAmount = (taxAmount * (100 - discountPercent)) / 100;
  }

  const cgst = isInterState ? 0 : round2(taxAmount / 2);
  const sgst = isInterState ? 0 : round2(taxAmount / 2);
  const igst = isInterState ? round2(taxAmount) : 0;

  return {
    subtotal: round2(subtotal),
    cgst,
    sgst,
    igst,
    taxAmount: round2(taxAmount),
    totalWithTax: round2(subtotal + taxAmount),
  };
}

function round2(num: number): number {
  return Math.round(num * 100) / 100;
}
