import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

// Get super admin stats
router.get('/stats', async (req, res) => {
    try {
        const [totalRestaurants, activeRestaurants, totalOrders, revenueResult] = await Promise.all([
            prisma.restaurant.count(),
            prisma.restaurant.count({ where: { isActive: true } }),
            prisma.order.count(),
            prisma.order.aggregate({ _sum: { totalAmount: true } })
        ]);
        res.json({
            totalRestaurants,
            activeRestaurants,
            totalOrders,
            totalRevenue: revenueResult._sum.totalAmount || 0
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get all restaurants
router.get('/', async (req, res) => {
    try {
        const restaurants = await prisma.restaurant.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { orders: true, menuItems: true }
                }
            }
        });
        res.json(restaurants);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get restaurant by slug
router.get('/slug/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const restaurant = await prisma.restaurant.findUnique({
            where: { slug },
            include: {
                categories: {
                    include: { menuItems: true }
                },
                menuItems: true
            }
        });
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
        res.json(restaurant);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create restaurant (with default 10-day trial)
router.post('/', async (req, res) => {
    try {
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 10); // Default 10-day trial

        const restaurant = await prisma.restaurant.create({
            data: {
                ...req.body,
                trialEndDate
            }
        });
        res.json(restaurant);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update trial days for a restaurant
router.patch('/:id/trial', async (req, res) => {
    try {
        const { id } = req.params;
        const { trialDays } = req.body; // number of days from today

        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + trialDays);

        const restaurant = await prisma.restaurant.update({
            where: { id },
            data: { trialEndDate }
        });
        res.json(restaurant);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update restaurant
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await prisma.restaurant.update({
            where: { id },
            data: req.body
        });
        res.json(restaurant);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
