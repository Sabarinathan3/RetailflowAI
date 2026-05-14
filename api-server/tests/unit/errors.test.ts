import { AppError, NotFoundError, BadRequestError, UnauthorizedError, ForbiddenError, ConflictError, ValidationError, InsufficientStockError } from '../../src/common/errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with defaults', () => {
      const err = new AppError('Something went wrong');
      expect(err.message).toBe('Something went wrong');
      expect(err.statusCode).toBe(500);
      expect(err.code).toBe('INTERNAL_ERROR');
      expect(err.isOperational).toBe(true);
      expect(err instanceof Error).toBe(true);
    });

    it('should accept custom values', () => {
      const err = new AppError('Custom', 418, 'TEAPOT', false);
      expect(err.statusCode).toBe(418);
      expect(err.code).toBe('TEAPOT');
      expect(err.isOperational).toBe(false);
    });
  });

  describe('NotFoundError', () => {
    it('should default to 404 with resource name', () => {
      const err = new NotFoundError('Product');
      expect(err.message).toBe('Product not found');
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe('NOT_FOUND');
    });
  });

  describe('BadRequestError', () => {
    it('should be 400', () => {
      const err = new BadRequestError('Invalid input');
      expect(err.statusCode).toBe(400);
    });
  });

  describe('UnauthorizedError', () => {
    it('should be 401', () => {
      const err = new UnauthorizedError();
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Unauthorized');
    });
  });

  describe('ForbiddenError', () => {
    it('should be 403', () => {
      const err = new ForbiddenError('No access');
      expect(err.statusCode).toBe(403);
    });
  });

  describe('ConflictError', () => {
    it('should be 409', () => {
      const err = new ConflictError('Already exists');
      expect(err.statusCode).toBe(409);
    });
  });

  describe('ValidationError', () => {
    it('should include field errors', () => {
      const errors = { email: ['Invalid email format'], name: ['Required'] };
      const err = new ValidationError(errors);
      expect(err.statusCode).toBe(422);
      expect(err.errors).toEqual(errors);
    });
  });

  describe('InsufficientStockError', () => {
    it('should include stock details in message', () => {
      const err = new InsufficientStockError('Maggi', 5, 10);
      expect(err.message).toContain('Maggi');
      expect(err.message).toContain('5');
      expect(err.message).toContain('10');
      expect(err.statusCode).toBe(400);
    });
  });
});
