import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

export const apiService = {
  // Authentication
  login: async (credentials) => {
    try {
      const res = await apiClient.post('/auth/login/', credentials);
      return res.data;
    } catch (e) {
      console.warn('Backend login endpoint fallback', e);
      if (credentials.role === 'admin') {
        return {
          success: true,
          role: 'admin',
          token: 'mock-admin-token',
          user: { name: 'Admin', email: credentials.email || 'admin@freshdiet.com', role: 'admin' }
        };
      } else if (credentials.role === 'delivery') {
        return {
          success: true,
          role: 'delivery',
          token: 'mock-delivery-token',
          active_partner_id: 1,
          user: { name: 'Rahul Kumar', email: credentials.email || 'rahul@delivery.com', role: 'delivery', id: 1 }
        };
      } else {
        return {
          success: true,
          role: 'customer',
          token: 'mock-customer-token',
          user: { name: 'Ananya Rao', email: credentials.email || 'ananya@example.com', role: 'customer' }
        };
      }
    }
  },

  register: async (userData) => {
    try {
      const res = await apiClient.post('/auth/register/', userData);
      return res.data;
    } catch (e) {
      return {
        success: true,
        role: 'customer',
        token: 'mock-registered-token',
        user: { name: userData.name, email: userData.email, role: 'customer' }
      };
    }
  },

  // Food Items & Categories
  getCategories: async () => {
    try {
      const res = await apiClient.get('/categories/');
      return res.data;
    } catch (e) {
      console.warn('Backend API offline, using fallback categories', e);
      return [
        { id: 1, name: 'Eggs & Toast', slug: 'eggs-toast', icon: 'Egg' },
        { id: 2, name: 'Fruit Bowls', slug: 'fruit-bowls', icon: 'Apple' },
        { id: 3, name: 'Rice Bowls', slug: 'rice-bowls', icon: 'Utensils' },
        { id: 4, name: 'Healthy Salads', slug: 'salads', icon: 'Salad' },
      ];
    }
  },

  createCategory: async (categoryData) => {
    try {
      const res = await apiClient.post('/categories/', categoryData);
      return res.data;
    } catch (e) {
      console.error('Error creating category', e);
      throw e;
    }
  },

  getFoodItems: async (categorySlug = '', dietType = '', search = '') => {
    try {
      const params = {};
      if (categorySlug) params.category = categorySlug;
      if (dietType) params.diet = dietType;
      if (search) params.search = search;

      const res = await apiClient.get('/food-items/', { params });
      return res.data;
    } catch (e) {
      console.warn('Backend API offline, returning fallback menu items', e);
      return fallbackFoodItems;
    }
  },

  getAllFoodItems: async () => {
    try {
      const res = await apiClient.get('/food-items/?all=true');
      return res.data;
    } catch (e) {
      return fallbackFoodItems;
    }
  },

  createFoodItem: async (data) => {
    try {
      const res = await apiClient.post('/food-items/', data);
      return res.data;
    } catch (e) {
      console.error('Error creating food item', e);
      throw e;
    }
  },

  updateFoodItem: async (id, data) => {
    try {
      const res = await apiClient.put(`/food-items/${id}/`, data);
      return res.data;
    } catch (e) {
      console.error('Error updating food item', e);
      throw e;
    }
  },

  deleteFoodItem: async (id) => {
    try {
      const res = await apiClient.delete(`/food-items/${id}/`);
      return res.data;
    } catch (e) {
      console.error('Error deleting food item', e);
      throw e;
    }
  },

  // Subscription Meal Plans
  getMealPlans: async () => {
    try {
      const res = await apiClient.get('/meal-plans/');
      return res.data;
    } catch (e) {
      return fallbackMealPlans;
    }
  },

  createMealPlan: async (data) => {
    try {
      const res = await apiClient.post('/meal-plans/', data);
      return res.data;
    } catch (e) {
      console.error('Error creating meal plan', e);
      throw e;
    }
  },

  updateMealPlan: async (id, data) => {
    try {
      const res = await apiClient.put(`/meal-plans/${id}/`, data);
      return res.data;
    } catch (e) {
      console.error('Error updating meal plan', e);
      throw e;
    }
  },

  deleteMealPlan: async (id) => {
    try {
      const res = await apiClient.delete(`/meal-plans/${id}/`);
      return res.data;
    } catch (e) {
      console.error('Error deleting meal plan', e);
      throw e;
    }
  },

  // Custom Quiz Recommendation API
  getCustomPlanRecommendation: async (quizData) => {
    try {
      const res = await apiClient.post('/recommend-plan/', quizData);
      return res.data;
    } catch (e) {
      return {
        recommended_plan: "Standard Plan (2 Meals/Day)",
        daily_calories: 1450,
        macros: { protein: "108g", carbs: "163g", fat: "40g" },
        recommended_meals: [
          "Low-calorie fresh fruit bowl",
          "Grilled Chicken / Paneer Protein Rice Bowl",
          "Avocado & Scrambled Egg Toast"
        ],
        monthly_cost_estimate: 8999,
        delivery_zone: quizData.location || "Hitech City",
        available_in_zone: true
      };
    }
  },

  // Order Placement & Management
  createOrder: async (orderData) => {
    try {
      const res = await apiClient.post('/orders/', orderData);
      return res.data;
    } catch (e) {
      return {
        id: Math.floor(Math.random() * 1000),
        order_number: "MYM-" + Math.floor(10000 + Math.random() * 90000),
        customer_name: orderData.customer_name,
        total_amount: orderData.total_amount || 358,
        status: "Placed",
        created_at: new Date().toISOString()
      };
    }
  },

  getOrders: async (filters = {}) => {
    try {
      const params = {};
      if (filters.email) params.email = filters.email;
      if (filters.delivery_partner) params.delivery_partner = filters.delivery_partner;
      if (filters.status) params.status = filters.status;

      const res = await apiClient.get('/orders/', { params });
      return res.data;
    } catch (e) {
      console.warn('Error fetching orders, returning empty/mock array', e);
      return [];
    }
  },

  updateOrderStatus: async (id, status, delivery_notes = '') => {
    try {
      const res = await apiClient.post(`/orders/${id}/update_status/`, { status, delivery_notes });
      return res.data;
    } catch (e) {
      console.error('Error updating order status', e);
      throw e;
    }
  },

  assignDeliveryPartner: async (orderId, deliveryPartnerId) => {
    try {
      const res = await apiClient.post(`/orders/${orderId}/assign_delivery/`, { delivery_partner_id: deliveryPartnerId });
      return res.data;
    } catch (e) {
      console.error('Error assigning delivery partner', e);
      throw e;
    }
  },

  // Delivery Partners
  getDeliveryPartners: async () => {
    try {
      const res = await apiClient.get('/delivery-partners/');
      return res.data;
    } catch (e) {
      return [
        { id: 1, name: 'Rahul Kumar', phone: '+91 98765 43210', vehicle_number: 'TS 09 EQ 4521', assigned_area: 'Hitech City & Madhapur', rating: 4.9, active_orders_count: 2 },
        { id: 2, name: 'Suresh Verma', phone: '+91 98123 45678', vehicle_number: 'TS 08 AB 8812', assigned_area: 'Kondapur & Gachibowli', rating: 4.8, active_orders_count: 1 },
        { id: 3, name: 'Priya Singh', phone: '+91 97654 32109', vehicle_number: 'TS 07 CD 3341', assigned_area: 'Jubilee & Banjara Hills', rating: 5.0, active_orders_count: 0 },
      ];
    }
  },

  createDeliveryPartner: async (data) => {
    try {
      const res = await apiClient.post('/delivery-partners/', data);
      return res.data;
    } catch (e) {
      console.error('Error creating delivery partner', e);
      throw e;
    }
  },

  deleteDeliveryPartner: async (id) => {
    try {
      const res = await apiClient.delete(`/delivery-partners/${id}/`);
      return res.data;
    } catch (e) {
      console.error('Error deleting delivery partner', e);
      throw e;
    }
  },

  // User Accounts
  getUsers: async () => {
    try {
      const res = await apiClient.get('/users/');
      return res.data;
    } catch (e) {
      return [
        { id: 1, first_name: 'Admin', email: 'admin@freshdiet.com', role: 'admin', date_joined: '2026-09-01' },
        { id: 2, first_name: 'Ananya Rao', email: 'ananya@example.com', role: 'customer', date_joined: '2026-09-05' },
        { id: 3, first_name: 'Rahul Kumar', email: 'rahul@delivery.com', role: 'delivery', date_joined: '2026-09-08' },
        { id: 4, first_name: 'Vikram Sharma', email: 'vikram@example.com', role: 'customer', date_joined: '2026-09-10' }
      ];
    }
  },

  createUser: async (data) => {
    try {
      const res = await apiClient.post('/users/', data);
      return res.data;
    } catch (e) {
      console.error('Error creating user', e);
      throw e;
    }
  },

  deleteUser: async (id) => {
    try {
      const res = await apiClient.delete(`/users/${id}/`);
      return res.data;
    } catch (e) {
      console.error('Error deleting user', e);
      throw e;
    }
  },

  // Subscriptions management
  getSubscriptions: async () => {
    try {
      const res = await apiClient.get('/subscriptions/');
      return res.data;
    } catch (e) {
      return [
        {
          id: 1,
          customer_name: "Vikram Sharma",
          plan_details: { name: "Standard Plan", tag: "Breakfast + Lunch" },
          start_date: "2026-09-01",
          end_date: "2026-09-30",
          delivery_area: "Hitech City",
          status: "Active",
          remaining_meals: 38,
          total_meals: 52
        }
      ];
    }
  },

  pauseSubscription: async (id) => {
    try {
      const res = await apiClient.post(`/subscriptions/${id}/pause/`);
      return res.data;
    } catch (e) {
      return { status: 'Subscription paused' };
    }
  },

  resumeSubscription: async (id) => {
    try {
      const res = await apiClient.post(`/subscriptions/${id}/resume/`);
      return res.data;
    } catch (e) {
      return { status: 'Subscription resumed' };
    }
  },

  // Monthly 30-day Rotating Menu
  getMonthlyMenu: async () => {
    try {
      const res = await apiClient.get('/monthly-menu/');
      return res.data;
    } catch (e) {
      return fallbackMonthlyMenu;
    }
  },

  createMonthlyMenu: async (data) => {
    try {
      const res = await apiClient.post('/monthly-menu/', data);
      return res.data;
    } catch (e) {
      console.error('Error creating monthly menu', e);
      throw e;
    }
  },

  updateMonthlyMenu: async (id, data) => {
    try {
      const res = await apiClient.put(`/monthly-menu/${id}/`, data);
      return res.data;
    } catch (e) {
      console.error('Error updating monthly menu', e);
      throw e;
    }
  },

  deleteMonthlyMenu: async (id) => {
    try {
      const res = await apiClient.delete(`/monthly-menu/${id}/`);
      return res.data;
    } catch (e) {
      console.error('Error deleting monthly menu', e);
      throw e;
    }
  },

  // Admin Analytics
  getAdminAnalytics: async () => {
    try {
      const res = await apiClient.get('/admin-analytics/');
      return res.data;
    } catch (e) {
      return {
        metrics: {
          today_orders: 82,
          active_subscribers: 143,
          monthly_revenue: "₹28,500",
          pending_deliveries: 11
        },
        hyderabad_routes: [
          { name: 'Morning Route', path: 'Hitech City → Madhapur → Kondapur', deliveries: 28 },
          { name: 'Lunch Route', path: 'Gachibowli → Financial District → Jubilee Hills', deliveries: 45 },
          { name: 'Evening Route', path: 'Banjara Hills → Madhapur → Hitech City', deliveries: 18 }
        ]
      };
    }
  }
};


