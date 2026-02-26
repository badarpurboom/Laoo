
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  MenuItem,
  Category,
  Order,
  RestaurantSettings,
  AIConfig,
  PaymentConfig,
  User,
  Restaurant,
  UserRole,
  OrderStatus,
  Banner
} from './types';
import { restaurantService, menuService, orderService, aiServiceApi, bannerService } from './services/api';

// Safe JSON parsing helper
const safeParseItemIds = (data: any): string[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Parse error:", e);
    return [];
  }
};

interface AppState {
  // Menu
  categories: Category[];
  menuItems: MenuItem[];
  recommendedItems: MenuItem[];
  isFetchingRecommendations: boolean;

  // Orders
  orders: Order[];

  // Configs
  settings: RestaurantSettings;
  aiConfig: AIConfig;
  paymentConfig: PaymentConfig;

  // SaaS State
  restaurants: Restaurant[];
  currentUser: User | null;
  activeRestaurantId: string | null;

  // Marketing
  banners: Banner[];

  // Actions
  fetchDashboardData: () => Promise<void>;
  addRestaurant: (restaurant: Partial<Restaurant>) => Promise<void>;
  updateRestaurant: (restaurant: Restaurant) => Promise<void>;
  deleteRestaurant: (id: string) => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  setActiveRestaurantId: (id: string | null) => void;
  setActiveRestaurantBySlug: (slug: string) => Promise<void>;

  // Existing Actions
  addOrder: (order: Partial<Order>) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  updatePaymentStatus: (id: string, status: 'pending' | 'paid') => Promise<void>;
  updateMenuItem: (item: MenuItem) => Promise<void>;
  addMenuItem: (item: MenuItem) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  addCategory: (category: Partial<Category>) => Promise<void>;
  addCategoriesBulk: (categories: { name: string, icon?: string }[]) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateCategory: (id: string, data: Partial<import('./types').Category>) => Promise<void>;
  updateSettings: (settings: RestaurantSettings) => Promise<void>;
  updateAIConfig: (config: AIConfig) => void;
  updatePaymentConfig: (config: PaymentConfig) => void;

  // AI Upsell
  fetchAIRecommendations: (cartItems: any[]) => Promise<void>;
  clearRecommendations: () => void;

  // Banner Actions
  fetchBanners: () => Promise<void>;
  addBanner: (data: Partial<Banner>) => Promise<void>;
  updateBanner: (id: string, data: Partial<Banner>) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      restaurants: [],
      currentUser: null,
      activeRestaurantId: null,
      categories: [],
      menuItems: [],
      orders: [],
      recommendedItems: [],
      isFetchingRecommendations: false,
      banners: [],

      settings: {
        restaurantId: '',
        name: "",
        logoUrl: "",
        address: "",
        contact: "",
        gstNumber: "",
        taxEnabled: false,
        taxPercentage: 0,
        deliveryChargesEnabled: false,
        deliveryCharges: 0,
        deliveryFreeThreshold: 0,
        currency: 'INR',
        isOpen: true,
        aiUpsellEnabled: true,
        aiUpsellPopupEnabled: false,
        popupMode: 'MANUAL',
        popupItem1Id: null,
        popupItem2Id: null,
        popup1Text: null,
        popup2Text: null,
        giftThreshold: null,
        giftItemId: null,
        aiMarketingEnabled: true,
        maxAiDiscountPct: 15,
        mysteryBoxEnabled: false,
        mysteryBoxPrice: 49,
        mysteryBoxItemIds: [],
        dessertPromptEnabled: false,
        dessertPromptMinutes: 15,
        dessertPromptItemIds: [],
        orderPreferences: {
          dineIn: true,
          takeaway: true,
          delivery: true,
          requireTableNumber: true
        }
      },
      aiConfig: {
        provider: 'gemini',
        apiKey: '',
        model: 'gemini-3-flash-preview',
        temperature: 0.7,
        promptSystem: 'You are a professional business analyst for a restaurant. You have access to order and menu data. Format your answers concisely.'
      },
      paymentConfig: {
        stripeEnabled: true,
        stripeApiKey: 'pk_test_mock',
        razorpayEnabled: false,
        razorpayApiKey: ''
      },

