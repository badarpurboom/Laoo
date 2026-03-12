import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categoriesData = [
  {
    name: 'Steamed Veg Momos',
    items: [
      { name: 'Classic Veg Steamed Momo', price: 90, halfPrice: 50 },
      { name: 'Paneer Steamed Momo', price: 110, halfPrice: 60 },
      { name: 'Corn & Cheese Steamed Momo', price: 130, halfPrice: 70 },
      { name: 'Spinach & Corn Steamed Momo', price: 120, halfPrice: 65 },
      { name: 'Soya Chilli Steamed Momo', price: 100, halfPrice: 55 },
      { name: 'Veg Mushroom Steamed Momo', price: 120, halfPrice: 65 },
      { name: 'Spicy Schezwan Veg Steamed Momo', price: 110, halfPrice: 60 },
      { name: 'Garlic Butter Veg Steamed Momo', price: 130, halfPrice: 70 },
    ],
    isVeg: true,
  },
  {
    name: 'Fried Veg Momos',
    items: [
      { name: 'Classic Veg Fried Momo', price: 100, halfPrice: 55 },
      { name: 'Paneer Fried Momo', price: 120, halfPrice: 65 },
      { name: 'Cheese & Corn Fried Momo', price: 140, halfPrice: 75 },
      { name: 'Peri Peri Veg Fried Momo', price: 130, halfPrice: 70 },
      { name: 'Soya Fried Momo', price: 110, halfPrice: 60 },
      { name: 'Mushroom Fried Momo', price: 130, halfPrice: 70 },
      { name: 'Schezwan Fried Momo', price: 120, halfPrice: 65 },
    ],
    isVeg: true,
  },
  {
    name: 'Tandoori & Afghani Veg Momos',
    items: [
      { name: 'Veg Tandoori Momo', price: 140, halfPrice: 75 },
      { name: 'Paneer Tandoori Momo', price: 160, halfPrice: 85 },
      { name: 'Mushroom Tandoori Momo', price: 160, halfPrice: 85 },
      { name: 'Soya Tandoori Momo', price: 150, halfPrice: 80 },
      { name: 'Hariyali Veg Tandoori Momo', price: 150, halfPrice: 80 },
      { name: 'Veg Afghani Malai Momo', price: 160, halfPrice: 85 },
      { name: 'Paneer Afghani Malai Momo', price: 180, halfPrice: 95 },
      { name: 'Soya Afghani Malai Momo', price: 170, halfPrice: 90 },
      { name: 'Achari Veg Tandoori Momo', price: 150, halfPrice: 80 },
      { name: 'Achari Paneer Tandoori Momo', price: 170, halfPrice: 90 },
    ],
    isVeg: true,
  },
  {
    name: 'Kurkure Veg Momos',
    items: [
      { name: 'Veg Kurkure Momo', price: 130, halfPrice: 70 },
      { name: 'Paneer Kurkure Momo', price: 150, halfPrice: 80 },
      { name: 'Cheese Corn Kurkure Momo', price: 160, halfPrice: 85 },
      { name: 'Soya Kurkure Momo', price: 140, halfPrice: 75 },
      { name: 'Schezwan Kurkure Momo', price: 150, halfPrice: 80 },
    ],
    isVeg: true,
  },
  {
    name: 'Steamed Non-Veg Momos',
    items: [
      { name: 'Classic Chicken Steamed Momo', price: 120, halfPrice: 65 },
      { name: 'Chicken Cheese Steamed Momo', price: 150, halfPrice: 80 },
      { name: 'Chicken Schezwan Steamed Momo', price: 140, halfPrice: 75 },
      { name: 'Chicken Tikka Steamed Momo', price: 160, halfPrice: 85 },
      { name: 'Mutton Steamed Momo', price: 180, halfPrice: 95 },
      { name: 'Spicy Mutton Steamed Momo', price: 190, halfPrice: 100 },
      { name: 'Darjeeling Special Chicken Momo', price: 140, halfPrice: 75 },
      { name: 'Garlic Chicken Steamed Momo', price: 150, halfPrice: 80 },
    ],
    isVeg: false,
  },
  {
    name: 'Fried & Kurkure Non-Veg Momos',
    items: [
      { name: 'Classic Chicken Fried Momo', price: 130, halfPrice: 70 },
      { name: 'Chicken Cheese Fried Momo', price: 160, halfPrice: 85 },
      { name: 'Zesty Lemon Chicken Fried Momo', price: 150, halfPrice: 80 },
      { name: 'Mutton Fried Momo', price: 190, halfPrice: 100 },
      { name: 'Chicken Kurkure Momo', price: 150, halfPrice: 80 },
      { name: 'Spicy Chicken Kurkure Momo', price: 160, halfPrice: 85 },
      { name: 'Mutton Kurkure Momo', price: 210, halfPrice: 110 },
    ],
    isVeg: false,
  },
  {
    name: 'Tandoori & Afghani Non-Veg Momos',
    items: [
      { name: 'Chicken Tandoori Momo', price: 170, halfPrice: 90 },
      { name: 'Chicken Afghani Momo', price: 190, halfPrice: 100 },
      { name: 'Chicken Achari Tandoori Momo', price: 180, halfPrice: 95 },
      { name: 'Mutton Tandoori Momo', price: 220, halfPrice: 115 },
      { name: 'Mutton Afghani Momo', price: 240, halfPrice: 125 },
    ],
    isVeg: false,
  },
];

async function seedMomos() {
  const username = process.argv[2];

  if (!username) {
    console.error('❌ Error: Please provide the restaurant username as an argument.');
    console.log('Usage: npx ts-node seed_momos_menu.ts <USERNAME>');
    process.exit(1);
  }

  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { username },
    });

    if (!restaurant) {
      console.error(`❌ Error: Restaurant with username "${username}" not found.`);
      process.exit(1);
    }

    console.log(`✅ Found restaurant: ${restaurant.name} (ID: ${restaurant.id})`);
    console.log('⏳ Generating Categories and 50 Momo Items...');

    let totalItemsAdded = 0;

    for (const categoryData of categoriesData) {
      // 1. Create Category
      const createdCategory = await prisma.category.create({
        data: {
          restaurantId: restaurant.id,
          name: categoryData.name,
          icon: '🥟', // Generic dumpling icon for all momos categories
        },
      });

      console.log(`+ Created Category: ${createdCategory.name}`);

      // 2. Add Items to that category
      for (const item of categoryData.items) {
        await prisma.menuItem.create({
          data: {
            restaurantId: restaurant.id,
            name: item.name,
            categoryId: createdCategory.id,
            fullPrice: item.price,
            halfPrice: item.halfPrice,
            isVeg: categoryData.isVeg,
            imageUrl: '', // Blank as requested
            description: `Delicious ${item.name} served hot.`,
            isAvailable: true,
          },
        });
        totalItemsAdded++;
      }
    }

    console.log(`\n🎉 Success! Added ${categoriesData.length} categories and ${totalItemsAdded} momo items to "${restaurant.name}".`);
  } catch (error) {
    console.error('❌ Error seeding momos menu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedMomos();
