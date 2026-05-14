/**
 * Add stock to all products that have 0 quantity in their main branch.
 * This seeds meaningful stock values for demo/testing purposes.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Default demo quantities per product name (add more as needed)
const DEMO_STOCK = {
  'Milk':  50,
  'Rice':  100,
  'Onion': 75,
  'Campa': 30,
};
const DEFAULT_QTY = 25;

async function main() {
  const inventoryRows = await prisma.inventory.findMany({
    where: { quantity: 0 },
    include: {
      product: { select: { name: true } },
      branch: { select: { name: true, shopId: true } },
    },
  });

  console.log(`\n🔧 Found ${inventoryRows.length} inventory row(s) with qty=0\n`);

  for (const row of inventoryRows) {
    const productName = row.product?.name ?? '';
    const qty = DEMO_STOCK[productName] ?? DEFAULT_QTY;
    
    await prisma.inventory.update({
      where: { id: row.id },
      data: { quantity: qty },
    });
    
    console.log(`  ✅ Set "${productName}" in "${row.branch?.name}" → qty=${qty}`);
  }

  // Final state
  console.log('\n📊 Updated inventory:');
  const all = await prisma.inventory.findMany({
    include: {
      product: { select: { name: true } },
      branch: { select: { name: true } },
    },
  });
  all.forEach((i) => {
    const status = i.quantity > 0 ? '✓' : '⚠️ ';
    console.log(`  ${status} ${i.product?.name?.padEnd(15)} | ${i.branch?.name?.padEnd(15)} | qty: ${i.quantity}`);
  });
}

main()
  .then(() => { console.log('\n✅ Stock seeded successfully'); process.exit(0); })
  .catch((e) => { console.error('❌ Error:', e.message); process.exit(1); });
