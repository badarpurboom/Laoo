
import React from 'react';
import { useStore } from '../store';
import { User, UserRole } from '../types';

const LoginView: React.FC = () => {
    const { setCurrentUser, setActiveRestaurantId, restaurants } = useStore();

    const handleLogin = (role: UserRole, restaurantId?: string) => {
        const user: User = {
            id: `u-${Date.now()}`,
            name: role === 'SUPER_ADMIN' ? 'Super Admin' : 'Restaurant Admin',
            email: role === 'SUPER_ADMIN' ? 'super@admin.com' : 'res@admin.com',
            role,
            restaurantId,
        };
        setCurrentUser(user);
        if (restaurantId) {
            setActiveRestaurantId(restaurantId);
            window.location.hash = '#/admin';
        } else {
            setActiveRestaurantId(null);
            window.location.hash = '#/super-admin';
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-lg">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-12">
                        <i className="fas fa-rocket text-white text-3xl"></i>
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">SaaS Login</h1>
                    <p className="text-slate-500 mt-2 font-medium">Select your entry point</p>
                </div>

                <div className="space-y-6">
                    <button
                        onClick={() => handleLogin('SUPER_ADMIN')}
                        className="w-full group p-6 border-2 border-indigo-100 hover:border-indigo-600 rounded-3xl transition-all flex items-center justify-between bg-slate-50 hover:bg-indigo-50"
                    >
                        <div className="text-left">
                            <div className="text-indigo-600 font-black text-xs uppercase tracking-widest mb-1">Infrastructure</div>
                            <div className="text-xl font-bold text-slate-800">Super Admin</div>
                            <div className="text-sm text-slate-500">Manage all restaurants & platform</div>
                        </div>
                        <i className="fas fa-chevron-right text-indigo-400 group-hover:translate-x-1 transition-transform"></i>
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-100"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white px-3 text-xs font-black text-slate-300 uppercase tracking-widest">or login as tenant</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {restaurants.map(res => (
                            <button
                                key={res.id}
                                onClick={() => handleLogin('RESTAURANT_ADMIN', res.id)}
                                className="w-full p-5 border-2 border-slate-100 hover:border-orange-500 rounded-3xl transition-all flex items-center justify-between text-left group"
                            >
                                <div>
                                    <div className="font-bold text-slate-800">{res.name}</div>
                                    <div className="text-xs text-slate-500">{res.ownerName}</div>
                                </div>
                                <div className="bg-slate-50 group-hover:bg-orange-100 text-[10px] font-black uppercase text-slate-400 group-hover:text-orange-600 px-3 py-1 rounded-full transition-colors">
                                    Login →
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <p className="text-center text-slate-400 text-xs mt-10">
                    Powered by BistroFlow SaaS Engine v2.0
                </p>
            </div>
        </div>
    );
};

export default LoginView;
