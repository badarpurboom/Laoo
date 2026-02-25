
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const RESTAURANT_ID = 'cmlm3l0690003l1gzyk8v3nyw';

    try {
        console.log(`Deleting all menu items for restaurant ID: ${RESTAURANT_ID}`);
        const result = await prisma.menuItem.deleteMany({
            where: {
                restaurantId: RESTAURANT_ID
            }
        });
        console.log(`Deleted ${result.count} menu items.`);
    } catch (error) {
        console.error('Error deleting menu items:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
