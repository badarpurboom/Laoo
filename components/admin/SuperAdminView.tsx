
import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Restaurant } from '../../types';
import { restaurantService } from '../../services/api';

const SuperAdminView: React.FC = () => {
    const { restaurants, addRestaurant, updateRestaurant, deleteRestaurant, fetchDashboardData } = useStore();
    const [showModal, setShowModal] = useState(false);
    const [editModal, setEditModal] = useState<Restaurant | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
    const [stats, setStats] = useState({ totalRestaurants: 0, activeRestaurants: 0, totalOrders: 0, totalRevenue: 0 });

    useEffect(() => {
        fetchDashboardData();
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const resp = await restaurantService.getStats();
            setStats(resp.data);
        } catch (err) {
            console.error("Failed to load stats", err);
        }
    };

    const [newRestaurant, setNewRestaurant] = useState({
        name: '',
        ownerName: '',
        email: '',
        phone: '',
    });
    const [generatedPassword, setGeneratedPassword] = useState('');

    // Edit form state
    const [editForm, setEditForm] = useState({
        name: '',
        ownerName: '',
        email: '',
        phone: '',
        password: '',
    });

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
            loadStats();
            alert(`Restaurant Created!\nUsername: ${username}\nPassword: ${password}\nPlease save these credentials.`);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to create restaurant.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (res: Restaurant) => {
        setEditModal(res);
        setEditForm({
            name: res.name,
            ownerName: res.ownerName,
            email: res.email,
            phone: res.phone,
            password: '',
        });
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editModal) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const updateData: any = {
                ...editModal,
                name: editForm.name,
                ownerName: editForm.ownerName,
                email: editForm.email,
                phone: editForm.phone,
                slug: generateSlug(editForm.name),
            };
            if (editForm.password.trim()) {
                updateData.password = editForm.password.trim();
            }
            await updateRestaurant(updateData);
            setEditModal(null);
            fetchDashboardData();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to update restaurant.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleRestaurantStatus = (res: Restaurant) => {
        updateRestaurant({ ...res, isActive: !res.isActive });
        setTimeout(loadStats, 500);
    };

    const togglePasswordVisibility = (id: string) => {
        setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Filter and search
    const filteredRestaurants = restaurants.filter(res => {
        const matchesSearch = searchQuery === '' ||
            res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            res.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            res.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            res.phone.includes(searchQuery);

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && res.isActive) ||
            (statusFilter === 'inactive' && !res.isActive);

        return matchesSearch && matchesStatus;
    });

    const statCards = [
        { label: 'Total Restaurants', value: stats.totalRestaurants, icon: 'fas fa-store', color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Active', value: stats.activeRestaurants, icon: 'fas fa-check-circle', color: 'from-green-500 to-green-600', bg: 'bg-green-50' },
        { label: 'Total Orders', value: stats.totalOrders.toLocaleString(), icon: 'fas fa-receipt', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
        { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: 'fas fa-rupee-sign', color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50' },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <i className="fas fa-bolt text-white text-sm"></i>
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 tracking-tight">Super Admin</h1>
                            <p className="text-xs text-slate-400">Manage all restaurants</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { loadStats(); fetchDashboardData(); }}
                            className="text-slate-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-slate-50 transition-all"
                            title="Refresh"
                        >
                            <i className="fas fa-sync-alt text-sm"></i>
                        </button>
                        <button
                            onClick={() => {
                                useStore.getState().setCurrentUser(null);
                                window.location.hash = '#/login';
                            }}
                            className="text-slate-500 hover:text-red-500 font-bold text-sm px-3 py-2 rounded-lg hover:bg-red-50 transition-all"
                        >
                            <i className="fas fa-sign-out-alt mr-1"></i> Logout
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 text-sm"
                        >
                            <i className="fas fa-plus text-xs"></i> New Restaurant
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                                    <i className={`${stat.icon} text-sm bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}></i>
                                </div>
                            </div>
                            <div className="text-2xl font-black text-slate-800">{stat.value}</div>
                            <div className="text-xs font-medium text-slate-400 mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Search & Filter Bar */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="relative flex-1 w-full">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
                        <input
                            type="text"
                            placeholder="Search by name, owner, email, phone..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {(['all', 'active', 'inactive'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-2 rounded-lg text-xs font-bold capitalize transition-all ${statusFilter === status
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                    <div className="text-xs text-slate-400 font-medium whitespace-nowrap">
                        {filteredRestaurants.length} of {restaurants.length}
                    </div>
                </div>

                {/* Restaurant Cards (Mobile) + Table (Desktop) */}
                {/* Mobile Card View */}
                <div className="block lg:hidden space-y-4">
                    {filteredRestaurants.map(res => (
                        <div key={res.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-50 flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-slate-800">{res.name}</h3>
                                    <p className="text-xs text-slate-400">{res.email}</p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${res.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {res.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="p-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <i className="fas fa-user text-[10px] text-slate-300 w-4"></i>
                                    {res.ownerName}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <i className="fas fa-phone text-[10px] text-slate-300 w-4"></i>
                                    {res.phone}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                                    <i className="fas fa-key text-[10px] text-slate-300 w-4"></i>
                                    User: {res.username || 'N/A'}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                                    <i className="fas fa-lock text-[10px] text-slate-300 w-4"></i>
                                    Pass: {showPassword[res.id] ? res.password : '••••••'}
                                    <button onClick={() => togglePasswordVisibility(res.id)} className="text-indigo-500 hover:text-indigo-700 ml-1">
                                        <i className={`fas ${showPassword[res.id] ? 'fa-eye-slash' : 'fa-eye'} text-[10px]`}></i>
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <i className="fas fa-receipt text-[10px] text-slate-300 w-4"></i>
                                    {(res as any)._count?.orders || 0} orders · {(res as any)._count?.menuItems || 0} items
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <i className="fas fa-link text-[10px] text-slate-300 w-4"></i>
                                    <span className="bg-slate-50 px-2 py-0.5 rounded text-[10px] font-mono">/r/{res.slug}</span>
                                    <button
                                        onClick={() => {
                                            const url = `${window.location.origin}${window.location.pathname}#/r/${res.slug}`;
                                            navigator.clipboard.writeText(url);
                                            alert('Link copied!');
                                        }}
                                        className="text-indigo-500"
                                    >
                                        <i className="fas fa-copy text-[10px]"></i>
                                    </button>
                                </div>
                            </div>
                            <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                                <button onClick={() => openEditModal(res)} className="flex-1 text-xs font-bold py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all">
                                    <i className="fas fa-edit mr-1"></i> Edit
                                </button>
                                <button onClick={() => toggleRestaurantStatus(res)} className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${res.isActive ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-500 hover:bg-green-100'}`}>
                                    {res.isActive ? 'Disable' : 'Enable'}
                                </button>
                                <button
                                    onClick={() => { if (confirm('Delete this restaurant? This cannot be undone.')) deleteRestaurant(res.id); }}
                                    className="px-3 text-xs font-bold py-2 rounded-lg bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Restaurant</th>
                                <th className="px-6 py-4">Owner</th>
                                <th className="px-6 py-4">Credentials</th>
                                <th className="px-6 py-4">Stats</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Link</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredRestaurants.map(res => (
                                <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800">{res.name}</div>
                                        <div className="text-xs text-slate-400">{res.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-slate-700">{res.ownerName}</div>
                                        <div className="text-[10px] text-slate-400">{res.phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-[10px] text-indigo-400 font-mono">User: {res.username || 'N/A'}</div>
                                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                            Pass: {showPassword[res.id] ? res.password : '••••••'}
                                            <button onClick={() => togglePasswordVisibility(res.id)} className="text-indigo-400 hover:text-indigo-600 ml-1">
                                                <i className={`fas ${showPassword[res.id] ? 'fa-eye-slash' : 'fa-eye'} text-[9px]`}></i>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs text-slate-600 font-medium">{(res as any)._count?.orders || 0} orders</div>
                                        <div className="text-[10px] text-slate-400">{(res as any)._count?.menuItems || 0} menu items</div>
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
                                                    alert('Link copied!');
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
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => openEditModal(res)}
                                                className="text-xs font-bold px-3 py-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-all"
                                                title="Edit"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                onClick={() => toggleRestaurantStatus(res)}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${res.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                                            >
                                                {res.isActive ? 'Disable' : 'Enable'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Delete this restaurant? This cannot be undone.')) {
                                                        deleteRestaurant(res.id);
                                                        setTimeout(loadStats, 500);
                                                    }
                                                }}
                                                className="text-xs font-bold px-3 py-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredRestaurants.length === 0 && (
                        <div className="py-16 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                                <i className="fas fa-store text-2xl"></i>
                            </div>
                            <h3 className="text-slate-500 font-medium">No restaurants found</h3>
                            <p className="text-sm text-slate-400 mt-1">
                                {searchQuery ? 'Try a different search term' : 'Add your first restaurant'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Restaurant Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-black text-slate-800">Add Restaurant</h3>
                            <button onClick={() => { setShowModal(false); setError(null); }} className="text-slate-400 hover:text-slate-600 p-1">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium flex items-center gap-2">
                                    <i className="fas fa-exclamation-circle"></i>
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Restaurant Name</label>
                                <input required type="text" value={newRestaurant.name} onChange={e => setNewRestaurant({ ...newRestaurant, name: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Owner Name</label>
                                    <input required type="text" value={newRestaurant.ownerName} onChange={e => setNewRestaurant({ ...newRestaurant, ownerName: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Phone</label>
                                    <input required type="text" value={newRestaurant.phone} onChange={e => setNewRestaurant({ ...newRestaurant, phone: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Email</label>
                                <input required type="email" value={newRestaurant.email} onChange={e => setNewRestaurant({ ...newRestaurant, email: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Admin Password</label>
                                <input type="text" placeholder="Leave blank to auto-generate" value={generatedPassword} onChange={e => setGeneratedPassword(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono" />
                                <p className="text-[10px] text-slate-400 mt-1">Username auto-generated (e.g. admin_pizzahut_123)</p>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 text-sm ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? <><i className="fas fa-spinner fa-spin"></i> Creating...</> : 'Create Restaurant'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Restaurant Modal */}
            {editModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-black text-slate-800">Edit Restaurant</h3>
                            <button onClick={() => { setEditModal(null); setError(null); }} className="text-slate-400 hover:text-slate-600 p-1">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium flex items-center gap-2">
                                    <i className="fas fa-exclamation-circle"></i>
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Restaurant Name</label>
                                <input required type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Owner Name</label>
                                    <input required type="text" value={editForm.ownerName} onChange={e => setEditForm({ ...editForm, ownerName: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Phone</label>
                                    <input required type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Email</label>
                                <input required type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">
                                    Reset Password <span className="normal-case font-normal text-slate-300">(leave blank to keep current)</span>
                                </label>
                                <input type="text" placeholder="Enter new password" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono" />
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500">
                                <div className="font-mono text-[10px] text-slate-400">Username: {editModal.username}</div>
                                <div className="font-mono text-[10px] text-slate-400">Slug: /r/{generateSlug(editForm.name)}</div>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 text-sm ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminView;
