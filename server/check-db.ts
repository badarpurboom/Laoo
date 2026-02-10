
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrders() {
    try {
        const orders = await prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { details: true }
        });

        console.log("LAST 5 ORDERS IN DATABASE:");
        orders.forEach(o => {
            console.log(`- ID: ${o.id}, Restaurant: ${o.restaurantId}, Customer: ${o.customerName}, Status: ${o.status}, Details Count: ${o.details.length}`);
        });

        if (orders.length > 0) {
            const firstId = orders[0].id;
            console.log(`\nTesting deletion of order ${firstId}...`);
            await prisma.order.delete({ where: { id: firstId } });
            console.log("Delete successful (Cascade check passed if no FK error).");
        } else {
            console.log("\nNo orders found to test deletion.");
        }

    } catch (err) {
        console.error("Diagnostic ERROR:", err);
    } finally {
        await prisma.$disconnect();
    }
}

checkOrders();