const fallbackFoodItems = [
  {
    id: 1,
    name: 'Boiled Eggs',
    description: 'Simple, healthy & protein rich. Perfectly boiled eggs served with pink salt and cracked black pepper.',
    price: 50,
    unit_info: '(3 EGGS)',
    calories: 210,
    protein: '18.0',
    carbs: '2.0',
    fat: '14.0',
    fiber: '0.0',
    category: 1,
    diet_type: 'non_veg',
    is_bestseller: true,
    image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 2,
    name: 'Fried Eggs',
    description: 'Classic & wholesome protein boost. Sunny side up or double side fried in cold-pressed oil.',
    price: 60,
    unit_info: '(3 EGGS)',
    calories: 270,
    protein: '18.0',
    carbs: '2.0',
    fat: '21.0',
    fiber: '0.0',
    category: 1,
    diet_type: 'non_veg',
    is_bestseller: false,
    image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 3,
    name: 'Scrambled Eggs',
    description: 'Soft, fluffy & high in protein. Creamy slow-scrambled eggs with fresh parsley.',
    price: 60,
    unit_info: '(3 EGGS)',
    calories: 260,
    protein: '18.0',
    carbs: '3.0',
    fat: '19.0',
    fiber: '0.0',
    category: 1,
    diet_type: 'non_veg',
    is_bestseller: true,
    image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 4,
    name: 'Scrambled Egg Toast',
    description: 'Creamy scrambled eggs on toasted bread.',
    price: 70,
    unit_info: '1 Plate',
    calories: 320,
    protein: '20.0',
    carbs: '28.0',
    fat: '15.0',
    fiber: '3.0',
    category: 1,
    diet_type: 'non_veg',
    is_bestseller: false,
    image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 5,
    name: 'Avocado Toast',
    description: 'Mashed avocado on toasted bread.',
    price: 90,
    unit_info: '1 Plate',
    calories: 290,
    protein: '8.0',
    carbs: '32.0',
    fat: '16.0',
    fiber: '9.0',
    category: 1,
    diet_type: 'veg',
    is_bestseller: true,
    image_url: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 6,
    name: 'Avocado Scrambled Egg Toast',
    description: 'The perfect combo of creamy avocado & scrambled eggs.',
    price: 100,
    unit_info: '1 Plate',
    calories: 410,
    protein: '24.0',
    carbs: '34.0',
    fat: '22.0',
    fiber: '9.0',
    category: 1,
    diet_type: 'non_veg',
    is_bestseller: true,
    image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 7,
    name: 'Basic Fruit Bowl',
    description: 'Guava, Apple, Pineapple, Papaya, Watermelon',
    price: 50,
    unit_info: 'Fresh & Wholesome',
    calories: 180,
    protein: '3.0',
    carbs: '42.0',
    fat: '1.0',
    fiber: '6.0',
    category: 2,
    diet_type: 'vegan',
    is_bestseller: false,
    image_url: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 8,
    name: 'Premium Fruit Bowl',
    description: 'Pineapple, Dragon Fruit, Papaya, Guava, Berries, Seasonal Fruit',
    price: 75,
    unit_info: 'More Variety, More Goodness',
    calories: 220,
    protein: '4.0',
    carbs: '52.0',
    fat: '1.0',
    fiber: '8.0',
    category: 2,
    diet_type: 'vegan',
    is_bestseller: true,
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 9,
    name: 'Deluxe Fruit Bowl',
    description: 'Strawberry, Blueberries, Kiwi, Papaya, Guava, Pineapple, Apple, Pears',
    price: 100,
    unit_info: 'The Best of Nature',
    calories: 260,
    protein: '5.0',
    carbs: '60.0',
    fat: '1.0',
    fiber: '10.0',
    category: 2,
    diet_type: 'vegan',
    is_bestseller: true,
    image_url: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 10,
    name: 'Chicken & Dal Rice Bowl',
    description: 'Grilled Chicken Breast + Dal Rice + Salad (Broccoli, Carrot, Beetroot, Beans, Capsicum)',
    price: 179,
    unit_info: '450g Bowl',
    calories: 480,
    protein: '38.0',
    carbs: '52.0',
    fat: '12.0',
    fiber: '7.0',
    category: 3,
    diet_type: 'non_veg',
    is_bestseller: true,
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 11,
    name: 'Fish & Puliyogare Bowl',
    description: 'Grilled Fish + Puliyogare + Salad (Broccoli, Carrot, Beetroot, Beans, Capsicum)',
    price: 179,
    unit_info: '450g Bowl',
    calories: 460,
    protein: '34.0',
    carbs: '50.0',
    fat: '14.0',
    fiber: '6.0',
    category: 3,
    diet_type: 'non_veg',
    is_bestseller: true,
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 12,
    name: 'Chicken & Curd Rice Bowl',
    description: 'Grilled Chicken Breast + Curd Rice + Salad (Broccoli, Carrot, Beetroot, Beans, Capsicum)',
    price: 179,
    unit_info: '450g Bowl',
    calories: 440,
    protein: '36.0',
    carbs: '46.0',
    fat: '11.0',
    fiber: '5.0',
    category: 3,
    diet_type: 'non_veg',
    is_bestseller: true,
    image_url: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 13,
    name: 'Paneer & Veg Pulao Bowl',
    description: 'Paneer + Veg Pulao + Salad (Broccoli, Carrot, Beetroot, Beans, Capsicum)',
    price: 179,
    unit_info: '450g Bowl',
    calories: 490,
    protein: '26.0',
    carbs: '54.0',
    fat: '18.0',
    fiber: '8.0',
    category: 3,
    diet_type: 'veg',
    is_bestseller: false,
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 14,
    name: 'Mushroom Fried Rice Bowl',
    description: 'Mushroom Fried Rice + Salad (Broccoli, Carrot, Beans, Capsicum)',
    price: 169,
    unit_info: '400g Bowl',
    calories: 410,
    protein: '16.0',
    carbs: '58.0',
    fat: '10.0',
    fiber: '7.0',
    category: 3,
    diet_type: 'veg',
    is_bestseller: false,
    image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 15,
    name: 'Chicken Fried Rice Bowl',
    description: 'Chicken Fried Rice + Salad (Broccoli, Carrot, Beans, Capsicum)',
    price: 169,
    unit_info: '450g Bowl',
    calories: 450,
    protein: '32.0',
    carbs: '54.0',
    fat: '12.0',
    fiber: '6.0',
    category: 3,
    diet_type: 'non_veg',
    is_bestseller: false,
    image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80'
  }
];

