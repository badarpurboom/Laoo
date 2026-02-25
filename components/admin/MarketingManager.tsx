import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Banner } from '../../types';
import { restaurantService, aiServiceApi } from '../../services/api';

const API_URL = '/api';

const MarketingManager: React.FC = () => {
    const { banners, fetchBanners, addBanner, updateBanner, deleteBanner, activeRestaurantId, settings, updateSettings, menuItems } = useStore();
    const [uploading, setUploading] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newImageUrl, setNewImageUrl] = useState('');
    const [isAddingViaUrl, setIsAddingViaUrl] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isPickingAI, setIsPickingAI] = useState(false);
    const [popup1Text, setPopup1Text] = useState(settings.popup1Text || '');
    const [popup2Text, setPopup2Text] = useState(settings.popup2Text || '');

    useEffect(() => {
        setPopup1Text(settings.popup1Text || '');
        setPopup2Text(settings.popup2Text || '');
    }, [settings.popup1Text, settings.popup2Text]);

    const handleSaveTaglines = () => {
        updateSettings({ ...settings, popup1Text, popup2Text });
    };

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

    const handleTogglePopup = async () => {
        await updateSettings({ ...settings, aiUpsellPopupEnabled: !settings.aiUpsellPopupEnabled });
    };

    const handleModeChange = async (mode: 'MANUAL' | 'AI') => {
        await updateSettings({ ...settings, popupMode: mode });
    };

    const handleManualSelect = async (popupNum: 1 | 2, itemId: string) => {
        const updates = popupNum === 1 ? { popupItem1Id: itemId } : { popupItem2Id: itemId };
        await updateSettings({ ...settings, ...updates });
    };

    const handleLetAIDecide = async () => {
        if (!activeRestaurantId) return;
        setIsPickingAI(true);
        try {
            const resp = await aiServiceApi.pickFlashItems(activeRestaurantId, "");
            if (resp.data?.success) {
                await updateSettings({
                    ...settings,
                    popupItem1Id: resp.data.popupItem1Id,
                    popupItem2Id: resp.data.popupItem2Id
                });
                alert("✨ Magic! Gemini has successfully analyzed your menu and picked the 2 best items for upselling.");
            }
        } catch (e: any) {
            alert("Failed to let AI decide: " + (e.response?.data?.error || e.message));
        } finally {
            setIsPickingAI(false);
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

            {/* AI Flash Popups Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-transparent bg-clip-text">✨ AI Flash Popups</span>
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">Automatically suggest high-value items to customers as they browse the menu.</p>
                    </div>

                    {/* Master Toggle */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-600">
                            {settings.aiUpsellPopupEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <button
                            onClick={handleTogglePopup}
                            className={`w-14 h-7 rounded-full transition-colors relative flex items-center shrink-0 ${settings.aiUpsellPopupEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        >
                            <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-transform duration-300 ${settings.aiUpsellPopupEnabled ? 'translate-x-8' : 'translate-x-1'}`}></div>
                        </button>
                    </div>
                </div>

                {settings.aiUpsellPopupEnabled && (
                    <div className="p-6 bg-slate-50/50">
                        {/* Custom Taglines */}
                        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700">Popup Taglines</label>
                                    <p className="text-xs text-slate-500">Customize the message for each popup.</p>
                                </div>
                                <button
                                    onClick={handleSaveTaglines}
                                    disabled={popup1Text === (settings.popup1Text || '') && popup2Text === (settings.popup2Text || '')}
                                    className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Popup 1 Tagline</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            maxLength={60}
                                            value={popup1Text}
                                            onChange={(e) => setPopup1Text(e.target.value)}
                                            placeholder="🌟 Customer Favorite! Try it today."
                                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 pr-16"
                                        />
                                        <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold ${popup1Text.length >= 60 ? 'text-red-500' : 'text-slate-400'}`}>
                                            {popup1Text.length}/60
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Popup 2 Tagline</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            maxLength={60}
                                            value={popup2Text}
                                            onChange={(e) => setPopup2Text(e.target.value)}
                                            placeholder="🔥 Chef's Secret! Abhi bhi confused ho?"
                                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 pr-16"
                                        />
                                        <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold ${popup2Text.length >= 60 ? 'text-red-500' : 'text-slate-400'}`}>
                                            {popup2Text.length}/60
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mode Selection */}
                        <div className="flex bg-slate-200/60 p-1 rounded-xl w-full max-w-sm mb-6">
                            <button
                                onClick={() => handleModeChange('MANUAL')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${settings.popupMode === 'MANUAL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <i className="fas fa-hand-pointer text-xs"></i> Manual Selection
                            </button>
                            <button
                                onClick={() => handleModeChange('AI')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${settings.popupMode === 'AI' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <i className="fas fa-sparkles text-xs"></i> AI Auto-Pilot
                            </button>
                        </div>

                        {settings.popupMode === 'MANUAL' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* First Item Selection */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Popup 1 (Top Right)</label>
                                    <p className="text-xs text-slate-500 mb-3">Appears 20 seconds after the menu is opened.</p>
                                    <select
                                        value={settings.popupItem1Id || ''}
                                        onChange={(e) => handleManualSelect(1, e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    >
                                        <option value="" disabled>Select a dish...</option>
                                        {menuItems.map(m => (
                                            <option key={`p1-${m.id}`} value={m.id}>{m.name} - ₹{m.fullPrice}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Second Item Selection */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Popup 2 (Bottom Left)</label>
                                    <p className="text-xs text-slate-500 mb-3">Appears 10 seconds after the first popup is skipped.</p>
                                    <select
                                        value={settings.popupItem2Id || ''}
                                        onChange={(e) => handleManualSelect(2, e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    >
                                        <option value="" disabled>Select a dish...</option>
                                        {menuItems.map(m => (
                                            <option key={`p2-${m.id}`} value={m.id}>{m.name} - ₹{m.fullPrice}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center bg-white border border-indigo-100 rounded-2xl p-8 shadow-sm">
                                <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-2xl mx-auto mb-4">
                                    <i className="fas fa-robot"></i>
                                </div>
                                <h4 className="text-lg font-bold text-slate-800 mb-2">Let AI Handle The Upselling</h4>
                                <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                                    Gemini will analyze your menu, prices, and trends to automatically select the most enticing items for the flash popups.
                                </p>
                                <button
                                    onClick={handleLetAIDecide}
                                    disabled={isPickingAI}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-indigo-500/20 shadow-lg disabled:opacity-70 flex items-center gap-2 mx-auto"
                                >
                                    {isPickingAI ? (
                                        <><i className="fas fa-circle-notch fa-spin"></i> Analyzing Menu...</>
                                    ) : (
                                        <><i className="fas fa-magic"></i> Let AI Decide Now</>
                                    )}
                                </button>

                                {(settings.popupItem1Id || settings.popupItem2Id) && (
                                    <div className="mt-8 pt-6 border-t border-slate-100 text-left">
                                        <p className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Currently Selected by AI</p>
                                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                            {settings.popupItem1Id && (
                                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">P1</div>
                                                    <span className="text-sm font-semibold text-slate-700">{menuItems.find(m => m.id === settings.popupItem1Id)?.name || 'Unknown'}</span>
                                                </div>
                                            )}
                                            {settings.popupItem2Id && (
                                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-purple-100 text-purple-500 flex items-center justify-center font-bold text-xs">P2</div>
                                                    <span className="text-sm font-semibold text-slate-700">{menuItems.find(m => m.id === settings.popupItem2Id)?.name || 'Unknown'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketingManager;
