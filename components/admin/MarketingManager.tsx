import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Banner } from '../../types';
import { restaurantService } from '../../services/api';

const API_URL = '/api';

const MarketingManager: React.FC = () => {
    const { banners, fetchBanners, addBanner, updateBanner, deleteBanner, activeRestaurantId } = useStore();
    const [uploading, setUploading] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newImageUrl, setNewImageUrl] = useState('');
    const [isAddingViaUrl, setIsAddingViaUrl] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchBanners();
    }, [activeRestaurantId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeRestaurantId) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const imageUrl = await restaurantService.uploadImage(formData);
            await addBanner({ restaurantId: activeRestaurantId, imageUrl, title: newTitle || undefined, isActive: true });
            setNewTitle('');
        } catch (err) {
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleAddViaUrl = async () => {
        if (!newImageUrl.trim() || !activeRestaurantId) return;
        try {
            await addBanner({ restaurantId: activeRestaurantId, imageUrl: newImageUrl, title: newTitle || undefined, isActive: true });
            setNewTitle('');
            setNewImageUrl('');
            setIsAddingViaUrl(false);
        } catch (err) {
            alert('Failed to add banner. Please try again.');
        }
    };

    const handleToggle = async (banner: Banner) => {
        await updateBanner(banner.id, { isActive: !banner.isActive });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this banner? This action cannot be undone.')) return;
        setDeletingId(id);
        try {
            await deleteBanner(id);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                    <i className="fas fa-bullhorn"></i> Marketing Banners
                </h2>
                <p className="text-indigo-100 text-sm">Upload promotional banners. Active banners appear as a sliding carousel at the top of the customer menu. <strong>Recommended size: 1200 × 512 px</strong></p>
            </div>

            {/* Add Banner Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-base font-bold text-slate-800 mb-4">Add New Banner</h3>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Banner Title / Promo Text (Optional)</label>
                    <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder='e.g. "Weekend Special – 20% Off All Starters!"'
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Upload from device */}
                    <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${uploading ? 'border-indigo-300 bg-indigo-50 text-indigo-400' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-500'}`}>
                        {uploading ? (
                            <><i className="fas fa-spinner fa-spin"></i> Uploading...</>
                        ) : (
                            <><i className="fas fa-cloud-upload-alt text-lg"></i> Upload Image from Device</>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                    </label>

                    {/* Add via URL */}
                    <button
                        onClick={() => setIsAddingViaUrl(!isAddingViaUrl)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-500 transition-all text-sm"
                    >
                        <i className="fas fa-link text-lg"></i> Use Image URL
                    </button>
                </div>

                {isAddingViaUrl && (
                    <div className="mt-4 flex gap-2">
                        <input
                            type="url"
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            placeholder="https://example.com/banner.jpg"
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button
                            onClick={handleAddViaUrl}
                            className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
                        >
                            Add
                        </button>
                    </div>
                )}
            </div>

            {/* Banners List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-800">Your Banners ({banners.length})</h3>
                </div>

                {banners.length === 0 ? (
                    <div className="p-12 text-center">
                        <i className="fas fa-image text-slate-200 text-5xl mb-3"></i>
                        <p className="text-slate-400 font-medium">No banners yet</p>
                        <p className="text-slate-400 text-sm mt-1">Add your first promotional banner above.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {banners.map(banner => (
                            <div key={banner.id} className="flex items-center gap-4 p-4">
                                {/* Preview */}
                                <div className="w-24 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
                                    <img src={banner.imageUrl} alt={banner.title || 'Banner'} className="w-full h-full object-cover" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-800 text-sm truncate">{banner.title || 'Untitled Banner'}</p>
                                    <p className="text-xs text-slate-400 truncate">{banner.imageUrl}</p>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    {/* Toggle */}
                                    <button
                                        onClick={() => handleToggle(banner)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${banner.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${banner.isActive ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                                        {banner.isActive ? 'Active' : 'Paused'}
                                    </button>

                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(banner.id)}
                                        disabled={deletingId === banner.id}
                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        {deletingId === banner.id ? (
                                            <i className="fas fa-spinner fa-spin text-xs"></i>
                                        ) : (
                                            <i className="fas fa-trash text-xs"></i>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketingManager;