      fetchDashboardData: async () => {
        const { activeRestaurantId } = get();

        // 1. Always fetch restaurants list first and successfully
        try {
          const resResp = await restaurantService.getAll();
          set({ restaurants: resResp.data });
        } catch (err) {
          console.error("Failed to fetch restaurants", err);
        }

        // 2. Fetch active restaurant details if applicable
        if (activeRestaurantId) {
          try {
            const [catResp, itemResp, orderResp] = await Promise.all([
              menuService.getCategories(activeRestaurantId),
              menuService.getMenuItems(activeRestaurantId),
              orderService.getOrders(activeRestaurantId)
            ]);

            set({
              categories: catResp.data as any,
              menuItems: itemResp.data as any,
              orders: orderResp.data as any
            });
          } catch (err) {
            console.error("Failed to load active restaurant details", err);
          }
        }
      },

      addRestaurant: async (res) => {
        const resp = await restaurantService.create(res);
        set((state) => ({ restaurants: [resp.data, ...state.restaurants] }));
      },
      updateRestaurant: async (res) => {
        const resp = await restaurantService.update(res.id, res);
        set((state) => ({
          restaurants: state.restaurants.map(r => r.id === res.id ? resp.data : r)
        }));
      },
      deleteRestaurant: async (id) => {
        try {
          await restaurantService.delete(id);
        } catch (err) {
          console.error("API delete failed, removing locally anyway", err);
        }
        set((state) => ({
          restaurants: state.restaurants.filter(r => r.id !== id),
          // If we deleted the active restaurant, clear the active state
          activeRestaurantId: state.activeRestaurantId === id ? null : state.activeRestaurantId
        }));
      },
      setCurrentUser: (user) => set({ currentUser: user }),
      setActiveRestaurantId: async (id) => {
        set({ activeRestaurantId: id });

        // Load settings from the selected restaurant (from API)
        if (id) {
          try {
            // Always fetch fresh from API to ensure latest data
            const resp = await restaurantService.getAll();
            const allRestaurants = resp.data || [];
            set({ restaurants: allRestaurants });

            const restaurant = allRestaurants.find((r: any) => r.id === id);
            if (restaurant) {
              set({
                settings: {
                  restaurantId: restaurant.id,
                  name: restaurant.name || '',
                  logoUrl: restaurant.logoUrl || '',
                  address: restaurant.address || '',
                  contact: restaurant.phone || '',
                  gstNumber: '',
                  taxEnabled: restaurant.taxEnabled !== undefined ? restaurant.taxEnabled : true,
                  taxPercentage: restaurant.taxPercentage !== undefined ? restaurant.taxPercentage : 5,
                  deliveryChargesEnabled: restaurant.deliveryChargesEnabled !== undefined ? restaurant.deliveryChargesEnabled : true,
                  deliveryCharges: restaurant.deliveryCharges !== undefined ? restaurant.deliveryCharges : 40,
                  deliveryFreeThreshold: restaurant.deliveryFreeThreshold !== undefined ? restaurant.deliveryFreeThreshold : 500,
                  currency: 'INR',
                  isOpen: restaurant.isActive !== undefined ? restaurant.isActive : true,
                  aiUpsellEnabled: restaurant.aiUpsellEnabled !== undefined ? restaurant.aiUpsellEnabled : false,
                  aiUpsellPopupEnabled: restaurant.aiUpsellPopupEnabled !== undefined ? restaurant.aiUpsellPopupEnabled : false,
                  popupMode: restaurant.popupMode || 'MANUAL',
                  popupItem1Id: restaurant.popupItem1Id || null,
                  popupItem2Id: restaurant.popupItem2Id || null,
                  popup1Text: restaurant.popup1Text || null,
                  popup2Text: restaurant.popup2Text || null,
                  giftThreshold: restaurant.giftThreshold !== undefined ? restaurant.giftThreshold : null,
                  giftItemId: restaurant.giftItemId || null,
                  aiMarketingEnabled: restaurant.aiMarketingEnabled !== undefined ? restaurant.aiMarketingEnabled : true,
                  maxAiDiscountPct: restaurant.maxAiDiscountPct !== undefined ? restaurant.maxAiDiscountPct : 15,
                  mysteryBoxEnabled: restaurant.mysteryBoxEnabled !== undefined ? restaurant.mysteryBoxEnabled : false,
                  mysteryBoxPrice: restaurant.mysteryBoxPrice !== undefined ? restaurant.mysteryBoxPrice : 49,
                  mysteryBoxItemIds: safeParseItemIds(restaurant.mysteryBoxItemIds),
                  dessertPromptEnabled: restaurant.dessertPromptEnabled !== undefined ? restaurant.dessertPromptEnabled : false,
                  dessertPromptMinutes: restaurant.dessertPromptMinutes !== undefined ? restaurant.dessertPromptMinutes : 15,
                  dessertPromptItemIds: safeParseItemIds(restaurant.dessertPromptItemIds),
                  orderPreferences: {
                    dineIn: restaurant.dineInEnabled !== undefined ? restaurant.dineInEnabled : true,
                    takeaway: restaurant.takeawayEnabled !== undefined ? restaurant.takeawayEnabled : true,
                    delivery: restaurant.deliveryEnabled !== undefined ? restaurant.deliveryEnabled : true,
                    requireTableNumber: restaurant.requireTableNumber !== undefined ? restaurant.requireTableNumber : true
                  }
                }
              });
            }
          } catch (err) {
            console.error("Failed to fetch restaurant settings", err);
          }
        }

        get().fetchDashboardData();
      },
      setActiveRestaurantBySlug: async (slug) => {
        const resp = await restaurantService.getBySlug(slug);
        if (resp.data) {
          const restaurant = resp.data as any;
          set({
            activeRestaurantId: restaurant.id,
            categories: restaurant.categories || [],
            menuItems: restaurant.menuItems || [],
            settings: {
              restaurantId: restaurant.id,
              name: restaurant.name || '',
              logoUrl: restaurant.logoUrl || '',
              address: restaurant.address || '',
              contact: restaurant.phone || '',
              gstNumber: '',
              taxEnabled: restaurant.taxEnabled !== undefined ? restaurant.taxEnabled : false,
              taxPercentage: restaurant.taxPercentage !== undefined ? restaurant.taxPercentage : 0,
              deliveryChargesEnabled: restaurant.deliveryChargesEnabled !== undefined ? restaurant.deliveryChargesEnabled : false,
              deliveryCharges: restaurant.deliveryCharges !== undefined ? restaurant.deliveryCharges : 0,
              deliveryFreeThreshold: restaurant.deliveryFreeThreshold !== undefined ? restaurant.deliveryFreeThreshold : 0,
              currency: 'INR',
              isOpen: restaurant.isActive !== undefined ? restaurant.isActive : true,
              aiUpsellEnabled: restaurant.aiUpsellEnabled !== undefined ? restaurant.aiUpsellEnabled : false,
              aiUpsellPopupEnabled: restaurant.aiUpsellPopupEnabled !== undefined ? restaurant.aiUpsellPopupEnabled : false,
              popupMode: restaurant.popupMode || 'MANUAL',
              popupItem1Id: restaurant.popupItem1Id || null,
              popupItem2Id: restaurant.popupItem2Id || null,
              popup1Text: restaurant.popup1Text || null,
              popup2Text: restaurant.popup2Text || null,
              giftThreshold: restaurant.giftThreshold !== undefined ? restaurant.giftThreshold : null,
              giftItemId: restaurant.giftItemId || null,
              aiMarketingEnabled: restaurant.aiMarketingEnabled !== undefined ? restaurant.aiMarketingEnabled : true,
              maxAiDiscountPct: restaurant.maxAiDiscountPct !== undefined ? restaurant.maxAiDiscountPct : 15,
              mysteryBoxEnabled: restaurant.mysteryBoxEnabled !== undefined ? restaurant.mysteryBoxEnabled : false,
              mysteryBoxPrice: restaurant.mysteryBoxPrice !== undefined ? restaurant.mysteryBoxPrice : 49,
              mysteryBoxItemIds: safeParseItemIds(restaurant.mysteryBoxItemIds),
              dessertPromptEnabled: restaurant.dessertPromptEnabled !== undefined ? restaurant.dessertPromptEnabled : false,
              dessertPromptMinutes: restaurant.dessertPromptMinutes !== undefined ? restaurant.dessertPromptMinutes : 15,
              dessertPromptItemIds: safeParseItemIds(restaurant.dessertPromptItemIds),
              orderPreferences: {
                dineIn: restaurant.dineInEnabled !== undefined ? restaurant.dineInEnabled : true,
                takeaway: restaurant.takeawayEnabled !== undefined ? restaurant.takeawayEnabled : true,
                delivery: restaurant.deliveryEnabled !== undefined ? restaurant.deliveryEnabled : true,
                requireTableNumber: restaurant.requireTableNumber !== undefined ? restaurant.requireTableNumber : true
              }
            }
          });
        }
      },

