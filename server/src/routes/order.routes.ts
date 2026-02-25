import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

// Get orders for restaurant
router.get('/:restaurantId', async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { restaurantId: req.params.restaurantId },
            include: {
                details: {
                    include: {
                        menuItem: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Map backend structure to frontend expectation
        const formattedOrders = orders.map((o: any) => ({
            ...o,
            status: o.status.toLowerCase(),
            timestamp: o.createdAt,
            items: o.details.map((d: any) => ({
                id: d.menuItemId,
                name: d.menuItem.name,
                price: d.price,
                quantity: d.quantity,
                portionType: d.portion || 'full',
                isUpsell: d.isUpsell || false,
                marketingSource: d.marketingSource || null
            }))
        }));

        res.json(formattedOrders);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create order
router.post('/', async (req, res) => {
    console.log("POST /api/orders - INCOMING:", JSON.stringify(req.body, null, 2));
    try {
        const { items, details, ...rest } = req.body;

        if (!req.body.restaurantId) {
            console.error("FAILED: Missing restaurantId");
            return res.status(400).json({ error: "Missing restaurantId" });
        }

        const itemsList = items || details || [];
        const orderDetails = [];

        for (const i of itemsList) {
            let resolvedItemId = i.id || i.menuItemId;

            if (resolvedItemId === 'mystery_box') {
                let mysteryItem = await prisma.menuItem.findFirst({
                    where: { restaurantId: req.body.restaurantId, name: 'Mystery Box' }
                });
                if (!mysteryItem) {
                    let category = await prisma.category.findFirst({
                        where: { restaurantId: req.body.restaurantId }
                    });
                    if (!category) {
                        category = await prisma.category.create({
                            data: { restaurantId: req.body.restaurantId, name: 'Specials', icon: 'fas fa-star' }
                        });
                    }
                    mysteryItem = await prisma.menuItem.create({
                        data: {
                            restaurantId: req.body.restaurantId,
                            name: 'Mystery Box',
                            description: 'Surprise Add-on',
                            fullPrice: i.price || 49,
                            categoryId: category.id,
                            isAvailable: true,
                            isVeg: true
                        }
                    });
                }
                resolvedItemId = mysteryItem.id;
            }

            orderDetails.push({
                menuItemId: resolvedItemId,
                quantity: i.quantity,
                price: i.price,
                portion: i.portionType || 'full',
                isUpsell: i.isUpsell || false,
                marketingSource: i.marketingSource || null
            });
        }

        console.log("Details to create:", orderDetails);

        // Explicitly map only valid Prisma fields
        const order = await prisma.order.create({
            data: {
                restaurantId: req.body.restaurantId,
                customerName: req.body.customerName,
                customerPhone: req.body.customerPhone || '0000000000',
                totalAmount: req.body.totalAmount,
                status: (req.body.status || 'pending').toUpperCase(),
                orderType: req.body.orderType || 'dine-in',
                tableNumber: req.body.tableNumber,
                address: req.body.address,
                paymentStatus: req.body.paymentStatus || 'pending',
                // Prisma automatically handles createdAt, so we don't pass timestamp
                details: {
                    create: orderDetails
                }
            },
            include: {
                details: {
                    include: { menuItem: true }
                }
            }
        });

        console.log("Order created! ID:", order.id);

        const formatted = {
            ...order,
            status: order.status.toLowerCase(),
            timestamp: order.createdAt,
            items: order.details.map((d: any) => ({
                id: d.menuItemId,
                name: d.menuItem.name,
                price: d.price,
                quantity: d.quantity,
                portionType: d.portion || 'full',
                isUpsell: d.isUpsell || false,
                marketingSource: d.marketingSource || null
            }))
        };
        res.json(formatted);
    } catch (error: any) {
        console.error("POST /api/orders - ERROR:", error);
        res.status(500).json({ error: error.message });
    }
});

// Update status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const order = await prisma.order.update({
            where: { id: req.params.id },
            data: { status: status.toUpperCase() },
            include: {
                details: {
                    include: { menuItem: true }
                }
            }
        });
        const formatted = {
            ...order,
            status: order.status.toLowerCase(),
            timestamp: order.createdAt,
            items: order.details.map((d: any) => ({
                id: d.menuItemId,
                name: d.menuItem.name,
                price: d.price,
                quantity: d.quantity,
                portionType: d.portion || 'full',
                isUpsell: d.isUpsell || false,
                marketingSource: d.marketingSource || null
            }))
        };
        res.json(formatted);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update payment status
router.patch('/:id/payment-status', async (req, res) => {
    try {
        const { status } = req.body;
        const order = await prisma.order.update({
            where: { id: req.params.id },
            data: { paymentStatus: status },
            include: {
                details: {
                    include: { menuItem: true }
                }
            }
        });
        const formatted = {
            ...order,
            status: order.status.toLowerCase(),
            timestamp: order.createdAt,
            items: order.details.map((d: any) => ({
                id: d.menuItemId,
                name: d.menuItem.name,
                price: d.price,
                quantity: d.quantity,
                portionType: d.portion || 'full',
                isUpsell: d.isUpsell || false,
                marketingSource: d.marketingSource || null
            }))
        };
        res.json(formatted);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
