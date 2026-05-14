const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const invCount = await prisma.inventory.count();
  console.log('Total inventory rows:', invCount);

  const inv = await prisma.inventory.findMany({
    take: 15,
    include: { product: { select: { name: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  const rows = inv.map((i) => ({
    product: i.product?.name,
    branchId: i.branchId,
    quantity: i.quantity,
  }));
  console.log('Inventory sample:', JSON.stringify(rows, null, 2));

  // Also check the activeBranchId in localStorage is in the DB
  const branches = await prisma.branch.findMany({ select: { id: true, name: true, isMain: true } });
  console.log('Branches:', JSON.stringify(branches, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
