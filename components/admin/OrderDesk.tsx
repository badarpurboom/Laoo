

import React from 'react';
import { useStore } from '../../store';
import { OrderStatus } from '../../types';
import { printKOT } from '../../utils/printKOT';

const OrderDesk: React.FC = () => {
  const { orders, updateOrderStatus, updatePaymentStatus, activeRestaurantId, settings, fetchDashboardData } = useStore();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState(new Date());
  const [audioEnabled, setAudioEnabled] = React.useState(true);
  const [selectedVoice, setSelectedVoice] = React.useState<SpeechSynthesisVoice | null>(null);
  const [viewMode, setViewMode] = React.useState<'orders' | 'tables'>('orders');

  const prevOrdersRef = React.useRef<Set<string>>(new Set());
  const isFirstLoad = React.useRef(true);
  const activeRestaurantRef = React.useRef(activeRestaurantId);

  // Browser TTS Only
  const playVoiceAnnouncement = (text: string) => {
    if (!audioEnabled) return;

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  // Load Browser Voices
  React.useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Prioritize Indian English or Hindi voices for natural Indian accent
      const preferredVoice = voices.find(v =>
        v.lang === 'hi-IN' ||
        v.lang === 'en-IN' ||
        v.name.includes('Google हिन्दी') ||
        v.name.includes('India')
      ) || voices.find(v => v.name.includes('Google') && v.lang.includes('en-US'));

      if (preferredVoice) {
        setSelectedVoice(preferredVoice);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Handle Restaurant Switching (Reset tracker)
  React.useEffect(() => {
    if (activeRestaurantId !== activeRestaurantRef.current) {
      prevOrdersRef.current = new Set(orders.filter(o => o.restaurantId === activeRestaurantId).map(o => o.id));
      activeRestaurantRef.current = activeRestaurantId;
    }
  }, [activeRestaurantId, orders]);

  // Audio Alert Logic
  const tenantOrders = orders.filter(o => o.restaurantId === activeRestaurantId);

  // Helper: Convert number to Hindi word
  const numberToHindi = (num: number): string => {
    const words = ['', 'ek', 'do', 'teen', 'char', 'paanch', 'chheh', 'saat', 'aath', 'nau', 'das'];
    return num <= 10 ? words[num] : num.toString();
  };

  // Helper: Report portion in Hindi
  const getPortionHindi = (portion?: string) => {
    if (portion === 'half') return 'half';
    if (portion === 'full') return 'full';
    return '';
  };

  // Helper: Generate natural Hindi sentence
  const generateNaturalHindi = (order: any): string => {
    const items = order.items || [];

    // Build item descriptions with natural numbers
    const itemDescriptions = items.map((item: any) => {
      const quantity = numberToHindi(item.quantity);
      const portion = getPortionHindi(item.portionType);
      return `${quantity} ${portion} ${item.name}`;
    }).join(' aur ');

    // Context-aware verb based on order type
    let action = '';

    if (order.orderType === 'takeaway') {
      action = 'pack kar do';
    } else if (order.orderType === 'dine-in') {
      action = order.tableNumber ? `table ${order.tableNumber} par laga do` : 'laga do';
    } else if (order.orderType === 'delivery') {
      action = 'deliver karne ke liye taiyar karo';
    }

    // Natural Hindi sentence: "Rohit ke liye ek half gajar ka halwa pack kar do"
    return `${order.customerName} ke liye ${itemDescriptions} ${action}.`;
  };

  React.useEffect(() => {
    if (isFirstLoad.current) {
      tenantOrders.forEach(o => prevOrdersRef.current.add(o.id));
      isFirstLoad.current = false;
      return;
    }

    const newOrders = tenantOrders.filter(o => !prevOrdersRef.current.has(o.id));

    if (newOrders.length > 0) {
      if (audioEnabled) {
        // Play custom alert sound once for the batch
        // User requested ONLY this sound, no TTS.
        const alertAudio = new Audio('/audio/custom_alert.mp3');
        alertAudio.play().catch(err => console.error("Failed to play custom alert:", err));
      }
    }

    prevOrdersRef.current = new Set(tenantOrders.map(o => o.id));
  }, [tenantOrders, audioEnabled]);

  // Short Polling: Fetch orders every 10 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
      setLastUpdated(new Date());
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setLastUpdated(new Date());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const toggleAudio = () => {
    if (!audioEnabled) {
      playVoiceAnnouncement("Audio alerts enabled. System online.");
    }
    setAudioEnabled(!audioEnabled);
  };

  console.log("OrderDesk DEBUG:", {
    activeRestaurantId,
    totalOrders: orders.length,
    ordersInThisRestaurant: orders.filter(o => o.restaurantId === activeRestaurantId).length
  });

  const getStatusColor = (status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled') => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'preparing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ready': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const statusFlow: OrderStatus[] = ['pending', 'preparing', 'ready', 'delivered'];

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-500">Live Updates Active</span>
          </div>

          <button
            onClick={toggleAudio}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${audioEnabled
              ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
              }`}
            title={selectedVoice ? `Using Browser Voice: ${selectedVoice.name}` : 'Using System Voice'}
          >
            <i className={`fas ${audioEnabled ? 'fa-volume-up' : 'fa-volume-mute'}`}></i>
            {audioEnabled ? 'Alerts On' : 'Alerts Off'}
          </button>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-2 disabled:opacity-50"
        >
          <i className={`fas fa-sync-alt ${isRefreshing ? 'animate-spin' : ''}`}></i>
          {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
        </button>
      </div>

      {/* Simple Mode for Small Restaurants (No Table Number = No Status Flow) */}
      {(!settings.orderPreferences?.requireTableNumber && settings.orderPreferences?.dineIn) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tenantOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').map(order => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-lg text-slate-800">{order.customerName}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${order.orderType === 'dine-in' ? 'bg-orange-100 text-orange-700' : order.orderType === 'delivery' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {order.orderType}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex justify-end mb-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); printKOT(order, settings); }}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                    title="Print KOT"
                  >
                    <i className="fas fa-print"></i> KOT
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm text-slate-600 border-b border-dashed border-slate-100 pb-1">
                      <span>
                        <span className="font-bold mr-1">{item.quantity}x</span>
                        {item.name}
                        {item.portionType && <span className="text-[9px] bg-slate-100 ml-1 px-1 rounded uppercase">{item.portionType}</span>}
                      </span>
                      <span>₹{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-slate-800 pt-1">
                    <span>Total</span>
                    <span>₹{order.totalAmount.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={async () => {
                  await updateOrderStatus(order.id, 'delivered');
                  await updatePaymentStatus(order.id, 'paid');
                  fetchDashboardData();
                }}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <i className="fas fa-check"></i> Finish Order
              </button>
            </div>
          ))}
          {tenantOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                <i className="fas fa-check text-2xl"></i>
              </div>
              <h3 className="text-slate-500 font-medium">All orders completed!</h3>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {statusFlow.concat(['cancelled'] as any).map(status => (
              <div key={status} className="min-w-[150px] bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">{status}</p>
                <p className="text-2xl font-bold text-slate-800">{tenantOrders.filter(o => o.status === status).length}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={() => setViewMode('orders')} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${viewMode === 'orders' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}><i className="fas fa-list mr-2"></i> All Orders</button>
            <button onClick={() => setViewMode('tables')} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${viewMode === 'tables' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}><i className="fas fa-chair mr-2"></i> Table View</button>
          </div>

          {viewMode === 'orders' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {tenantOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                  <div className={`p-4 border-b flex justify-between items-center ${getStatusColor(order.status as any)}`}>
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold">{order.id}</h4>
                      <button
                        onClick={(e) => { e.stopPropagation(); printKOT(order, settings); }}
                        className="bg-white/50 hover:bg-white text-slate-700 px-2 py-1 rounded text-[10px] font-bold transition-colors flex items-center gap-1"
                        title="Print KOT"
                      >
                        <i className="fas fa-print"></i> KOT
                      </button>
                    </div>
                    <span className="text-[10px] font-bold bg-white/50 px-2 py-1 rounded">
                      {order.timestamp ? new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </span>
                  </div>

                  <div className="flex-1 p-4 space-y-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-slate-800">{order.customerName}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${order.orderType === 'dine-in' ? 'bg-orange-100 text-orange-700' :
                          order.orderType === 'delivery' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                          {order.orderType}
                        </span>
                      </div>

                      {order.tableNumber && (
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <i className="fas fa-chair text-[10px] w-4"></i>
                          {order.tableNumber}
                        </div>
                      )}

                      {order.address && (
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <i className="fas fa-map-marker-alt text-[10px] w-4"></i>
                          <span className="line-clamp-1" title={order.address}>{order.address}</span>
                        </div>
                      )}

                      {order.customerPhone && order.orderType === 'delivery' && (
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <i className="fas fa-phone text-[10px] w-4"></i>
                          {order.customerPhone}
                        </div>
                      )}

                      <span className="text-xs text-slate-400 mt-1">{(order.items || []).reduce((s, i) => s + i.quantity, 0)} items</span>
                    </div>

                    <div className="space-y-1">
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            {item.quantity}x {item.name}
                            {item.portionType && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${item.portionType === 'half'
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}>
                                {item.portionType}
                              </span>
                            )}
                          </span>
                          <span>₹{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-dashed flex justify-between font-bold text-slate-800">
                      <span>Total</span>
                      <span>₹{order.totalAmount.toFixed(0)}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t flex gap-2">
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <>
                        <button
                          onClick={() => {
                            const currentIndex = statusFlow.indexOf(order.status as any);
                            if (currentIndex < statusFlow.length - 1) {
                              updateOrderStatus(order.id, statusFlow[currentIndex + 1]);
                            }
                          }}
                          className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                        >
                          Move to {statusFlow[statusFlow.indexOf(order.status as any) + 1] || 'Done'}
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled' as any)}
                          className="px-4 py-2 border border-red-200 text-red-500 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </>
                    )}
                    {order.status === 'delivered' && (
                      <div className="w-full text-center py-2 text-green-600 font-bold text-xs">
                        <i className="fas fa-check-circle mr-2"></i> Order Delivered
                      </div>
                    )}
                    {order.status === 'cancelled' && (
                      <div className="w-full text-center py-2 text-red-600 font-bold text-xs">
                        Cancelled
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {tenantOrders.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <i className="fas fa-receipt text-3xl"></i>
                  </div>
                  <h3 className="text-slate-500 font-medium">No active orders</h3>
                  <p className="text-sm text-slate-400">Orders placed by customers will appear here.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Object.values(tenantOrders.reduce((groups: any, order) => {
                if (order.orderType === 'dine-in' && order.tableNumber && order.status !== 'cancelled' && order.paymentStatus !== 'paid') {
                  const table = order.tableNumber;
                  if (!groups[table]) {
                    groups[table] = { tableNumber: table, orders: [], totalAmount: 0, items: [], customerName: order.customerName };
                  }
                  groups[table].orders.push(order);
                  groups[table].totalAmount += order.totalAmount;
                  groups[table].items.push(...(order.items || []));
                }
                return groups;
              }, {})).map((table: any) => (
                <div key={table.tableNumber} className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-orange-100 bg-orange-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                        {table.tableNumber}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">Table {table.tableNumber}</h4>
                        <p className="text-xs text-slate-500">{table.customerName}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-white px-2 py-1 rounded text-orange-600 border border-orange-200">
                      {table.orders.length} Orders
                    </span>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2 bg-orange-50/30 border-b border-orange-50">
                    <button
                      onClick={() => {
                        // Construct a synthetic order with ALL items for this table
                        // This acts as a "Running KOT" or "Table Summary"
                        const aggregatedOrder: any = {
                          id: `TBL-${table.tableNumber}-RUNNING`,
                          restaurantId: settings.restaurantId,
                          customerName: table.customerName,
                          items: table.items, // All items from all orders
                          totalAmount: table.totalAmount,
                          status: 'preparing',
                          orderType: 'dine-in',
                          timestamp: new Date().toISOString(),
                          tableNumber: table.tableNumber,
                          paymentStatus: 'pending'
                        };
                        printKOT(aggregatedOrder, settings);
                      }}
                      className="text-xs font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1"
                    >
                      <i className="fas fa-print"></i> Print Running KOT (All Items)
                    </button>
                  </div>

                  <div className="flex-1 p-4">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-2">Order History</div>
                    <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto custom-scrollbar">
                      {table.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm text-slate-700 border-b border-dashed border-slate-100 pb-1">
                          <span className="flex items-center gap-1">
                            <span className="font-bold text-slate-500">{item.quantity}x</span>
                            {item.name}
                            {item.portionType && <span className="text-[9px] bg-slate-100 px-1 rounded uppercase">{item.portionType}</span>}
                          </span>
                          <span className="font-medium">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t-2 border-orange-100 text-lg font-bold text-slate-800">
                      <span>Total Bill</span>
                      <span>₹{table.totalAmount}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50/50 border-t border-orange-100">
                    <button
                      onClick={async () => {
                        if (window.confirm(`Settle bill for Table ${table.tableNumber}? Total: ₹${table.totalAmount}`)) {
                          await Promise.all(table.orders.map(async (order: any) => {
                            await updateOrderStatus(order.id, 'delivered');
                            await updatePaymentStatus(order.id, 'paid');
                          }));
                          fetchDashboardData();
                        }
                      }}
                      className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-file-invoice-dollar"></i>
                      Settle Bill & Finish
                    </button>
                  </div>
                </div>
              ))}
              {/* Empty State for Tables */}
              {tenantOrders.filter(o => o.orderType === 'dine-in' && o.tableNumber && o.status !== 'cancelled' && o.paymentStatus !== 'paid').length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-200">
                    <i className="fas fa-chair text-3xl"></i>
                  </div>
                  <h3 className="text-slate-500 font-medium">No active tables</h3>
                  <p className="text-sm text-slate-400">Dine-in orders will appear here.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderDesk;
