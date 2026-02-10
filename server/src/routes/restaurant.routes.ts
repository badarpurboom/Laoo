import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

// Get all restaurants
router.get('/', async (req, res) => {
    try {
        const restaurants = await prisma.restaurant.findMany({
            orderBy: { createdAt: 'desc' }
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

// Create restaurant
router.post('/', async (req, res) => {
    try {
        const restaurant = await prisma.restaurant.create({
            data: req.body
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
