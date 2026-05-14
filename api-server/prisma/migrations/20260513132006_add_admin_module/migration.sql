-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'MANAGER', 'CASHIER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER');

-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('USER_VIEW', 'USER_CREATE', 'USER_EDIT', 'USER_DELETE', 'BRANCH_VIEW', 'BRANCH_CREATE', 'BRANCH_EDIT', 'BRANCH_DELETE', 'PRODUCT_VIEW', 'PRODUCT_CREATE', 'PRODUCT_EDIT', 'PRODUCT_DELETE', 'INVENTORY_VIEW', 'INVENTORY_EDIT', 'INVENTORY_TRANSFER', 'ORDER_VIEW', 'ORDER_EDIT', 'ORDER_APPROVE', 'ORDER_CANCEL', 'SUPPLIER_VIEW', 'SUPPLIER_CREATE', 'SUPPLIER_EDIT', 'SUPPLIER_DELETE', 'REPORTS_VIEW', 'ANALYTICS_VIEW', 'EXPORT_DATA', 'ADMIN_SETTINGS', 'AUDIT_LOGS_VIEW', 'SYSTEM_SETTINGS', 'NOTIFICATIONS_MANAGE', 'BILLING_VIEW', 'BILLING_MANAGE');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'UPI', 'CARD', 'CREDIT');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('COMPLETED', 'REFUNDED', 'PARTIAL_REFUND');

-- CreateEnum
CREATE TYPE "StockAction" AS ENUM ('ADD', 'ADJUST', 'TRANSFER_IN', 'TRANSFER_OUT', 'SALE', 'REFUND');

