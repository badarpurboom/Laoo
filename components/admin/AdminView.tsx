
import React, { useState } from 'react';
import { useStore } from '../../store';
import AdminDashboard from './AdminDashboard';
import OrderDesk from './OrderDesk';
import MenuManager from './MenuManager';
import AIChat from './AIChat';
import SettingsManager from './SettingsManager';

const AdminView: React.FC = () => {
  const { currentUser, setActiveRestaurantId, activeRestaurantId, setCurrentUser, settings, restaurants } = useStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'menu' | 'ai' | 'settings'>('dashboard');
  const [audioEnabled, setAudioEnabled] = React.useState(true);



  React.useEffect(() => {
    if (currentUser?.restaurantId && activeRestaurantId !== currentUser.restaurantId) {
      setActiveRestaurantId(currentUser.restaurantId);
    }
  }, [currentUser, activeRestaurantId, setActiveRestaurantId]);

  const activeRestaurant = restaurants.find(r => r.id === currentUser?.restaurantId);

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveRestaurantId(null);
    window.location.hash = '#/login';
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line' },
    { id: 'orders', label: 'Order Desk', icon: 'fas fa-clipboard-list' },
    { id: 'menu', label: 'Menu Manager', icon: 'fas fa-th-large' },
    { id: 'ai', label: 'AI Analytics', icon: 'fas fa-robot' },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog' },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center">
            <i className="fas fa-bolt text-xs"></i>
          </div>
          <span className="font-bold text-lg tracking-tight">Laoo</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <i className={tab.icon}></i>
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 transition-colors"
          >
            <i className="fas fa-sign-out-alt"></i>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-slate-50 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 capitalize">{activeTab}</h1>
            <p className="text-slate-500 text-sm">Managing {activeRestaurant?.name || 'Restaurant'}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800">{currentUser?.name}</p>
              <p className="text-xs text-slate-500">{activeRestaurant?.name}</p>
            </div>
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
              <img src="https://picsum.photos/100/100?random=admin" alt="avatar" />
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'orders' && <OrderDesk />}
        {activeTab === 'menu' && <MenuManager />}
        {activeTab === 'ai' && <AIChat />}
        {activeTab === 'settings' && <SettingsManager />}
      </main>
    </div>
  );
};

export default AdminView;
