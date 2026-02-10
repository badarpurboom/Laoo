import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import CustomerView from './components/customer/CustomerView';
import AdminView from './components/admin/AdminView';
import SuperAdminView from './components/admin/SuperAdminView';
import DocumentationView from './components/DocumentationView';
import LoginView from './components/LoginView';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'customer' | 'admin' | 'super-admin' | 'docs' | 'login' | 'public-menu'>('customer');
  const { currentUser, activeRestaurantId, setActiveRestaurantBySlug, fetchDashboardData } = useStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, activeRestaurantId]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/r/')) {
        const slug = hash.split('#/r/')[1];
        if (slug) {
          setActiveRestaurantBySlug(slug);
          setActiveView('public-menu');
        }
      } else if (hash === '#/super-admin') {
        setActiveView('super-admin');
      } else if (hash === '#/admin') {
        setActiveView('admin');
      } else if (hash === '#/docs') {
        setActiveView('docs');
      } else if (hash === '#/login') {
        setActiveView('login');
      } else {
        setActiveView('customer');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view: 'customer' | 'admin' | 'docs') => {
    if (view === 'customer') window.location.hash = '';
    else window.location.hash = `#/${view}`;
  };

  // Simple route guard simulation
  const renderView = () => {
    switch (activeView) {
      case 'super-admin':
        return currentUser?.role === 'SUPER_ADMIN' ? <SuperAdminView /> : <LoginView />;
      case 'admin':
        return currentUser?.role === 'RESTAURANT_ADMIN' ? <AdminView /> : <LoginView />;
      case 'docs':
        return <DocumentationView />;
      case 'login':
        return <LoginView />;
      case 'public-menu':
        return <CustomerView />;
      default:
        return <CustomerView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {renderView()}
    </div>
  );
};

export default App;