-- CreateEnum
CREATE TYPE "CreditStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'BASIC', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LOW_STOCK', 'OUT_OF_STOCK', 'DUE_REMINDER', 'OVERDUE_PAYMENT', 'SALE_COMPLETED', 'BILLING_FAILURE', 'INVENTORY_UPDATE', 'PURCHASE_ORDER', 'DAILY_SUMMARY', 'SYSTEM', 'PROMOTION');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "shops" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "gst_number" TEXT,
    "pan" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "logo_url" TEXT,
    "tax_enabled" BOOLEAN NOT NULL DEFAULT true,
    "default_tax_rate" DOUBLE PRECISION NOT NULL DEFAULT 18.0,
    "subscription_plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "subscription_expiry" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "feature_flags" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "is_main" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "printer_config" JSONB,
    "tax_settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password" TEXT,
    "pin" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CASHIER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "barcode" TEXT,
    "category" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "purchase_price" DOUBLE PRECISION NOT NULL,
    "selling_price" DOUBLE PRECISION NOT NULL,
    "mrp" DOUBLE PRECISION,
    "gst_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hsn_code" TEXT,
    "reorder_threshold" INTEGER NOT NULL DEFAULT 10,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "batch_number" TEXT,
    "expiry_date" TIMESTAMP(3),
    "cost_price" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_logs" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "action" "StockAction" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previous_qty" INTEGER NOT NULL,
    "new_qty" INTEGER NOT NULL,
    "batch_number" TEXT,
    "reason" TEXT,
    "reference_id" TEXT,
    "performed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfers" (
    "id" TEXT NOT NULL,
    "from_branch_id" TEXT NOT NULL,
    "to_branch_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "batch_number" TEXT,
    "notes" TEXT,
    "transferred_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "customer_id" TEXT,
    "user_id" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "discount_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount_percent" DOUBLE PRECISION,
    "tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payment_mode" "PaymentMode" NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gst_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gst_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_price" DOUBLE PRECISION NOT NULL,
    "batch_number" TEXT,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "loyalty_points" INTEGER NOT NULL DEFAULT 0,
    "total_spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_ledgers" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outstanding_amount" DOUBLE PRECISION NOT NULL,
    "due_date" TIMESTAMP(3),
    "status" "CreditStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_payments" (
    "id" TEXT NOT NULL,
    "credit_ledger_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_mode" "PaymentMode" NOT NULL,
    "notes" TEXT,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "gst_number" TEXT,
    "lead_time_days" INTEGER,
    "rating" DOUBLE PRECISION DEFAULT 5.0,
    "ai_risk_status" TEXT NOT NULL DEFAULT 'LOW',
    "tags" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "expected_date" TIMESTAMP(3),
    "received_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "received_qty" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_ledgers" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "purchase_order_id" TEXT,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outstanding_amount" DOUBLE PRECISION NOT NULL,
    "due_date" TIMESTAMP(3),
    "status" "CreditStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_payments" (
    "id" TEXT NOT NULL,
    "supplier_ledger_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_mode" "PaymentMode" NOT NULL,
    "reference_number" TEXT,
    "notes" TEXT,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'system',
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_predictions" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "input_data" JSONB,
    "prediction" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION,
    "cached_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_snapshots" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "date" DATE NOT NULL,
    "metric" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'MANAGER',
    "permissions" "Permission"[] DEFAULT ARRAY[]::"Permission"[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "last_activity_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "refresh_expires_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "user_agent" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_activity_logs" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" TEXT,
    "description" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "status" TEXT NOT NULL DEFAULT 'success',
    "error_message" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_audits" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT,
    "eventType" TEXT NOT NULL,
    "entity" TEXT,
    "entity_id" TEXT,
    "changes" JSONB,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "message" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "users_shop_id_idx" ON "users"("shop_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_shop_id_key" ON "users"("email", "shop_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_shop_id_key" ON "users"("phone", "shop_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "products_shop_id_idx" ON "products"("shop_id");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_shop_id_key" ON "products"("sku", "shop_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_shop_id_key" ON "products"("barcode", "shop_id");

-- CreateIndex
CREATE INDEX "inventory_branch_id_idx" ON "inventory"("branch_id");

-- CreateIndex
CREATE INDEX "inventory_product_id_idx" ON "inventory"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_product_id_branch_id_batch_number_key" ON "inventory"("product_id", "branch_id", "batch_number");

-- CreateIndex
CREATE INDEX "inventory_logs_shop_id_idx" ON "inventory_logs"("shop_id");

-- CreateIndex
CREATE INDEX "inventory_logs_branch_id_idx" ON "inventory_logs"("branch_id");

-- CreateIndex
CREATE INDEX "inventory_logs_product_id_idx" ON "inventory_logs"("product_id");

-- CreateIndex
CREATE INDEX "inventory_logs_created_at_idx" ON "inventory_logs"("created_at");

-- CreateIndex
CREATE INDEX "stock_transfers_from_branch_id_idx" ON "stock_transfers"("from_branch_id");

-- CreateIndex
CREATE INDEX "stock_transfers_to_branch_id_idx" ON "stock_transfers"("to_branch_id");

-- CreateIndex
CREATE INDEX "invoices_shop_id_idx" ON "invoices"("shop_id");

-- CreateIndex
CREATE INDEX "invoices_branch_id_idx" ON "invoices"("branch_id");

-- CreateIndex
CREATE INDEX "invoices_customer_id_idx" ON "invoices"("customer_id");

-- CreateIndex
CREATE INDEX "invoices_created_at_idx" ON "invoices"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_shop_id_key" ON "invoices"("invoice_number", "shop_id");

-- CreateIndex
CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items"("invoice_id");

-- CreateIndex
CREATE INDEX "invoice_items_product_id_idx" ON "invoice_items"("product_id");

-- CreateIndex
CREATE INDEX "customers_shop_id_idx" ON "customers"("shop_id");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_shop_id_key" ON "customers"("phone", "shop_id");

-- CreateIndex
CREATE INDEX "credit_ledgers_shop_id_idx" ON "credit_ledgers"("shop_id");

-- CreateIndex
CREATE INDEX "credit_ledgers_customer_id_idx" ON "credit_ledgers"("customer_id");

-- CreateIndex
CREATE INDEX "credit_ledgers_status_idx" ON "credit_ledgers"("status");

-- CreateIndex
CREATE INDEX "credit_payments_credit_ledger_id_idx" ON "credit_payments"("credit_ledger_id");

-- CreateIndex
CREATE INDEX "suppliers_shop_id_idx" ON "suppliers"("shop_id");

-- CreateIndex
CREATE INDEX "purchase_orders_shop_id_idx" ON "purchase_orders"("shop_id");

-- CreateIndex
CREATE INDEX "purchase_orders_supplier_id_idx" ON "purchase_orders"("supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_order_number_shop_id_key" ON "purchase_orders"("order_number", "shop_id");

-- CreateIndex
CREATE INDEX "purchase_order_items_purchase_order_id_idx" ON "purchase_order_items"("purchase_order_id");

-- CreateIndex
CREATE INDEX "supplier_ledgers_shop_id_idx" ON "supplier_ledgers"("shop_id");

-- CreateIndex
CREATE INDEX "supplier_ledgers_supplier_id_idx" ON "supplier_ledgers"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_ledgers_status_idx" ON "supplier_ledgers"("status");

-- CreateIndex
CREATE INDEX "supplier_payments_supplier_ledger_id_idx" ON "supplier_payments"("supplier_ledger_id");

-- CreateIndex
CREATE INDEX "notifications_shop_id_idx" ON "notifications"("shop_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "ai_predictions_shop_id_idx" ON "ai_predictions"("shop_id");

-- CreateIndex
CREATE INDEX "ai_predictions_type_idx" ON "ai_predictions"("type");

-- CreateIndex
CREATE INDEX "ai_predictions_created_at_idx" ON "ai_predictions"("created_at");

-- CreateIndex
CREATE INDEX "analytics_snapshots_shop_id_idx" ON "analytics_snapshots"("shop_id");

-- CreateIndex
CREATE INDEX "analytics_snapshots_date_idx" ON "analytics_snapshots"("date");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_snapshots_shop_id_branch_id_date_metric_key" ON "analytics_snapshots"("shop_id", "branch_id", "date", "metric");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_phone_key" ON "admin_users"("phone");

-- CreateIndex
CREATE INDEX "admin_users_role_idx" ON "admin_users"("role");

-- CreateIndex
CREATE INDEX "admin_users_is_active_idx" ON "admin_users"("is_active");

-- CreateIndex
CREATE INDEX "admin_users_created_at_idx" ON "admin_users"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_token_key" ON "admin_sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_refresh_token_key" ON "admin_sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "admin_sessions_admin_user_id_idx" ON "admin_sessions"("admin_user_id");

-- CreateIndex
CREATE INDEX "admin_sessions_token_idx" ON "admin_sessions"("token");

-- CreateIndex
CREATE INDEX "admin_sessions_refresh_token_idx" ON "admin_sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "admin_sessions_expires_at_idx" ON "admin_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "admin_activity_logs_admin_user_id_idx" ON "admin_activity_logs"("admin_user_id");

-- CreateIndex
CREATE INDEX "admin_activity_logs_action_idx" ON "admin_activity_logs"("action");

-- CreateIndex
CREATE INDEX "admin_activity_logs_resource_idx" ON "admin_activity_logs"("resource");

-- CreateIndex
CREATE INDEX "admin_activity_logs_created_at_idx" ON "admin_activity_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "admin_settings_key_key" ON "admin_settings"("key");

-- CreateIndex
CREATE INDEX "admin_settings_category_idx" ON "admin_settings"("category");

-- CreateIndex
CREATE INDEX "admin_settings_key_idx" ON "admin_settings"("key");

-- CreateIndex
CREATE INDEX "system_audits_admin_user_id_idx" ON "system_audits"("admin_user_id");

-- CreateIndex
CREATE INDEX "system_audits_eventType_idx" ON "system_audits"("eventType");

-- CreateIndex
CREATE INDEX "system_audits_severity_idx" ON "system_audits"("severity");

-- CreateIndex
CREATE INDEX "system_audits_created_at_idx" ON "system_audits"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_shop_id_idx" ON "audit_logs"("shop_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_from_branch_id_fkey" FOREIGN KEY ("from_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_to_branch_id_fkey" FOREIGN KEY ("to_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_ledgers" ADD CONSTRAINT "credit_ledgers_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_ledgers" ADD CONSTRAINT "credit_ledgers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_ledgers" ADD CONSTRAINT "credit_ledgers_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_payments" ADD CONSTRAINT "credit_payments_credit_ledger_id_fkey" FOREIGN KEY ("credit_ledger_id") REFERENCES "credit_ledgers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_ledgers" ADD CONSTRAINT "supplier_ledgers_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_ledgers" ADD CONSTRAINT "supplier_ledgers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_ledgers" ADD CONSTRAINT "supplier_ledgers_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_supplier_ledger_id_fkey" FOREIGN KEY ("supplier_ledger_id") REFERENCES "supplier_ledgers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_predictions" ADD CONSTRAINT "ai_predictions_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "admin_activity_logs_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
