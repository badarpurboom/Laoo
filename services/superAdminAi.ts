
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { MenuItem, Restaurant } from "../types";

export type AIAction =
    | { type: 'RESPONSE'; message: string }
    | { type: 'FETCH_MENU'; restaurantId: string; restaurantName: string; reason: string }
    | { type: 'CONFIRM_DELETE'; itemId: string; itemName: string; restaurantId: string }
    | { type: 'CONFIRM_UPDATE_PRICE'; itemId: string; itemName: string; newPrice: number; restaurantId: string }
    | { type: 'CONFIRM_DELETE_RESTAURANT'; restaurantId: string; restaurantName: string }
    | { type: 'CONFIRM_ADD_ITEM'; restaurantId: string; restaurantName: string; name: string; price: number; description: string; isVeg: boolean }
    | { type: 'CONFIRM_UPDATE_RESTAURANT'; restaurantId: string; restaurantName: string; updates: { name?: string; ownerName?: string; phone?: string; email?: string } };

export const processSuperAdminQuery = async (
    query: string,
    restaurants: Restaurant[],
    apiKey: string,
    provider: 'gemini' | 'openai',
    context?: { menuItems?: MenuItem[]; restaurantName?: string },
    globalStats?: { totalRestaurants: number; activeRestaurants: number; totalOrders: number; totalRevenue: number },
    history: { role: string, content: string }[] = []
): Promise<AIAction> => {

    if (!apiKey) return { type: 'RESPONSE', message: "API Key missing. Please configure it in settings." };

    // 1. Context Building
    let prompt = "";

    // Format History
    const conversationHistory = history.map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`).join('\n');

    if (!context?.menuItems) {
        // Broad Context: List of Restaurants
        const resSummary = restaurants.map(r => ({
            id: r.id,
            name: r.name,
            ownerName: r.ownerName,
            phone: r.phone,
            status: r.isActive ? 'Active' : 'Inactive',
            itemCount: (r as any)._count?.menuItems || 0,
            orderCount: (r as any)._count?.orders || 0,
            trialEnds: (r as any).trialEndDate ? new Date((r as any).trialEndDate).toISOString().split('T')[0] : 'N/A'
        }));

        prompt = `
        You are the "Master AI" for a Restaurant SaaS Platform. You have Super Admin privileges.
        
        Global Business Stats:
        ${globalStats ? JSON.stringify(globalStats) : 'Not available'}

        Current System State (Restaurants):
        ${JSON.stringify(resSummary)}

        Conversation History:
        ${conversationHistory}
        
        Current User Query: "${query}"
        
        Instructions:
        1. If the user asks for GENERAL stats, answer directly.
        2. If the user wants to DELETE a RESTAURANT:
           - Return JSON: { "type": "CONFIRM_DELETE_RESTAURANT", "restaurantId": "...", "restaurantName": "..." }
        3. If the user wants to UPDATE RESTAURANT DETAILS (Name, Owner, Phone, etc.):
           - Identify the restaurant.
           - Return JSON: { "type": "CONFIRM_UPDATE_RESTAURANT", "restaurantId": "...", "restaurantName": "...", "updates": { "name": "New Name", "phone": "..." } }
        4. If the user wants to ADD a NEW MENU ITEM:
           - Identify the restaurant.
           - Extract details (name, price, description, veg/non-veg). If details missing, make reasonable defaults or ask.
           - Return JSON: { "type": "CONFIRM_ADD_ITEM", "restaurantId": "...", "restaurantName": "...", "name": "...", "price": 100, "description": "...", "isVeg": true }
        5. If the user wants to DELETE/MODIFY a MENU ITEM:
           - Return JSON: { "type": "FETCH_MENU", "restaurantId": "...", "restaurantName": "...", "reason": "To find the item..." }
        6. If restaurant not found, ask for clarification.
        
        CRITICAL RULES:
        - NEVER say "I have updated/deleted it" in text. YOU CANNOT DO IT.
        - YOU MUST RETURN THE JSON OBJECT to trigger the system action.
        - If you return text saying you did it, you are FAILING.
        - ONLY return JSON for actions.
        
        Output Format:
        - If answering info: Just the text answer.
        - If taking action: ONLY the JSON object. NO markdown, NO text explanation.
        `;
    } else {
        // Specific Context: Menu is loaded
        prompt = `
        You are the "Master AI". You are processing a request for restaurant: "${context.restaurantName}".
        
        Conversation History:
        ${conversationHistory}

        User Query: "${query}"
        
        Loaded Menu Items for ${context.restaurantName}:
        ${JSON.stringify(context.menuItems.map(m => ({ id: m.id, name: m.name, price: m.fullPrice })))}
        
        Instructions:
        1. Identify the item logic.
        2. If DELETE: Return JSON { "type": "CONFIRM_DELETE", "itemId": "...", "itemName": "...", "restaurantId": "..." }
        3. If UPDATE PRICE: Return JSON { "type": "CONFIRM_UPDATE_PRICE", "itemId": "...", "itemName": "...", "newPrice": 123, "restaurantId": "..." }
        4. If ADDING ITEM (even if menu loaded): Return JSON { "type": "CONFIRM_ADD_ITEM", "restaurantId": "...", "restaurantName": "...", "name": "...", "price": 100, "description": "...", "isVeg": true }
        
        CRITICAL RULES:
        - NEVER say "I have updated/deleted it" in text. YOU CANNOT DO IT.
        - YOU MUST RETURN THE JSON OBJECT to trigger the system action.
        - ONLY return JSON for actions.
        
        Output Format:
        - JSON Object for actions.
        - Text for errors/questions.
        `;
    }

    try {
        let responseText = "";

        if (provider === 'openai') {
            const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
            const completion = await openai.chat.completions.create({
                messages: [{ role: "system", content: prompt }],
                model: "gpt-4o",
            });
            responseText = completion.choices[0].message.content || "";
        } else {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: prompt,
                config: { temperature: 0.1 }
            });
            // Safe access: response.text is likely a getter string
            responseText = (response.text as any) || "";
        }

        // Clean cleanup
        let cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        // Extract JSON if embedded in text
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanText = jsonMatch[0];
        }

        try {
            // Try parsing as JSON action
            if (cleanText.startsWith('{')) {
                const action = JSON.parse(cleanText);
                if (action.type) return action; // It's a valid action
            }
        } catch (e) {
            // Not JSON, treat as text
        }

        return { type: 'RESPONSE', message: responseText };

    } catch (error: any) {
        console.error("AI Error:", error);
        return { type: 'RESPONSE', message: `AI Error: ${error.message}` };
    }
};
