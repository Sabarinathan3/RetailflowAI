import type { CreditStatus, PaymentMode } from './enums';
import type { Customer } from './customer.types';
import type { Invoice } from './billing.types';

// ── Core domain types ─────────────────────────────────────────────────────────

export interface CreditLedger {
  id: string;
  shopId: string;
  customerId: string;
  invoiceId: string | null;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: CreditStatus;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined relations
  customer?: Customer | null;
  invoice?: Pick<Invoice, 'id' | 'invoiceNumber' | 'totalAmount'> | null;
  payments?: CreditPayment[];
}

export interface CreditPayment {
  id: string;
  creditLedgerId: string;
  amount: number;
  paymentMode: string;
  notes: string | null;
  paidAt: string;
}

// ── Input types ───────────────────────────────────────────────────────────────

export interface AddCreditPaymentInput {
  amount: number;
  paymentMode: PaymentMode;
  notes?: string;
}

// ── Summary / analytics types ─────────────────────────────────────────────────

export interface CreditSummary {
  totalCredit: number;
  totalOutstanding: number;
  totalPaid: number;
  overdueCount: number;
  pendingCount: number;
  paidCount: number;
}
