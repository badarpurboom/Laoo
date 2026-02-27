import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { MenuItem, CartItem, Order, OrderType, Category } from '../../types';

// ── Marketing Banner Carousel ──────────────────────────────────────────────
const BannerCarousel: React.FC = React.memo(() => {
  const banners = useStore(state => state.banners);
  const fetchBanners = useStore(state => state.fetchBanners);
  const activeBanners = useMemo(() => banners.filter(b => b.isActive), [banners]);
  const [current, setCurrent] = React.useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % activeBanners.length);
    }, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeBanners.length]);

  if (activeBanners.length === 0) {
    return (
      <section className="px-4 py-8 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-b-[2.5rem] mb-6">
        <h2 className="text-3xl font-bold mb-1">Delicious Food,</h2>
        <p className="text-orange-100 text-lg">Delivered straight to your table.</p>
      </section>
    );
  }

  return (
    <div className="px-4 mt-3 mb-6">
      <div className="relative overflow-hidden rounded-2xl shadow-md">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {activeBanners.map(banner => (
            <div key={banner.id} className="min-w-full relative">
              <img
                src={banner.imageUrl}
                alt={banner.title || 'Promo'}
                className="w-full h-44 sm:h-56 object-cover"
              />
              {banner.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-5 py-4">
                  <p className="text-white font-bold text-base leading-tight">{banner.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Dots */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {activeBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${i === current ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────

interface MenuItemCardProps {
  item: MenuItem;
  cart: CartItem[];
  addToCart: (item: MenuItem, portion: 'half' | 'full') => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  fakeDiscountPct?: number;
}

const MenuItemCard: React.FC<MenuItemCardProps> = React.memo(({ item, cart, addToCart, updateQuantity, fakeDiscountPct = 0 }) => {
  const [selectedPortion, setSelectedPortion] = useState<'half' | 'full'>('full');
  const [imgZoomed, setImgZoomed] = useState(false);
  const autoResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartItemId = `${item.id}-${selectedPortion}`;
  const inCart = cart.find(i => `${i.id}-${i.portionType}` === cartItemId);
  const price = selectedPortion === 'half' ? (item.halfPrice || item.fullPrice) : item.fullPrice;

  // Fake Price Drop calculation
  const fakeOriginalPrice = fakeDiscountPct > 0 ? Math.round(price / (1 - fakeDiscountPct / 100)) : null;

  const zoomIn = () => {
    setImgZoomed(true);
    // Auto-close after 2.5 seconds
    if (autoResetRef.current) clearTimeout(autoResetRef.current);
    autoResetRef.current = setTimeout(() => setImgZoomed(false), 2500);
    // Close on next scroll
    const closeOnScroll = () => { setImgZoomed(false); window.removeEventListener('scroll', closeOnScroll, true); };
    window.addEventListener('scroll', closeOnScroll, true);
    // Close on click anywhere else
    const closeOnClick = () => { setImgZoomed(false); document.removeEventListener('click', closeOnClick, true); };
    setTimeout(() => document.addEventListener('click', closeOnClick, true), 0);
  };

  return (
    <div
      className="group bg-white rounded-3xl p-2.5 shadow-[0_10px_40px_rgb(0,0,0,0.04)] border border-white flex gap-3 transition-all duration-300 hover:shadow-[0_20px_60px_rgb(0,0,0,0.1)] hover:-translate-y-1.5 cursor-pointer overflow-hidden relative"
      onClick={zoomIn}
    >
      <div className="relative flex-shrink-0" style={{ zIndex: imgZoomed ? 20 : 'auto' }}>
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-20 h-20 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform duration-500"
          style={{
            transform: imgZoomed ? 'scale(1.7)' : undefined,
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            position: 'relative',
            zIndex: imgZoomed ? 20 : 'auto',
          }}
        />

        <div className={`absolute -top-1 -left-1 px-1.5 py-0.5 rounded-br-xl shadow-sm z-10 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between py-0.5">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="font-extrabold text-slate-800 text-[13px] leading-tight group-hover:text-orange-600 transition-colors uppercase tracking-tight">{item.name}</h3>
          </div>
          <p className="text-[9px] text-slate-400 font-medium line-clamp-2 mt-0.5 italic">{item.description}</p>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex flex-col">
              {fakeOriginalPrice && (
                <span className="text-[9px] text-slate-300 line-through leading-none font-bold">₹{fakeOriginalPrice}</span>
              )}
              <div className="flex items-center gap-1.5">
                <span className={`font-black text-[15px] ${fakeOriginalPrice ? 'text-rose-500' : 'text-slate-900'}`}>₹{price}</span>
                {fakeDiscountPct > 0 && (
                  <span className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse border border-rose-400/50">
                    {fakeDiscountPct}% OFF
                  </span>
                )}
              </div>
            </div>

            {item.halfPrice && (
              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 shadow-inner">
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedPortion('half'); }}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${selectedPortion === 'half' ? 'bg-white text-orange-600 shadow-md scale-105' : 'text-slate-400'}`}
                >
                  Half
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedPortion('full'); }}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${selectedPortion === 'full' ? 'bg-white text-orange-600 shadow-md scale-105' : 'text-slate-400'}`}
                >
                  Full
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-2">
          {inCart ? (
            <div className="flex items-center gap-4 bg-slate-950 text-white rounded-2xl px-2 py-1.5 shadow-lg animate-in zoom-in-75 duration-200">
              <button
                onClick={(e) => { e.stopPropagation(); updateQuantity(cartItemId, -1); }}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <i className="fas fa-minus text-[10px]"></i>
              </button>
              <span className="text-sm font-black w-4 text-center">{inCart.quantity}</span>
              <button
                onClick={(e) => { e.stopPropagation(); updateQuantity(cartItemId, 1); }}
                className="w-8 h-8 flex items-center justify-center text-orange-400 hover:text-orange-300 transition-colors"
              >
                <i className="fas fa-plus text-[10px]"></i>
              </button>
            </div>
          ) : (
            <button
              disabled={!item.isAvailable}
              onClick={(e) => { e.stopPropagation(); addToCart(item, selectedPortion); }}
              className="group/btn bg-slate-900 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-orange-500 disabled:bg-slate-200 shadow-lg shadow-slate-200 transition-all active:scale-90 text-[11px] font-black uppercase tracking-widest overflow-hidden relative"
            >
              <span className="relative z-10">Add</span>
              <i className="fas fa-plus text-[10px] relative z-10 group-hover/btn:rotate-90 transition-transform"></i>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-rose-600 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// ── AI Flash Popups Component ──────────────────────────────────────────────
interface AIFlashPopupsProps {
  showPopup1: boolean;
  showPopup2: boolean;
  handleSkipPopup1: () => void;
  handleSkipPopup2: () => void;
  settings: any;
  menuItems: MenuItem[];
  cart: CartItem[];
  addToCart: (item: MenuItem, portion?: 'half' | 'full', isUpsell?: boolean, source?: string) => void;
}

const AIFlashPopups: React.FC<AIFlashPopupsProps> = React.memo(({
  showPopup1, showPopup2, handleSkipPopup1, handleSkipPopup2,
  settings, menuItems, cart, addToCart
}) => {
  return (
    <>
      {showPopup1 && settings.popupItem1Id && (() => {
        const item = menuItems.find(m => m.id === settings.popupItem1Id);
        if (!item || !item.isAvailable || cart.find(i => i.id === item.id)) return null;
        return (
          <div className="fixed top-20 right-4 z-50 pointer-events-auto shadow-2xl rounded-2xl animate-bounce-fade-in">
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700 max-w-[280px] sm:max-w-sm relative overflow-hidden ring-4 ring-slate-900/50">
              <button onClick={handleSkipPopup1} className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-400 hover:text-white rounded-full z-20">
                <i className="fas fa-times"></i>
              </button>
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-2 py-1 mb-3 flex items-center gap-1.5">
                <i className="fas fa-lock-open text-rose-400 text-[9px] animate-pulse"></i>
                <span className="text-[9px] font-black text-rose-400 uppercase">🎉 Exclusive Deal Unlocked</span>
              </div>
              <div className="flex gap-4 relative z-10">
                <img src={item.imageUrl} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{item.name}</p>
                  <p className="text-[11px] text-slate-300 mb-2 leading-snug">{settings.popup1Text || "🌟 Customer Favorite!"}</p>
                  <button onClick={() => { addToCart(item, 'full', true, 'POPUP'); handleSkipPopup1(); }} className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold w-full">
                    Add ₹{item.fullPrice}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {showPopup2 && settings.popupItem2Id && (() => {
        const item = menuItems.find(m => m.id === settings.popupItem2Id);
        if (!item || !item.isAvailable || cart.find(i => i.id === item.id)) return null;
        return (
          <div className="fixed bottom-24 left-4 z-50 pointer-events-auto shadow-2xl rounded-2xl animate-bounce-fade-up">
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700 max-w-[280px] sm:max-w-sm relative overflow-hidden ring-4 ring-slate-900/50">
              <button onClick={handleSkipPopup2} className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-400 hover:text-white rounded-full z-20">
                <i className="fas fa-times"></i>
              </button>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1 mb-3 flex items-center gap-1.5">
                <i className="fas fa-utensils text-amber-400 text-[9px]"></i>
                <span className="text-[9px] font-black text-amber-400 uppercase">🍽️ Completes Your Meal</span>
              </div>
              <div className="flex gap-4 relative z-10">
                <img src={item.imageUrl} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{item.name}</p>
                  <p className="text-[11px] text-slate-300 mb-2 leading-snug">{settings.popup2Text || "🔥 Pairs perfectly!"}</p>
                  <button onClick={() => { addToCart(item, 'full', true, 'POPUP'); handleSkipPopup2(); }} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold w-full">
                    Add ₹{item.fullPrice}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
});

// ── Mystery Box Reveal Component ───────────────────────────────────────────
interface MysteryBoxRevealProps {
  show: boolean;
  item: MenuItem | null;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const MysteryBoxReveal: React.FC<MysteryBoxRevealProps> = React.memo(({
  show, item, isOpen, onOpen, onClose
}) => {
  if (!show || !item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-md">
      {!isOpen ? (
        <div className="flex flex-col items-center justify-center cursor-pointer animate-bounce-fade-up" onClick={onOpen}>
          <h2 className="text-3xl font-black text-white mb-10 text-center">
            Unlocked a <br /><span className="text-orange-400">Mystery Box! 🎁</span>
          </h2>
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-amber-400/50 rounded-full blur-[80px] animate-pulse"></div>
            <div className="w-56 h-56 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-3xl border-8 border-white/20 shadow-2xl flex items-center justify-center animate-shake">
              <i className="fas fa-question text-8xl text-white opacity-90 animate-pulse"></i>
            </div>
          </div>
          <button className="bg-gradient-to-r from-orange-500 to-rose-600 text-white px-10 py-5 rounded-full font-black shadow-lg">Tap To Open</button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center px-4 text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-amber-400 rounded-full blur-[60px] opacity-70 animate-pulse"></div>
            <img src={item.imageUrl} className="w-56 h-56 md:w-64 md:h-64 rounded-[2.5rem] border-8 border-white shadow-2xl animate-jump-reveal" />
            <div className="absolute -bottom-6 -right-6 bg-green-500 text-white px-6 py-2 rounded-full font-black border-4 border-white animate-bounce-custom">Worth ₹{item.price}!</div>
          </div>
          <h2 className="text-4xl font-black text-white mb-3">It's <span className="text-orange-400">{item.name}!</span> 🎉</h2>
          <p className="text-slate-300 max-w-sm mb-10">Surprise! Added to your order. Enjoy!</p>
          <button onClick={onClose} className="bg-white text-slate-900 px-10 py-4 rounded-full font-black shadow-xl active:scale-95 transition-all">Yay! Thanks 😍</button>
        </div>
      )}
    </div>
  );
});

// ── Post-Meal Dessert Prompt Component ─────────────────────────────────────
interface DessertPromptProps {
  show: boolean;
  onClose: () => void;
  settings: any;
  menuItems: MenuItem[];
  cart: CartItem[];
  addToCart: (item: MenuItem, portion: 'half' | 'full', isUpsell: boolean, sources: string) => void;
}

const DessertPrompt: React.FC<DessertPromptProps> = React.memo(({
  show, onClose, settings, menuItems, cart, addToCart
}) => {
  if (!show || (settings.dessertPromptItemIds || []).length === 0) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-bounce-fade-in">
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-5 text-white text-center relative overflow-hidden">
          <div className="text-4xl mb-2">🍮</div>
          <h3 className="text-xl font-black">Khana aacha laga?</h3>
          <p className="text-pink-100 text-sm mt-1">Kuch meetha ho jaye! 😋</p>
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>
        <div className="p-5 space-y-3">
          {(settings.dessertPromptItemIds || []).map(itemId => {
            const item = menuItems.find(m => m.id === itemId && m.isAvailable);
            if (!item) return null;
            const alreadyInCart = cart.find(c => c.id === item.id);
            return (
              <div key={item.id} className="flex items-center gap-3 bg-pink-50 border border-pink-100 rounded-2xl p-3">
                <img src={item.imageUrl} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{item.name}</p>
                  <p className="text-pink-600 font-black text-sm">₹{item.fullPrice}</p>
                </div>
                <button
                  onClick={() => {
                    if (!alreadyInCart) addToCart(item, 'full', true, 'DESSERT_PROMPT');
                    onClose();
                  }}
                  className={`shrink-0 px-4 py-2 rounded-xl font-bold text-sm transition-all ${alreadyInCart ? 'bg-slate-100 text-slate-400' : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'}`}
                >
                  {alreadyInCart ? '✓ Added' : '+ Add'}
                </button>
              </div>
            );
          })}
          <button onClick={onClose} className="w-full py-3 text-slate-400 text-xs font-medium hover:text-slate-600">
            No thanks, I'm full 😊
          </button>
        </div>
      </div>
    </div>
  );
});

const Preloader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center justify-center animate-out fade-out duration-1000 delay-500 fill-mode-forwards">
      <div className="relative">
        {/* Outer Ring */}
        <div className="w-24 h-24 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin"></div>
        {/* Inner Pulsing Circle */}
        <div className="absolute inset-0 m-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-rose-500 rounded-full animate-pulse shadow-lg shadow-orange-500/30"></div>
        {/* Central Icon */}
        <div className="absolute inset-0 m-auto w-8 h-8 flex items-center justify-center text-white">
          <i className="fas fa-utensils text-xl"></i>
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center">
        <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase italic">
          <span className="text-orange-500">Laoo</span>
        </h2>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></div>
          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-4 opacity-70 animate-pulse">
          Setting your table...
        </p>
      </div>
    </div>
  );
};

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionBill: { total: number; items: any[]; orderCount?: number };
  activeTable: string;
  menuItems: MenuItem[];
  addToCart: (item: MenuItem, portion: 'half' | 'full', isUpsell: boolean, sources: string) => void;
}

