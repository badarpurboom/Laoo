import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

// Categories
router.get('/categories/:restaurantId', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { restaurantId: req.params.restaurantId }
        });
        res.json(categories);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/categories', async (req, res) => {
    try {
        const category = await prisma.category.create({
            data: req.body
        });
        res.json(category);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Bulk Create Categories
router.post('/categories/bulk', async (req, res) => {
    try {
        const { restaurantId, categories } = req.body;
        // Simple loop to ensure each category is created within the correct restaurant
        const created = await Promise.all(
            categories.map((c: any) => prisma.category.create({
                data: {
                    name: c.name,
                    icon: c.icon || 'utensils',
                    restaurantId
                }
            }))
        );
        res.json(created);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        await prisma.category.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Menu Items
router.get('/items/:restaurantId', async (req, res) => {
    try {
        const items = await prisma.menuItem.findMany({
            where: { restaurantId: req.params.restaurantId }
        });
        res.json(items);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/items', async (req, res) => {
    try {
        const { id, ...data } = req.body;
        const item = await prisma.menuItem.create({
            data: data
        });
        res.json(item);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/items/:id', async (req, res) => {
    try {
        const { id, ...data } = req.body;
        const item = await prisma.menuItem.update({
            where: { id: req.params.id },
            data: data
        });
        res.json(item);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/items/:id', async (req, res) => {
    try {
        await prisma.menuItem.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
