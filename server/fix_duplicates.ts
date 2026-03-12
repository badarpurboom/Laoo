import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix() {
  const username = 'admin_momosstall_278';
  const r = await prisma.restaurant.findUnique({ where: { username } });

  if (!r) {
    console.log('RESTAURANT_NOT_FOUND');
    return;
  }

  console.log('--- Restaurant Info ---');
  console.log('Name:', r.name);
  console.log('Slug:', r.slug);
  console.log('Is Active:', r.isActive);
  console.log('-----------------------');

  const items = await prisma.menuItem.findMany({ where: { restaurantId: r.id } });
  console.log('Total items before cleanup:', items.length);

  const seen = new Set();
  const duplicates = [];

  for (const item of items) {
    const key = `${item.name.toLowerCase()}_${item.categoryId}`;
    if (seen.has(key)) {
      duplicates.push(item.id);
    } else {
      seen.add(key);
    }
  }

  if (duplicates.length > 0) {
    console.log(`Deleting ${duplicates.length} duplicate items...`);
    await prisma.menuItem.deleteMany({
      where: { id: { in: duplicates } }
    });
    console.log('Cleanup complete!');
  } else {
    console.log('No duplicates found.');
  }

  // Also check duplicate categories
  const categories = await prisma.category.findMany({ where: { restaurantId: r.id } });
  const catSeen = new Set();
  const catDuplicates = [];
  for (const cat of categories) {
    const key = cat.name.toLowerCase();
    if (catSeen.has(key)) {
      catDuplicates.push(cat.id);
    } else {
      catSeen.add(key);
    }
  }

  if (catDuplicates.length > 0) {
      console.log(`Deleting ${catDuplicates.length} duplicate categories...`);
      await prisma.category.deleteMany({
          where: { id: { in: catDuplicates } }
      });
      console.log('Category cleanup complete!');
  }

  const finalItems = await prisma.menuItem.count({ where: { restaurantId: r.id } });
  console.log('Total items now:', finalItems);
}

fix()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
