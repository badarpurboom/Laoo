import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
});

export const restaurantService = {
    getAll: () => api.get('/restaurants'),
    getBySlug: (slug: string) => api.get(`/restaurants/slug/${slug}`),
    create: (data: any) => api.post('/restaurants', data),
    update: (id: string, data: any) => api.put(`/restaurants/${id}`, data),
};

export const menuService = {
    getCategories: (restaurantId: string) => api.get(`/menu/categories/${restaurantId}`),
    addCategory: (category: any) => api.post('/menu/categories', category),
    createCategoriesBulk: (restaurantId: string, categories: { name: string, icon?: string }[]) =>
        api.post('/menu/categories/bulk', { restaurantId, categories }),
    deleteCategory: (categoryId: string) => api.delete(`/menu/categories/${categoryId}`),
    getMenuItems: (restaurantId: string) => api.get(`/menu/items/${restaurantId}`),
    createMenuItem: (data: any) => api.post('/menu/items', data),
    updateMenuItem: (id: string, data: any) => api.put(`/menu/items/${id}`, data),
    deleteMenuItem: (id: string) => api.delete(`/menu/items/${id}`),
};

export const orderService = {
    getOrders: (restaurantId: string) => api.get(`/orders/${restaurantId}`),
    createOrder: (data: any) => api.post('/orders', data),
    updateStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
    updatePaymentStatus: (id: string, status: 'pending' | 'paid') => api.patch(`/orders/${id}/payment-status`, { status }),
};
