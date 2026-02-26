import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const axiosInstance = axios.create({
    baseURL: API_URL,
});

export const restaurantService = {
    getAll: () => axiosInstance.get('/restaurants'),
    getStats: () => axiosInstance.get('/restaurants/stats'),
    getBySlug: (slug: string) => axiosInstance.get(`/restaurants/slug/${slug}`),
    create: (data: any) => axiosInstance.post('/restaurants', data),
    update: (id: string, data: any) => axiosInstance.put(`/restaurants/${id}`, data),
    updateTrial: (id: string, trialDays: number) => axiosInstance.patch(`/restaurants/${id}/trial`, { trialDays }),
    delete: (id: string) => axiosInstance.delete(`/restaurants/${id}`),
    uploadImage: async (formData: FormData) => {
        const response = await axios.post(`${API_URL}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.imageUrl;
    }
};



export const menuService = {
    getCategories: (restaurantId: string) => axiosInstance.get(`/menu/categories/${restaurantId}`),
    addCategory: (category: any) => axiosInstance.post('/menu/categories', category),
    updateCategory: (id: string, data: any) => axiosInstance.put(`/menu/categories/${id}`, data),
    createCategoriesBulk: (restaurantId: string, categories: { name: string, icon?: string }[]) =>
        axiosInstance.post('/menu/categories/bulk', { restaurantId, categories }),
    deleteCategory: (categoryId: string) => axiosInstance.delete(`/menu/categories/${categoryId}`),
    getMenuItems: (restaurantId: string) => axiosInstance.get(`/menu/items/${restaurantId}`),
    createMenuItem: (data: any) => axiosInstance.post('/menu/items', data),
    updateMenuItem: (id: string, data: any) => axiosInstance.put(`/menu/items/${id}`, data),
    deleteMenuItem: (id: string) => axiosInstance.delete(`/menu/items/${id}`),
};

export const orderService = {
    getOrders: (restaurantId: string) => axiosInstance.get(`/orders/${restaurantId}`),
    createOrder: (data: any) => axiosInstance.post('/orders', data),
    updateStatus: (id: string, status: string) => axiosInstance.patch(`/orders/${id}/status`, { status }),
    updatePaymentStatus: (id: string, status: 'pending' | 'paid') => axiosInstance.patch(`/orders/${id}/payment-status`, { status }),
};

export const queryService = {
    getPredefined: () => axiosInstance.get('/query/predefined'),
    getSchema: () => axiosInstance.get('/query/schema'),
    execute: (data: { queryKey?: string; customSql?: string }) => axiosInstance.post('/query/execute', data),
};

export const aiServiceApi = {
    getRecommendations: (restaurantId: string, cartItems: any[], apiKey?: string) =>
        axiosInstance.post('/ai-upsell/recommend', { restaurantId, cartItems, apiKey }),
    syncMenu: (restaurantId: string, apiKey?: string) =>
        axiosInstance.post('/ai-upsell/sync-menu', { restaurantId, apiKey }),
    pickFlashItems: (restaurantId: string, apiKey?: string) =>
        axiosInstance.post('/ai-upsell/pick-flash-items', { restaurantId, apiKey })
};

export const bannerService = {
    getBanners: (restaurantId: string) => axiosInstance.get(`/banners/${restaurantId}`),
    createBanner: (data: any) => axiosInstance.post('/banners', data),
    updateBanner: (id: string, data: any) => axiosInstance.put(`/banners/${id}`, data),
    deleteBanner: (id: string) => axiosInstance.delete(`/banners/${id}`),
};
