
import React, { useMemo } from 'react';
import { useStore } from '../../store';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const AdminDashboard: React.FC = () => {
  const { orders, activeRestaurantId, categories, menuItems } = useStore();

  const tenantOrders = orders.filter(o => o.restaurantId === activeRestaurantId);

  const totalRevenue = tenantOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = tenantOrders.filter(o => o.status === 'pending').length;
  const preparingOrders = tenantOrders.filter(o => o.status === 'preparing').length;
  const deliveryOrders = tenantOrders.filter(o => o.status === 'delivered').length;

  // Calculate real revenue data for the last 7 days
  const revenueData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        name: days[d.getDay()],
        dateStr: d.toDateString(), // For comparing
        revenue: 0
      };
    });

    tenantOrders.forEach(order => {
      // Only count completed orders toward revenue chart
      if (order.status !== 'cancelled' && order.timestamp) {
        const orderDate = new Date(order.timestamp).toDateString();
        const dayMatch = last7Days.find(d => d.dateStr === orderDate);
        if (dayMatch) {
          dayMatch.revenue += order.totalAmount;
        }
      }
    });

    return last7Days.map(d => ({ name: d.name, revenue: Math.round(d.revenue) }));
  }, [tenantOrders]);

  // Calculate top selling categories
  const topCategoriesData = useMemo(() => {
    const categorySales: Record<string, number> = {};
    const tenantCategories = categories.filter(c => c.restaurantId === activeRestaurantId);

    tenantOrders.forEach(order => {
      if (order.status !== 'cancelled') {
        order.items.forEach(item => {
          const menuItem = menuItems.find(m => m.id === item.id);
          if (menuItem) {
            const catId = menuItem.categoryId;
            if (categorySales[catId]) {
              categorySales[catId] += item.quantity;
            } else {
              categorySales[catId] = item.quantity;
            }
          }
        });
      }
    });

    return tenantCategories.map(cat => ({
      name: cat.name,
      value: categorySales[cat.id] || 0
    })).sort((a, b) => b.value - a.value).slice(0, 5); // Get top 5

  }, [tenantOrders, categories, menuItems, activeRestaurantId]);

  // Calculate AI Upsell Analytics
  const aovMetrics = useMemo(() => {
    let popupRev = 0;
    let mysteryBoxRev = 0;
    let aiCrossSellRev = 0;
    let rewardCount = 0; // Number of times reward was given

    tenantOrders.forEach(order => {
      if (order.status === 'cancelled') return;
      order.items.forEach(item => {
        if (item.marketingSource === 'POPUP') popupRev += (item.price * item.quantity);
        if (item.marketingSource === 'MYSTERY_BOX') mysteryBoxRev += (item.price * item.quantity);
        if (item.marketingSource === 'AI_CROSS_SELL') aiCrossSellRev += (item.price * item.quantity);
        if (item.marketingSource === 'REWARD') {
          rewardCount += item.quantity; // Count how many free reward items were given
        }
        // Fallback for older upsell items before tagging
        if (item.isUpsell && !item.marketingSource) aiCrossSellRev += (item.price * item.quantity);
      });
    });

    return { popupRev, mysteryBoxRev, aiCrossSellRev, rewardCount, totalAovRev: popupRev + mysteryBoxRev + aiCrossSellRev };
  }, [tenantOrders]);

  const topAIItemsData = useMemo(() => {
    const itemSales: Record<string, number> = {};
    tenantOrders.forEach(order => {
      if (order.status !== 'cancelled') {
        order.items.forEach(item => {
          if (item.isUpsell) {
            itemSales[item.name] = (itemSales[item.name] || 0) + item.quantity;
          }
        });
      }
    });
    return Object.keys(itemSales).map(name => ({
      name,
      value: itemSales[name]
    })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [tenantOrders]);

  const stats = [
    { label: "Total Revenue", value: `₹${totalRevenue.toFixed(0)}`, icon: 'fas fa-dollar-sign', color: 'bg-emerald-100 text-emerald-600' },
    { label: "AOV Opt. Revenue", value: `₹${aovMetrics.totalAovRev.toFixed(0)}`, icon: 'fas fa-chart-line', color: 'bg-indigo-100 text-indigo-600' },
    { label: "Total Orders", value: tenantOrders.length, icon: 'fas fa-shopping-bag', color: 'bg-blue-100 text-blue-600' },
    { label: "Pending", value: pendingOrders, icon: 'fas fa-clock', color: 'bg-orange-100 text-orange-600' },
    { label: "Delivered", value: deliveryOrders, icon: 'fas fa-check-circle', color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div className={`${stat.color} p-3 rounded-xl`}>
                <i className={stat.icon}></i>
              </div>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
            <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Analysis (Last 7 Days)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`₹${value}`, 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AOV Performance Breakdown */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <i className="fas fa-bullseye text-indigo-500"></i> AOV Feature Performance
          </h3>
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <i className="fas fa-sparkles"></i>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">AI Cross-Sells</h4>
                  <p className="text-[10px] text-slate-500">Contextual pairings</p>
                </div>
              </div>
              <span className="font-black text-indigo-600">₹{aovMetrics.aiCrossSellRev.toFixed(0)}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-rose-50 rounded-xl border border-rose-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <i className="fas fa-bolt"></i>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Flash Popups</h4>
                  <p className="text-[10px] text-slate-500">Top items & chef secrets</p>
                </div>
              </div>
              <span className="font-black text-rose-600">₹{aovMetrics.popupRev.toFixed(0)}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl border border-orange-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <i className="fas fa-box-open"></i>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Mystery Box</h4>
                  <p className="text-[10px] text-slate-500">Checkout impulse buys</p>
                </div>
              </div>
              <span className="font-black text-orange-600">₹{aovMetrics.mysteryBoxRev.toFixed(0)}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <i className="fas fa-gift"></i>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Spend Rewards</h4>
                  <p className="text-[10px] text-slate-500">Times reward was claimed today</p>
                </div>
              </div>
              <span className="font-black text-emerald-600">{aovMetrics.rewardCount} <span className="text-xs font-semibold text-emerald-500">times</span></span>
            </div>
          </div>
        </div>

        {/* Popular Items Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Top Selling Categories</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCategoriesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`${value} Items Sold`, 'Sales']}
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top AI Items Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <i className="fas fa-magic text-indigo-500"></i> Top AI Upsold Items
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topAIItemsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`${value} Items Upsold`, 'Sales']}
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
          <button className="text-indigo-600 text-sm font-bold hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenantOrders.slice(0, 5).map(order => (
                <tr key={order.id} className="text-sm hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium">{order.id}</td>
                  <td className="px-6 py-4">{order.customerName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold">₹{order.totalAmount.toFixed(0)}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
              {tenantOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">No orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
