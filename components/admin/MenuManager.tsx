
import React, { useState } from 'react';
import { useStore } from '../../store';
import { MenuItem, Category } from '../../types';
import ImageUploader from '../common/ImageUploader';

const MenuManager: React.FC = () => {
  const {
    menuItems,
    categories,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addCategoriesBulk,
    deleteCategory,
    activeRestaurantId
  } = useStore();

  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  // Category management state
  const [newCategoriesText, setNewCategoriesText] = useState('');
  const [isSubmittingCats, setIsSubmittingCats] = useState(false);

  const tenantCategories = categories.filter(c => c.restaurantId === activeRestaurantId);
  const tenantMenuItems = menuItems.filter(m => m.restaurantId === activeRestaurantId);

  const getEmptyItem = (): MenuItem => ({
    id: '',
    restaurantId: activeRestaurantId || '',
    name: '',
    description: '',
    fullPrice: 0,
    halfPrice: undefined,
    categoryId: tenantCategories[0]?.id || '',
    imageUrl: 'https://picsum.photos/400/300?random=' + Date.now(),
    isVeg: true,
    isAvailable: true
  });

  const [formData, setFormData] = useState<MenuItem>(getEmptyItem());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      alert("Please select a category first. Use 'Manage Categories' if none exist.");
      return;
    }
    if (formData.halfPrice && formData.halfPrice >= formData.fullPrice) {
      alert("Half price must be less than full price");
      return;
    }

    setIsSubmittingItem(true);
    try {
      if (editingItem) {
        await updateMenuItem(formData);
      } else {
        await addMenuItem(formData);
      }
      setShowModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save menu item. Please check your connection.");
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const handleBulkCategories = async (e: React.FormEvent) => {
    e.preventDefault();
    const names = newCategoriesText.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (names.length === 0) return;

    setIsSubmittingCats(true);
    try {
      const catsToCreate = names.map(name => ({ name }));
      await addCategoriesBulk(catsToCreate);
      setNewCategoriesText('');
      // If no category was selected in form, select the first newly created one
      if (!formData.categoryId && names.length > 0) {
        // This is a bit tricky since state might not be updated yet, 
        // but the next time modal opens it will be fine.
      }
      setShowCatModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to add categories");
    } finally {
      setIsSubmittingCats(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input type="text" placeholder="Search menu..." className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64" />
          </div>
          <select className="bg-slate-100 border-none rounded-lg text-sm px-4 py-2 outline-none">
            <option value="">All Categories</option>
            {tenantCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCatModal(true)}
            className="bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors border border-slate-200"
          >
            <i className="fas fa-tags mr-2"></i> Manage Categories
          </button>
          <button
            onClick={() => { setFormData(getEmptyItem()); setEditingItem(null); setShowModal(true); }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
          >
            <i className="fas fa-plus mr-2"></i> Add Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tenantMenuItems.map(item => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group">
            <div className="h-40 relative">
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => { setEditingItem(item); setFormData(item); setShowModal(true); }}
                  className="w-10 h-10 bg-white text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-50"
                  title="Edit Item"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button
                  onClick={() => { if (confirm('Delete this item?')) deleteMenuItem(item.id); }}
                  className="w-10 h-10 bg-white text-red-600 rounded-lg flex items-center justify-center hover:bg-red-50"
                  title="Delete Item"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
              <div className="absolute top-2 right-2 flex gap-1">
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${item.isAvailable ? 'bg-green-500 text-white' : 'bg-slate-500 text-white'}`}>
                  {item.isAvailable ? 'IN STOCK' : 'OUT OF STOCK'}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                <div className="text-right">
                  <div className="text-indigo-600 font-bold text-sm">₹{item.fullPrice}</div>
                  {item.halfPrice && <div className="text-slate-400 text-[10px]">Half: ₹{item.halfPrice}</div>}
                </div>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
              <div className="mt-3 pt-3 border-t flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {tenantCategories.find(c => c.id === item.categoryId)?.name || 'Category'}
                </span>
                <span className={`w-3 h-3 rounded-full flex items-center justify-center ${item.isVeg ? 'border border-green-500' : 'border border-red-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </span>
              </div>
            </div>
          </div>
        ))}
        {tenantMenuItems.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
              <i className="fas fa-plus text-2xl"></i>
            </div>
            <h3 className="font-bold text-slate-800">No menu items yet</h3>
            <p className="text-sm text-slate-500">Start by adding your first dish!</p>
          </div>
        )}
      </div>

      {/* Item Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-4 py-3 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">{editingItem ? 'Edit Item' : 'New Item'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <ImageUploader
                    currentImage={formData.imageUrl}
                    onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
                    label="Item Image"
                    className="h-24"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Full Price (₹)*</label>
                  <input
                    required
                    type="number"
                    value={formData.fullPrice}
                    onChange={e => setFormData({ ...formData, fullPrice: parseFloat(e.target.value) })}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Half Price (₹)</label>
                  <input
                    type="number"
                    value={formData.halfPrice || ''}
                    onChange={e => setFormData({ ...formData, halfPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Category</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                  >
                    <option value="">Select Category</option>
                    {tenantCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-10 text-xs"
                  ></textarea>
                </div>
                <div className="flex items-center gap-3 col-span-2 py-1">
                  <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    <input
                      type="checkbox"
                      checked={formData.isVeg}
                      onChange={e => setFormData({ ...formData, isVeg: e.target.checked })}
                      className="w-3 h-3 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] font-bold text-slate-700">VEG</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                      className="w-3 h-3 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] font-bold text-slate-700">AVAILABLE</span>
                  </label>
                </div>
              </div>
              <div className="pt-1 flex gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 text-xs">Cancel</button>
                <button
                  type="submit"
                  disabled={isSubmittingItem}
                  className={`flex-1 py-1.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 flex items-center justify-center gap-2 text-xs ${isSubmittingItem ? 'opacity-50' : ''}`}
                >
                  {isSubmittingItem ? <i className="fas fa-spinner fa-spin"></i> : (editingItem ? 'Save' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Manage Categories</h3>
                <p className="text-xs text-slate-500">Add or remove menu categories for your restaurant</p>
              </div>
              <button onClick={() => setShowCatModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Add Bulk Section */}
              <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">Add Multiple Categories</h4>
                <form onSubmit={handleBulkCategories}>
                  <textarea
                    placeholder="Enter category names, one per line (e.g. Italian, Chinese, Drinks)"
                    value={newCategoriesText}
                    onChange={(e) => setNewCategoriesText(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-32 text-sm"
                  ></textarea>
                  <button
                    type="submit"
                    disabled={isSubmittingCats || !newCategoriesText.trim()}
                    className={`mt-3 w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 ${isSubmittingCats ? 'opacity-50' : ''}`}
                  >
                    {isSubmittingCats ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus-circle"></i>}
                    Add Categories
                  </button>
                </form>
              </div>

              {/* List Section */}
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Existing Categories ({tenantCategories.length})</h4>
                <div className="grid grid-cols-2 gap-3">
                  {tenantCategories.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-300 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                          <i className={`fas fa-${cat.icon || 'utensils'} text-xs`}></i>
                        </div>
                        <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                      </div>
                      <button
                        onClick={() => { if (confirm('Delete Category? This will affect items in this category.')) deleteCategory(cat.id); }}
                        className="text-slate-300 hover:text-red-500 p-2 transition-colors"
                        title="Delete Category"
                      >
                        <i className="fas fa-trash-alt text-sm"></i>
                      </button>
                    </div>
                  ))}
                  {tenantCategories.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-slate-400">
                      <i className="fas fa-tags text-4xl mb-3 opacity-20"></i>
                      <p className="text-sm">No categories found. Add some above!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-slate-50">
              <button onClick={() => setShowCatModal(false)} className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;