const fallbackMealPlans = [
  {
    id: 1,
    name: 'Starter Plan',
    tag: '1 Meal per Day',
    price: 4999,
    meals_per_day: 1,
    total_meals: 26,
    duration_days: 30,
    description: 'Perfect for beginners focusing on a healthy daily lunch or breakfast routine.',
    features: '1 Fresh Meal Daily, 26 Meals/Month, Calorie & Macro Tracked, Free Doorstep Delivery across Hyderabad, Flexible Skip & Pause',
    features_list: [
      '1 Fresh Meal Daily',
      '26 Meals/Month',
      'Calorie & Macro Tracked',
      'Free Doorstep Delivery across Hyderabad',
      'Flexible Skip & Pause'
    ],
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 2,
    name: 'Standard Plan',
    tag: 'Breakfast + Lunch',
    price: 8999,
    meals_per_day: 2,
    total_meals: 52,
    duration_days: 30,
    description: 'Ideal for busy working professionals who want guilt-free morning and noon nutrition.',
    features: 'Breakfast + Lunch Daily, 52 Meals/Month, Rotating Monthly Menu, Dedicated Nutritionist Advice, Priority Morning Delivery, Skip Any Day',
    features_list: [
      'Breakfast + Lunch Daily',
      '52 Meals/Month',
      'Rotating Monthly Menu',
      'Dedicated Nutritionist Advice',
      'Priority Morning Delivery',
      'Skip Any Day'
    ],
    image_url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 3,
    name: 'Premium Plan',
    tag: 'Breakfast + Lunch + Dinner',
    price: 12999,
    meals_per_day: 3,
    total_meals: 78,
    duration_days: 30,
    description: 'Complete 360-degree monthly diet management for maximum health & fitness results.',
    features: 'Breakfast + Lunch + Dinner, 78 Meals/Month, Full Macro Customization, VIP Delivery Slots, 1-on-1 Dietitian Integration, Free Weekly Fruit Box Add-on',
    features_list: [
      'Breakfast + Lunch + Dinner',
      '78 Meals/Month',
      'Full Macro Customization',
      'VIP Delivery Slots',
      '1-on-1 Dietitian Integration',
      'Free Weekly Fruit Box Add-on'
    ],
    image_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=600&q=80'
  }
];

const fallbackMonthlyMenu = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  day_number: i + 1,
  breakfast: ['Oats & Berry Bowl', 'Egg & Avocado Toast', 'Fresh Fruit Bowl', 'South Indian Vegetable Upma', 'High-Protein Egg Omelette'][i % 5],
  lunch: ['Chicken & Dal Rice Bowl', 'Paneer & Veg Pulao Bowl', 'Fish & Puliyogare Bowl', 'Quinoa Veg Salad', 'Chicken Fried Rice Bowl'][i % 5],
  dinner: ['Vegetable Clear Soup & Salad', 'Grilled Chicken with Broccoli', 'Paneer Tikka & Steamed Veggies', 'Dal & Brown Rice Bowl', 'Grilled Fish & Asparagus'][i % 5],
  total_calories: 1450 + (i % 4) * 40,
  items: [
    fallbackFoodItems[i % fallbackFoodItems.length],
    fallbackFoodItems[(i + 2) % fallbackFoodItems.length],
    fallbackFoodItems[(i + 4) % fallbackFoodItems.length]
  ]
}));
