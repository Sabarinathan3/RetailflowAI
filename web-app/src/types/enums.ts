export type Role = 'OWNER' | 'MANAGER' | 'CASHIER' | 'ADMIN';
export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'CREDIT';
export type InvoiceStatus = 'COMPLETED' | 'REFUNDED' | 'PARTIAL_REFUND';
export type StockAction = 'ADD' | 'ADJUST' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'SALE' | 'REFUND';
export type CreditStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
export type SubscriptionPlan = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CANCELLED';
export type PurchaseOrderStatus = 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
export type NotificationType =
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'DUE_REMINDER'
  | 'OVERDUE_PAYMENT'
  | 'SALE_COMPLETED'
  | 'BILLING_FAILURE'
  | 'INVENTORY_UPDATE'
  | 'PURCHASE_ORDER'
  | 'DAILY_SUMMARY'
  | 'SYSTEM'
  | 'PROMOTION';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
