import { calculateItemTax, calculateInvoiceGst } from '../../src/modules/billing/gst.helper';

describe('GST Helper', () => {
  describe('calculateItemTax', () => {
    it('should calculate tax correctly for a single item with no discount', () => {
      const result = calculateItemTax(100, 2, 18, 0);

      expect(result.unitPrice).toBe(100);
      expect(result.quantity).toBe(2);
      expect(result.baseAmount).toBe(200);
      expect(result.gstPercentage).toBe(18);
      expect(result.gstAmount).toBe(36);
      expect(result.totalPrice).toBe(236);
    });

    it('should calculate tax correctly with discount', () => {
      const result = calculateItemTax(100, 3, 12, 50);

      // base = 100*3 - 50 = 250
      expect(result.baseAmount).toBe(250);
      // gst = 250 * 12% = 30
      expect(result.gstAmount).toBe(30);
      // total = 250 + 30 = 280
      expect(result.totalPrice).toBe(280);
    });

    it('should handle zero GST', () => {
      const result = calculateItemTax(50, 1, 0, 0);

      expect(result.baseAmount).toBe(50);
      expect(result.gstAmount).toBe(0);
      expect(result.totalPrice).toBe(50);
    });

    it('should handle 5% GST correctly', () => {
      const result = calculateItemTax(24, 2, 5, 0);

      expect(result.baseAmount).toBe(48);
      expect(result.gstAmount).toBe(2.4);
      expect(result.totalPrice).toBe(50.4);
    });
  });

  describe('calculateInvoiceGst', () => {
    it('should split tax into CGST + SGST for intra-state', () => {
      const items = [
        { baseAmount: 200, gstAmount: 36, totalPrice: 236 },
        { baseAmount: 100, gstAmount: 12, totalPrice: 112 },
      ];

      const result = calculateInvoiceGst(items, false, 0);

      expect(result.subtotal).toBe(300);
      expect(result.taxAmount).toBe(48);
      expect(result.cgst).toBe(24);
      expect(result.sgst).toBe(24);
      expect(result.igst).toBe(0);
      expect(result.totalWithTax).toBe(348);
    });

    it('should use IGST for inter-state', () => {
      const items = [
        { baseAmount: 200, gstAmount: 36, totalPrice: 236 },
      ];

      const result = calculateInvoiceGst(items, true, 0);

      expect(result.cgst).toBe(0);
      expect(result.sgst).toBe(0);
      expect(result.igst).toBe(36);
    });

    it('should apply invoice-level discount', () => {
      const items = [
        { baseAmount: 1000, gstAmount: 180, totalPrice: 1180 },
      ];

      const result = calculateInvoiceGst(items, false, 10);

      // subtotal = 1000 - 10% = 900
      expect(result.subtotal).toBe(900);
      // tax = 180 * 90% = 162
      expect(result.taxAmount).toBe(162);
      expect(result.totalWithTax).toBe(1062);
    });

    it('should handle multiple items with mixed GST rates', () => {
      const items = [
        { baseAmount: 48, gstAmount: 2.4, totalPrice: 50.4 },     // 5%
        { baseAmount: 70, gstAmount: 8.4, totalPrice: 78.4 },     // 12%
        { baseAmount: 280, gstAmount: 33.6, totalPrice: 313.6 },  // 12%
        { baseAmount: 110, gstAmount: 19.8, totalPrice: 129.8 },  // 18%
      ];

      const result = calculateInvoiceGst(items, false, 0);

      expect(result.subtotal).toBe(508);
      expect(result.taxAmount).toBe(64.2);
      expect(result.cgst).toBe(32.1);
      expect(result.sgst).toBe(32.1);
      expect(result.totalWithTax).toBe(572.2);
    });
  });
});
