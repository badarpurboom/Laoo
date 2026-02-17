import { Router } from 'express';
import { prisma } from '../index.js';
import { Prisma } from '@prisma/client';

const router = Router();

// ===== MINIMAL SAFETY: QUERY CHAINING PREVENTION =====
// This endpoint allows ALL SQL queries (SELECT, INSERT, UPDATE, DELETE, etc.)
// ONLY blocks semicolons to prevent query chaining
// ⚠️ DANGER: Full database access enabled for Super Admin

function isSafeQuery(sql: string): { safe: boolean; reason?: string } {
    // No semicolons allowed (prevents query chaining)
    if (sql.includes(';')) {
        return { safe: false, reason: 'Semicolons not allowed (prevents query chaining)' };
    }

    return { safe: true };
}

// Database schema reference for the AI/queries
const DB_SCHEMA = `
Tables in the database:

1. "Restaurant" - id, name, slug, ownerName, email, phone, username, password, isActive, businessType (restaurant/hotel), address, logoUrl, taxEnabled, taxPercentage, deliveryChargesEnabled, deliveryCharges, deliveryFreeThreshold, dineInEnabled, takeawayEnabled, deliveryEnabled, requireTableNumber, trialEndDate, createdAt

2. "Category" - id, restaurantId, name, icon

3. "MenuItem" - id, restaurantId, name, description, fullPrice, halfPrice, categoryId, imageUrl, isVeg, isAvailable

4. "Order" - id, restaurantId, customerName, customerPhone, totalAmount, status (PENDING/preparing/ready/delivered/cancelled), orderType (dine-in/takeaway/delivery), tableNumber, address, paymentStatus (pending/paid/failed), createdAt

5. "OrderDetail" - id, orderId, menuItemId, quantity, price, portion (full/half)

6. "Notification" - id, restaurantId, tableNumber, type (WAITER_CALL/BILL_REQUEST), status (pending/resolved), createdAt
`;

