
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { Order, MenuItem } from "../types";

export const queryDataWithAI = async (
    query: string,
    orders: Order[],
    menuItems: MenuItem[],
    apiKey: string,
    provider: 'openai' | 'gemini' = 'gemini',
    model: string = 'gemini-3-flash-preview'
) => {
    if (!apiKey) {
        return "API Key not configured in Settings. Please ask Admin to set it up.";
    }

    // Prepare data context for the LLM
    const dataSummary = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
        orderStats: orders.map(o => ({
            date: o.createdAt,
            total: o.totalAmount,
            status: o.status,
            items: o.items.map(i => i.name)
        })),
        menu: menuItems.map(m => ({ name: m.name, price: m.price, category: m.categoryId }))
    };

    const systemInstruction = `
    You are an expert restaurant business analyst.
    Below is the current JSON data of the restaurant:
    ${JSON.stringify(dataSummary)}

    User Query: "${query}"

    Instructions:
    1. Answer based ONLY on the provided data.
    2. If asked for sales, calculate them correctly.
    3. If asked for best-sellers, analyze the item frequencies in orders.
    4. Provide actionable insights if possible.
    5. Format the output in Markdown with bold headers.
  `;

    try {
        if (provider === 'openai') {
            const openai = new OpenAI({
                apiKey: apiKey,
                dangerouslyAllowBrowser: true // For client-side demo only
            });

            const completion = await openai.chat.completions.create({
                messages: [{ role: "system", content: systemInstruction }],
                model: model || "gpt-4o",
            });

            return completion.choices[0].message.content || "I couldn't generate a response.";
        } else {
            // Gemini
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: model || 'gemini-3-flash-preview',
                contents: systemInstruction,
                config: {
                    temperature: 0.2,
                }
            });

            return response.text || "I couldn't generate a response.";
        }
    } catch (error) {
        console.error("AI Query Error:", error);
        return `Error communicating with ${provider}. Please check your API Key.`;
    }
};