      addOrder: async (order) => {
        const resp = await orderService.createOrder(order);
        set((state) => ({ orders: [resp.data, ...state.orders] }));
      },
      updateOrderStatus: async (id, status) => {
        await orderService.updateStatus(id, status);
        set((state) => ({
          orders: state.orders.map(o => o.id === id ? { ...o, status } : o)
        }));
      },
      updatePaymentStatus: async (id, status) => {
        await orderService.updatePaymentStatus(id, status);
        set((state) => ({
          orders: state.orders.map(o => o.id === id ? { ...o, paymentStatus: status } : o)
        }));
      },
      updateMenuItem: async (item) => {
        const resp = await menuService.updateMenuItem(item.id, item);
        set((state) => ({
          menuItems: state.menuItems.map(m => m.id === item.id ? resp.data : m)
        }));
      },
      addMenuItem: async (item) => {
        const resp = await menuService.createMenuItem(item);
        set((state) => ({
          menuItems: [resp.data, ...state.menuItems]
        }));
      },
      deleteMenuItem: async (id) => {
        await menuService.deleteMenuItem(id);
        set((state) => ({
          menuItems: state.menuItems.filter(m => m.id !== id)
        }));
      },
      addCategory: async (category) => {
        const resp = await menuService.addCategory(category);
        set((state) => ({
          categories: [resp.data, ...state.categories]
        }));
      },
      addCategoriesBulk: async (newCategories) => {
        const { activeRestaurantId } = get();
        if (!activeRestaurantId) return;
        const resp = await menuService.createCategoriesBulk(activeRestaurantId, newCategories);
        set((state) => ({
          categories: [...resp.data, ...state.categories]
        }));
      },
      deleteCategory: async (id) => {
        await menuService.deleteCategory(id);
        set((state) => ({
          categories: state.categories.filter(c => c.id !== id),
          menuItems: state.menuItems.filter(m => m.categoryId !== id)
        }));
      },
      updateCategory: async (id, data) => {
        const resp = await menuService.updateCategory(id, data);
        set((state) => ({
          categories: state.categories.map(c => c.id === id ? { ...c, ...resp.data } : c)
        }));
      },
      updateSettings: async (settings) => {
        set({ settings });
        const { activeRestaurantId } = get();
        if (activeRestaurantId) {
          // Map settings back to Restaurant model fields
          const updateData: Partial<Restaurant> = {
            name: settings.name,
            address: settings.address,
            phone: settings.contact,
            logoUrl: settings.logoUrl,
            isActive: settings.isOpen,
            aiUpsellEnabled: settings.aiUpsellEnabled,
            taxEnabled: settings.taxEnabled,
            taxPercentage: settings.taxPercentage,
            deliveryChargesEnabled: settings.deliveryChargesEnabled,
            deliveryCharges: settings.deliveryCharges,
            deliveryFreeThreshold: settings.deliveryFreeThreshold,
            dineInEnabled: settings.orderPreferences?.dineIn,
            takeawayEnabled: settings.orderPreferences?.takeaway,
            deliveryEnabled: settings.orderPreferences?.delivery,
            requireTableNumber: settings.orderPreferences?.requireTableNumber,
            aiUpsellPopupEnabled: settings.aiUpsellPopupEnabled,
            popupMode: settings.popupMode,
            popupItem1Id: settings.popupItem1Id,
            popupItem2Id: settings.popupItem2Id,
            popup1Text: settings.popup1Text,
            popup2Text: settings.popup2Text,
            giftThreshold: settings.giftThreshold,
            giftItemId: settings.giftItemId,
            aiMarketingEnabled: settings.aiMarketingEnabled,
            maxAiDiscountPct: settings.maxAiDiscountPct,
            mysteryBoxEnabled: settings.mysteryBoxEnabled,
            mysteryBoxPrice: settings.mysteryBoxPrice,
            mysteryBoxItemIds: JSON.stringify(settings.mysteryBoxItemIds || []) as any,
            dessertPromptEnabled: settings.dessertPromptEnabled,
            dessertPromptMinutes: settings.dessertPromptMinutes,
            dessertPromptItemIds: JSON.stringify(settings.dessertPromptItemIds || []) as any
          };
          try {
            await restaurantService.update(activeRestaurantId, updateData as any);
          } catch (err) {
            console.error("Failed to persist settings", err);
          }
        }
      },
      updateAIConfig: (aiConfig) => set({ aiConfig }),
      updatePaymentConfig: (paymentConfig) => set({ paymentConfig }),

