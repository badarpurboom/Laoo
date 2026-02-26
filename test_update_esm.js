
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
    try {
        console.log("Searching for restaurant 'test'...");
        const r = await prisma.restaurant.findFirst({
            where: {
                name: { contains: 'test', mode: 'insensitive' }
            }
        });

        if (!r) {
            console.log("No restaurant found matching 'test'");
            return;
        }

        console.log(`Found Restaurant: ${r.name} (${r.id})`);
        console.log("Attempting to update name to 'xyz'...");

        const updated = await prisma.restaurant.update({
            where: { id: r.id },
            data: { name: 'xyz' }
        });

        console.log("Update SUCCESS!");
        console.log(`New Name: ${updated.name}`);

    } catch (e) {
        console.error("Update FAILED:", e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