// Predefined safe queries
const PREDEFINED_QUERIES: Record<string, { label: string; sql: string; description: string }> = {
    'all-restaurants': {
        label: '🏪 All Restaurants & Hotels',
        sql: `SELECT name, "ownerName", email, phone, "businessType", "isActive", "trialEndDate", "createdAt" FROM "Restaurant" ORDER BY "createdAt" DESC`,
        description: 'List all registered businesses with their details'
    },
    'total-revenue': {
        label: '💰 Revenue by Restaurant',
        sql: `SELECT r.name, r."businessType", COUNT(o.id) as total_orders, COALESCE(SUM(o."totalAmount"), 0) as total_revenue FROM "Restaurant" r LEFT JOIN "Order" o ON r.id = o."restaurantId" AND o."paymentStatus" = 'paid' GROUP BY r.id, r.name, r."businessType" ORDER BY total_revenue DESC`,
        description: 'Revenue breakdown per restaurant/hotel'
    },
    'orders-today': {
        label: '📦 Today\'s Orders',
        sql: `SELECT r.name, o."customerName", o."totalAmount", o.status, o."orderType", o."tableNumber", o."paymentStatus", o."createdAt" FROM "Order" o JOIN "Restaurant" r ON r.id = o."restaurantId" WHERE o."createdAt" >= CURRENT_DATE ORDER BY o."createdAt" DESC`,
        description: 'All orders placed today across all businesses'
    },
    'menu-overview': {
        label: '🍔 Menu Items Overview',
        sql: `SELECT r.name as restaurant, COUNT(m.id) as total_items, SUM(CASE WHEN m."isVeg" THEN 1 ELSE 0 END) as veg_items, SUM(CASE WHEN NOT m."isVeg" THEN 1 ELSE 0 END) as nonveg_items, SUM(CASE WHEN m."isAvailable" THEN 1 ELSE 0 END) as available, ROUND(AVG(m."fullPrice")::numeric, 0) as avg_price FROM "MenuItem" m JOIN "Restaurant" r ON r.id = m."restaurantId" GROUP BY r.id, r.name ORDER BY total_items DESC`,
        description: 'Menu statistics per restaurant'
    },
    'top-items': {
        label: '🌟 Top Selling Items',
        sql: `SELECT m.name as item_name, r.name as restaurant, COUNT(od.id) as times_ordered, SUM(od.quantity) as total_qty, SUM(od.price * od.quantity) as total_revenue FROM "OrderDetail" od JOIN "MenuItem" m ON m.id = od."menuItemId" JOIN "Restaurant" r ON r.id = m."restaurantId" GROUP BY m.id, m.name, r.name ORDER BY total_qty DESC LIMIT 20`,
        description: 'Most ordered items across all businesses'
    },
    'trial-status': {
        label: '⏰ Trial Status',
        sql: `SELECT name, "businessType", "trialEndDate", CASE WHEN "trialEndDate" IS NULL THEN 'No Trial' WHEN "trialEndDate" < NOW() THEN 'EXPIRED' ELSE CONCAT(EXTRACT(DAY FROM "trialEndDate" - NOW())::int, ' days left') END as trial_status, "isActive" FROM "Restaurant" ORDER BY "trialEndDate" ASC NULLS LAST`,
        description: 'Trial expiry status for all businesses'
    },
    'daily-stats': {
        label: '📊 Daily Order Stats (7 days)',
        sql: `SELECT DATE(o."createdAt") as date, COUNT(o.id) as total_orders, COALESCE(SUM(o."totalAmount"), 0) as total_revenue, COUNT(CASE WHEN o."paymentStatus" = 'paid' THEN 1 END) as paid_orders FROM "Order" o WHERE o."createdAt" >= CURRENT_DATE - INTERVAL '7 days' GROUP BY DATE(o."createdAt") ORDER BY date DESC`,
        description: 'Order & revenue stats for the last 7 days'
    },
    'customer-insights': {
        label: '👥 Top Customers',
        sql: `SELECT o."customerName", o."customerPhone", COUNT(o.id) as total_orders, SUM(o."totalAmount") as total_spent, MAX(o."createdAt") as last_order FROM "Order" o WHERE o."customerName" IS NOT NULL AND o."customerName" != '' GROUP BY o."customerName", o."customerPhone" ORDER BY total_orders DESC LIMIT 20`,
        description: 'Most frequent customers across all businesses'
    },
    'order-types': {
        label: '🍽️ Order Type Breakdown',
        sql: `SELECT r.name, r."businessType", o."orderType", COUNT(o.id) as count, COALESCE(SUM(o."totalAmount"), 0) as revenue FROM "Order" o JOIN "Restaurant" r ON r.id = o."restaurantId" GROUP BY r.name, r."businessType", o."orderType" ORDER BY r.name, count DESC`,
        description: 'Dine-in vs Takeaway vs Delivery breakdown'
    },
    'notifications': {
        label: '🔔 Recent Notifications',
        sql: `SELECT r.name, n."tableNumber", n.type, n.status, n."createdAt" FROM "Notification" n JOIN "Restaurant" r ON r.id = n."restaurantId" ORDER BY n."createdAt" DESC LIMIT 30`,
        description: 'Latest waiter calls and bill requests'
    }
};

// GET predefined queries list
router.get('/predefined', (req, res) => {
    const queries = Object.entries(PREDEFINED_QUERIES).map(([key, val]) => ({
        key,
        label: val.label,
        description: val.description
    }));
    res.json(queries);
});

// GET schema info
router.get('/schema', (req, res) => {
    res.json({ schema: DB_SCHEMA });
});

// POST execute a query (predefined or custom)
router.post('/execute', async (req, res) => {
    try {
        const { queryKey, customSql } = req.body;

        let sql = '';
        let label = 'Custom Query';

        if (queryKey && PREDEFINED_QUERIES[queryKey]) {
            sql = PREDEFINED_QUERIES[queryKey].sql;
            label = PREDEFINED_QUERIES[queryKey].label;
        } else if (customSql) {
            sql = customSql.trim();
            label = 'Custom SQL Query';
        } else {
            return res.status(400).json({ error: 'Provide either queryKey or customSql' });
        }

        // ===== SAFETY CHECK =====
        const safety = isSafeQuery(sql);
        if (!safety.safe) {
            return res.status(403).json({
                error: `🚫 BLOCKED: ${safety.reason}`,
                sql
            });
        }

        // Execute the query
        const startTime = Date.now();
        const result = await prisma.$queryRawUnsafe(sql);
        const executionTime = Date.now() - startTime;

        // Convert BigInt to number for JSON serialization
        const serialized = JSON.parse(JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? Number(value) : value
        ));

        res.json({
            label,
            sql,
            data: serialized,
            rowCount: Array.isArray(serialized) ? serialized.length : 0,
            executionTime: `${executionTime}ms`
        });

    } catch (error: any) {
        console.error('Query execution error:', error);
        res.status(500).json({
            error: error.message || 'Query failed',
            sql: req.body.customSql || req.body.queryKey
        });
    }
});

export default router;