const BillModal: React.FC<BillModalProps> = React.memo(({
  isOpen, onClose, sessionBill, activeTable, menuItems, addToCart
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md h-[80vh] sm:h-auto rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Table {activeTable}</h2>
            <p className="text-xs text-slate-500">Session Summary</p>
          </div>
          <button onClick={onClose} className="bg-white w-8 h-8 rounded-full shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="space-y-4">
            {sessionBill.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-sm border-b border-dashed border-slate-100 pb-2">
                <div>
                  <div className="font-bold text-slate-700">
                    {item.quantity}x {item.name}
                    {item.portionType && <span className="text-[9px] bg-slate-100 ml-1 px-1 rounded uppercase font-normal text-slate-500">{item.portionType}</span>}
                  </div>
                </div>
                <div className="font-bold text-slate-800">
                  ₹{(item.price * item.quantity).toFixed(0)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t-2 border-slate-100 space-y-2">
            <div className="flex justify-between items-center text-lg font-black text-slate-800">
              <span>Total to Pay</span>
              <span>₹{sessionBill.total.toFixed(0)}</span>
            </div>
            <p className="text-xs text-center text-slate-400 mt-4">
              Please ask the waiter to bring the bill or pay at the counter.
            </p>
          </div>

          {sessionBill.items.length > 0 && (
            <div className="mt-6 pt-5 border-t-2 border-dashed border-orange-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <i className="fas fa-redo text-orange-500 text-xs"></i>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">Chahiye aur? 🍽️</h4>
                  <p className="text-[10px] text-slate-400">Apni favourite dish dobara order karo!</p>
                </div>
              </div>
              <div className="space-y-2">
                {sessionBill.items
                  .filter((item, idx, arr) => arr.findIndex(i => i.name === item.name) === idx)
                  .slice(0, 4)
                  .map((item, idx) => {
                    const menuItem = menuItems.find(m => m.name === item.name);
                    return (
                      <div key={idx} className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {menuItem?.imageUrl && (
                            <img src={menuItem.imageUrl} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                            <p className="text-[10px] text-orange-500 font-semibold">₹{item.price}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (menuItem) {
                              addToCart(menuItem, item.portionType as any || 'full', true, 'REORDER_NUDGE');
                              onClose();
                            }
                          }}
                          disabled={!menuItem}
                          className="ml-2 shrink-0 bg-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg hover:bg-orange-600 active:scale-95 transition-all flex items-center gap-1 disabled:opacity-40"
                        >
                          <i className="fas fa-plus text-[8px]"></i> Add
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t">
          <button onClick={onClose} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold shadow-lg">
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateQuantity: (cartItemId: string, delta: number) => void;
  checkoutStep: 'cart' | 'details' | 'success';
  setCheckoutStep: (step: 'cart' | 'details' | 'success') => void;
  handleCheckout: () => void;
  finalizeSuccess: () => void;
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  orderType: OrderType;
  setOrderType: (v: OrderType) => void;
  tableOrAddress: string;
  setTableOrAddress: (v: string) => void;
  activeRestaurantId: string | null;
}

const CartModal: React.FC<CartModalProps & {
  addToCart: (item: MenuItem, portion?: 'half' | 'full', isUpsell?: boolean, marketingSource?: string) => void;
  handleAddMysteryBox: () => void;
  tenantCategories: Category[];
  isHotel: boolean;
  tableLabel: string;
  tablePlaceholder: string;
}> = React.memo(({
  isOpen, onClose, cart, updateQuantity, checkoutStep, setCheckoutStep,
  handleCheckout, finalizeSuccess, customerName, setCustomerName,
  customerPhone, setCustomerPhone, orderType, setOrderType,
  tableOrAddress, setTableOrAddress, activeRestaurantId,
  addToCart, handleAddMysteryBox, tenantCategories, isHotel,
  tableLabel, tablePlaceholder
}) => {
  const settings = useStore(state => state.settings);
  const menuItems = useStore(state => state.menuItems);
  const recommendedItems = useStore(state => state.recommendedItems);
  const isFetchingRecommendations = useStore(state => state.isFetchingRecommendations);

  if (!isOpen) return null;

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxAmount = (settings.taxEnabled) ? (cartTotal * settings.taxPercentage) / 100 : 0;

  let deliveryFee = 0;
  if (orderType === 'delivery' && settings.deliveryChargesEnabled) {
    if (settings.deliveryFreeThreshold > 0 && cartTotal > settings.deliveryFreeThreshold) {
      deliveryFee = 0;
    } else {
      deliveryFee = settings.deliveryCharges;
    }
  }
  const finalTotal = cartTotal + taxAmount + deliveryFee;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md h-[90vh] sm:h-auto sm:max-h-[80vh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Your Cart</h2>
          <button onClick={() => { onClose(); setCheckoutStep('cart'); }} className="text-slate-400 hover:text-slate-600">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {checkoutStep === 'cart' && (
            <>
              {/* AI Upsell Carousel */}
              {cart.length > 0 && settings.aiUpsellEnabled && (
                <div className="mb-6 pb-6 border-b border-slate-100 flex-shrink-0">
                  {isFetchingRecommendations ? (
                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 animate-pulse">
                      <h3 className="text-xs font-bold text-indigo-600 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                        <i className="fas fa-sparkles"></i> AI is finding perfect add-ons...
                      </h3>
                      <div className="flex gap-3 overflow-hidden">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="min-w-[120px] h-24 bg-indigo-100/50 rounded-xl"></div>
                        ))}
                      </div>
                    </div>
                  ) : recommendedItems.length > 0 ? (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-xl"></div>
                      <h3 className="text-xs font-black text-indigo-800 mb-3 flex items-center gap-1.5 uppercase tracking-wider relative z-10">
                        <i className="fas fa-magic text-indigo-500"></i> Cart Exclusive Add-ons
                        {settings.aiMarketingEnabled && (settings.maxAiDiscountPct || 0) > 0 && (
                          <span className="ml-auto text-[9px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full normal-case tracking-normal">
                            🎉 Unlocked!
                          </span>
                        )}
                      </h3>
                      <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 relative z-10">
                        {recommendedItems.filter(item => !cart.find(c => c.id === item.id)).map(item => {
                          const maxDisc = (settings.aiMarketingEnabled && (settings.maxAiDiscountPct || 0) > 0) ? settings.maxAiDiscountPct! : 0;
                          const discPct = maxDisc > 0 ? Math.max(5, Math.min(maxDisc, (item.id.charCodeAt(0) % (maxDisc - 4)) + 5)) : 0;
                          const discountedPrice = discPct > 0 ? Math.round(item.fullPrice * (1 - discPct / 100)) : item.fullPrice;

                          return (
                            <div key={item.id} className="min-w-[130px] w-[130px] bg-white rounded-xl p-2 shadow-sm border border-indigo-50/50 flex flex-col gap-2 group relative overflow-hidden">
                              {discPct > 0 && (
                                <div className="absolute top-1 left-1 z-10 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                  Save ₹{item.fullPrice - discountedPrice}
                                </div>
                              )}
                              <div className="overflow-hidden rounded-lg">
                                <img src={item.imageUrl} className="w-full h-20 object-cover group-hover:scale-105 transition-transform duration-300" />
                              </div>
                              <div className="flex-1 flex flex-col justify-between">
                                <h4 className="text-[11px] font-bold text-slate-800 leading-tight line-clamp-2">{item.name}</h4>
                                <div className="flex justify-between items-center mt-2">
                                  <div className="flex flex-col">
                                    {discPct > 0 && <span className="text-[9px] text-slate-400 line-through">₹{item.fullPrice}</span>}
                                    <span className="text-[11px] font-black text-indigo-600">₹{discountedPrice}</span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const discItem = { ...item, fullPrice: discountedPrice };
                                      addToCart(discItem, 'full', true, 'AI_CROSS_SELL');
                                    }}
                                    className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-sm active:scale-95"
                                  >
                                    <i className="fas fa-plus text-[9px]"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Reward Progress Bar */}
              {settings.giftThreshold && settings.giftThreshold > 0 && settings.giftItemId && cart.length > 0 && (() => {
                const giftItem = menuItems.find(m => m.id === settings.giftItemId);
                if (!giftItem) return null;
                const amountToReward = settings.giftThreshold - cartTotal;
                const progress = Math.min(100, (cartTotal / settings.giftThreshold) * 100);
                const isUnlocked = amountToReward <= 0;

                return (
                  <div className="mb-6 bg-emerald-50 border border-emerald-100 p-4 rounded-xl relative overflow-hidden">
                    <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-2">
                      <i className="fas fa-gift text-emerald-500"></i>
                      {isUnlocked ? "Reward Unlocked!" : `Spend ₹${amountToReward.toFixed(0)} more for a FREE ${giftItem.name}!`}
                    </h4>
                    <div className="w-full bg-emerald-200/50 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                );
              })()}

              {/* Mystery Box */}
              {settings.mysteryBoxEnabled && cart.length > 0 && !cart.find(c => c.id === 'mystery_box') && (
                <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-rose-50 rounded-xl border border-orange-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-rose-500 text-xl border">
                      <i className="fas fa-box-open animate-bounce"></i>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Mystery Box</h4>
                      <p className="text-[10px] text-slate-500">Add a surprise dessert for ₹{settings.mysteryBoxPrice}!</p>
                    </div>
                  </div>
                  <button onClick={handleAddMysteryBox} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap active:scale-95 shrink-0">
                    + Add ₹{settings.mysteryBoxPrice}
                  </button>
                </div>
              )}

              {cart.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <i className="fas fa-shopping-cart text-6xl mb-4 opacity-20"></i>
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => {
                    const cartItemId = `${item.id}-${item.portionType}`;
                    return (
                      <div key={cartItemId} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={item.imageUrl} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold truncate">{item.name} {item.halfPrice && `(${item.portionType})`}</h4>
                            <p className="text-xs text-slate-500">₹{item.price.toFixed(0)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white rounded-full px-2 py-1 shadow-sm border shrink-0">
                          <button onClick={() => updateQuantity(cartItemId, -1)} className="w-6 h-6 flex items-center justify-center text-slate-500">
                            {item.quantity === 1 ? <i className="fas fa-trash-alt text-[10px] text-red-500"></i> : <i className="fas fa-minus text-[10px]"></i>}
                          </button>
                          <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(cartItemId, 1)} className="w-6 h-6 flex items-center justify-center text-orange-500">
                            <i className="fas fa-plus text-[10px]"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {checkoutStep === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Order Type</label>
                <div className="flex flex-wrap gap-2">
                  {['dine-in', 'takeaway', 'delivery'].filter(type => {
                    if (isHotel) return type === 'dine-in';
                    if (type === 'dine-in') return settings.orderPreferences?.dineIn ?? true;
                    if (type === 'takeaway') return settings.orderPreferences?.takeaway ?? true;
                    if (type === 'delivery') return settings.orderPreferences?.delivery ?? true;
                    return true;
                  }).map((type) => (
                    <button key={type} onClick={() => setOrderType(type as OrderType)} className={`flex-1 py-2 px-1 rounded-lg text-xs font-semibold border transition-all ${orderType === type ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'}`}>
                      {isHotel && type === 'dine-in' ? 'Room Service' : type.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your name" className="w-full px-4 py-2 bg-slate-50 border rounded-lg outline-none" />
              {(orderType === 'delivery' || settings.orderPreferences?.requireCustomerPhone) && <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Mobile number" className="w-full px-4 py-2 bg-slate-50 border rounded-lg outline-none" />}
              {orderType !== 'takeaway' && (orderType === 'dine-in' && !(settings.orderPreferences?.requireTableNumber ?? true) ? null : <input type="text" value={tableOrAddress} onChange={(e) => setTableOrAddress(e.target.value)} placeholder={orderType === 'dine-in' ? tablePlaceholder : "Full address"} className="w-full px-4 py-2 bg-slate-50 border rounded-lg outline-none" />)}
            </div>
          )}

          {checkoutStep === 'success' && (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"><i className="fas fa-check text-4xl"></i></div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Order Confirmed!</h3>
              <p className="text-slate-500 mb-6">Enjoy your meal!</p>
              <button onClick={finalizeSuccess} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold">Done</button>
            </div>
          )}
        </div>

        {checkoutStep !== 'success' && cart.length > 0 && (
          <div className="p-6 border-t bg-slate-50">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-slate-600 text-sm"><span>Subtotal</span><span>₹{cartTotal.toFixed(0)}</span></div>
              <div className="flex justify-between text-slate-600 text-sm"><span>Tax</span><span>₹{taxAmount.toFixed(0)}</span></div>
              {deliveryFee > 0 && <div className="flex justify-between text-slate-600 text-sm"><span>Delivery Fee</span><span>₹{deliveryFee.toFixed(0)}</span></div>}
              {(() => {
                const totalFakeSavings = cart.reduce((sum, cartItem) => {
                  const cat = tenantCategories.find(c => c.id === cartItem.categoryId);
                  const disc = cat?.fakeDiscountPct || 0;
                  if (disc <= 0) return sum;
                  const fakeOriginal = Math.round(cartItem.price / (1 - disc / 100));
                  return sum + ((fakeOriginal - cartItem.price) * cartItem.quantity);
                }, 0);
                if (totalFakeSavings <= 0) return null;
                return <div className="flex justify-between items-center text-emerald-600 text-sm bg-emerald-50 px-3 py-2 rounded-xl"><span className="font-bold">Your Savings</span><span className="font-black">₹{totalFakeSavings.toFixed(0)}</span></div>;
              })()}
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span>₹{finalTotal.toFixed(0)}</span></div>
            </div>
            <button onClick={() => checkoutStep === 'cart' ? setCheckoutStep('details') : handleCheckout()} className={`w-full py-4 text-white rounded-xl font-bold shadow-lg ${checkoutStep === 'cart' ? 'bg-orange-500' : 'bg-slate-800'}`}>
              {checkoutStep === 'cart' ? 'Checkout' : 'Place Order'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

const CustomerView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  const menuItems = useStore(state => state.menuItems);
  const categories = useStore(state => state.categories);
  const settings = useStore(state => state.settings);
  const addOrder = useStore(state => state.addOrder);
  const activeRestaurantId = useStore(state => state.activeRestaurantId);
  const orders = useStore(state => state.orders);
  const restaurants = useStore(state => state.restaurants);
  const recommendedItems = useStore(state => state.recommendedItems);
  const isFetchingRecommendations = useStore(state => state.isFetchingRecommendations);
  const fetchAIRecommendations = useStore(state => state.fetchAIRecommendations);

  useEffect(() => {
    // Artificial delay to show the beautiful preloader
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const activeRestaurant = restaurants.find(r => r.id === activeRestaurantId);
  const isHotel = activeRestaurant?.businessType === 'hotel';
  const tableLabel = isHotel ? 'Room Number' : 'Table Number';
  const tablePlaceholder = isHotel ? 'e.g. 205' : 'e.g. 5';

  const [activeTable, setActiveTable] = useState<string>('');
  const [showBill, setShowBill] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // AI Flash Popups
  const [showPopup1, setShowPopup1] = useState(false);
  const [showPopup2, setShowPopup2] = useState(false);
  const popup1TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popup2TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!settings.aiUpsellPopupEnabled || !settings.popupItem1Id) return;

    popup1TimerRef.current = setTimeout(() => {
      setShowPopup1(true);
    }, 20000);

    return () => {
      if (popup1TimerRef.current) clearTimeout(popup1TimerRef.current);
      if (popup2TimerRef.current) clearTimeout(popup2TimerRef.current);
    };
  }, [settings.aiUpsellPopupEnabled, settings.popupItem1Id]);

  const handleSkipPopup1 = () => {
    setShowPopup1(false);
    if (!settings.popupItem2Id) return;
    popup2TimerRef.current = setTimeout(() => {
      setShowPopup2(true);
    }, 10000);
  };

  const handleSkipPopup2 = () => {
    setShowPopup2(false);
  };

  React.useEffect(() => {
    const savedTable = localStorage.getItem('bistro_table_number');
    if (savedTable) setActiveTable(savedTable);
  }, []);

  const sessionBill = React.useMemo(() => {
    if (!activeTable) return { total: 0, items: [] };
    const tableOrders = orders.filter(o =>
      o.restaurantId === activeRestaurantId &&
      o.orderType === 'dine-in' &&
      o.tableNumber === activeTable &&
      o.paymentStatus !== 'paid' &&
      o.status !== 'cancelled'
    );
    const total = tableOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const items = tableOrders.flatMap(o => o.items || []);
    return { total, items, orderCount: tableOrders.length };
  }, [orders, activeTable, activeRestaurantId]);

  const tenantCategories = useMemo(() => categories.filter(c => c.restaurantId === activeRestaurantId), [categories, activeRestaurantId]);
  const tenantMenuItems = useMemo(() => menuItems.filter(m => m.restaurantId === activeRestaurantId), [menuItems, activeRestaurantId]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'details' | 'success'>('cart');
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableOrAddress, setTableOrAddress] = useState('');

  // Mystery Box Reveal State
  const [revealedMysteryItem, setRevealedMysteryItem] = useState<{ name: string, imageUrl: string, price: number } | null>(null);
  const [isMysteryBoxOpened, setIsMysteryBoxOpened] = useState(false);
  const [showMysteryBounty, setShowMysteryBounty] = useState(false);

  // Post-Meal Dessert Prompt State
  const [showDessertPrompt, setShowDessertPrompt] = useState(false);
  const [dessertPromptTriggeredOrderId, setDessertPromptTriggeredOrderId] = useState<string | null>(null);

  // Auto-select valid order type if current one is disabled
  React.useEffect(() => {
    const prefs = settings.orderPreferences;
    if (!prefs) return;

    const isDineInEnabled = prefs.dineIn ?? true;
    const isTakeawayEnabled = prefs.takeaway ?? true;
    const isDeliveryEnabled = prefs.delivery ?? true;

    if (orderType === 'dine-in' && !isDineInEnabled) {
      if (isTakeawayEnabled) setOrderType('takeaway');
      else if (isDeliveryEnabled) setOrderType('delivery');
    } else if (orderType === 'takeaway' && !isTakeawayEnabled) {
      if (isDineInEnabled) setOrderType('dine-in');
      else if (isDeliveryEnabled) setOrderType('delivery');
    } else if (orderType === 'delivery' && !isDeliveryEnabled) {
      if (isDineInEnabled) setOrderType('dine-in');
      else if (isTakeawayEnabled) setOrderType('takeaway');
    }
  }, [settings.orderPreferences, orderType]);

  // FIXME: Debug AI Upsell State
  React.useEffect(() => {
    console.log("CustomerView Context Dump:", {
      aiUpsellEnabled: settings.aiUpsellEnabled,
      cartLength: cart.length,
      recommendedLength: recommendedItems.length,
      settingsObj: settings,
      cartData: cart
    });
  }, [cart.length, settings.aiUpsellEnabled, recommendedItems.length]);

  // 🍰 Recovery: Post-Meal Dessert Prompt after refresh
  React.useEffect(() => {
    if (!settings.dessertPromptEnabled || (settings.dessertPromptItemIds || []).length === 0) return;
    if (!activeRestaurantId) return;

    const storageKey = `dessert_prompt_order_${activeRestaurantId}`;
    const storedTimestamp = localStorage.getItem(storageKey);
    if (storedTimestamp) {
      const orderTime = parseInt(storedTimestamp);
      const now = Date.now();
      const elapsed = now - orderTime;
      const targetDelay = (settings.dessertPromptMinutes || 15) * 60 * 1000;
      const MaxWindow = 2 * 60 * 60 * 1000; // 2 hours

      if (elapsed >= targetDelay && elapsed < MaxWindow) {
        // Show immediately if time passed but within 2 hours
        setShowDessertPrompt(true);
        localStorage.removeItem(storageKey);
      } else if (elapsed < targetDelay) {
        // Set timer for remaining time
        const timer = setTimeout(() => {
          setShowDessertPrompt(true);
          localStorage.removeItem(storageKey);
        }, targetDelay - elapsed);
        return () => clearTimeout(timer);
      } else {
        // Too old, clear it
        localStorage.removeItem(storageKey);
      }
    }
  }, [activeRestaurantId, settings.dessertPromptEnabled, settings.dessertPromptMinutes, settings.dessertPromptItemIds]);

  const filteredMenu = useMemo(() => {
    let results = tenantMenuItems;

    // Category filter — skip if user is actively searching
    if (selectedCategory !== 'all' && !searchQuery.trim()) {
      results = results.filter(item => item.categoryId === selectedCategory);
    }

    // Search filter — always searches all items
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(item =>
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    }

    return results;
  }, [tenantMenuItems, selectedCategory, searchQuery]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Auto-add/remove Mystery Box and Gift item logic can be complex, let's keep it simple:
  // We'll manage mystery box as a special cart item, or just add it to cart when clicked.
  const handleAddMysteryBox = () => {
    if (!settings.mysteryBoxEnabled) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === 'mystery_box');
      if (existing) return prev;
      return [...prev, {
        id: 'mystery_box',
        restaurantId: activeRestaurantId || '',
        name: '🎁 Mystery Box (Surprise Add-on)',
        description: 'A special surprise item at a throwaway price!',
        categoryId: 'special',
        fullPrice: settings.mysteryBoxPrice || 49,
        quantity: 1,
        portionType: 'full',
        price: settings.mysteryBoxPrice || 49,
        isAvailable: true,
        isVeg: true,
        imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200&h=200&fit=crop',
        marketingSource: 'MYSTERY_BOX' // Tracking
      }];
    });
  };

  // Tax Logic
  const taxAmount = (settings.taxEnabled) ? (cartTotal * settings.taxPercentage) / 100 : 0;

  // Delivery Fee Logic
  let deliveryFee = 0;
  if (orderType === 'delivery' && settings.deliveryChargesEnabled) {
    if (settings.deliveryFreeThreshold > 0 && cartTotal > settings.deliveryFreeThreshold) {
      deliveryFee = 0;
    } else {
      deliveryFee = settings.deliveryCharges;
    }
  }
  const finalTotal = cartTotal + taxAmount + deliveryFee;

  const addToCart = (item: MenuItem, portion: 'half' | 'full' = 'full', isUpsell: boolean = false, marketingSource?: string) => {
    setCart(prev => {
      const cartItemId = `${item.id}-${portion}`;
      const existing = prev.find(i => `${i.id}-${i.portionType}` === cartItemId);
      const price = portion === 'half' ? (item.halfPrice || item.fullPrice) : item.fullPrice;

      if (existing) {
        return prev.map(i => `${i.id}-${i.portionType}` === cartItemId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, price, portionType: portion, isUpsell, marketingSource }];
    });
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      const currentId = `${i.id}-${i.portionType}`;
      if (currentId === cartItemId) {
        const newQty = Math.max(0, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const handleCheckout = async () => {
    const isTableRequired = orderType === 'dine-in'
      ? (settings.orderPreferences?.requireTableNumber ?? true)
      : (orderType === 'delivery');

    if (!customerName || (isTableRequired && !tableOrAddress) || (orderType === 'delivery' && !customerPhone)) {
      alert("Please fill in all details");
      return;
    }

    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      restaurantId: activeRestaurantId || '',
      customerName,
      customerPhone,
      items: cart,
      totalAmount: finalTotal,
      status: 'pending',
      orderType,
      timestamp: new Date().toISOString(),
      tableNumber: (orderType === 'dine-in' && tableOrAddress) ? tableOrAddress : undefined,
      address: orderType === 'delivery' ? tableOrAddress : undefined,
      paymentStatus: 'pending'
    };

    try {
      let finalItems = [...cart];

      // 1. If Gift threshold is met, implicitly add the free item before submitting
      if (settings.giftThreshold && settings.giftItemId && cartTotal >= settings.giftThreshold) {
        const giftItem = menuItems.find(m => m.id === settings.giftItemId);
        if (giftItem && !finalItems.find(i => i.id === giftItem.id && i.price === 0)) {
          finalItems.push({
            ...giftItem,
            quantity: 1,
            portionType: 'full',
            price: 0,
            isUpsell: true,
            marketingSource: 'REWARD'
          });
        }
      }

      // 2. Resolve Mystery Box to actual item before creating the order
      const mysteryBoxIndex = finalItems.findIndex(i => i.id === 'mystery_box');
      let willShowMysteryBounty = false;

      if (mysteryBoxIndex !== -1 && settings.mysteryBoxEnabled) {
        // Use admin-configured pool first, fall back to all available items
        const adminPool = settings.mysteryBoxItemIds || [];
        let potentialItems = adminPool.length > 0
          ? tenantMenuItems.filter(m => adminPool.includes(m.id) && m.isAvailable)
          : tenantMenuItems.filter(m => m.isAvailable && m.fullPrice >= (settings.mysteryBoxPrice || 49));
        if (potentialItems.length === 0) potentialItems = tenantMenuItems.filter(m => m.isAvailable);

        if (potentialItems.length > 0) {
          const randomItem = potentialItems[Math.floor(Math.random() * potentialItems.length)];
          setRevealedMysteryItem({
            name: randomItem.name,
            imageUrl: randomItem.imageUrl || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48',
            price: randomItem.fullPrice
          });
          willShowMysteryBounty = true;

          // Replace generic mystery box with the actual item in the order payload
          const genericMysteryBox = finalItems[mysteryBoxIndex];
          finalItems[mysteryBoxIndex] = {
            ...randomItem,
            quantity: genericMysteryBox.quantity,
            portionType: 'full',
            // We charge whatever the mystery box cost was:
            price: genericMysteryBox.price,
            isUpsell: true,
            marketingSource: 'MYSTERY_BOX'
          };
        }
      }

      const orderToSubmit: Order = {
        id: newOrder.id,
        restaurantId: newOrder.restaurantId,
        customerName: newOrder.customerName,
        customerPhone: newOrder.customerPhone,
        items: finalItems,
        totalAmount: newOrder.totalAmount,
        status: newOrder.status,
        orderType: newOrder.orderType,
        timestamp: newOrder.timestamp,
        tableNumber: newOrder.tableNumber,
        address: newOrder.address,
        paymentStatus: newOrder.paymentStatus
      };

      await addOrder(orderToSubmit);

      // 🕒 Post-Meal Dessert Prompt (Persistence Ready)
      if (settings.dessertPromptEnabled && (settings.dessertPromptItemIds || []).length > 0 && activeRestaurantId) {
        const storageKey = `dessert_prompt_order_${activeRestaurantId}`;
        const now = Date.now();
        localStorage.setItem(storageKey, now.toString());

        const delay = (settings.dessertPromptMinutes || 15) * 60 * 1000;
        setTimeout(() => {
          if (localStorage.getItem(storageKey)) {
            setShowDessertPrompt(true);
            localStorage.removeItem(storageKey);
          }
        }, delay);
      }

      setCheckoutStep('success');
    } catch (err: any) {
      console.error("Order failed:", err);
      alert("Failed to place order. Please try again.");
    }
  };

  const finalizeSuccess = () => {
    setShowCart(false);
    setCheckoutStep('cart');
    setCart([]);
    setIsMysteryBoxOpened(false);

    if (revealedMysteryItem) {
      // Trigger the Subway surf sequence on the main screen!
      setShowMysteryBounty(true);
    } else {
      // Normal close logic
      if (orderType === 'dine-in' && tableOrAddress) {
        localStorage.setItem('bistro_table_number', tableOrAddress);
        window.location.reload(); // Simple reload to refresh bill status
      }
    }
  };

  const handleCloseMysteryBounty = () => {
    setShowMysteryBounty(false);
    setRevealedMysteryItem(null);
    if (orderType === 'dine-in' && tableOrAddress) {
      localStorage.setItem('bistro_table_number', tableOrAddress);
      window.location.reload();
    }
  };

  return (
    <>
      {isLoading && <Preloader />}
      <div className={`pb-20 min-h-screen bg-slate-50/50 transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {/* Header - Glassmorphism */}
        <header className={`sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-white/20 px-4 py-4 justify-between items-center transition-all duration-300 ${isSearchFocused ? 'hidden' : 'flex'}`}>
          <div className="flex items-center gap-3">
            <img src={settings.logoUrl} alt="logo" className="w-10 h-10 rounded-lg shadow-sm" />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-none">{settings.name}</h1>
              {activeTable && (
                <button
                  onClick={() => {
                    if (confirm("Leave this table session?")) {
                      localStorage.removeItem('bistro_table_number');
                      setActiveTable('');
                      window.location.reload();
                    }
                  }}
                  className="text-xs font-bold text-orange-600 flex items-center gap-1 mt-1 hover:bg-orange-50 px-1 -ml-1 rounded"
                >
                  <i className="fas fa-chair"></i> Table {activeTable} <i className="fas fa-times opacity-50 ml-1"></i>
                </button>
              )}
            </div>
          </div>
          {/* Right side: Bill (if dine-in) + Cart */}
          <div className="flex items-center gap-2">
            {sessionBill.total > 0 && (
              <button
                onClick={() => setShowBill(true)}
                className="flex items-center gap-1.5 bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm hover:bg-slate-700 transition-colors"
              >
                <i className="fas fa-receipt text-[10px]"></i>
                Bill
              </button>
            )}
            <button
              onClick={() => {
                setShowCart(true);
                if (cart.length > 0) fetchAIRecommendations(cart);
              }}
              className="relative p-2 text-slate-600 hover:text-orange-500 transition-colors"
            >
              <i className="fas fa-shopping-basket text-2xl"></i>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </header>


        {/* Dynamic Marketing Banner Carousel */}
        {!isSearchFocused && <BannerCarousel />}

        {/* Search Bar */}
        <div className={`transition-all duration-300 ${isSearchFocused ? 'sticky top-0 left-0 right-0 z-50 pt-3 pb-3 px-4 bg-slate-50/95 backdrop-blur-md shadow-sm' : 'px-4 mb-3'}`}>
          <div className="relative group flex items-center gap-2">
            {isSearchFocused && (
              <button
                onClick={() => {
                  setIsSearchFocused(false);
                  setSearchQuery('');
                }}
                className="w-10 h-[48px] flex-shrink-0 flex items-center justify-center bg-white border border-slate-200/50 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all font-bold"
              >
                <i className="fas fa-arrow-left"></i>
              </button>
            )}
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"></i>
              <input
                type="text"
                placeholder="Search for delicious items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200/50 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] focus:ring-2 focus:ring-orange-500/10 focus:border-orange-400 outline-none transition-all text-[13px] font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                >
                  <i className="fas fa-times-circle"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className={`flex gap-2 px-4 py-1.5 overflow-x-auto no-scrollbar mb-4 ${isSearchFocused ? 'hidden' : ''}`}>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-bold transition-all duration-300 shadow-sm ${selectedCategory === 'all'
              ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white translate-y-[-1px] shadow-orange-200'
              : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
          >
            All Items
          </button>
          {tenantCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-bold transition-all duration-300 shadow-sm ${selectedCategory === cat.id
                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white translate-y-[-1px] shadow-orange-200'
                : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-32">
          {filteredMenu.length > 0 ? (
            filteredMenu.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                cart={cart}
                addToCart={addToCart}
                updateQuantity={updateQuantity}
                fakeDiscountPct={tenantCategories.find(c => c.id === item.categoryId)?.fakeDiscountPct || 0}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-search text-slate-300 text-2xl"></i>
              </div>
              <h3 className="text-slate-800 font-bold">No items found</h3>
              <p className="text-slate-500 text-sm mt-1">Try searching for something else</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="mt-6 text-orange-500 font-bold text-sm hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>


        {/* Sticky Bottom Order Bar (Floating Island Design) */}
        {
          cart.length > 0 && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md">
              <div className="bg-slate-900/95 backdrop-blur-xl text-white p-3.5 pr-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex justify-between items-center animate-in slide-in-from-bottom-10 fade-in duration-500 border border-white/10">
                <div className="flex items-center gap-4 pl-4 border-r border-white/10 pr-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-orange-400 font-bold uppercase tracking-[0.1em]">
                      {cart.reduce((s, i) => s + i.quantity, 0)} {cart.reduce((s, i) => s + i.quantity, 0) === 1 ? 'Item' : 'Items'}
                    </span>
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">₹{finalTotal.toFixed(0)}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCart(true);
                    if (cart.length > 0) fetchAIRecommendations(cart);
                  }}
                  className="bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white px-8 py-4 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-orange-500/30 flex items-center gap-2 group"
                >
                  PROCEED
                  <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
                </button>
              </div>
            </div>
          )
        }

        {/* Cart Modal */}
        <CartModal
          isOpen={showCart}
          onClose={() => setShowCart(false)}
          cart={cart}
          updateQuantity={updateQuantity}
          checkoutStep={checkoutStep}
          setCheckoutStep={setCheckoutStep}
          handleCheckout={handleCheckout}
          finalizeSuccess={finalizeSuccess}
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          orderType={orderType}
          setOrderType={setOrderType}
          tableOrAddress={tableOrAddress}
          setTableOrAddress={setTableOrAddress}
          activeRestaurantId={activeRestaurantId}
          addToCart={addToCart}
          handleAddMysteryBox={handleAddMysteryBox}
          tenantCategories={tenantCategories}
          isHotel={isHotel}
          tableLabel={tableLabel}
          tablePlaceholder={tablePlaceholder}
        />

        <BillModal
          isOpen={showBill}
          onClose={() => setShowBill(false)}
          sessionBill={sessionBill}
          activeTable={activeTable}
          menuItems={menuItems}
          addToCart={addToCart}
        />

        <AIFlashPopups
          showPopup1={showPopup1}
          showPopup2={showPopup2}
          handleSkipPopup1={handleSkipPopup1}
          handleSkipPopup2={handleSkipPopup2}
          settings={settings}
          menuItems={menuItems}
          cart={cart}
          addToCart={addToCart}
        />

        <DessertPrompt
          show={showDessertPrompt}
          onClose={() => setShowDessertPrompt(false)}
          settings={settings}
          menuItems={menuItems}
          cart={cart}
          addToCart={addToCart}
        />

        <MysteryBoxReveal
          show={showMysteryBounty}
          item={revealedMysteryItem}
          isOpen={isMysteryBoxOpened}
          onOpen={() => setIsMysteryBoxOpened(true)}
          onClose={handleCloseMysteryBounty}
        />


        <style>{`
        @keyframes bounce-fade-in {
          0% { transform: translateX(100px) scale(0.9); opacity: 0; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes bounce-fade-up {
          0% { transform: translateY(100px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes bounce-custom {
            0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
            50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
        }
        @keyframes shake {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-5deg) translateY(-5px); }
            50% { transform: rotate(5deg) translateY(0px); }
            75% { transform: rotate(-5deg) translateY(5px); }
        }
        @keyframes jump-reveal {
            0% { transform: scale(0.1) translateY(200px) rotate(-180deg); opacity: 0; box-shadow: 0 0 0 rgba(0,0,0,0); }
            50% { transform: scale(1.3) translateY(-50px) rotate(15deg); opacity: 1; box-shadow: 0 50px 100px rgba(0,0,0,0.5); }
            70% { transform: scale(0.9) translateY(10px) rotate(-5deg); }
            100% { transform: scale(1) translateY(0) rotate(0deg); box-shadow: 0 25px 50px rgba(0,0,0,0.3); }
        }
        @keyframes fall {
            0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(1000px) rotate(720deg); opacity: 0; }
        }
        .animate-bounce-fade-up { animation: bounce-fade-up 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-bounce-custom { animation: bounce-custom 2s infinite; }
        .animate-shake { animation: shake 1.5s infinite ease-in-out; }
        .animate-jump-reveal { animation: jump-reveal 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>
      </div >
    </>
  );
};

export default CustomerView;
