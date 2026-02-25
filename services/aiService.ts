
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { Order, MenuItem } from "../types";

export const queryDataWithAI = async (
    query: string,
    orders: Order[],
    menuItems: MenuItem[],
    categories: { id: string; name: string }[],
    apiKey: string,
    provider: 'openai' | 'gemini' = 'gemini',
    model: string = 'gemini-2.0-flash',
    conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
) => {
    if (!apiKey) {
        return "API Key not configured in Settings. Please ask Admin to set it up.";
    }

    // Prepare data context for the LLM
    // Build category map for name lookups
    const categoryMap: Record<string, string> = {};
    categories.forEach(c => { categoryMap[c.id] = c.name; });

    const dataSummary = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
        categories: categories.map(c => c.name),
        menu: menuItems.map(m => ({
            name: m.name,
            fullPrice: m.fullPrice,
            halfPrice: m.halfPrice || null,
            category: categoryMap[m.categoryId] || m.categoryId,
            isVeg: m.isVeg,
            isAvailable: m.isAvailable,
        })),
        orders: orders.map(o => ({
            date: o.timestamp,
            totalAmount: o.totalAmount,
            status: o.status,
            orderType: o.orderType,
            tableNumber: o.tableNumber || null,
            customerName: o.customerName || null,
            paymentStatus: o.paymentStatus,
            items: o.items.map((i: any) => ({
                name: i.name,
                quantity: i.quantity,
                price: i.price,
                portion: i.portionType || 'full',
                isUpsell: i.isUpsell || false,
            }))
        }))
    };

    // Build conversation history string for context
    const historyText = conversationHistory.length > 0
        ? `\n\nPrevious conversation:\n${conversationHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}`
        : '';

    const systemInstruction = `
    You are an expert restaurant business analyst.
    Below is the current JSON data of the restaurant:
    ${JSON.stringify(dataSummary)}
    ${historyText}

    Current User Query: "${query}"

    Instructions:
    1. Answer based ONLY on the provided data.
    2. Remember the previous conversation context above when answering.
    3. If asked for sales, calculate them correctly.
    4. If asked for best-sellers, analyze the item frequencies in orders.
    5. Provide actionable insights if possible.
    6. Format the output in Markdown with bold headers.
  `;

    try {
        if (provider === 'openai') {
            const openai = new OpenAI({
                apiKey: apiKey,
                dangerouslyAllowBrowser: true // For client-side demo only
            });

            const completion = await openai.chat.completions.create({
                messages: [{ role: "system", content: systemInstruction }],
                model: "gpt-4o",
            });

            return completion.choices[0].message.content || "I couldn't generate a response.";
        } else {
            // Gemini
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: model || 'gemini-2.0-flash',
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

// NEW: Generate SQL from Natural Language
export const generateSqlFromText = async (
    userQuery: string,
    schema: string,
    apiKey: string,
    provider: 'openai' | 'gemini' = 'gemini'
): Promise<{ sql?: string; error?: string }> => {
    if (!apiKey) return { error: "API Key missing" };

    const systemInstruction = `
    You are a PostgreSQL expert. Convert the user's natural language question into a valid, safe PostgreSQL SELECT query.

    Database Schema:
    ${schema}

    Instructions:
    1. Return ONLY the raw SQL query. Do not wrap in markdown blocks like \`\`\`sql ... \`\`\`.
    2. Use ONLY "SELECT" queries. No INSERT, UPDATE, DELETE, DROP, etc.
    3. Use ISO 8601 format for dates (YYYY-MM-DD).
    4. For today's items, use CURRENT_DATE.
    5. Always quote table names and column names with double quotes to be safe (e.g. "Restaurant", "createdAt").
    6. If the user asks for "hotel" or "restaurant", filter by "businessType" column in "Restaurant" table.
    7. Limit results to 50 unless specified otherwise.
    8. If query is unsafe or unclear, return SELECT 1.

    User Question: "${userQuery}"
    `;

    try {
        let sql = '';
        if (provider === 'openai') {
            const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
            const completion = await openai.chat.completions.create({
                messages: [{ role: "system", content: systemInstruction }],
                model: "gpt-4o",
            });
            sql = completion.choices[0].message.content || '';
        } else {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: systemInstruction,
            });
            sql = response.text || '';
        }

        // Clean up markdown block if present
        sql = sql.replace(/```sql/g, '').replace(/```/g, '').trim();
        return { sql };

    } catch (error: any) {
        console.error("AI SQL Generation Error:", error);
        return { error: error.message || "Failed to generate SQL" };
    }
};
