import {
  sendSuccess,
  parsePagination,
  buildPaginationMeta,
  generateInvoiceNumber,
  buildWhatsAppLink,
} from '../../src/common/helpers';

describe('Helpers', () => {
  describe('parsePagination', () => {
    it('should return defaults for empty query', () => {
      const result = parsePagination({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.skip).toBe(0);
    });

    it('should parse page and limit', () => {
      const result = parsePagination({ page: '3', limit: '10' });
      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.skip).toBe(20); // (3-1)*10
    });

    it('should clamp limit to max 100', () => {
      const result = parsePagination({ page: '1', limit: '500' });
      expect(result.limit).toBe(100);
    });

    it('should default to page 1 for invalid values', () => {
      const result = parsePagination({ page: '-1', limit: '0' });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(1);
    });
  });

  describe('buildPaginationMeta', () => {
    it('should calculate total pages correctly', () => {
      const meta = buildPaginationMeta(95, { page: 1, limit: 20, skip: 0 });
      expect(meta.total).toBe(95);
      expect(meta.totalPages).toBe(5); // ceil(95/20)
      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(20);
    });

    it('should handle zero results', () => {
      const meta = buildPaginationMeta(0, { page: 1, limit: 20, skip: 0 });
      expect(meta.total).toBe(0);
      expect(meta.totalPages).toBe(0);
    });
  });

  describe('generateInvoiceNumber', () => {
    it('should generate a string starting with the prefix', () => {
      const inv = generateInvoiceNumber('INV');
      expect(inv).toMatch(/^INV-\d{8}-[A-Z0-9]{6}$/);
    });

    it('should accept custom prefix', () => {
      const inv = generateInvoiceNumber('BILL');
      expect(inv.startsWith('BILL-')).toBe(true);
    });

    it('should generate unique numbers', () => {
      const inv1 = generateInvoiceNumber();
      const inv2 = generateInvoiceNumber();
      expect(inv1).not.toBe(inv2);
    });
  });

  describe('buildWhatsAppLink', () => {
    it('should generate valid wa.me link', () => {
      const link = buildWhatsAppLink('9876543210', 'Hello!');
      expect(link).toBe('https://wa.me/9876543210?text=Hello!');
    });

    it('should encode special characters', () => {
      const link = buildWhatsAppLink('9876543210', 'Amount: ₹100');
      expect(link).toContain('wa.me/9876543210');
      expect(link).toContain(encodeURIComponent('Amount: ₹100'));
    });

    it('should strip non-digit characters from phone', () => {
      const link = buildWhatsAppLink('+91-9876-543-210', 'Hi');
      expect(link).toBe('https://wa.me/919876543210?text=Hi');
    });
  });
});
