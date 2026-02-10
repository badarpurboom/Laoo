
import { GoogleGenAI } from "@google/genai";
import { Order, MenuItem } from "../types";

export const queryDataWithAI = async (
  query: string,
  orders: Order[],
  menuItems: MenuItem[]
) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "API Key not configured. Please check environment variables.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Prepare data context for the LLM
  // We sanitize the data to avoid sending massive blobs if orders are many, 
  // but for a demo, we send a summary.
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
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: systemInstruction,
      config: {
        temperature: 0.2,
      }
    });

    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("AI Query Error:", error);
    return "Error communicating with the AI. Please try again.";
  }
};
