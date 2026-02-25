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

        const cartItemNames = cartItems.map((i: any) => i.name);

        // Collect all recommended IDs from cart items
        let recommendedIdsMap: { [key: string]: number } = {};

        for (const cartItem of cartItems) {
            const menuItem = restaurant.menuItems.find(m => m.id === cartItem.id);
            if (menuItem && menuItem.recommendedItemIds) {
                try {
                    const ids: string[] = JSON.parse(menuItem.recommendedItemIds);
                    ids.forEach(id => {
                        if (recommendedIdsMap[id]) {
                            recommendedIdsMap[id]++;
                        } else {
                            recommendedIdsMap[id] = 1;
                        }
                    });
                } catch (e) { }
            }
        }

        // Sort by frequency and get top 3
        const topIds = Object.keys(recommendedIdsMap)
            .sort((a, b) => recommendedIdsMap[b] - recommendedIdsMap[a])
            .slice(0, 3);

        if (topIds.length === 0) {
            return res.json([]);
        }

        const recommendedItems = topIds
            .map(id => restaurant.menuItems.find(m => m.id === id && !cartItemNames.includes(m.name)))
            .filter(Boolean);

        res.json(recommendedItems);

    } catch (error: any) {
        console.error("AI Upsell Error:", error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

router.post('/sync-menu', async (req, res) => {
    try {
        const { restaurantId, apiKey } = req.body;

        if (!restaurantId) {
            return res.status(400).json({ error: 'Missing restaurantId' });
        }

        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                menuItems: { where: { isAvailable: true } }
            }
        });

        if (!restaurant || !restaurant.menuItems.length) {
            return res.status(404).json({ error: 'Restaurant or menu items not found' });
        }

        const finalApiKey = apiKey || process.env.GEMINI_API_KEY;
        if (!finalApiKey) {
            return res.status(500).json({ error: 'Server AI Key not configured' });
        }

        // Respond immediately to prevent Nginx 504 Gateway Timeout
        res.json({ message: 'Sync initiated in background. Please check back in a few minutes.' });

        // Process in background
        (async () => {
            try {
                const menuItemsShort = restaurant.menuItems.map(m => ({ id: m.id, name: m.name, price: m.fullPrice, isVeg: m.isVeg }));
                const chunkSize = 40;
                let recommendationsMap: { [key: string]: string[] } = {};

                for (let i = 0; i < menuItemsShort.length; i += chunkSize) {
                    const chunk = menuItemsShort.slice(i, i + chunkSize);
                    const chunkIds = chunk.map(c => c.id);

                    const prompt = `
                    You are an expert restaurant up-seller. 
                    Available Restaurant Menu:
                    ${JSON.stringify(menuItemsShort)}

                    I want recommendations ONLY for the following item IDs:
                    ${JSON.stringify(chunkIds)}

                    For EACH of these specific item IDs, suggest EXACTLY 3 other complementary item IDs from the Available Restaurant Menu.
                    Return ONLY a raw JSON object where keys are the specific item IDs requested, and values are arrays of 3 recommended string IDs.
                    Example:
                    {
                      "item_id_1": ["rec_id_1", "rec_id_2", "rec_id_3"],
                      "item_id_2": ["rec_id_4", "rec_id_5", "rec_id_6"]
                    }
                    Absolutely no markdown formatting, no text, just the raw JSON object.
                    `;

                    let textStr = "{}";

                    if (finalApiKey.startsWith("sk-")) {
                        // OpenAI approach
                        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${finalApiKey}`
                            },
                            body: JSON.stringify({
                                model: "gpt-4o-mini",
                                messages: [
                                    { role: "system", content: "You return pure JSON objects of IDs." },
                                    { role: "user", content: prompt }
                                ],
                                temperature: 0.2
                            })
                        });

                        if (!aiResponse.ok) throw new Error(`Failed to fetch from OpenAI: ${aiResponse.statusText}`);
                        const data = await aiResponse.json();
                        textStr = data.choices[0]?.message?.content || "{}";
                    } else {
                        // Gemini approach
                        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${finalApiKey}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: prompt }] }],
                                generationConfig: { temperature: 0.2, response_mime_type: "application/json" }
                            })
                        });

                        if (!aiResponse.ok) throw new Error(`Failed to fetch from Gemini: ${aiResponse.statusText}`);
                        const data = await aiResponse.json();
                        textStr = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
                    }

                    textStr = textStr.replace(/```json/g, '').replace(/```/g, '').trim();

                    try {
                        const parsed = JSON.parse(textStr);
                        Object.assign(recommendationsMap, parsed);
                    } catch (e) {
                        console.error("Failed to parse AI chunk response:", textStr);
                    }
                }

                const updatePromises = [];
                for (const itemId of Object.keys(recommendationsMap)) {
                    const recIds = recommendationsMap[itemId];
                    if (Array.isArray(recIds) && recIds.length > 0) {
                        updatePromises.push(
                            prisma.menuItem.update({
                                where: { id: itemId },
                                data: { recommendedItemIds: JSON.stringify(recIds) }
                            })
                        );
                    }
                }

                await prisma.$transaction(updatePromises);
                console.log(`Background AI Sync complete. Updated ${updatePromises.length} items for restaurant ${restaurantId}.`);

            } catch (err: any) {
                console.error("Background AI Sync Failed:", err);
            }
        })();

    } catch (error: any) {
        console.error("AI Upsell Sync Original Request Error:", error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

router.post('/pick-flash-items', async (req, res) => {
    try {
        const { restaurantId, apiKey } = req.body;

        if (!restaurantId) {
            return res.status(400).json({ error: 'Missing restaurantId' });
        }

        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                menuItems: { where: { isAvailable: true } }
            }
        });

        if (!restaurant || !restaurant.menuItems.length) {
            return res.status(404).json({ error: 'Restaurant or menu items not found' });
        }

        const finalApiKey = apiKey || process.env.GEMINI_API_KEY;
        if (!finalApiKey) {
            return res.status(500).json({ error: 'Server AI Key not configured' });
        }

        const menuItemsShort = restaurant.menuItems.map(m => ({ id: m.id, name: m.name, price: m.fullPrice, isVeg: m.isVeg }));

        const prompt = `
        You are an expert restaurant up-seller. 
        Available Restaurant Menu:
        ${JSON.stringify(menuItemsShort)}

        Task: Select EXACTLY 2 menu items from the available menu that are visually appealing or highly recommended for up-selling.
        Return ONLY a raw JSON array of the 2 selected IDs.
        Example: ["item_id_1", "item_id_2"]
        Absolutely no markdown formatting, no text, just the raw JSON array.
        `;

        let textStr = "[]";

        if (finalApiKey.startsWith("sk-")) {
            // OpenAI approach
            const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${finalApiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "You return pure JSON arrays of 2 IDs." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.5
                })
            });

            if (!aiResponse.ok) throw new Error(`Failed to fetch from OpenAI: ${aiResponse.statusText}`);
            const data = await aiResponse.json();
            textStr = data.choices[0]?.message?.content || "[]";
        } else {
            // Gemini approach
            const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${finalApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.5, response_mime_type: "application/json" }
                })
            });

            if (!aiResponse.ok) throw new Error(`Failed to fetch from Gemini: ${aiResponse.statusText}`);
            const data = await aiResponse.json();
            textStr = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        }

        textStr = textStr.replace(/```json/g, '').replace(/```/g, '').trim();

        let parsedIds: string[] = [];
        try {
            parsedIds = JSON.parse(textStr);
        } catch (e) {
            console.error("Failed to parse AI response:", textStr);
            return res.status(500).json({ error: 'Failed to process AI response' });
        }

        if (!Array.isArray(parsedIds) || parsedIds.length < 2) {
            return res.status(500).json({ error: 'AI did not return exactly 2 items' });
        }

        // Save immediately to Restaurant settings
        const updatedRestaurant = await prisma.restaurant.update({
            where: { id: restaurantId },
            data: {
                popupItem1Id: parsedIds[0],
                popupItem2Id: parsedIds[1]
            }
        });

        res.json({ success: true, popupItem1Id: parsedIds[0], popupItem2Id: parsedIds[1] });

    } catch (error: any) {
        console.error("AI Flash Item Pick Error:", error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

export default router;
