
import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get Pending Notifications for a Restaurant
router.get('/', async (req, res) => {
    try {
        const { restaurantId } = req.query;

        if (!restaurantId) {
            res.status(400).json({ error: 'Restaurant ID is required' });
            return;
        }

        const notifications = await prisma.notification.findMany({
            where: {
                restaurantId: String(restaurantId),
                status: 'pending'
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Create a New Notification (Waiter Call)
router.post('/', async (req, res) => {
    try {
        const { restaurantId, tableNumber, type = 'WAITER_CALL' } = req.body;

        if (!restaurantId || !tableNumber) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Check for existing pending notification to prevent spam
        const existing = await prisma.notification.findFirst({
            where: {
                restaurantId,
                tableNumber,
                status: 'pending',
                type
            }
        });

        if (existing) {
            res.json(existing); // Return existing instead of creating duplicate
            return;
        }

        const notification = await prisma.notification.create({
            data: {
                restaurantId,
                tableNumber,
                type,
                status: 'pending'
            }
        });

        res.json(notification);
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
});

// Mark Notification as Resolved
router.patch('/:id/resolve', async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await prisma.notification.update({
            where: { id },
            data: { status: 'resolved' }
        });

        res.json(notification);
    } catch (error) {
        console.error('Error resolving notification:', error);
        res.status(500).json({ error: 'Failed to resolve notification' });
    }
});

export default router;
