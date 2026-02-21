
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { processSuperAdminQuery, AIAction } from '../../services/superAdminAi';
import { menuService } from '../../services/api';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    isAction?: boolean;
    actionData?: any;
    status?: 'pending' | 'completed' | 'cancelled';
}

interface Props {
    onClose: () => void;
    stats: { totalRestaurants: number; activeRestaurants: number; totalOrders: number; totalRevenue: number };
}

const MasterAIChat: React.FC<Props> = ({ onClose, stats }) => {
    const { restaurants, aiConfig, updateAIConfig, updateMenuItem, deleteMenuItem } = useStore();
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hello Super Admin! I have access to all restaurant data. Command me to analyze or modify anything." }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [apiKey, setApiKey] = useState(aiConfig?.apiKey || '');
    const [showSettings, setShowSettings] = useState(!aiConfig?.apiKey);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Save key when changed
    const handleSaveKey = () => {
        const provider = apiKey.startsWith('sk-') ? 'openai' : 'gemini';
        updateAIConfig({ ...aiConfig, apiKey, provider });
        setShowSettings(false);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userQuery = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
        setIsTyping(true);

        try {
            // Step 1: Initial Processing
            const provider = apiKey.startsWith('sk-') ? 'openai' : 'gemini';

            // Prepare history (exclude system/action messages if complex, but here we just map)
            const history = messages.map(m => ({ role: m.role, content: m.content })).filter(m => m.role !== 'system');

            const action = await processSuperAdminQuery(
                userQuery,
                restaurants,
                apiKey,
                provider,
                undefined, // context
                stats,
                history
            );

            await handleAIAction(action, userQuery);

        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleAIAction = async (action: AIAction, originalQuery: string) => {

        if (action.type === 'RESPONSE') {
            setMessages(prev => [...prev, { role: 'assistant', content: action.message }]);
            return;
        }

        if (action.type === 'FETCH_MENU') {
            setMessages(prev => [...prev, { role: 'system', content: `🔍 Accessing menu for **${action.restaurantName}**...` }]);

            try {
                // Fetch context
                const resp = await menuService.getMenuItems(action.restaurantId);
                const menuItems = resp.data;

                // Step 2: Re-prompt AI with context
                const provider = apiKey.startsWith('sk-') ? 'openai' : 'gemini';
                const history = messages.map(m => ({ role: m.role, content: m.content })).filter(m => m.role !== 'system');

                const nextAction = await processSuperAdminQuery(
                    originalQuery,
                    restaurants,
                    apiKey,
                    provider,
                    { menuItems, restaurantName: action.restaurantName },
                    stats,
                    history
                );

                await handleAIAction(nextAction, originalQuery);

            } catch (err) {
                setMessages(prev => [...prev, { role: 'assistant', content: "Failed to fetch menu data." }]);
            }
            return;
        }

        if (['CONFIRM_DELETE', 'CONFIRM_UPDATE_PRICE', 'CONFIRM_DELETE_RESTAURANT', 'CONFIRM_ADD_ITEM', 'CONFIRM_UPDATE_RESTAURANT'].includes(action.type)) {
            let messageContent = '';
            if (action.type === 'CONFIRM_DELETE') messageContent = `⚠️ **Confirmation Needed**\n\nDelete item **${action.itemName}** from **${restaurants.find(r => r.id === action.restaurantId)?.name}**?`;
            else if (action.type === 'CONFIRM_DELETE_RESTAURANT') messageContent = `⚠️ **CRITICAL WARNING**\n\nAre you sure you want to DELETE restaurant **"${action.restaurantName}"**?\nThis will delete all its data permanently.`;
            else if (action.type === 'CONFIRM_UPDATE_PRICE') messageContent = `⚠️ **Confirmation Needed**\n\nUpdate price of **${action.itemName}** to **₹${action.newPrice}**?`;
            else if (action.type === 'CONFIRM_ADD_ITEM') messageContent = `🆕 **New Item Request**\n\nAdd **${action.name}** (₹${action.price}) to **${action.restaurantName}**?\n*${action.description}*`;
            else if (action.type === 'CONFIRM_UPDATE_RESTAURANT') {
                messageContent = `📝 **Update Restaurant Details**\n\nUpdate **${action.restaurantName}** with:\n` +
                    Object.entries(action.updates).map(([k, v]) => `- **${k}**: ${v}`).join('\n');
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: messageContent,
                isAction: true,
                actionData: action,
                status: 'pending'
            }]);
        }
    };

    const executeAction = async (msgIndex: number, action: any) => {
        const msg = messages[msgIndex];
        if (msg.status !== 'pending') return;

        // Optimistic update
        const newMessages = [...messages];
        newMessages[msgIndex].status = 'completed';
        setMessages(newMessages);

        try {
            if (action.type === 'CONFIRM_DELETE_RESTAURANT') {
                await useStore.getState().deleteRestaurant(action.restaurantId);
                setMessages(prev => [...prev, { role: 'system', content: `✅ Successfully deleted restaurant **${action.restaurantName}**` }]);
            }

            if (action.type === 'CONFIRM_UPDATE_RESTAURANT') {
                const currentRes = restaurants.find(r => r.id === action.restaurantId);
                if (currentRes) {
                    const updatedRes = { ...currentRes, ...action.updates };
                    await useStore.getState().updateRestaurant(updatedRes);
                    setMessages(prev => [...prev, { role: 'system', content: `✅ Updated **${action.restaurantName}** details` }]);
                } else {
                    throw new Error('Restaurant not found');
                }
            }

            if (action.type === 'CONFIRM_DELETE') {
                await deleteMenuItem(action.itemId);
                setMessages(prev => [...prev, { role: 'system', content: `✅ Deleted **${action.itemName}**` }]);
            }

            if (action.type === 'CONFIRM_UPDATE_PRICE') {
                // We need to fetch the item first to get other fields? 
                // Actually menuService.updateMenuItem needs full object usually, or partial?
                // Let's check api.ts. Usually PUT /items/:id takes partial.
                // If not, we might risk overwriting. 
                // SAFE BET: We already fetched menu to get here. 
                // But we don't have the full item in this scope easily.
                // Let's assume the backend handles partial updates or we re-fetch.
                // Wait, `processSuperAdminQuery` context had the item.

                // Simpler: Just call update with ID and price.
                // Backend route: router.put('/items/:id', ...) -> prisma.update({ data })
                // Prisma update supports partials.

                await menuService.updateMenuItem(action.itemId, { fullPrice: action.newPrice } as any);
                setMessages(prev => [...prev, { role: 'system', content: `✅ Price updated to ₹${action.newPrice}` }]);
            }
        } catch (err: any) {
            setMessages(prev => [...prev, { role: 'system', content: `❌ Action failed: ${err.message}` }]);
            // Revert status
            newMessages[msgIndex].status = 'pending';
            setMessages(newMessages);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="p-4 bg-indigo-600 text-white flex justify-between items-center shadow-md z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center animate-pulse">
                            <i className="fas fa-brain text-xl"></i>
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">Master AI</h2>
                            <p className="text-xs text-indigo-200">Super Admin Assistant</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-indigo-500 rounded-lg transition-colors">
                            <i className="fas fa-cog"></i>
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-indigo-500 rounded-lg transition-colors">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Settings Overlay */}
                {showSettings && (
                    <div className="absolute top-20 left-4 right-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xl z-20">
                        <h3 className="font-bold text-slate-700 mb-3">AI Configuration</h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Enter OpenAI or Gemini API Key"
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowSettings(false)} className="text-xs font-bold text-slate-500 px-3 py-2">Cancel</button>
                                <button onClick={handleSaveKey} className="text-xs font-bold bg-indigo-600 text-white px-4 py-2 rounded-lg">Save Key</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${m.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : m.role === 'system'
                                    ? 'bg-slate-200 text-slate-600 text-xs font-mono border border-slate-300'
                                    : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                                }`}>
                                <div className="whitespace-pre-wrap">{m.content}</div>

                                {/* Action Buttons */}
                                {m.isAction && m.status === 'pending' && (
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            onClick={() => executeAction(i, m.actionData)}
                                            className="flex-1 bg-green-500 text-white py-2 rounded-lg font-bold text-xs hover:bg-green-600 transition-colors shadow-md"
                                        >
                                            <i className="fas fa-check mr-1"></i> Confirm
                                        </button>
                                        <button
                                            onClick={() => {
                                                const newMsgs = [...messages];
                                                newMsgs[i].status = 'cancelled';
                                                setMessages(newMsgs);
                                            }}
                                            className="flex-1 bg-red-100 text-red-500 py-2 rounded-lg font-bold text-xs hover:bg-red-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                                {m.status === 'completed' && <div className="mt-2 text-xs text-green-600 font-bold"><i className="fas fa-check-circle"></i> Action Executed</div>}
                                {m.status === 'cancelled' && <div className="mt-2 text-xs text-slate-400 italic">Action Cancelled</div>}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={apiKey ? "Ask Master AI..." : "Please configure API Key first"}
                            disabled={!apiKey}
                            className="w-full pl-5 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping}
                            className="absolute right-2 top-1.5 w-10 h-10 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 flex items-center justify-center transition-colors shadow-md"
                        >
                            <i className="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MasterAIChat;
