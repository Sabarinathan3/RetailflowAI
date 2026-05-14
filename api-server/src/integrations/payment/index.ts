// Payment gateway integration stub
// Replace with actual payment provider (Razorpay, PayU, etc.) when ready

import { logger } from '../../config/logger';

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  description?: string;
}

export interface PaymentResponse {
  paymentId: string;
  orderId: string;
  status: 'success' | 'pending' | 'failed';
  amount: number;
  gateway: string;
}

/**
 * Create a payment order. Currently a stub.
 */
export async function createPaymentOrder(request: PaymentRequest): Promise<PaymentResponse> {
  logger.info(`[PAYMENT] Payment order stub: ₹${request.amount} for order ${request.orderId}`);

  return {
    paymentId: `pay_stub_${Date.now()}`,
    orderId: request.orderId,
    status: 'success',
    amount: request.amount,
    gateway: 'stub',
  };
}

/**
 * Verify payment status. Currently a stub.
 */
export async function verifyPayment(paymentId: string): Promise<PaymentResponse> {
  logger.info(`[PAYMENT] Payment verification stub: ${paymentId}`);

  return {
    paymentId,
    orderId: 'order_stub',
    status: 'success',
    amount: 0,
    gateway: 'stub',
  };
}
