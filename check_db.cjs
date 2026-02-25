const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const rs = await prisma.restaurant.findMany({ where: { slug: { contains: 'shree' } }, include: { menuItems: true } });
    rs.forEach(r => {
        console.log(r.name, 'AI Enable:', r.aiUpsellEnabled);
        const hasRecs = r.menuItems.filter(m => m.recommendedItemIds && m.recommendedItemIds !== '[]' && m.recommendedItemIds !== 'null');
        console.log('Items with recs:', hasRecs.length, '/', r.menuItems.length);
    });
}
main().catch(console.error).finally(() => process.exit(0));
