import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

// Get banners for a restaurant
router.get('/:restaurantId', async (req, res) => {
    try {
        const banners = await prisma.banner.findMany({
            where: { restaurantId: req.params.restaurantId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(banners);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new banner
router.post('/', async (req, res) => {
    try {
        const { restaurantId, imageUrl, title, isActive } = req.body;

        if (!restaurantId || !imageUrl) {
            return res.status(400).json({ error: "Missing required fields (restaurantId, imageUrl)" });
        }

        const banner = await prisma.banner.create({
            data: {
                restaurantId,
                imageUrl,
                title,
                isActive: isActive ?? true
            }
        });

        res.status(201).json(banner);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update banner visibility or details
router.put('/:id', async (req, res) => {
    try {
        const { imageUrl, title, isActive } = req.body;

        const banner = await prisma.banner.update({
            where: { id: req.params.id },
            data: {
                ...(imageUrl !== undefined && { imageUrl }),
                ...(title !== undefined && { title }),
                ...(isActive !== undefined && { isActive })
            }
        });

        res.json(banner);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a banner
router.delete('/:id', async (req, res) => {
    try {
        await prisma.banner.delete({
            where: { id: req.params.id }
        });

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
