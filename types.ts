
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type OrderType = 'dine-in' | 'takeaway' | 'delivery';

export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  icon: string;
  fakeDiscountPct?: number;
}

export type UserRole = 'SUPER_ADMIN' | 'RESTAURANT_ADMIN' | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  restaurantId?: string; // Null for Super Admin
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  isActive: boolean;
  businessType?: string; // "restaurant" or "hotel"

  // Settings
  address?: string;
  logoUrl?: string;
  taxEnabled?: boolean;
  taxPercentage?: number;
  deliveryChargesEnabled?: boolean;
  deliveryCharges?: number;
  deliveryFreeThreshold?: number;

  // Order Preferences
  dineInEnabled?: boolean;
  takeawayEnabled?: boolean;
  deliveryEnabled?: boolean;
  requireTableNumber?: boolean;

  createdAt: string;
  aiUpsellEnabled?: boolean;
  aiUpsellPopupEnabled?: boolean;
  popupMode?: string;
  popupItem1Id?: string | null;
  popupItem2Id?: string | null;
  popup1Text?: string | null;
  popup2Text?: string | null;

  // Advanced AOV Tracking & Marketing Config
  giftThreshold?: number | null;
  giftItemId?: string | null;
  aiMarketingEnabled?: boolean;
  maxAiDiscountPct?: number;
  mysteryBoxEnabled?: boolean;
  mysteryBoxPrice?: number;
  mysteryBoxItemIds?: string[];
  dessertPromptEnabled?: boolean;
  dessertPromptMinutes?: number;
  dessertPromptItemIds?: string[];
  aiCustomPrompt?: string | null;
}

export interface Banner {
  id: string;
  restaurantId: string;
  imageUrl: string;
  title?: string;
  isActive: boolean;
  createdAt?: string; // Optional since it's populated by DB automatically
}

export interface Notification {
  id: string;
  restaurantId: string;
  tableNumber: string;
  type: string;
  status: string;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  fullPrice: number;
  halfPrice?: number;
  categoryId: string;
  imageUrl: string;
  isVeg: boolean;
  isAvailable: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
  portionType: 'half' | 'full';
  price: number; // The actual price for the selected portion
  isUpsell?: boolean;
  marketingSource?: string | null;
  marketingRuleId?: string | null;
}

export interface Order {
  id: string;
  restaurantId: string;
  customerName: string;
  customerPhone?: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  timestamp: string;
  orderType: OrderType;
  tableNumber?: string;
  address?: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
}

export interface RestaurantSettings {
  restaurantId: string;
  aiCustomPrompt?: string | null;
  name: string;
  logoUrl: string;
  address: string;
  contact: string;
  gstNumber: string;
  taxEnabled: boolean;
  taxPercentage: number;
  deliveryChargesEnabled: boolean;
  deliveryCharges: number;
  deliveryFreeThreshold: number;
  currency: string;
  whatsappNumber?: string;
  isOpen: boolean;
  aiUpsellEnabled?: boolean;
  aiUpsellPopupEnabled?: boolean;
  popupMode?: string;
  popupItem1Id?: string | null;
  popupItem2Id?: string | null;
  popup1Text?: string | null;
  popup2Text?: string | null;
  orderPreferences: {
    dineIn: boolean;
    takeaway: boolean;
    delivery: boolean;
    requireTableNumber: boolean;
    requireCustomerPhone?: boolean;
  };
  giftThreshold?: number | null;
  giftItemId?: string | null;
  aiMarketingEnabled?: boolean;
  maxAiDiscountPct?: number;
  mysteryBoxEnabled?: boolean;
  mysteryBoxPrice?: number;
  mysteryBoxItemIds?: string[];
  dessertPromptEnabled?: boolean;
  dessertPromptMinutes?: number;
  dessertPromptItemIds?: string[];
}

export interface MarketingRule {
  id: string;
  restaurantId: string;
  type: 'CROSS_SELL' | 'UP_SELL' | 'IMPULSE' | 'COMBO' | 'MYSTERY_BOX' | 'POPUP';
  triggerItemId?: string | null;
  targetItemId?: string | null;
  discountPct: number;
  isActive: boolean;
  isAiManaged: boolean;
  createdAt: string;
}

export interface AIConfig {
  provider: 'openai' | 'gemini';
  apiKey: string;
  model: string;
  temperature: number;
  promptSystem: string;
}

export interface PaymentConfig {
  stripeEnabled: boolean;
  stripeApiKey: string;
  razorpayEnabled: boolean;
  razorpayApiKey: string;
}
