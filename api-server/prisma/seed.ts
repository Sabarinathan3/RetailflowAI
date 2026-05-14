import { PrismaClient, Role, Permission, AdminRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.adminActivityLog.deleteMany();
  await prisma.adminSession.deleteMany();
  await prisma.systemAudit.deleteMany();
  await prisma.adminSettings.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.analyticsSnapshot.deleteMany();
  await prisma.aiPrediction.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.creditPayment.deleteMany();
  await prisma.creditLedger.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.stockTransfer.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.shop.deleteMany();

  // ── Create Shop ──
  const shop = await prisma.shop.create({
    data: {
      name: 'SuperMart India',
      email: 'owner@supermart.in',
      phone: '9876543210',
      gstNumber: '29AABCT1332L1ZN',
      address: '123 MG Road, Bengaluru',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      taxEnabled: true,
      defaultTaxRate: 18,
      subscriptionPlan: 'PRO',
      subscriptionStatus: 'ACTIVE',
    },
  });

  console.log(`  ✅ Shop created: ${shop.name}`);

  // ── Create Branches ──
  const mainBranch = await prisma.branch.create({
    data: {
      shopId: shop.id,
      name: 'Main Branch - MG Road',
      address: '123 MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      isMain: true,
      printerConfig: { type: 'thermal', width: 80 },
      taxSettings: { enabled: true, defaultRate: 18, includeInPrice: false },
    },
  });

  const secondBranch = await prisma.branch.create({
    data: {
      shopId: shop.id,
      name: 'Branch 2 - Indiranagar',
      address: '456 12th Main',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      isMain: false,
    },
  });

  console.log(`  ✅ Branches created: ${mainBranch.name}, ${secondBranch.name}`);

  // ── Create Users ──
  const hashedPassword = await bcrypt.hash('password123', 12);
  const hashedPin = await bcrypt.hash('1234', 12);

  const owner = await prisma.user.create({
    data: {
      shopId: shop.id,
      branchId: mainBranch.id,
      name: 'Rajesh Kumar',
      email: 'owner@supermart.in',
      phone: '9876543210',
      password: hashedPassword,
      role: 'OWNER',
    },
  });

  const manager = await prisma.user.create({
    data: {
      shopId: shop.id,
      branchId: mainBranch.id,
      name: 'Priya Sharma',
      email: 'manager@supermart.in',
      phone: '9876543211',
      password: hashedPassword,
      role: 'MANAGER',
    },
  });

  const cashier = await prisma.user.create({
    data: {
      shopId: shop.id,
      branchId: mainBranch.id,
      name: 'Amit Singh',
      phone: '9876543212',
      pin: hashedPin,
      role: 'CASHIER',
    },
  });

  console.log(`  ✅ Users created: ${owner.name} (OWNER), ${manager.name} (MANAGER), ${cashier.name} (CASHIER)`);

  // ── Create Products ──
  const products = await Promise.all([
    prisma.product.create({
      data: {
        shopId: shop.id,
        name: 'Tata Salt 1kg',
        sku: 'SALT-001',
        barcode: '8901030701000',
        category: 'Grocery',
        unit: 'pcs',
        purchasePrice: 18,
        sellingPrice: 24,
        mrp: 28,
        gstPercentage: 5,
        hsnCode: '2501',
        reorderThreshold: 20,
      },
    }),
    prisma.product.create({
      data: {
        shopId: shop.id,
        name: 'Maggi Noodles 70g',
        sku: 'MAG-001',
        barcode: '8901088001456',
        category: 'Grocery',
        unit: 'pcs',
        purchasePrice: 10,
        sellingPrice: 14,
        mrp: 14,
        gstPercentage: 12,
        hsnCode: '1902',
        reorderThreshold: 50,
      },
    }),
    prisma.product.create({
      data: {
        shopId: shop.id,
        name: 'Amul Butter 500g',
        sku: 'AMUL-B-500',
        barcode: '8901262150026',
        category: 'Dairy',
        unit: 'pcs',
        purchasePrice: 220,
        sellingPrice: 280,
        mrp: 290,
        gstPercentage: 12,
        hsnCode: '0405',
        reorderThreshold: 10,
      },
    }),
    prisma.product.create({
      data: {
        shopId: shop.id,
        name: 'Colgate MaxFresh 150g',
        sku: 'COL-MF-150',
        barcode: '8901314200600',
        category: 'Personal Care',
        unit: 'pcs',
        purchasePrice: 80,
        sellingPrice: 110,
        mrp: 115,
        gstPercentage: 18,
        hsnCode: '3306',
        reorderThreshold: 15,
      },
    }),
    prisma.product.create({
      data: {
        shopId: shop.id,
        name: 'Parle-G Biscuits 800g',
        sku: 'PG-800',
        barcode: '8901725133399',
        category: 'Snacks',
        unit: 'pcs',
        purchasePrice: 55,
        sellingPrice: 75,
        mrp: 80,
        gstPercentage: 18,
        hsnCode: '1905',
        reorderThreshold: 25,
      },
    }),
  ]);

  console.log(`  ✅ Products created: ${products.length} items`);

  // ── Create Inventory ──
  for (const product of products) {
    await prisma.inventory.create({
      data: {
        productId: product.id,
        branchId: mainBranch.id,
        quantity: 100,
        batchNumber: 'BATCH-001',
        costPrice: product.purchasePrice,
      },
    });

    await prisma.inventory.create({
      data: {
        productId: product.id,
        branchId: secondBranch.id,
        quantity: 50,
        batchNumber: 'BATCH-001',
        costPrice: product.purchasePrice,
      },
    });
  }

  console.log(`  ✅ Inventory created for ${products.length} products across 2 branches`);

  // ── Create Customers ──
  const customer1 = await prisma.customer.create({
    data: {
      shopId: shop.id,
      name: 'Suresh Patel',
      phone: '9988776655',
      email: 'suresh@email.com',
      loyaltyPoints: 150,
      totalSpent: 15000,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      shopId: shop.id,
      name: 'Meena Devi',
      phone: '9977665544',
      loyaltyPoints: 80,
      totalSpent: 8000,
    },
  });

  console.log(`  ✅ Customers created: ${customer1.name}, ${customer2.name}`);

  // ── Create a Supplier ──
  const supplier = await prisma.supplier.create({
    data: {
      shopId: shop.id,
      name: 'Metro Cash & Carry',
      contactPerson: 'Vijay',
      phone: '9123456789',
      email: 'orders@metro.in',
      gstNumber: '29AABCT1332L1ZP',
      leadTimeDays: 3,
    },
  });

  console.log(`  ✅ Supplier created: ${supplier.name}`);

  // ── Create Sample Invoice ──
  const invoice = await prisma.invoice.create({
    data: {
      shopId: shop.id,
      branchId: mainBranch.id,
      userId: cashier.id,
      invoiceNumber: 'INV-20260417-SEED01',
      customerId: customer1.id,
      subtotal: 503,
      discountAmount: 0,
      taxAmount: 69.48,
      cgst: 34.74,
      sgst: 34.74,
      igst: 0,
      totalAmount: 572.48,
      paidAmount: 572.48,
      paymentMode: 'CASH',
      status: 'COMPLETED',
      items: {
        create: [
          {
            productId: products[0].id,
            productName: products[0].name,
            quantity: 2,
            unitPrice: 24,
            discount: 0,
            gstPercentage: 5,
            gstAmount: 2.4,
            totalPrice: 50.4,
          },
          {
            productId: products[1].id,
            productName: products[1].name,
            quantity: 5,
            unitPrice: 14,
            discount: 0,
            gstPercentage: 12,
            gstAmount: 8.4,
            totalPrice: 78.4,
          },
          {
            productId: products[2].id,
            productName: products[2].name,
            quantity: 1,
            unitPrice: 280,
            discount: 0,
            gstPercentage: 12,
            gstAmount: 33.6,
            totalPrice: 313.6,
          },
        ],
      },
    },
  });

  console.log(`  ✅ Sample invoice created: ${invoice.invoiceNumber}`);

  // ── Create a CREDIT invoice with ledger ──
  const creditInvoice = await prisma.invoice.create({
    data: {
      shopId: shop.id,
      branchId: mainBranch.id,
      userId: cashier.id,
      invoiceNumber: 'INV-20260417-SEED02',
      customerId: customer2.id,
      subtotal: 185,
      discountAmount: 0,
      taxAmount: 27.3,
      cgst: 13.65,
      sgst: 13.65,
      igst: 0,
      totalAmount: 212.3,
      paidAmount: 100,
      paymentMode: 'CREDIT',
      status: 'COMPLETED',
    },
  });

  await prisma.creditLedger.create({
    data: {
      shopId: shop.id,
      customerId: customer2.id,
      invoiceId: creditInvoice.id,
      totalAmount: 212.3,
      paidAmount: 100,
      outstandingAmount: 112.3,
      status: 'PARTIAL',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`  ✅ Credit invoice + ledger created for ${customer2.name}`);

  const platformAdminPwd = await bcrypt.hash('Password123!', 12);
  const allPermissions = Object.values(Permission).filter((p): p is Permission => typeof p === 'string');
  await prisma.adminUser.create({
    data: {
      email: 'admin@example.com',
      password: platformAdminPwd,
      firstName: 'Platform',
      lastName: 'Administrator',
      role: AdminRole.ADMIN,
      permissions: allPermissions,
      isActive: true,
    },
  });
  console.log(`  ✅ Platform admin: admin@example.com / Password123!`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log(`   Owner:   owner@supermart.in / password123`);
  console.log(`   Manager: manager@supermart.in / password123`);
  console.log(`   Cashier: PIN 1234 (shop_id: ${shop.id})`);
  console.log(`   Platform admin: admin@example.com / Password123!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
