
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
  OrderStatus
} from './types';
import { restaurantService, menuService, orderService } from './services/api';

interface AppState {
  // Menu
  categories: Category[];
  menuItems: MenuItem[];

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

  // Actions
  fetchDashboardData: () => Promise<void>;
  addRestaurant: (restaurant: Partial<Restaurant>) => Promise<void>;
  updateRestaurant: (restaurant: Restaurant) => Promise<void>;
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
  updateSettings: (settings: RestaurantSettings) => void;
  updateAIConfig: (config: AIConfig) => void;
  updatePaymentConfig: (config: PaymentConfig) => void;
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
      settings: {
        restaurantId: 'res-1',
        name: "Laoo Central",
        logoUrl: "https://picsum.photos/100/100?random=logo",
        address: "123 Food Street, Tech City, CA 94103",
        contact: "+1 (555) 000-1111",
        gstNumber: "22AAAAA0000A1Z5",
        taxEnabled: true,
        taxPercentage: 5,
        deliveryChargesEnabled: true,
        deliveryCharges: 40,
        deliveryFreeThreshold: 500,
        currency: 'INR',
        isOpen: true,
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
        try {
          const [resResp, catResp, itemResp, orderResp] = await Promise.all([
            restaurantService.getAll(),
            activeRestaurantId ? menuService.getCategories(activeRestaurantId) : Promise.resolve({ data: [] }),
            activeRestaurantId ? menuService.getMenuItems(activeRestaurantId) : Promise.resolve({ data: [] }),
            activeRestaurantId ? orderService.getOrders(activeRestaurantId) : Promise.resolve({ data: [] }),
          ]);
          set({
            restaurants: resResp.data,
            categories: catResp.data as any,
            menuItems: itemResp.data as any,
            orders: orderResp.data as any
          });
        } catch (err) {
          console.error("Failed to load dashboard data", err);
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
      setCurrentUser: (user) => set({ currentUser: user }),
      setActiveRestaurantId: (id) => {
        set({ activeRestaurantId: id });
        get().fetchDashboardData();
      },
      setActiveRestaurantBySlug: async (slug) => {
        const resp = await restaurantService.getBySlug(slug);
        if (resp.data) {
          set({
            activeRestaurantId: resp.data.id,
            categories: (resp.data as any).categories || [],
            menuItems: (resp.data as any).menuItems || []
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
      updateSettings: (settings) => set({ settings }),
      updateAIConfig: (aiConfig) => set({ aiConfig }),
      updatePaymentConfig: (paymentConfig) => set({ paymentConfig }),
    }),
    {
      name: 'bistroflow-storage',
    }
  )
);
