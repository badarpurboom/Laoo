
import React, { useState } from 'react';
import { useStore } from '../../store';
import { Restaurant } from '../../types';

const SuperAdminView: React.FC = () => {
    const { restaurants, addRestaurant, updateRestaurant, deleteRestaurant, fetchDashboardData } = useStore();
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        fetchDashboardData();
    }, []);
    const [newRestaurant, setNewRestaurant] = useState({
        name: '',
        ownerName: '',
        email: '',
        phone: '',
    });
    const [generatedPassword, setGeneratedPassword] = useState('');

    const generateSlug = (name: string) => {
        return name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
    };

    const generateUsername = (name: string) => {
        return `admin_${name.toLowerCase().replace(/\s+/g, '')}_${Math.floor(Math.random() * 1000)}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            const username = generateUsername(newRestaurant.name);
            const password = generatedPassword || Math.random().toString(36).slice(-8);

            const restaurantData = {
                ...newRestaurant,
                slug: generateSlug(newRestaurant.name),
                isActive: true,
                username,
                password
            };
            await addRestaurant(restaurantData as any);
            setShowModal(false);
            setNewRestaurant({ name: '', ownerName: '', email: '', phone: '' });
            setGeneratedPassword('');
            alert(`Restaurant Created!\nUsername: ${username}\nPassword: ${password}\nPlease save these credentials.`);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to create restaurant. Please ensure the backend is running and the database is migrated.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleRestaurantStatus = (res: Restaurant) => {
        updateRestaurant({ ...res, isActive: !res.isActive });
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Super Admin</h1>
                    <p className="text-slate-500">Manage all registered restaurants</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            useStore.getState().setCurrentUser(null);
                            window.location.hash = '#/login';
                        }}
                        className="text-slate-500 hover:text-red-500 font-bold text-sm px-4 py-3"
                    >
                        <i className="fas fa-sign-out-alt mr-2"></i> Logout
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                        <i className="fas fa-plus"></i> New Restaurant
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        <tr>
                            <th className="px-6 py-4">Restaurant</th>
                            <th className="px-6 py-4">Owner</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Public Link</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {restaurants.map(res => (
                            <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800">{res.name}</div>
                                    <div className="text-xs text-slate-400">{res.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-slate-700">{res.ownerName}</div>
                                    <div className="text-[10px] text-slate-400">{res.phone}</div>
                                    <div className="text-[10px] text-indigo-400 mt-1 font-mono">User: {res.username || 'N/A'}</div>
                                    <div className="text-[10px] text-slate-300 font-mono">Pass: {res.password ? '****' : 'N/A'}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${res.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {res.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="text-[10px] bg-slate-100 px-2 py-1 rounded-md text-slate-500 font-mono">
                                            /r/{res.slug}
                                        </div>
                                        <button
                                            onClick={() => {
                                                const url = `${window.location.origin}${window.location.pathname}#/r/${res.slug}`;
                                                navigator.clipboard.writeText(url);
                                                alert('Link copied to clipboard!');
                                            }}
                                            className="text-indigo-600 hover:text-indigo-800 p-1"
                                            title="Copy Public Link"
                                        >
                                            <i className="fas fa-copy text-xs"></i>
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-400">
                                    {res.createdAt ? new Date(res.createdAt).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => toggleRestaurantStatus(res)}
                                        className={`text-xs font-bold px-4 py-2 rounded-xl transition-all mr-2 ${res.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                                    >
                                        {res.isActive ? 'Disable' : 'Enable'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Are you sure you want to delete this restaurant? This cannot be undone.')) {
                                                deleteRestaurant(res.id);
                                            }
                                        }}
                                        className="text-xs font-bold px-4 py-2 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-800">Add Restaurant</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-4">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium flex items-center gap-2">
                                    <i className="fas fa-exclamation-circle"></i>
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase mb-1 tracking-widest">Restaurant Name</label>
                                <input required type="text" value={newRestaurant.name} onChange={e => setNewRestaurant({ ...newRestaurant, name: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-1 tracking-widest">Owner Name</label>
                                    <input required type="text" value={newRestaurant.ownerName} onChange={e => setNewRestaurant({ ...newRestaurant, ownerName: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-1 tracking-widest">Phone</label>
                                    <input required type="text" value={newRestaurant.phone} onChange={e => setNewRestaurant({ ...newRestaurant, phone: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase mb-1 tracking-widest">Email Address</label>
                                <input required type="email" value={newRestaurant.email} onChange={e => setNewRestaurant({ ...newRestaurant, email: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase mb-1 tracking-widest">Set Admin Password</label>
                                <input
                                    type="text"
                                    placeholder="Leave blank to auto-generate"
                                    value={generatedPassword}
                                    onChange={e => setGeneratedPassword(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Username will be auto-generated (e.g. admin_pizzahut_123)</p>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 mt-4 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i> Creating...
                                    </>
                                ) : (
                                    'Create Restaurant'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminView;
