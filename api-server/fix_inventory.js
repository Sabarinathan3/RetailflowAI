/**
 * Fix inventory: Ensure every active product in every shop has at least
 * one inventory row in the shop's main branch.
 * Products with NO inventory row will be given 0 quantity (visible as "Out")
 * rather than causing them to be invisible or crash.
 *
 * Also prints a full diagnostic summary.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Show all shops
  const shops = await prisma.shop.findMany({ select: { id: true, name: true } });
  console.log('\n📦 Shops:', shops.map((s) => `${s.name} (${s.id})`).join(', '));

  for (const shop of shops) {
    console.log(`\n──────────────── Shop: ${shop.name} ────────────────`);

    // 2. Get main branch
    const mainBranch = await prisma.branch.findFirst({
      where: { shopId: shop.id, isMain: true },
    });
    if (!mainBranch) { console.log('  ⚠️  No main branch'); continue; }
    console.log(`  Main Branch: ${mainBranch.name} (${mainBranch.id})`);

    // 3. Get all active products
    const products = await prisma.product.findMany({
      where: { shopId: shop.id, isActive: true },
      include: { inventory: { where: { branchId: mainBranch.id } } },
    });
    console.log(`  Active products: ${products.length}`);

    for (const product of products) {
      const hasEntry = product.inventory.length > 0;
      const qty = hasEntry ? product.inventory[0].quantity : null;
      
      if (!hasEntry) {
        // Create a 0-quantity entry so the product appears (Out of Stock) rather than breaking
        await prisma.inventory.create({
          data: {
            productId: product.id,
            branchId: mainBranch.id,
            quantity: 0,
          },
        });
        console.log(`  ✅ Created inventory entry for "${product.name}" (qty=0, needs restocking)`);
      } else {
        console.log(`  ✓  "${product.name}" has inventory qty=${qty}`);
      }
    }
  }

  // 4. Final summary
  console.log('\n📊 Final inventory state:');
  const all = await prisma.inventory.findMany({
    include: {
      product: { select: { name: true } },
      branch: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  all.forEach((i) => {
    console.log(`  ${i.product?.name?.padEnd(15)} | branch: ${i.branch?.name?.padEnd(15)} | qty: ${i.quantity}`);
  });
}

main()
  .then(() => { console.log('\n✅ Done'); process.exit(0); })
  .catch((e) => { console.error('❌ Error:', e.message); process.exit(1); });
