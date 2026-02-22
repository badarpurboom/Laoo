import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

router.post('/recommend', async (req, res) => {
    try {
        const { restaurantId, cartItems, apiKey } = req.body;

        if (!restaurantId || !cartItems || cartItems.length === 0) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                menuItems: { where: { isAvailable: true } }
            }
        });

        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        if (!restaurant.aiUpsellEnabled) {
            return res.status(403).json({ error: 'AI Upsell is disabled' });
        }

        const finalApiKey = apiKey || process.env.GEMINI_API_KEY;
        if (!finalApiKey) {
            return res.status(500).json({ error: 'Server AI Key not configured' });
        }

        // Prepare context
        const cartItemNames = cartItems.map((i: any) => i.name);
        const menuItemsShort = restaurant.menuItems
            .filter(m => !cartItemNames.includes(m.name)) // filter out already in cart
            .map(m => ({ id: m.id, name: m.name, price: m.fullPrice, isVeg: m.isVeg }));

        const prompt = `
        You are an expert restaurant up-seller and psychologist. 
        Customer has these items in their cart:
        ${JSON.stringify(cartItemNames)}

        Available Restaurant Menu:
        ${JSON.stringify(menuItemsShort)}

        Suggest EXACTLY 3 items from the menu that complement the cart perfectly. 
        Rules:
        1. Focus on high-margin, impulsive add-ons (like drinks, sides, dips, breads, desserts). 
        2. Ensure they are a good match (e.g., if cart has Pizza, suggest Coke or Garlic Bread).
        3. DO NOT suggest items they already have.
        4. Return ONLY a JSON array of 3 string IDs, absolutely no markdown formatting, no explanations. 
        Example: ["id1", "id2", "id3"]
        `;

        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${finalApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3 }
            })
        });

        if (!aiResponse.ok) {
            throw new Error(`Failed to fetch from Gemini: ${aiResponse.statusText}`);
        }

        const data = await aiResponse.json();
        let textStr = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

        // Clean up any potential markdown
        textStr = textStr.replace(/```json/g, '').replace(/```/g, '').trim();

        let idsArray: string[] = [];
        try {
            idsArray = JSON.parse(textStr);
        } catch (e) {
            console.error("Failed to parse AI response:", textStr);
            // Fallback: regex to find array
            const match = textStr.match(/\[(.*?)\]/s);
            if (match) {
                idsArray = JSON.parse(`[${match[1]}]`);
            }
        }

        if (!Array.isArray(idsArray) || idsArray.length === 0) {
            return res.json([]); // return empty if parsing failed
        }

        // Fetch the full items maintaining AI's order
        const recommendedItems = idsArray
            .map(id => restaurant.menuItems.find(m => m.id === id))
            .filter(Boolean); // remove undefined

        res.json(recommendedItems);

    } catch (error: any) {
        console.error("AI Upsell Error:", error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

export default router;