      fetchAIRecommendations: async (cartItems) => {
        const { activeRestaurantId, settings, aiConfig } = get();
        if (!activeRestaurantId || cartItems.length === 0 || !settings.aiUpsellEnabled) {
          set({ recommendedItems: [] });
          return;
        }

        set({ isFetchingRecommendations: true });
        try {
          const resp = await aiServiceApi.getRecommendations(activeRestaurantId, cartItems, aiConfig.apiKey);
          set({ recommendedItems: resp.data });
        } catch (err) {
          console.error("AI Upsell fetch failed", err);
          set({ recommendedItems: [] });
        } finally {
          set({ isFetchingRecommendations: false });
        }
      },
      clearRecommendations: () => set({ recommendedItems: [] }),

      fetchBanners: async () => {
        const { activeRestaurantId } = get();
        if (!activeRestaurantId) return;
        try {
          const resp = await bannerService.getBanners(activeRestaurantId);
          set({ banners: resp.data });
        } catch (err) {
          console.error('Failed to fetch banners', err);
        }
      },
      addBanner: async (data) => {
        const resp = await bannerService.createBanner(data);
        set((state) => ({ banners: [resp.data, ...state.banners] }));
      },
      updateBanner: async (id, data) => {
        const resp = await bannerService.updateBanner(id, data);
        set((state) => ({
          banners: state.banners.map(b => b.id === id ? resp.data : b)
        }));
      },
      deleteBanner: async (id) => {
        await bannerService.deleteBanner(id);
        set((state) => ({ banners: state.banners.filter(b => b.id !== id) }));
      },
    }),
    {
      name: 'bistroflow-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        activeRestaurantId: state.activeRestaurantId,
        aiConfig: state.aiConfig,
        paymentConfig: state.paymentConfig,
        // Don't persist: settings (load from DB), restaurants, categories, menuItems, orders
      }),
    }
  )
);
