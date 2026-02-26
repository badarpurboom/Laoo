import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { MenuItem, CartItem, Order, OrderType } from '../../types';

// ── Marketing Banner Carousel ──────────────────────────────────────────────
const BannerCarousel: React.FC = () => {
  const { banners, fetchBanners } = useStore();
  const activeBanners = banners.filter(b => b.isActive);
  const [current, setCurrent] = React.useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { fetchBanners(); }, []);

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
};

// ─────────────────────────────────────────────────────────────────────────────

interface MenuItemCardProps {
  item: MenuItem;
  cart: CartItem[];
  addToCart: (item: MenuItem, portion: 'half' | 'full') => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  fakeDiscountPct?: number;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, cart, addToCart, updateQuantity, fakeDiscountPct = 0 }) => {
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
      className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex gap-4 transition-all hover:shadow-md cursor-pointer"
      onClick={zoomIn}
    >
      <div className="relative flex-shrink-0" style={{ zIndex: imgZoomed ? 20 : 'auto' }}>
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-24 h-24 rounded-xl object-cover"
          style={{
            transform: imgZoomed ? 'scale(1.55)' : 'scale(1)',
            transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
            position: 'relative',
            zIndex: imgZoomed ? 20 : 'auto',
          }}
        />
        {/* Fake Discount Badge — only if category has a fake discount */}
        {fakeDiscountPct > 0 && (
          <div className="absolute top-1 right-1 z-10" style={{ zIndex: imgZoomed ? 22 : 10 }}>
            <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-md animate-pulse">
              ⬇ {fakeDiscountPct}% OFF
            </div>
          </div>
        )}
        <span className={`absolute top-1 left-1 text-[8px] px-1.5 py-0.5 rounded-full font-bold ${item.isVeg ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
          style={{ zIndex: imgZoomed ? 21 : 'auto' }}>
          {item.isVeg ? 'VEG' : 'N-VEG'}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-sm leading-tight">{item.name}</h3>
          <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{item.description}</p>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex flex-col">
              {fakeOriginalPrice && (
                <span className="text-[10px] text-slate-400 line-through leading-none">₹{fakeOriginalPrice}</span>
              )}
              <span className={`font-black text-sm ${fakeOriginalPrice ? 'text-rose-600' : 'text-orange-600'}`}>₹{price}</span>
            </div>

            {item.halfPrice && (
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedPortion('half'); }}
                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all ${selectedPortion === 'half' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Half
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedPortion('full'); }}
                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all ${selectedPortion === 'full' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Full
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-2">
          {inCart ? (
            <div className="flex items-center gap-3 bg-white rounded-full px-2 py-1 shadow-sm border border-orange-100">
              <button
                onClick={(e) => { e.stopPropagation(); updateQuantity(cartItemId, -1); }}
                className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full"
              >
                <i className="fas fa-minus text-[10px]"></i>
              </button>
              <span className="text-xs font-black w-4 text-center text-slate-800">{inCart.quantity}</span>
              <button
                onClick={(e) => { e.stopPropagation(); updateQuantity(cartItemId, 1); }}
                className="w-6 h-6 flex items-center justify-center text-orange-500 hover:bg-orange-50 rounded-full"
              >
                <i className="fas fa-plus text-[10px]"></i>
              </button>
            </div>
          ) : (
            <button
              disabled={!item.isAvailable}
              onClick={(e) => { e.stopPropagation(); addToCart(item, selectedPortion); }}
              className="bg-orange-500 text-white px-4 py-1.5 rounded-full flex items-center gap-2 hover:bg-orange-600 disabled:bg-slate-300 shadow-sm transition-all active:scale-95 text-[10px] font-black uppercase tracking-wider"
            >
              Add
              <i className="fas fa-plus text-[8px]"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const CustomerView: React.FC = () => {
  const { menuItems, categories, settings, addOrder, activeRestaurantId, orders, restaurants, recommendedItems, isFetchingRecommendations, fetchAIRecommendations } = useStore();
  const activeRestaurant = restaurants.find(r => r.id === activeRestaurantId);
  const isHotel = activeRestaurant?.businessType === 'hotel';
  const tableLabel = isHotel ? 'Room Number' : 'Table Number';
  const tablePlaceholder = isHotel ? 'e.g. 205' : 'e.g. 5';

  const [activeTable, setActiveTable] = useState<string>('');
  const [showBill, setShowBill] = useState(false);

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

  const tenantCategories = categories.filter(c => c.restaurantId === activeRestaurantId);
  const tenantMenuItems = menuItems.filter(m => m.restaurantId === activeRestaurantId);

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
    <div className="pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm px-4 py-4 flex justify-between items-center">
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
      <BannerCarousel />

      {/* Search Bar */}
      <div className="px-4 mb-4">
        <div className="relative group">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"></i>
          <input
            type="text"
            placeholder="Search for dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={(e) => {
              const target = e.target as HTMLInputElement;
              // Add a small delay for the mobile keyboard to pop up before scrolling
              setTimeout(() => {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 400);
            }}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm font-medium"
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

      {/* Categories */}
      <div className="flex gap-3 px-4 py-2 overflow-x-auto no-scrollbar mb-4">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`whitespace-nowrap px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          All Items
        </button>
        {tenantCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`whitespace-nowrap px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat.id ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
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


      {/* Sticky Bottom Order Bar (View Cart) */}
      {
        cart.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
            <div className="bg-slate-900 text-white p-3 pr-4 rounded-2xl shadow-2xl flex justify-between items-center animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center gap-4 pl-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {cart.reduce((s, i) => s + i.quantity, 0)} {cart.reduce((s, i) => s + i.quantity, 0) === 1 ? 'Item' : 'Items'}
                  </span>
                  <span className="text-xl font-black">₹{finalTotal.toFixed(0)}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCart(true);
                  if (cart.length > 0) fetchAIRecommendations(cart);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-orange-500/20 flex items-center gap-2"
              >
                View Cart
                <i className="fas fa-chevron-right text-[10px]"></i>
              </button>
            </div>
          </div>
        )
      }

      {/* Cart Modal */}
      {
        showCart && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
            <div className="bg-white w-full sm:max-w-md h-[90vh] sm:h-auto sm:max-h-[80vh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Your Cart</h2>
                <button onClick={() => { setShowCart(false); setCheckoutStep('cart'); }} className="text-slate-400 hover:text-slate-600">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {checkoutStep === 'cart' && (
                  <>
                    {/* AI Upsell Carousel - MOVED TO TOP FOR VISIBILITY */}
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
                              <i className="fas fa-magic text-indigo-500"></i> Perfect Add-ons For You
                              {settings.aiMarketingEnabled && (settings.maxAiDiscountPct || 0) > 0 && (
                                <span className="ml-auto text-[9px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full normal-case tracking-normal">
                                  🔥 Up to {settings.maxAiDiscountPct}% OFF
                                </span>
                              )}
                            </h3>
                            <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 relative z-10">
                              {recommendedItems.filter(item => !cart.find(c => c.id === item.id)).map(item => {
                                // Calculate a smart discount for this item if AI marketing is enabled
                                const maxDisc = (settings.aiMarketingEnabled && (settings.maxAiDiscountPct || 0) > 0) ? settings.maxAiDiscountPct! : 0;
                                // Use item.id chars to get a stable "random" discount per item (not random every render)
                                const discPct = maxDisc > 0
                                  ? Math.max(5, Math.min(maxDisc, (item.id.charCodeAt(0) % (maxDisc - 4)) + 5))
                                  : 0;
                                const discountedPrice = discPct > 0 ? Math.round(item.fullPrice * (1 - discPct / 100)) : item.fullPrice;

                                return (
                                  <div key={item.id} className="min-w-[130px] w-[130px] bg-white rounded-xl p-2 shadow-sm border border-indigo-50/50 flex flex-col gap-2 group relative overflow-hidden">
                                    {discPct > 0 && (
                                      <div className="absolute top-1 left-1 z-10 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                        -{discPct}%
                                      </div>
                                    )}
                                    <div className="overflow-hidden rounded-lg">
                                      <img src={item.imageUrl} className="w-full h-20 object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                      <h4 className="text-[11px] font-bold text-slate-800 leading-tight line-clamp-2" title={item.name}>{item.name}</h4>
                                      <div className="flex justify-between items-center mt-2">
                                        <div className="flex flex-col">
                                          {discPct > 0 && (
                                            <span className="text-[9px] text-slate-400 line-through leading-none">₹{item.fullPrice}</span>
                                          )}
                                          <span className="text-[11px] font-black text-indigo-600">₹{discountedPrice}</span>
                                        </div>
                                        <button
                                          onClick={() => {
                                            // Add at the discounted price
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
                    {/* End AI Upsell */}

                    {/* Reward Progress Bar */}
                    {settings.giftThreshold && settings.giftThreshold > 0 && settings.giftItemId && cart.length > 0 && (() => {
                      const giftItem = menuItems.find(m => m.id === settings.giftItemId);
                      if (!giftItem) return null;
                      const amountToReward = settings.giftThreshold - cartTotal;
                      const progress = Math.min(100, (cartTotal / settings.giftThreshold) * 100);
                      const isUnlocked = amountToReward <= 0;

                      return (
                        <div className="mb-6 bg-emerald-50 border border-emerald-100 p-4 rounded-xl relative overflow-hidden">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                              <i className="fas fa-gift text-emerald-500"></i>
                              {isUnlocked ? "Reward Unlocked!" : `Spend ₹${amountToReward.toFixed(0)} more for a FREE ${giftItem.name}!`}
                            </h4>
                          </div>
                          <div className="w-full bg-emerald-200/50 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500 ease-out relative"
                              style={{ width: `${progress}%` }}
                            >
                              {progress > 10 && (
                                <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
                              )}
                            </div>
                          </div>
                          {isUnlocked && (
                            <p className="text-[10px] text-emerald-600 mt-2 font-semibold">
                              ✅ {giftItem.name} will be added to your order for free!
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Mystery Box Impulse Buy */}
                    {settings.mysteryBoxEnabled && cart.length > 0 && !cart.find(c => c.id === 'mystery_box') && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-rose-50 rounded-xl border border-orange-100 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center text-rose-500 text-xl border border-rose-100 shrink-0">
                            <i className="fas fa-box-open animate-bounce"></i>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 leading-tight mb-0.5">Mystery Box</h4>
                            <p className="text-[10px] text-slate-500 leading-tight">Add a surprise dessert for just ₹{settings.mysteryBoxPrice}!</p>
                          </div>
                        </div>
                        <button
                          onClick={handleAddMysteryBox}
                          className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-slate-900 transition-colors whitespace-nowrap active:scale-95 shrink-0"
                        >
                          + Add ₹{settings.mysteryBoxPrice}
                        </button>
                      </div>
                    )}

                    {cart.length === 0 ? (
                      <div className="text-center py-20">
                        <i className="fas fa-shopping-cart text-slate-200 text-6xl mb-4"></i>
                        <p className="text-slate-400">Your cart is empty</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cart.map(item => {
                          const cartItemId = `${item.id}-${item.portionType}`;

                          return (
                            <div key={cartItemId} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                              <div className="flex items-center gap-3">
                                <img src={item.imageUrl} className="w-12 h-12 rounded-lg object-cover" />
                                <div className="flex-1">
                                  <h4 className="text-sm font-semibold leading-tight">
                                    {item.name}
                                    {item.halfPrice && (
                                      <span className="text-[10px] text-orange-600 font-bold ml-1 uppercase">
                                        ({item.portionType})
                                      </span>
                                    )}
                                  </h4>
                                  <p className="text-xs text-slate-500">₹{item.price.toFixed(0)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 bg-white rounded-full px-2 py-1 shadow-sm border">
                                <button
                                  onClick={() => updateQuantity(cartItemId, -1)}
                                  className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-full"
                                >
                                  {item.quantity === 1 ? <i className="fas fa-trash-alt text-[10px] text-red-500"></i> : <i className="fas fa-minus text-[10px]"></i>}
                                </button>
                                <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(cartItemId, 1)}
                                  className="w-6 h-6 flex items-center justify-center text-orange-500 hover:bg-orange-50 rounded-full"
                                >
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
                          if (isHotel) return type === 'dine-in'; // Hotels: only room service
                          if (type === 'dine-in') return settings.orderPreferences?.dineIn ?? true;
                          if (type === 'takeaway') return settings.orderPreferences?.takeaway ?? true;
                          if (type === 'delivery') return settings.orderPreferences?.delivery ?? true;
                          return true;
                        }).map((type) => (
                          <button
                            key={type}
                            onClick={() => setOrderType(type as OrderType)}
                            className={`flex-1 py-2 px-1 rounded-lg text-xs font-semibold capitalize border transition-all ${orderType === type ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
                          >
                            {isHotel && type === 'dine-in' ? 'Room Service' : type.replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Your name"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>

                    {(orderType === 'delivery' || settings.orderPreferences?.requireCustomerPhone) && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Mobile number"
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                      </div>
                    )}

                    {orderType !== 'takeaway' && (
                      <div>
                        {orderType === 'dine-in' && !(settings.orderPreferences?.requireTableNumber ?? true) ? null : (
                          <>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              {orderType === 'dine-in' ? tableLabel : 'Delivery Address'}
                            </label>
                            <input
                              type="text"
                              value={tableOrAddress}
                              onChange={(e) => setTableOrAddress(e.target.value)}
                              placeholder={orderType === 'dine-in' ? tablePlaceholder : "Full address"}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {checkoutStep === 'success' && (
                  <div className="text-center py-10">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <i className="fas fa-check text-4xl"></i>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Order Confirmed!</h3>
                    <p className="text-slate-500 mb-6">Your order is being prepared. Enjoy your meal!</p>
                    <button
                      onClick={finalizeSuccess}
                      className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>

              {checkoutStep !== 'success' && cart.length > 0 && (
                <div className="p-6 border-t bg-slate-50">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-slate-600 text-sm">
                      <span>Subtotal</span>
                      <span>₹{cartTotal.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-sm">
                      <span>Tax ({settings.taxPercentage}%)</span>
                      <span>₹{taxAmount.toFixed(0)}</span>
                    </div>
                    {deliveryFee > 0 && (
                      <div className="flex justify-between text-slate-600 text-sm">
                        <span>Delivery Fee</span>
                        <span>₹{deliveryFee.toFixed(0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-slate-800">
                      <span>Total</span>
                      <span>₹{finalTotal.toFixed(0)}</span>
                    </div>
                  </div>
                  {checkoutStep === 'cart' ? (
                    <button
                      onClick={() => setCheckoutStep('details')}
                      className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-600 transition-colors"
                    >
                      Checkout
                    </button>
                  ) : (
                    <button
                      onClick={handleCheckout}
                      className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-900 transition-colors"
                    >
                      Place Order
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* Bill Modal */}
      {
        showBill && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
            <div className="bg-white w-full sm:max-w-md h-[80vh] sm:h-auto rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Table {activeTable}</h2>
                  <p className="text-xs text-slate-500">Session Summary</p>
                </div>
                <button onClick={() => setShowBill(false)} className="bg-white w-8 h-8 rounded-full shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600">
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

                {/* 🔄 Re-Order Nudge */}
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
                        .filter((item, idx, arr) => arr.findIndex(i => i.name === item.name) === idx) // deduplicate
                        .slice(0, 4) // show max 4 items
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
                                    setShowBill(false);
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
                <button
                  onClick={() => setShowBill(false)}
                  className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold shadow-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* AI Flash Popups */}
      {
        showPopup1 && settings.popupItem1Id && (() => {
          const item = menuItems.find(m => m.id === settings.popupItem1Id);
          if (!item || !item.isAvailable || cart.find(i => i.id === item.id)) return null;
          return (
            <div className="fixed top-20 right-4 z-50 pointer-events-auto shadow-2xl rounded-2xl" style={{ animation: 'bounce-fade-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700 max-w-[280px] sm:max-w-sm relative overflow-hidden ring-4 ring-slate-900/50">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-rose-500/20 to-pink-500/20 rounded-full blur-2xl pointer-events-none"></div>
                <button onClick={handleSkipPopup1} className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full text-sm transition-colors z-20">
                  <i className="fas fa-times"></i>
                </button>
                <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 z-10 relative">
                  <i className="fas fa-star text-rose-400 animate-pulse"></i> Top Rated
                </h4>
                <div className="flex gap-4 relative z-10">
                  <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-xl object-cover shadow-sm shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white leading-tight mb-0.5 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-300 mb-2 leading-snug font-medium">{settings.popup1Text || "🌟 Customer Favorite! Try it today."}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-black text-rose-400">₹{item.fullPrice}</span>
                      <button
                        onClick={() => { addToCart(item, 'full', true, 'POPUP'); setShowPopup1(false); }}
                        className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-rose-500/20 hover:shadow-lg active:scale-95 transition-all text-center flex items-center justify-center gap-1"
                      >
                        Add <i className="fas fa-shopping-cart text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      }

      {
        showPopup2 && settings.popupItem2Id && (() => {
          const item = menuItems.find(m => m.id === settings.popupItem2Id);
          if (!item || !item.isAvailable || cart.find(i => i.id === item.id)) return null;
          return (
            <div className="fixed bottom-24 left-4 z-50 pointer-events-auto shadow-2xl rounded-2xl" style={{ animation: 'bounce-fade-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700 max-w-[280px] sm:max-w-sm relative overflow-hidden ring-4 ring-slate-900/50">
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 rounded-full blur-2xl pointer-events-none"></div>
                <button onClick={handleSkipPopup2} className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full text-sm transition-colors z-20">
                  <i className="fas fa-times"></i>
                </button>
                <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 z-10 relative">
                  <i className="fas fa-fire animate-pulse"></i> Chef's Secret
                </h4>
                <div className="flex gap-4 relative z-10">
                  <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-xl object-cover shadow-sm shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white leading-tight mb-0.5 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-300 mb-2 leading-snug font-medium">{settings.popup2Text || "🔥 Chef's Secret! Abhi bhi confused ho?"}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-black text-amber-400">₹{item.fullPrice}</span>
                      <button
                        onClick={() => { addToCart(item, 'full', true, 'POPUP'); setShowPopup2(false); }}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-orange-500/20 hover:shadow-lg active:scale-95 transition-all text-center flex items-center justify-center gap-1"
                      >
                        Add <i className="fas fa-shopping-cart text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      }

      {/* 🍰 POST-MEAL DESSERT PROMPT */}
      {
        showDessertPrompt && (settings.dessertPromptItemIds || []).length > 0 && (
          <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" style={{ animation: 'bounce-fade-in 0.5s ease forwards' }}>
            <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl">
              {/* Pink gradient header */}
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-5 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                <div className="relative z-10">
                  <div className="text-4xl mb-2">🍮</div>
                  <h3 className="text-xl font-black">Khana aacha laga?</h3>
                  <p className="text-pink-100 text-sm mt-1">Kuch meetha ho jaye! 😋</p>
                </div>
                <button
                  onClick={() => setShowDessertPrompt(false)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <i className="fas fa-times text-sm"></i>
                </button>
              </div>
              {/* Dessert items */}
              <div className="p-5 space-y-3">
                {(settings.dessertPromptItemIds || []).map(itemId => {
                  const item = menuItems.find(m => m.id === itemId && m.isAvailable);
                  if (!item) return null;
                  const alreadyInCart = cart.find(c => c.id === item.id);
                  return (
                    <div key={item.id} className="flex items-center gap-3 bg-pink-50 border border-pink-100 rounded-2xl p-3">
                      <img src={item.imageUrl} className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{item.name}</p>
                        <p className="text-pink-600 font-black text-sm">₹{item.fullPrice}</p>
                      </div>
                      <button
                        onClick={() => {
                          if (!alreadyInCart) addToCart(item, 'full', true, 'DESSERT_PROMPT');
                          setShowDessertPrompt(false);
                        }}
                        className={`shrink-0 px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 ${alreadyInCart ? 'bg-slate-100 text-slate-400' : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-200 hover:shadow-lg'}`}
                      >
                        {alreadyInCart ? '✓ Added' : '+ Add'}
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => setShowDessertPrompt(false)}
                  className="w-full py-3 text-slate-400 text-xs font-medium hover:text-slate-600 transition-colors"
                >
                  No thanks, I'm full 😊
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* GLOBAL / HOME SCREEN MYSTERY BOX REVEAL */}
      {
        showMysteryBounty && revealedMysteryItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-md pointer-events-auto">
            {!isMysteryBoxOpened ? (
              <div className="flex flex-col items-center justify-center cursor-pointer group px-4 animate-bounce-fade-up" onClick={() => setIsMysteryBoxOpened(true)}>
                <h2 className="text-3xl font-black text-white mb-10 text-center drop-shadow-lg">
                  You've unlocked a <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400">Mystery Box! 🎁</span>
                </h2>
                <div className="relative mb-12">
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/50 to-rose-500/50 rounded-full blur-[80px] animate-pulse"></div>
                  <div className="w-56 h-56 bg-gradient-to-br from-indigo-500 border-[8px] border-white/20 to-purple-700 rounded-3xl shadow-[0_0_50px_rgba(236,72,153,0.5)] relative z-10 animate-shake flex items-center justify-center transition-transform duration-300">
                    <i className="fas fa-question text-8xl text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] opacity-90 animate-pulse"></i>
                  </div>
                </div>
                <button className="bg-gradient-to-r from-orange-500 to-rose-600 text-white px-10 py-5 rounded-full font-black shadow-[0_10px_40px_rgba(244,63,94,0.5)] active:scale-95 transition-all flex items-center gap-3 text-xl tracking-wide uppercase">
                  Tap To Open
                  <i className="fas fa-hand-pointer animate-bounce text-2xl"></i>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-4 w-full h-full">
                {/* Confetti Explosion Effect via CSS + Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="absolute w-3 h-8 bg-orange-500 opacity-80"
                      style={{
                        left: `${Math.random() * 100}%`, top: '-5%',
                        transform: `rotate(${Math.random() * 360}deg)`,
                        animation: `fall ${1 + Math.random() * 2}s linear forwards`,
                        backgroundColor: ['#f97316', '#e11d48', '#8b5cf6', '#3b82f6'][Math.floor(Math.random() * 4)]
                      }}>
                    </div>
                  ))}
                </div>

                <div className="relative z-10 mb-8 mt-10">
                  {/* Spinning Light Rays */}
                  <div className="absolute -inset-[100%] animate-[spin_8s_linear_infinite] flex items-center justify-center pointer-events-none">
                    <div className="w-[800px] h-[800px] bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] opacity-10 blur-md"></div>
                    <div className="absolute w-[800px] h-[800px] bg-[conic-gradient(from_45deg,transparent_0_340deg,white_360deg)] opacity-10 blur-2xl"></div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 to-rose-500 rounded-full blur-[60px] opacity-70 animate-pulse"></div>
                  <img
                    src={revealedMysteryItem.imageUrl}
                    alt="Mystery Item"
                    className="w-56 h-56 md:w-64 md:h-64 rounded-[2.5rem] object-cover border-[6px] border-white shadow-2xl relative z-10 animate-jump-reveal bg-white"
                  />
                  <div className="absolute -bottom-6 -right-6 bg-green-500 text-white text-lg font-black px-6 py-2 rounded-full shadow-2xl z-20 transform -rotate-6 border-4 border-white animate-bounce-custom">
                    Worth ₹{revealedMysteryItem.price}!
                  </div>
                </div>

                <h2 className="text-4xl md:text-5xl font-black text-white mb-3 mt-4 text-center z-10 animate-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both drop-shadow-xl tracking-tight">
                  It's <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400">{revealedMysteryItem.name}!</span> 🎉
                </h2>
                <p className="text-slate-300 text-center mb-10 px-4 text-sm md:text-base font-medium z-10 max-w-sm animate-in fade-in duration-1000 delay-500 fill-mode-both">
                  Surprise! This item has been added to your confirmed order. The Chef hopes you love it!
                </p>

                <button
                  onClick={handleCloseMysteryBounty}
                  className="w-full max-w-[300px] py-4 md:py-5 bg-white text-slate-900 rounded-2xl font-black text-lg shadow-[0_10px_40px_rgba(255,255,255,0.2)] hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center gap-3 z-10 uppercase tracking-widest animate-in fade-in zoom-in duration-500 delay-1000 fill-mode-both"
                >
                  Awesome! <i className="fas fa-check-circle text-green-500"></i>
                </button>
              </div>
            )}
          </div>
        )
      }

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
  );
};

export default CustomerView;
