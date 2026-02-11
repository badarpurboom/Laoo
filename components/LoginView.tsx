import React, { useState } from 'react';
import { useStore } from '../store';
import { restaurantService } from '../services/api';

const LoginView: React.FC = () => {
    const { setCurrentUser, setActiveRestaurantId } = useStore();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Super Admin Hardcoded Check
            if (username === 'superadmin' && password === 'password123') {
                setCurrentUser({
                    id: 'super-admin',
                    name: 'Super Admin',
                    email: 'admin@bistroflow.com',
                    role: 'SUPER_ADMIN'
                });
                setActiveRestaurantId(null);
                window.location.hash = '#/super-admin';
                return;
            }

            // Database Check for Restaurant Admin
            // In a real app, this would be a backend /auth/login call
            // For this demo, we can iterate through loaded restaurants or fetch
            // But since we might not have all loaded, let's fetch all restaurants first or use a specific find endpoint
            // Optimization: Created a quick specific find logic here.

            // Re-fetch restaurants to ensure latest data
            const resResp = await restaurantService.getAll();
            const allRestaurants = resResp.data;

            const restaurant = allRestaurants.find((r: any) =>
                (r.username === username || r.email === username) && r.password === password
            );

            if (restaurant && restaurant.isActive) {
                setCurrentUser({
                    id: `admin-${restaurant.id}`,
                    name: restaurant.ownerName,
                    email: restaurant.email,
                    role: 'RESTAURANT_ADMIN',
                    restaurantId: restaurant.id
                });
                setActiveRestaurantId(restaurant.id);
                window.location.hash = '#/admin';
            } else if (restaurant && !restaurant.isActive) {
                setError('Your account has been deactivated. Contact Super Admin.');
            } else {
                setError('Invalid username or password');
            }

        } catch (err) {
            console.error(err);
            setError('Login failed. Please try again.');
        } finally {
            setIsLoading(false);
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

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label htmlFor="username-email" className="block text-sm font-medium text-slate-700 mb-1">Username or Email</label>
                            <input
                                type="text"
                                id="username-email"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Enter username or email"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input
                                type="password"
                                id="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Enter password"
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <button
                            type="submit"
                            className="w-full p-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                'Login'
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-400 text-xs mt-10">
                    Powered by Laoo SaaS Engine v2.0
                </p>
            </div>
        </div>
    );
};

export default LoginView;
