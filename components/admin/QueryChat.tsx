import React, { useState, useRef, useEffect } from 'react';
import { queryService } from '../../services/api';

interface ChatMessage {
    id: string;
    type: 'user' | 'system' | 'result' | 'error';
    content: string;
    sql?: string;
    data?: any[];
    rowCount?: number;
    executionTime?: string;
    timestamp: Date;
}

interface PredefinedQuery {
    key: string;
    label: string;
    description: string;
}

const QueryChat: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            type: 'system',
            content: 'Welcome to the Database Query Console. Use the quick queries below or write your own SELECT query to explore your data.',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [predefinedQueries, setPredefinedQueries] = useState<PredefinedQuery[]>([]);
    const [showSchema, setShowSchema] = useState(false);
    const [schema, setSchema] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        queryService.getPredefined().then(res => setPredefinedQueries(res.data));
        queryService.getSchema().then(res => setSchema(res.data.schema));
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const addMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        setMessages(prev => [...prev, { ...msg, id: Date.now().toString(), timestamp: new Date() }]);
    };

    const executeQuery = async (queryKey?: string, customSql?: string, label?: string) => {
        setIsLoading(true);
        addMessage({
            type: 'user',
            content: label || customSql || queryKey || 'Query'
        });

        try {
            const res = await queryService.execute({ queryKey, customSql });
            const { data, sql, rowCount, executionTime, label: resLabel } = res.data;

            addMessage({
                type: 'result',
                content: resLabel || 'Query Result',
                sql,
                data,
                rowCount,
                executionTime
            });
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || err.message || 'Query failed';
            addMessage({
                type: 'error',
                content: errorMsg,
                sql: err.response?.data?.sql
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userInput = input.trim();
        setInput('');

        // Only accept SQL queries (SELECT or WITH)
        if (userInput.toUpperCase().startsWith('SELECT') || userInput.toUpperCase().startsWith('WITH')) {
            executeQuery(undefined, userInput);
        } else {
            addMessage({
                type: 'error',
                content: '⚠️ Only SELECT queries are allowed. Start your query with SELECT or WITH.'
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const renderTable = (data: any[]) => {
        if (!data || data.length === 0) return <p className="text-slate-400 text-xs italic">No results</p>;
        const columns = Object.keys(data[0]);
        return (
            <div className="overflow-x-auto rounded-lg border border-slate-700/50 mt-2">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-slate-800/80">
                            {columns.map(col => (
                                <th key={col} className="px-3 py-2 text-left font-bold text-emerald-400 whitespace-nowrap border-b border-slate-700/50">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i} className={`${i % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/10'} hover:bg-slate-700/40 transition-colors`}>
                                {columns.map(col => (
                                    <td key={col} className="px-3 py-1.5 text-slate-300 whitespace-nowrap border-b border-slate-800/50 max-w-[200px] truncate">
                                        {row[col] === null ? <span className="text-slate-500 italic">null</span> :
                                            typeof row[col] === 'object' ? JSON.stringify(row[col]) :
                                                String(row[col])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <i className="fas fa-terminal text-white"></i>
                    </div>
                    <div>
                        <h3 className="font-black text-white text-sm">Database Query Console</h3>
                        <p className="text-[10px] text-slate-400">Read-Only · SELECT queries only · All data accessible</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSchema(!showSchema)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showSchema ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-emerald-400'}`}
                    >
                        <i className="fas fa-database mr-1"></i> Schema
                    </button>
                    <button
                        onClick={() => setMessages([messages[0]])}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 hover:text-red-400 transition-all"
                    >
                        <i className="fas fa-trash mr-1"></i> Clear
                    </button>
                </div>
            </div>

            {/* Schema Panel */}
            {showSchema && (
                <div className="px-5 py-3 bg-slate-800/50 border-b border-slate-700/50 max-h-48 overflow-y-auto">
                    <pre className="text-[11px] text-emerald-300/80 font-mono whitespace-pre-wrap leading-relaxed">{schema}</pre>
                </div>
            )}

            {/* Quick Queries */}
            <div className="px-5 py-3 bg-slate-900/80 border-b border-slate-800/50 overflow-x-auto">
                <div className="flex gap-2 flex-nowrap pb-1">
                    {predefinedQueries.map(q => (
                        <button
                            key={q.key}
                            onClick={() => executeQuery(q.key, undefined, q.label)}
                            disabled={isLoading}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold whitespace-nowrap border border-slate-700/50 hover:border-emerald-500/30 transition-all disabled:opacity-50 flex-shrink-0"
                            title={q.description}
                        >
                            {q.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id}>
                        {msg.type === 'system' && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <i className="fas fa-robot text-emerald-400 text-xs"></i>
                                </div>
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                                    <p className="text-sm text-slate-300">{msg.content}</p>
                                </div>
                            </div>
                        )}

                        {msg.type === 'user' && (
                            <div className="flex items-start gap-3 justify-end">
                                <div className="bg-emerald-600/20 border border-emerald-500/20 rounded-xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                                    <p className="text-sm text-emerald-300 font-medium">{msg.content}</p>
                                </div>
                                <div className="w-8 h-8 bg-emerald-600/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <i className="fas fa-user text-emerald-400 text-xs"></i>
                                </div>
                            </div>
                        )}

                        {msg.type === 'result' && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <i className="fas fa-check-circle text-emerald-400 text-xs"></i>
                                </div>
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl rounded-tl-sm px-4 py-3 max-w-full w-full">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-sm font-bold text-white">{msg.content}</span>
                                        <span className="text-[10px] text-slate-500">{msg.rowCount} rows · {msg.executionTime}</span>
                                    </div>
                                    {msg.sql && (
                                        <details className="mb-2">
                                            <summary className="text-[10px] text-slate-500 cursor-pointer hover:text-emerald-400 transition-colors">
                                                <i className="fas fa-code mr-1"></i> View SQL
                                            </summary>
                                            <pre className="text-[10px] text-cyan-300/70 font-mono bg-slate-900/50 rounded-lg p-2 mt-1 overflow-x-auto whitespace-pre-wrap">{msg.sql}</pre>
                                        </details>
                                    )}
                                    {msg.data && renderTable(msg.data)}
                                </div>
                            </div>
                        )}

                        {msg.type === 'error' && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <i className="fas fa-exclamation-triangle text-red-400 text-xs"></i>
                                </div>
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                                    <p className="text-sm text-red-400 font-medium">{msg.content}</p>
                                    {msg.sql && (
                                        <pre className="text-[10px] text-red-300/50 font-mono mt-2 bg-red-900/20 rounded p-2">{msg.sql}</pre>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fas fa-spinner fa-spin text-emerald-400 text-xs"></i>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl rounded-tl-sm px-4 py-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                <span className="text-xs text-slate-400 ml-1">Executing query...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="px-5 py-4 bg-slate-900 border-t border-slate-800">
                <div className="flex gap-3 items-end">
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder='Type a SELECT query... e.g. SELECT * FROM "Restaurant" LIMIT 5'
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 font-mono focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none resize-none"
                            rows={2}
                            disabled={isLoading}
                        />
                        <div className="absolute bottom-2 right-3 text-[9px] text-slate-600">
                            Enter to send · Shift+Enter for new line
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl font-bold hover:from-emerald-500 hover:to-cyan-500 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                        <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-play'}`}></i>
                        Run
                    </button>
                </div>
                <p className="text-[10px] text-slate-600 mt-2 text-center">
                    🔒 Read-only mode · Only SELECT queries allowed · No data can be modified
                </p>
            </form>
        </div>
    );
};

export default QueryChat;
