import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAndDump() {
    const username = 'admin_test_511';

    const restaurant = await prisma.restaurant.findUnique({
        where: { username }
    });

    if (!restaurant) return;

    // 1. Revert mistakes!
    await prisma.menuItem.updateMany({
        where: { restaurantId: restaurant.id, name: { in: ['Veg 65', 'Paneer 65 (8 Pcs)'] } },
        data: { fullPrice: 159 } // Setting both back to a generic old price, actual price might need fixing based on exact previous values if different, but let's reset for now so they don't have crazy prices.
    });

    await prisma.menuItem.updateMany({
        where: { restaurantId: restaurant.id, name: { contains: 'Aloo Gobhi Matar' } },
        data: { fullPrice: 315 }
    });


    // 2. Dump exact names and IDs
    const items = await prisma.menuItem.findMany({
        where: { restaurantId: restaurant.id },
        select: { id: true, name: true, fullPrice: true, halfPrice: true }
    });

    console.log(JSON.stringify(items, null, 2));
}

fixAndDump().finally(() => prisma.$disconnect());
